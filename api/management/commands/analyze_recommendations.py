"""
Management command for analyzing recommendation system performance.
Generates reports on click-through rates, user engagement, and A/B test results.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count, Avg, Q, F
from django.utils import timezone
from django.conf import settings
from datetime import timedelta, datetime
import json
import csv
import os
import logging

from api.models import (
    UserRecommendation, UserBehavior, ABTestVariant, 
    User, Provider, Favorite, Review
)
from api.utils.ab_testing import ABTestManager

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Analyze recommendation system performance and generate reports'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to analyze (default: 30)'
        )
        parser.add_argument(
            '--output-dir',
            type=str,
            default='reports',
            help='Directory to save reports (default: reports)'
        )
        parser.add_argument(
            '--format',
            choices=['json', 'csv', 'console'],
            default='console',
            help='Output format (default: console)'
        )
        parser.add_argument(
            '--metric',
            choices=[
                'all', 'ctr', 'engagement', 'abtest', 'coverage', 
                'diversity', 'cold_start', 'algorithm_performance'
            ],
            default='all',
            help='Specific metric to analyze (default: all)'
        )
        parser.add_argument(
            '--experiment',
            type=str,
            help='Analyze specific A/B test experiment'
        )
        parser.add_argument(
            '--user-segment',
            choices=['new', 'active', 'inactive', 'all'],
            default='all',
            help='User segment to analyze (default: all)'
        )
        parser.add_argument(
            '--save-report',
            action='store_true',
            help='Save detailed report to file'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        self.verbosity = options['verbosity']
        self.options = options
        
        if self.verbosity >= 1:
            self.stdout.write(
                self.style.SUCCESS(f'Analyzing recommendation system performance...')
            )
        
        try:
            # Prepare date range
            end_date = timezone.now()
            start_date = end_date - timedelta(days=options['days'])
            
            # Initialize analysis results
            analysis_results = {
                'analysis_period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': options['days']
                },
                'metrics': {}
            }
            
            # Run specific or all analyses
            if options['metric'] in ['all', 'ctr']:
                analysis_results['metrics']['click_through_rate'] = self.analyze_click_through_rate(
                    start_date, end_date
                )
            
            if options['metric'] in ['all', 'engagement']:
                analysis_results['metrics']['user_engagement'] = self.analyze_user_engagement(
                    start_date, end_date, options['user_segment']
                )
            
            if options['metric'] in ['all', 'abtest']:
                analysis_results['metrics']['ab_test_performance'] = self.analyze_ab_test_performance(
                    start_date, end_date, options['experiment']
                )
            
            if options['metric'] in ['all', 'coverage']:
                analysis_results['metrics']['recommendation_coverage'] = self.analyze_recommendation_coverage(
                    start_date, end_date
                )
            
            if options['metric'] in ['all', 'diversity']:
                analysis_results['metrics']['recommendation_diversity'] = self.analyze_recommendation_diversity(
                    start_date, end_date
                )
            
            if options['metric'] in ['all', 'cold_start']:
                analysis_results['metrics']['cold_start_performance'] = self.analyze_cold_start_performance(
                    start_date, end_date
                )
            
            if options['metric'] in ['all', 'algorithm_performance']:
                analysis_results['metrics']['algorithm_performance'] = self.analyze_algorithm_performance(
                    start_date, end_date
                )
            
            # Output results
            self.output_results(analysis_results)
            
            if self.verbosity >= 1:
                self.stdout.write(
                    self.style.SUCCESS('Analysis completed successfully!')
                )
                
        except Exception as e:
            logger.error(f"Error in recommendation analysis: {e}")
            raise CommandError(f'Recommendation analysis failed: {e}')
    
    def analyze_click_through_rate(self, start_date, end_date):
        """Analyze click-through rates for recommendations"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing click-through rates...')
        
        # Get recommendations shown in period
        recommendations_shown = UserRecommendation.objects.filter(
            created_at__range=[start_date, end_date]
        )
        
        total_shown = recommendations_shown.count()
        
        if total_shown == 0:
            return {'error': 'No recommendations found in period'}
        
        # Find clicks on recommended providers
        clicked_recommendations = 0
        
        for rec in recommendations_shown:
            # Check if user viewed the recommended provider after recommendation
            clicks = UserBehavior.objects.filter(
                user=rec.user,
                provider=rec.provider,
                action_type='view',
                created_at__gte=rec.created_at,
                created_at__lte=rec.created_at + timedelta(days=7)  # Within 7 days
            ).exists()
            
            if clicks:
                clicked_recommendations += 1
        
        ctr = (clicked_recommendations / total_shown * 100) if total_shown > 0 else 0
        
        # Analyze by algorithm version
        algorithm_ctr = {}
        for version in recommendations_shown.values_list('algorithm_version', flat=True).distinct():
            version_recs = recommendations_shown.filter(algorithm_version=version)
            version_total = version_recs.count()
            version_clicks = 0
            
            for rec in version_recs:
                if UserBehavior.objects.filter(
                    user=rec.user,
                    provider=rec.provider,
                    action_type='view',
                    created_at__gte=rec.created_at,
                    created_at__lte=rec.created_at + timedelta(days=7)
                ).exists():
                    version_clicks += 1
            
            algorithm_ctr[version] = {
                'total_shown': version_total,
                'clicked': version_clicks,
                'ctr_percent': (version_clicks / version_total * 100) if version_total > 0 else 0
            }
        
        return {
            'overall': {
                'total_recommendations_shown': total_shown,
                'clicked_recommendations': clicked_recommendations,
                'click_through_rate_percent': round(ctr, 2)
            },
            'by_algorithm': algorithm_ctr
        }
    
    def analyze_user_engagement(self, start_date, end_date, user_segment):
        """Analyze user engagement improvements"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing user engagement...')
        
        # Get users based on segment
        if user_segment == 'new':
            users = User.objects.filter(date_joined__range=[start_date, end_date])
        elif user_segment == 'active':
            active_user_ids = UserBehavior.objects.filter(
                created_at__range=[start_date, end_date]
            ).values_list('user_id', flat=True).distinct()
            users = User.objects.filter(id__in=active_user_ids)
        elif user_segment == 'inactive':
            # Users with no recent activity but have recommendations
            active_user_ids = UserBehavior.objects.filter(
                created_at__range=[start_date, end_date]
            ).values_list('user_id', flat=True).distinct()
            users = User.objects.exclude(id__in=active_user_ids).filter(
                userrecommendation__created_at__range=[start_date, end_date]
            ).distinct()
        else:  # all
            users = User.objects.filter(is_active=True)
        
        total_users = users.count()
        
        # Analyze engagement metrics
        engagement_stats = {
            'total_users_analyzed': total_users,
            'users_with_recommendations': 0,
            'users_who_interacted': 0,
            'average_interactions_per_user': 0,
            'favorite_conversion_rate': 0,
            'contact_conversion_rate': 0
        }
        
        if total_users == 0:
            return engagement_stats
        
        # Users with recommendations
        users_with_recs = users.filter(
            userrecommendation__created_at__range=[start_date, end_date]
        ).distinct().count()
        
        # Users who interacted with recommendations
        users_who_interacted = 0
        total_interactions = 0
        users_who_favorited = 0
        users_who_contacted = 0
        
        for user in users:
            user_recs = UserRecommendation.objects.filter(
                user=user,
                created_at__range=[start_date, end_date]
            )
            
            if not user_recs.exists():
                continue
            
            # Check for interactions with recommended providers
            recommended_provider_ids = user_recs.values_list('provider_id', flat=True)
            
            user_interactions = UserBehavior.objects.filter(
                user=user,
                provider_id__in=recommended_provider_ids,
                created_at__range=[start_date, end_date]
            )
            
            if user_interactions.exists():
                users_who_interacted += 1
                total_interactions += user_interactions.count()
                
                # Check for favorites
                if user_interactions.filter(action_type='favorite').exists():
                    users_who_favorited += 1
                
                # Check for contacts
                if user_interactions.filter(action_type='contact').exists():
                    users_who_contacted += 1
        
        engagement_stats.update({
            'users_with_recommendations': users_with_recs,
            'users_who_interacted': users_who_interacted,
            'average_interactions_per_user': round(
                total_interactions / users_who_interacted if users_who_interacted > 0 else 0, 2
            ),
            'favorite_conversion_rate': round(
                users_who_favorited / users_with_recs * 100 if users_with_recs > 0 else 0, 2
            ),
            'contact_conversion_rate': round(
                users_who_contacted / users_with_recs * 100 if users_with_recs > 0 else 0, 2
            )
        })
        
        return engagement_stats
    
    def analyze_ab_test_performance(self, start_date, end_date, specific_experiment=None):
        """Analyze A/B test performance"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing A/B test performance...')
        
        ab_manager = ABTestManager()
        
        experiments_to_analyze = []
        if specific_experiment:
            if specific_experiment in ab_manager.experiments:
                experiments_to_analyze = [specific_experiment]
        else:
            experiments_to_analyze = list(ab_manager.experiments.keys())
        
        results = {}
        
        for experiment_name in experiments_to_analyze:
            if not ab_manager.is_experiment_active(experiment_name):
                continue
            
            experiment_stats = ab_manager.get_experiment_stats(experiment_name)
            
            # Analyze performance by variant
            variant_performance = {}
            
            for variant in experiment_stats['variants'].keys():
                variant_users = ABTestVariant.objects.filter(
                    experiment_name=experiment_name,
                    variant=variant
                ).values_list('user_id', flat=True)
                
                # Analyze engagement for this variant
                variant_engagement = self.calculate_variant_engagement(
                    variant_users, start_date, end_date
                )
                
                variant_performance[variant] = {
                    'user_count': experiment_stats['variants'][variant]['user_count'],
                    'percentage': experiment_stats['variants'][variant]['percentage'],
                    'engagement': variant_engagement
                }
            
            results[experiment_name] = {
                'experiment_info': ab_manager.experiments[experiment_name],
                'stats': experiment_stats,
                'performance_by_variant': variant_performance
            }
        
        return results
    
    def calculate_variant_engagement(self, user_ids, start_date, end_date):
        """Calculate engagement metrics for A/B test variant"""
        if not user_ids:
            return {}
        
        behaviors = UserBehavior.objects.filter(
            user_id__in=user_ids,
            created_at__range=[start_date, end_date]
        )
        
        return {
            'total_actions': behaviors.count(),
            'unique_users_active': behaviors.values('user').distinct().count(),
            'avg_actions_per_user': round(
                behaviors.count() / len(user_ids) if user_ids else 0, 2
            ),
            'action_breakdown': dict(
                behaviors.values_list('action_type').annotate(count=Count('action_type'))
            )
        }
    
    def analyze_recommendation_coverage(self, start_date, end_date):
        """Analyze recommendation coverage (percentage of users receiving recommendations)"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing recommendation coverage...')
        
        total_active_users = User.objects.filter(
            is_active=True,
            last_login__gte=start_date - timedelta(days=30)  # Active in last 30 days
        ).count()
        
        users_with_recommendations = UserRecommendation.objects.filter(
            created_at__range=[start_date, end_date]
        ).values('user').distinct().count()
        
        coverage_percent = (
            users_with_recommendations / total_active_users * 100 
            if total_active_users > 0 else 0
        )
        
        return {
            'total_active_users': total_active_users,
            'users_with_recommendations': users_with_recommendations,
            'coverage_percentage': round(coverage_percent, 2)
        }
    
    def analyze_recommendation_diversity(self, start_date, end_date):
        """Analyze recommendation diversity metrics"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing recommendation diversity...')
        
        recommendations = UserRecommendation.objects.filter(
            created_at__range=[start_date, end_date]
        ).select_related('provider')
        
        if not recommendations.exists():
            return {'error': 'No recommendations found in period'}
        
        # Category diversity
        recommended_categories = set()
        for rec in recommendations:
            provider_categories = rec.provider.services.values_list(
                'category_id', flat=True
            ).distinct()
            recommended_categories.update(provider_categories)
        
        total_categories = Provider.objects.filter(
            is_active=True
        ).values_list(
            'services__category'
        ).distinct().count()
        
        category_diversity = len(recommended_categories) / total_categories if total_categories > 0 else 0
        
        # Provider diversity (how many unique providers recommended)
        unique_providers = recommendations.values('provider').distinct().count()
        total_providers = Provider.objects.filter(is_active=True).count()
        
        provider_diversity = unique_providers / total_providers if total_providers > 0 else 0
        
        return {
            'category_diversity_score': round(category_diversity, 3),
            'provider_diversity_score': round(provider_diversity, 3),
            'unique_categories_recommended': len(recommended_categories),
            'total_categories_available': total_categories,
            'unique_providers_recommended': unique_providers,
            'total_providers_available': total_providers
        }
    
    def analyze_cold_start_performance(self, start_date, end_date):
        """Analyze cold start problem handling"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing cold start performance...')
        
        # New users in period
        new_users = User.objects.filter(
            date_joined__range=[start_date, end_date]
        )
        
        cold_start_stats = {
            'new_users_count': new_users.count(),
            'new_users_with_recommendations': 0,
            'time_to_first_recommendation': [],
            'new_user_engagement_rate': 0
        }
        
        new_users_with_recs = 0
        engaged_new_users = 0
        
        for user in new_users:
            # Check if user got recommendations
            first_rec = UserRecommendation.objects.filter(
                user=user
            ).order_by('created_at').first()
            
            if first_rec:
                new_users_with_recs += 1
                
                # Time to first recommendation
                time_diff = first_rec.created_at - user.date_joined
                cold_start_stats['time_to_first_recommendation'].append(
                    time_diff.total_seconds() / 3600  # Convert to hours
                )
                
                # Check engagement
                if UserBehavior.objects.filter(
                    user=user,
                    created_at__gte=first_rec.created_at
                ).exists():
                    engaged_new_users += 1
        
        cold_start_stats.update({
            'new_users_with_recommendations': new_users_with_recs,
            'new_user_engagement_rate': round(
                engaged_new_users / new_users_with_recs * 100 
                if new_users_with_recs > 0 else 0, 2
            ),
            'avg_time_to_first_rec_hours': round(
                sum(cold_start_stats['time_to_first_recommendation']) / 
                len(cold_start_stats['time_to_first_recommendation'])
                if cold_start_stats['time_to_first_recommendation'] else 0, 2
            )
        })
        
        return cold_start_stats
    
    def analyze_algorithm_performance(self, start_date, end_date):
        """Compare performance of different recommendation algorithms"""
        if self.verbosity >= 2:
            self.stdout.write('Analyzing algorithm performance...')
        
        recommendations = UserRecommendation.objects.filter(
            created_at__range=[start_date, end_date]
        )
        
        algorithm_performance = {}
        
        for algorithm in recommendations.values_list('algorithm_version', flat=True).distinct():
            algo_recs = recommendations.filter(algorithm_version=algorithm)
            
            # Calculate metrics for this algorithm
            total_recs = algo_recs.count()
            interactions = 0
            
            for rec in algo_recs:
                if UserBehavior.objects.filter(
                    user=rec.user,
                    provider=rec.provider,
                    created_at__gte=rec.created_at,
                    created_at__lte=rec.created_at + timedelta(days=7)
                ).exists():
                    interactions += 1
            
            algorithm_performance[algorithm] = {
                'total_recommendations': total_recs,
                'interactions': interactions,
                'interaction_rate': round(
                    interactions / total_recs * 100 if total_recs > 0 else 0, 2
                ),
                'avg_score': round(
                    algo_recs.aggregate(avg_score=Avg('score'))['avg_score'] or 0, 3
                )
            }
        
        return algorithm_performance
    
    def output_results(self, results):
        """Output analysis results in specified format"""
        if self.options['format'] == 'console':
            self.output_to_console(results)
        elif self.options['format'] == 'json':
            self.output_to_json(results)
        elif self.options['format'] == 'csv':
            self.output_to_csv(results)
        
        if self.options['save_report']:
            self.save_detailed_report(results)
    
    def output_to_console(self, results):
        """Output results to console"""
        self.stdout.write(self.style.SUCCESS('\\n=== RECOMMENDATION SYSTEM ANALYSIS ==='))
        
        period = results['analysis_period']
        self.stdout.write(f"Analysis Period: {period['days']} days")
        self.stdout.write(f"From: {period['start_date']}")
        self.stdout.write(f"To: {period['end_date']}")
        
        for metric_name, metric_data in results['metrics'].items():
            self.stdout.write(f"\\n--- {metric_name.upper().replace('_', ' ')} ---")
            self.stdout.write(json.dumps(metric_data, indent=2))
    
    def output_to_json(self, results):
        """Output results to JSON file"""
        os.makedirs(self.options['output_dir'], exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"recommendation_analysis_{timestamp}.json"
        filepath = os.path.join(self.options['output_dir'], filename)
        
        with open(filepath, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        
        self.stdout.write(f"Analysis saved to: {filepath}")
    
    def output_to_csv(self, results):
        """Output key metrics to CSV file"""
        os.makedirs(self.options['output_dir'], exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"recommendation_metrics_{timestamp}.csv"
        filepath = os.path.join(self.options['output_dir'], filename)
        
        with open(filepath, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Metric', 'Value', 'Unit'])
            
            # Extract key metrics for CSV
            for metric_name, metric_data in results['metrics'].items():
                if isinstance(metric_data, dict):
                    for key, value in metric_data.items():
                        if isinstance(value, (int, float)):
                            writer.writerow([f"{metric_name}_{key}", value, ''])
        
        self.stdout.write(f"Metrics CSV saved to: {filepath}")
    
    def save_detailed_report(self, results):
        """Save detailed analysis report"""
        os.makedirs(self.options['output_dir'], exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"recommendation_detailed_report_{timestamp}.txt"
        filepath = os.path.join(self.options['output_dir'], filename)
        
        with open(filepath, 'w') as f:
            f.write("RECOMMENDATION SYSTEM DETAILED ANALYSIS REPORT\\n")
            f.write("=" * 50 + "\\n\\n")
            
            period = results['analysis_period']
            f.write(f"Analysis Period: {period['days']} days\\n")
            f.write(f"From: {period['start_date']}\\n")
            f.write(f"To: {period['end_date']}\\n\\n")
            
            for metric_name, metric_data in results['metrics'].items():
                f.write(f"{metric_name.upper().replace('_', ' ')}\\n")
                f.write("-" * 30 + "\\n")
                f.write(json.dumps(metric_data, indent=2))
                f.write("\\n\\n")
        
        self.stdout.write(f"Detailed report saved to: {filepath}")