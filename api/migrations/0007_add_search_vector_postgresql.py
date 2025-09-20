# Generated migration for conditional SearchVectorField (PostgreSQL only)

from django.db import migrations, models, connection
from django.contrib.postgres.search import SearchVectorField


def add_search_vector_field(apps, schema_editor):
    """Add SearchVectorField only for PostgreSQL databases"""
    if connection.vendor == 'postgresql':
        # Add the field using raw SQL to avoid import issues
        schema_editor.execute(
            "ALTER TABLE api_provider ADD COLUMN search_vector tsvector NULL"
        )


def remove_search_vector_field(apps, schema_editor):
    """Remove SearchVectorField only for PostgreSQL databases"""
    if connection.vendor == 'postgresql':
        schema_editor.execute(
            "ALTER TABLE api_provider DROP COLUMN IF EXISTS search_vector"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0006_add_availability_model'),
    ]

    operations = [
        # Use SeparateDatabaseAndState to add field to model state for all databases
        # but only execute the SQL for PostgreSQL
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AddField(
                    model_name='provider',
                    name='search_vector',
                    field=SearchVectorField(blank=True, null=True, help_text="Auto-maintained search vector for full-text search"),
                ),
            ],
            database_operations=[
                migrations.RunPython(
                    add_search_vector_field,
                    remove_search_vector_field,
                ),
            ],
        ),
    ]