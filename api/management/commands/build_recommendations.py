"""
Management command for building personalized recommendations.
This command trains ML models and generates recommendations for users.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from datetime import timedelta
import logging
import os

from api.models import UserRecommendation, UserBehavior, Provider
from api.utils.recommendation_engine import HybridRecommendationEngine, ColdStartHandler
from api.utils.ab_testing import ABTestManager

User = get_user_model()
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Build personalized recommendations for users'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--user-id',
            type=int,
            help='Build recommendations for specific user ID'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Batch size for processing users (default: 100)'
        )
        parser.add_argument(
            '--max-recommendations',
            type=int,
            default=20,
            help='Maximum recommendations per user (default: 20)'
        )
        parser.add_argument(
            '--min-score',
            type=float,
            default=0.1,
            help='Minimum recommendation score threshold (default: 0.1)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Run without saving recommendations to database'
        )
        parser.add_argument(
            '--retrain-models',
            action='store_true',
            help='Force retraining of ML models'
        )
        parser.add_argument(
            '--full-rebuild',
            action='store_true',
            help='Rebuild recommendations for all users (not just recent activity)'
        )
        parser.add_argument(
            '--skip-training',
            action='store_true',
            help='Skip model training (use existing models)'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        self.verbosity = options['verbosity']
        self.dry_run = options['dry_run']
        
        if self.verbosity >= 1:
            mode = "DRY RUN" if self.dry_run else "LIVE"
            self.stdout.write(
                self.style.SUCCESS(f'Starting recommendation building ({mode})...')
            )
        
        try:
            # Initialize recommendation engines
            self.hybrid_engine = HybridRecommendationEngine()
            self.cold_start_handler = ColdStartHandler()
            self.ab_test_manager = ABTestManager()
            
            # Train models if needed
            if not options['skip_training']:
                if options['retrain_models']:
                    self.train_models()
                else:
                    self.load_existing_models()
            
            # Build recommendations
            if not self.dry_run:
                if options['user_id']:
                    self.build_user_recommendations(
                        options['user_id'],
                        options['max_recommendations'],
                        options['min_score']
                    )
                else:
                    self.build_all_recommendations(
                        options['batch_size'],
                        options['max_recommendations'],
                        options['min_score'],
                        options['full_rebuild']
                    )
            
            if self.verbosity >= 1:
                self.stdout.write(
                    self.style.SUCCESS('Recommendation building completed successfully!')
                )
                
        except Exception as e:
            logger.error(f"Error in recommendation building: {e}")
            raise CommandError(f'Recommendation building failed: {e}')
    
    def train_models(self):
        """Train all recommendation models"""
        if self.verbosity >= 1:
            self.stdout.write('Training recommendation models...')
        
        # Train engines
        training_results = self.hybrid_engine.train_all_engines()
        
        if self.verbosity >= 2:
            for engine, success in training_results.items():
                status = 'SUCCESS' if success else 'FAILED'
                self.stdout.write(f'  {engine}: {status}')
        
        # Save trained models
        if not self.dry_run:
            self.save_models()
        
        if self.verbosity >= 1:
            self.stdout.write(self.style.SUCCESS('Model training completed.'))
    
    def load_existing_models(self):
        """Load existing trained models from disk"""
        model_dir = getattr(settings, 'RECOMMENDATION_MODEL_DIR', 'data/models')
        
        cf_model_path = os.path.join(model_dir, 'collaborative_filtering.pkl')
        
        # Try to load collaborative filtering model
        if os.path.exists(cf_model_path):
            if self.hybrid_engine.cf_engine.load_model(cf_model_path):
                if self.verbosity >= 2:
                    self.stdout.write('Loaded collaborative filtering model')
            else:
                if self.verbosity >= 1:
                    self.stdout.write(self.style.WARNING('Failed to load CF model, will retrain'))
                self.hybrid_engine.cf_engine.train()
        else:
            if self.verbosity >= 1:
                self.stdout.write('No existing CF model found, training new one')
            self.hybrid_engine.cf_engine.train()
        
        # Train content-based model (lightweight, always retrain)
        self.hybrid_engine.content_engine.train()
        
        if self.verbosity >= 1:
            self.stdout.write('Model loading/training completed.')
    
    def save_models(self):
        """Save trained models to disk"""
        model_dir = getattr(settings, 'RECOMMENDATION_MODEL_DIR', 'data/models')
        os.makedirs(model_dir, exist_ok=True)
        
        # Save collaborative filtering model
        cf_model_path = os.path.join(model_dir, 'collaborative_filtering.pkl')
        if self.hybrid_engine.cf_engine.save_model(cf_model_path):
            if self.verbosity >= 2:
                self.stdout.write(f'Saved CF model to {cf_model_path}')
    
    def build_all_recommendations(self, batch_size, max_recommendations, min_score, full_rebuild):
        """Build recommendations for all users"""
        # Get users with behavior or new users
        if full_rebuild:
            users_queryset = User.objects.filter(is_active=True)
        else:
            # Only users with recent behavior or no existing recommendations
            recent_behavior_users = UserBehavior.objects.filter(
                created_at__gte=timezone.now() - timedelta(days=7)
            ).values_list('user_id', flat=True).distinct()
            
            users_without_recommendations = User.objects.exclude(
                userrecommendation__expires_at__gt=timezone.now()
            ).values_list('id', flat=True)
            
            user_ids = set(recent_behavior_users) | set(users_without_recommendations)
            users_queryset = User.objects.filter(id__in=user_ids, is_active=True)
        
        total_users = users_queryset.count()
        
        if self.verbosity >= 1:
            self.stdout.write(f'Building recommendations for {total_users} users...')
        
        processed = 0
        
        for user_batch in self.batch_queryset(users_queryset, batch_size):
            with transaction.atomic():
                for user in user_batch:
                    try:
                        self.build_user_recommendations(
                            user.id, max_recommendations, min_score
                        )
                        processed += 1
                        
                        if self.verbosity >= 2 and processed % 10 == 0:
                            self.stdout.write(f'Processed {processed}/{total_users} users')
                            
                    except Exception as e:
                        logger.error(f"Error building recommendations for user {user.id}: {e}")
                        if self.verbosity >= 2:
                            self.stdout.write(
                                self.style.ERROR(f'Failed for user {user.id}: {e}')
                            )
        
        if self.verbosity >= 1:
            self.stdout.write(
                self.style.SUCCESS(f'Completed recommendations for {processed} users')
            )
    
    def build_user_recommendations(self, user_id, max_recommendations, min_score):
        """Build recommendations for a specific user"""
        try:
            user = User.objects.get(id=user_id, is_active=True)
        except User.DoesNotExist:
            if self.verbosity >= 2:
                self.stdout.write(self.style.ERROR(f'User {user_id} not found'))
            return
        
        # Get A/B test variant for recommendation weights
        weights = self.ab_test_manager.get_recommendation_weights(user)
        self.hybrid_engine.weights = weights
        
        # Check if user has any behavior (cold start detection)
        has_behavior = UserBehavior.objects.filter(user=user).exists()
        
        if has_behavior:
            # Use hybrid recommendations
            recommendations = self.generate_hybrid_recommendations(
                user, max_recommendations, min_score
            )
        else:
            # Use cold start strategy
            recommendations = self.generate_cold_start_recommendations(
                user, max_recommendations
            )
        
        # Save recommendations
        if not self.dry_run and recommendations:
            self.save_user_recommendations(user, recommendations)
        
        if self.verbosity >= 2:
            self.stdout.write(
                f'Generated {len(recommendations)} recommendations for user {user_id}'
            )
    
    def generate_hybrid_recommendations(self, user, max_recommendations, min_score):
        """Generate hybrid recommendations for user with behavior history"""
        # Get candidate providers (exclude already interacted)
        excluded_providers = set()
        
        # Exclude favorited providers
        from api.models import Favorite
        excluded_providers.update(
            Favorite.objects.filter(user=user).values_list('provider_id', flat=True)
        )
        
        # Exclude recently viewed providers (within last 7 days)
        excluded_providers.update(
            UserBehavior.objects.filter(
                user=user,
                action_type='view',
                created_at__gte=timezone.now() - timedelta(days=7)
            ).values_list('provider_id', flat=True)
        )
        
        # Get all active providers except excluded ones
        candidate_providers = list(
            Provider.objects.filter(is_active=True)
            .exclude(id__in=excluded_providers)
            .values_list('id', flat=True)
        )
        
        # Get user's location preference for location-based scoring
        user_location = self.get_user_location_preference(user)
        
        # Generate recommendations
        raw_recommendations = self.hybrid_engine.generate_recommendations(
            user_id=user.id,
            candidate_providers=candidate_providers,
            top_k=max_recommendations * 2,  # Get more to filter
            user_location=user_location
        )
        
        # Filter by minimum score and format
        recommendations = []
        for provider_id, score in raw_recommendations:
            if score >= min_score:
                recommendations.append({
                    'provider_id': provider_id,
                    'score': score,
                    'algorithm_version': f"hybrid_v1.0"
                })
        
        return recommendations[:max_recommendations]
    
    def generate_cold_start_recommendations(self, user, max_recommendations):
        """Generate recommendations for new users without behavior history"""
        # Get cold start strategy from A/B test
        strategy = self.ab_test_manager.get_cold_start_strategy(user)
        
        if strategy == 'popular_providers':
            provider_ids = self.cold_start_handler.get_popular_providers(
                top_k=max_recommendations
            )
        elif strategy == 'category_based':
            provider_ids = self.cold_start_handler.get_category_based_recommendations(
                user.id, top_k=max_recommendations
            )
        else:
            # Default to popular providers
            provider_ids = self.cold_start_handler.get_popular_providers(
                top_k=max_recommendations
            )
        
        # Format recommendations
        recommendations = []
        for i, provider_id in enumerate(provider_ids):
            score = 0.8 - (i * 0.05)  # Decreasing scores
            recommendations.append({
                'provider_id': provider_id,
                'score': max(0.3, score),  # Minimum score of 0.3
                'algorithm_version': f"cold_start_{strategy}_v1.0"
            })
        
        return recommendations
    
    def get_user_location_preference(self, user):
        """Get user's location preference from recent behavior"""
        recent_locations = UserBehavior.objects.filter(
            user=user,
            location_lat__isnull=False,
            location_lng__isnull=False,
            created_at__gte=timezone.now() - timedelta(days=30)
        ).order_by('-created_at')[:10]
        
        if recent_locations:
            # Use most recent location
            latest_location = recent_locations[0]
            return (float(latest_location.location_lat), float(latest_location.location_lng))
        
        return None
    
    def save_user_recommendations(self, user, recommendations):
        """Save recommendations to database"""
        # Delete existing recommendations for this user
        UserRecommendation.objects.filter(user=user).delete()
        
        # Create new recommendations
        recommendation_objects = []
        for rec in recommendations:
            recommendation_objects.append(
                UserRecommendation(
                    user=user,
                    provider_id=rec['provider_id'],
                    score=rec['score'],
                    algorithm_version=rec['algorithm_version'],
                    expires_at=timezone.now() + timedelta(
                        hours=getattr(settings, 'RECOMMENDATION_CACHE_TIMEOUT', 24)
                    )
                )
            )
        
        # Bulk create
        UserRecommendation.objects.bulk_create(
            recommendation_objects,
            batch_size=100
        )
    
    def batch_queryset(self, queryset, batch_size):
        """Yield batches of queryset results"""
        total = queryset.count()
        for start in range(0, total, batch_size):
            end = min(start + batch_size, total)
            yield queryset[start:end]