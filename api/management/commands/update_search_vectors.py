"""
Management command to update search vectors for all providers.

Usage:
    python manage.py update_search_vectors
    python manage.py update_search_vectors --since 2024-01-01
    python manage.py update_search_vectors --provider-id 123
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.utils.dateparse import parse_datetime
from api.models import Provider


class Command(BaseCommand):
    help = 'Update search vectors for providers (PostgreSQL only)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--since',
            type=str,
            help='Update providers modified since this datetime (ISO format)',
        )
        parser.add_argument(
            '--provider-id',
            type=int,
            help='Update specific provider by ID',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=100,
            help='Number of providers to process in each batch',
        )

    def handle(self, *args, **options):
        if connection.vendor != 'postgresql':
            self.stdout.write(
                self.style.WARNING('Search vectors are only supported on PostgreSQL databases.')
            )
            return

        # Build queryset based on options
        queryset = Provider.objects.filter(is_active=True)
        
        if options['provider_id']:
            queryset = queryset.filter(id=options['provider_id'])
        elif options['since']:
            try:
                since_date = parse_datetime(options['since'])
                if not since_date:
                    raise ValueError("Invalid datetime format")
                queryset = queryset.filter(updated_at__gte=since_date)
            except ValueError as e:
                raise CommandError(f'Invalid --since format: {e}')

        total_count = queryset.count()
        
        if total_count == 0:
            self.stdout.write(self.style.SUCCESS('No providers to update.'))
            return

        self.stdout.write(f'Updating search vectors for {total_count} providers...')

        # Process in batches
        batch_size = options['batch_size']
        updated_count = 0
        
        for i in range(0, total_count, batch_size):
            batch = queryset[i:i + batch_size]
            
            for provider in batch:
                try:
                    provider.update_search_vector()
                    updated_count += 1
                    
                    if updated_count % 50 == 0:
                        self.stdout.write(f'  Updated {updated_count}/{total_count} providers...')
                        
                except Exception as e:
                    self.stderr.write(f'Error updating provider {provider.id}: {e}')

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated search vectors for {updated_count} providers.')
        )