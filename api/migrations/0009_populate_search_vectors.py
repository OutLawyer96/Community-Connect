# Data migration to populate search_vector field for existing providers

from django.db import migrations, connection


def populate_search_vectors(apps, schema_editor):
    """Populate search_vector field for all existing providers (PostgreSQL only)"""
    if connection.vendor == 'postgresql':
        # Use raw SQL to populate search vectors efficiently
        schema_editor.execute("""
            UPDATE api_provider 
            SET search_vector = 
                setweight(to_tsvector('english', COALESCE(business_name, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(
                    (SELECT string_agg(s.name, ' ') 
                     FROM api_service s 
                     WHERE s.provider_id = api_provider.id), '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(
                    (SELECT string_agg(s.description, ' ') 
                     FROM api_service s 
                     WHERE s.provider_id = api_provider.id), '')), 'C')
            WHERE search_vector IS NULL OR search_vector = ''
        """)


def clear_search_vectors(apps, schema_editor):
    """Clear search_vector field"""
    if connection.vendor == 'postgresql':
        schema_editor.execute(
            "UPDATE api_provider SET search_vector = NULL"
        )


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0008_add_gin_index_postgresql'),
    ]

    operations = [
        migrations.RunPython(
            populate_search_vectors,
            clear_search_vectors,
        ),
    ]