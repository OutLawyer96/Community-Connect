from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from datetime import timedelta
from api.models import Notification
from api.utils.notification_utils import cleanup_old_notifications


class Command(BaseCommand):
    help = 'Clean up old notifications to maintain database performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Delete read notifications older than this many days (default: 30)'
        )
        parser.add_argument(
            '--unread-days',
            type=int,
            default=90,
            help='Delete very old unread notifications older than this many days (default: 90)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=1000,
            help='Number of notifications to delete in each batch (default: 1000)'
        )

    def handle(self, *args, **options):
        days = options['days']
        unread_days = options['unread_days']
        dry_run = options['dry_run']
        batch_size = options['batch_size']

        cutoff_date = timezone.now() - timedelta(days=days)
        unread_cutoff_date = timezone.now() - timedelta(days=unread_days)

        self.stdout.write(
            self.style.WARNING(f'Cleaning up notifications older than {days} days (read) / {unread_days} days (unread)')
        )

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes will be made'))

        # Count what would be deleted
        read_notifications = Notification.objects.filter(
            is_read=True,
            created_at__lt=cutoff_date
        )

        unread_notifications = Notification.objects.filter(
            is_read=False,
            created_at__lt=unread_cutoff_date
        )

        total_read = read_notifications.count()
        total_unread = unread_notifications.count()
        total = total_read + total_unread

        self.stdout.write(f'Found {total_read} read notifications older than {days} days')
        self.stdout.write(f'Found {total_unread} unread notifications older than {unread_days} days')
        self.stdout.write(f'Total notifications to delete: {total}')

        if total == 0:
            self.stdout.write(self.style.SUCCESS('No notifications to clean up'))
            return

        if dry_run:
            self.stdout.write(self.style.SUCCESS('Dry run complete - no deletions performed'))
            return

        # Perform the cleanup
        try:
            deleted_count = cleanup_old_notifications(
                days=days,
                unread_days=unread_days,
                batch_size=batch_size
            )

            self.stdout.write(
                self.style.SUCCESS(f'Successfully deleted {deleted_count} notifications')
            )

        except Exception as e:
            raise CommandError(f'Error during cleanup: {str(e)}')