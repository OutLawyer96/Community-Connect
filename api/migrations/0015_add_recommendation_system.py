# Generated migration for recommendation system models

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0014_merge_20250922_1549'),
    ]

    operations = [
        migrations.CreateModel(
            name='UserBehavior',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action_type', models.CharField(choices=[('view', 'View Provider'), ('search', 'Search Providers'), ('favorite', 'Add to Favorites'), ('contact', 'Contact Provider')], max_length=20)),
                ('search_query', models.TextField(blank=True, null=True)),
                ('location_lat', models.DecimalField(blank=True, decimal_places=8, max_digits=10, null=True)),
                ('location_lng', models.DecimalField(blank=True, decimal_places=8, max_digits=11, null=True)),
                ('session_id', models.CharField(blank=True, max_length=40, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('category', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.category')),
                ('provider', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='api.provider')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'api_userbehavior',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='UserRecommendation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('score', models.FloatField()),
                ('algorithm_version', models.CharField(default='v1.0', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('expires_at', models.DateTimeField()),
                ('provider', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='api.provider')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'api_userrecommendation',
                'ordering': ['-score'],
            },
        ),
        migrations.CreateModel(
            name='ABTestVariant',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('experiment_name', models.CharField(max_length=100)),
                ('variant', models.CharField(max_length=50)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'db_table': 'api_abtestvariant',
            },
        ),
        migrations.AddIndex(
            model_name='userbehavior',
            index=models.Index(fields=['user', 'action_type'], name='api_userbeha_user_id_5a7a5d_idx'),
        ),
        migrations.AddIndex(
            model_name='userbehavior',
            index=models.Index(fields=['created_at'], name='api_userbeha_created_5f2c8a_idx'),
        ),
        migrations.AddIndex(
            model_name='userbehavior',
            index=models.Index(fields=['provider'], name='api_userbeha_provide_7b4c91_idx'),
        ),
        migrations.AddIndex(
            model_name='userbehavior',
            index=models.Index(fields=['session_id'], name='api_userbeha_session_8d3e2f_idx'),
        ),
        migrations.AddIndex(
            model_name='userrecommendation',
            index=models.Index(fields=['user', '-score'], name='api_userreco_user_id_4f8a9b_idx'),
        ),
        migrations.AddIndex(
            model_name='userrecommendation',
            index=models.Index(fields=['expires_at'], name='api_userreco_expires_2c5d7e_idx'),
        ),
        migrations.AddIndex(
            model_name='userrecommendation',
            index=models.Index(fields=['algorithm_version'], name='api_userreco_algorit_1e6f8a_idx'),
        ),
        migrations.AddIndex(
            model_name='abtestvariant',
            index=models.Index(fields=['user', 'experiment_name'], name='api_abtestva_user_id_3a9b8c_idx'),
        ),
        migrations.AddIndex(
            model_name='abtestvariant',
            index=models.Index(fields=['experiment_name', 'variant'], name='api_abtestva_experim_5d7e2f_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='userrecommendation',
            unique_together={('user', 'provider')},
        ),
        migrations.AlterUniqueTogether(
            name='abtestvariant',
            unique_together={('user', 'experiment_name')},
        ),
    ]