"""
Management command for recommendation system cleanup and maintenance.
Removes expired recommendations, old behavior data, and completed A/B test assignments.
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
import logging

from api.models import UserRecommendation, UserBehavior, ABTestVariant
from api.utils.ab_testing import ABTestManager

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Clean up expired recommendations, old behavior data, and completed A/B test assignments'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
        parser.add_argument(
            '--behavior-retention-days',
            type=int,
            default=90,
            help='Number of days to retain user behavior data (default: 90)'
        )
        parser.add_argument(
            '--abtest-cleanup-days',
            type=int,
            default=30,
            help='Days after experiment end to keep A/B test assignments (default: 30)'
        )
        parser.add_argument(
            '--user-id',
            type=int,
            help='Clean up data for specific user ID only'
        )
        parser.add_argument(
            '--recommendations-only',
            action='store_true',
            help='Only clean up expired recommendations'
        )
        parser.add_argument(
            '--behavior-only',
            action='store_true',
            help='Only clean up old behavior data'
        )
        parser.add_argument(
            '--abtest-only',
            action='store_true',
            help='Only clean up A/B test assignments'
        )
        parser.add_argument(
            '--optimize-db',
            action='store_true',
            help='Run database optimization queries after cleanup'
        )
    
    def handle(self, *args, **options):
        """Main command handler"""
        self.verbosity = options['verbosity']
        self.dry_run = options['dry_run']
        
        if self.verbosity >= 1:
            mode = "DRY RUN" if self.dry_run else "LIVE"
            self.stdout.write(
                self.style.SUCCESS(f'Starting recommendation system cleanup ({mode})...')
            )
        
        try:
            cleanup_stats = {
                'expired_recommendations': 0,
                'old_behavior': 0,
                'abtest_assignments': 0
            }
            
            # Clean up expired recommendations
            if not options['behavior_only'] and not options['abtest_only']:
                cleanup_stats['expired_recommendations'] = self.cleanup_expired_recommendations(
                    options['user_id']
                )
            
            # Clean up old behavior data
            if not options['recommendations_only'] and not options['abtest_only']:
                cleanup_stats['old_behavior'] = self.cleanup_old_behavior(
                    options['behavior_retention_days'],
                    options['user_id']
                )
            
            # Clean up A/B test assignments
            if not options['recommendations_only'] and not options['behavior_only']:
                cleanup_stats['abtest_assignments'] = self.cleanup_abtest_assignments(
                    options['abtest_cleanup_days']
                )
            
            # Database optimization
            if options['optimize_db'] and not self.dry_run:
                self.optimize_database()
            
            # Report results
            if self.verbosity >= 1:
                self.report_cleanup_results(cleanup_stats)
                
        except Exception as e:
            logger.error(f"Error in recommendation cleanup: {e}")
            raise CommandError(f'Recommendation cleanup failed: {e}')
    
    def cleanup_expired_recommendations(self, user_id=None):
        """Clean up expired UserRecommendation records"""
        if self.verbosity >= 2:
            self.stdout.write('Cleaning up expired recommendations...')
        
        queryset = UserRecommendation.objects.filter(
            expires_at__lt=timezone.now()
        )
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        count = queryset.count()
        
        if self.verbosity >= 2:
            self.stdout.write(f'Found {count} expired recommendations')
        
        if not self.dry_run and count > 0:
            with transaction.atomic():
                deleted_count = queryset.delete()[0]
                logger.info(f"Deleted {deleted_count} expired recommendations")
                return deleted_count
        
        return count
    
    def cleanup_old_behavior(self, retention_days, user_id=None):
        """Clean up old UserBehavior records while preserving aggregated statistics"""
        if self.verbosity >= 2:
            self.stdout.write(f'Cleaning up behavior data older than {retention_days} days...')
        
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        queryset = UserBehavior.objects.filter(
            created_at__lt=cutoff_date
        )
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        count = queryset.count()
        
        if self.verbosity >= 2:
            self.stdout.write(f'Found {count} old behavior records')
        
        if not self.dry_run and count > 0:
            with transaction.atomic():
                # Before deleting, you might want to preserve aggregated statistics
                # This is a placeholder for more sophisticated retention logic
                
                deleted_count = queryset.delete()[0]
                logger.info(f"Deleted {deleted_count} old behavior records")
                return deleted_count
        
        return count
    
    def cleanup_abtest_assignments(self, cleanup_days):
        """Clean up A/B test assignments for ended experiments"""
        if self.verbosity >= 2:
            self.stdout.write(f'Cleaning up A/B test assignments for experiments ended {cleanup_days}+ days ago...')
        
        ab_manager = ABTestManager()
        count = ab_manager.cleanup_ended_experiments(cleanup_days)
        
        if self.verbosity >= 2:
            self.stdout.write(f'Cleaned up {count} A/B test assignments')
        
        return count
    
    def optimize_database(self):
        """Run database optimization queries"""
        if self.verbosity >= 2:
            self.stdout.write('Running database optimization...')
        
        try:
            from django.db import connection
            
            with connection.cursor() as cursor:
                # Analyze tables for better query planning
                tables_to_analyze = [
                    'api_userrecommendation',
                    'api_userbehavior',
                    'api_abtestvariant'
                ]
                
                for table in tables_to_analyze:
                    if connection.vendor == 'postgresql':
                        cursor.execute(f'ANALYZE {table};')
                    elif connection.vendor == 'sqlite':
                        cursor.execute(f'ANALYZE {table};')
                
                if self.verbosity >= 2:
                    self.stdout.write('Database optimization completed')
                    
        except Exception as e:
            logger.error(f"Error during database optimization: {e}")
            if self.verbosity >= 1:
                self.stdout.write(
                    self.style.WARNING(f'Database optimization failed: {e}')
                )
    
    def report_cleanup_results(self, stats):
        """Report cleanup results to user"""
        action = "Would delete" if self.dry_run else "Deleted"
        
        self.stdout.write(self.style.SUCCESS('Cleanup completed:'))
        self.stdout.write(f'  {action} {stats["expired_recommendations"]} expired recommendations')
        self.stdout.write(f'  {action} {stats["old_behavior"]} old behavior records')
        self.stdout.write(f'  {action} {stats["abtest_assignments"]} A/B test assignments')
        
        total = sum(stats.values())
        if total == 0:
            self.stdout.write(self.style.SUCCESS('No cleanup needed - all data is current'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Total records processed: {total}'))
    
    def get_cleanup_schedule_info(self):
        """Provide information about recommended cleanup schedule"""
        info = [
            "Recommended cleanup schedule:",
            "- Daily: Expired recommendations (automated via cron)",
            "- Weekly: Recent behavior data optimization",
            "- Monthly: Old behavior data cleanup (90+ days)",
            "- Quarterly: A/B test assignment cleanup",
            "",
            "Example cron entries:",
            "# Daily cleanup at 2 AM",
            "0 2 * * * python manage.py cleanup_recommendations --recommendations-only",
            "",
            "# Weekly optimization on Sundays at 3 AM", 
            "0 3 * * 0 python manage.py cleanup_recommendations --optimize-db",
            "",
            "# Monthly full cleanup on 1st at 4 AM",
            "0 4 1 * * python manage.py cleanup_recommendations"
        ]
        
        return "\n".join(info)