# Generated migration for notification system

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def create_default_preferences(apps, schema_editor):
    """Create default notification preferences for existing users"""
    User = apps.get_model('api', 'User')
    NotificationPreference = apps.get_model('api', 'NotificationPreference')
    
    for user in User.objects.all():
        NotificationPreference.objects.get_or_create(
            user=user,
            defaults={
                'email_for_reviews': True,
                'email_for_claims': True,
                'email_for_messages': True,
                'email_for_system': True,
                'in_app_enabled': True,
            }
        )


def reverse_default_preferences(apps, schema_editor):
    """Remove default preferences"""
    NotificationPreference = apps.get_model('api', 'NotificationPreference')
    NotificationPreference.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0011_add_user_avatar'),  # Corrected dependency
        ('contenttypes', '0002_remove_content_type_name'),
    ]

    operations = [
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(choices=[('review', 'Review'), ('claim', 'Claim'), ('message', 'Message'), ('system', 'System')], max_length=20)),
                ('title', models.CharField(max_length=255)),
                ('message', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('email_sent', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('object_id', models.PositiveIntegerField(blank=True, null=True)),
                ('content_type', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.contenttype')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='NotificationPreference',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email_for_reviews', models.BooleanField(default=True)),
                ('email_for_claims', models.BooleanField(default=True)),
                ('email_for_messages', models.BooleanField(default=True)),
                ('email_for_system', models.BooleanField(default=True)),
                ('in_app_enabled', models.BooleanField(default=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='notification_preferences', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='MessageThread',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('customer', models.ForeignKey(limit_choices_to={'role': 'customer'}, on_delete=django.db.models.deletion.CASCADE, related_name='customer_threads', to=settings.AUTH_USER_MODEL)),
                ('provider', models.ForeignKey(limit_choices_to={'role': 'provider'}, on_delete=django.db.models.deletion.CASCADE, related_name='provider_threads', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('content', models.TextField()),
                ('is_read', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
                ('thread', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='messages', to='api.messagethread')),
            ],
            options={
                'ordering': ['created_at'],
            },
        ),
        # Add indexes for performance
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'notification_type'], name='api_notific_user_id_9b5c5f_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['user', 'is_read'], name='api_notific_user_id_af7a8d_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['created_at'], name='api_notific_created_2a1b3c_idx'),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['thread', 'created_at'], name='api_message_thread_6f4d5e_idx'),
        ),
        migrations.AddIndex(
            model_name='message',
            index=models.Index(fields=['sender', 'created_at'], name='api_message_sender_7e8f9a_idx'),
        ),
        # Add constraints
        migrations.AddConstraint(
            model_name='messagethread',
            constraint=models.UniqueConstraint(fields=('customer', 'provider'), name='unique_customer_provider_thread'),
        ),
        # Create default preferences for existing users
        migrations.RunPython(create_default_preferences, reverse_default_preferences),
    ]