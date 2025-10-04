# Generated migration to add search_vector field for PostgreSQL

from django.db import migrations
from django.contrib.postgres.search import SearchVectorField
from django.contrib.postgres.operations import TrigramExtension


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_alter_availability_day_of_week_and_more'),
    ]

    operations = [
        # Add pg_trgm extension for similarity search
        TrigramExtension(),
        
        # Add search_vector field to Provider model
        migrations.AddField(
            model_name='provider',
            name='search_vector',
            field=SearchVectorField(null=True, blank=True, help_text="Auto-maintained search vector for full-text search"),
        ),
        
        # Add GIN index for search_vector field
        migrations.RunSQL(
            sql="CREATE INDEX IF NOT EXISTS api_provider_search_vector_idx ON api_provider USING GIN (search_vector);",
            reverse_sql="DROP INDEX IF EXISTS api_provider_search_vector_idx;",
        ),
    ]
