# Migration for PostgreSQL GIN index on search_vector field

from django.db import migrations, connection
from django.contrib.postgres.indexes import GinIndex


def add_gin_index(apps, schema_editor):
    """Add GIN index on search_vector field for PostgreSQL"""
    if connection.vendor == 'postgresql':
        schema_editor.execute(
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS provider_search_vector_gin ON api_provider USING GIN (search_vector)"
        )


def remove_gin_index(apps, schema_editor):
    """Remove GIN index on search_vector field for PostgreSQL"""
    if connection.vendor == 'postgresql':
        schema_editor.execute(
            "DROP INDEX IF EXISTS provider_search_vector_gin"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0007_add_search_vector_postgresql'),
    ]

    operations = [
        migrations.RunPython(
            add_gin_index,
            remove_gin_index,
        ),
    ]