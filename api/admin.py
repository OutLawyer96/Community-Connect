from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from .models import User, Category, Provider, Service, Address, Review, Favorite, Claim, Notification, NotificationPreference, MessageThread, Message, UserBehavior, UserRecommendation, ABTestVariant
from .utils import approve_claim, reject_claim

# Custom User Admin
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active', 'date_joined']
    list_filter = ['role', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('role', 'phone')}),
    )

# Category Admin
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent_category', 'is_active']
    list_filter = ['is_active', 'parent_category']
    search_fields = ['name', 'description']

# Provider Admin
@admin.register(Provider)
class ProviderAdmin(admin.ModelAdmin):
    list_display = ['business_name', 'user', 'is_claimed', 'is_active', 'average_rating']
    list_filter = ['is_claimed', 'is_active']
    search_fields = ['business_name', 'user__username', 'user__email']
    readonly_fields = ['average_rating']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('user', 'business_name', 'description', 'is_active')
        }),
        ('Contact Information', {
            'fields': ('phone', 'email', 'website')
        }),
        ('System Information', {
            'fields': ('average_rating',),
            'classes': ('collapse',)
        }),
    )

# Service Admin
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name', 'provider', 'category', 'price', 'is_active']
    list_filter = ['category', 'is_active', 'provider']
    search_fields = ['name', 'description', 'provider__business_name']

# Address Admin
@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['provider', 'street', 'city', 'state', 'postal_code', 'is_primary']
    list_filter = ['state', 'city', 'is_primary']
    search_fields = ['provider__business_name', 'street', 'city']

# Review Admin
@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['provider', 'user', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['provider__business_name', 'user__username', 'comment']
    readonly_fields = ['created_at', 'updated_at']

# Favorite Admin
@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'provider__business_name']

# Claim Admin
@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ['provider', 'claimant', 'status', 'email_verified', 'created_at', 'reviewed_at']
    list_filter = ['status', 'email_verified', 'created_at']
    search_fields = ['provider__business_name', 'claimant__username', 'claimant__email']
    readonly_fields = ['created_at', 'updated_at', 'verification_token']
    
    fieldsets = (
        ('Claim Information', {
            'fields': ('provider', 'claimant', 'status', 'email_verified')
        }),
        ('Documentation', {
            'fields': ('business_documents', 'additional_info')
        }),
        ('Review Process', {
            'fields': ('admin_notes', 'reviewed_by', 'reviewed_at')
        }),
        ('System Fields', {
            'fields': ('verification_token', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['approve_claims', 'reject_claims']
    
    def approve_claims(self, request, queryset):
        """Bulk approve selected claims"""
        updated = 0
        for claim in queryset.filter(status='pending'):
            success = approve_claim(claim, request.user)
            if success:
                updated += 1
        
        self.message_user(request, f'{updated} claims approved successfully.')
    approve_claims.short_description = "Approve selected claims"
    
    def reject_claims(self, request, queryset):
        """Bulk reject selected claims"""
        updated = 0
        for claim in queryset.filter(status='pending'):
            success = reject_claim(claim, request.user, admin_notes="Bulk rejected via admin")
            if success:
                updated += 1
        
        self.message_user(request, f'{updated} claims rejected.')
    reject_claims.short_description = "Reject selected claims"


# Notification Admin
@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'notification_type', 'title', 'is_read', 'email_sent', 'created_at']
    list_filter = ['notification_type', 'is_read', 'email_sent', 'created_at']
    search_fields = ['user__username', 'title', 'message']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('user', 'notification_type', 'title', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'email_sent')
        }),
        ('Related Object', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread', 'send_email_notifications']
    
    def mark_as_read(self, request, queryset):
        """Mark selected notifications as read"""
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} notifications marked as read.')
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        """Mark selected notifications as unread"""
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} notifications marked as unread.')
    mark_as_unread.short_description = "Mark selected notifications as unread"
    
    def send_email_notifications(self, request, queryset):
        """Send email for selected notifications"""
        from .utils.notification_utils import send_notification_email
        sent = 0
        for notification in queryset.filter(email_sent=False):
            try:
                send_notification_email(notification)
                notification.email_sent = True
                notification.save()
                sent += 1
            except Exception as e:
                self.message_user(request, f'Error sending email for notification {notification.id}: {e}', level='ERROR')
        
        self.message_user(request, f'{sent} email notifications sent.')
    send_email_notifications.short_description = "Send email notifications"


# Notification Preference Admin
@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_for_reviews', 'email_for_claims', 'email_for_messages', 'email_for_system', 'in_app_enabled']
    list_filter = ['email_for_reviews', 'email_for_claims', 'email_for_messages', 'email_for_system', 'in_app_enabled']
    search_fields = ['user__username', 'user__email']


# Message Thread Admin
@admin.register(MessageThread)
class MessageThreadAdmin(admin.ModelAdmin):
    list_display = ['id', 'customer', 'provider', 'message_count', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['customer__username', 'provider__username', 'customer__email', 'provider__email']
    readonly_fields = ['created_at', 'updated_at', 'message_count']
    
    def message_count(self, obj):
        """Get the number of messages in this thread"""
        return obj.messages.count()
    message_count.short_description = "Messages"


# Message Admin
@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread', 'sender', 'content_preview', 'is_read', 'created_at']
    list_filter = ['is_read', 'created_at', 'sender__role']
    search_fields = ['sender__username', 'content', 'thread__customer__username', 'thread__provider__username']
    readonly_fields = ['created_at']
    
    def content_preview(self, obj):
        """Show preview of message content"""
        return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
    content_preview.short_description = "Content Preview"
    
    actions = ['mark_as_read', 'mark_as_unread']
    
    def mark_as_read(self, request, queryset):
        """Mark selected messages as read"""
        updated = queryset.update(is_read=True)
        self.message_user(request, f'{updated} messages marked as read.')
    mark_as_read.short_description = "Mark selected messages as read"
    
    def mark_as_unread(self, request, queryset):
        """Mark selected messages as unread"""
        updated = queryset.update(is_read=False)
        self.message_user(request, f'{updated} messages marked as unread.')
    mark_as_unread.short_description = "Mark selected messages as unread"


# UserBehavior Admin
@admin.register(UserBehavior)
class UserBehaviorAdmin(admin.ModelAdmin):
    list_display = ['user', 'action_type', 'provider', 'search_query_preview', 'category', 'created_at']
    list_filter = ['action_type', 'created_at', 'category']
    search_fields = ['user__username', 'user__email', 'provider__business_name', 'search_query']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def search_query_preview(self, obj):
        """Show preview of search query"""
        if obj.search_query:
            return obj.search_query[:50] + ('...' if len(obj.search_query) > 50 else '')
        return '-'
    search_query_preview.short_description = "Search Query"
    
    actions = ['delete_old_behavior']
    
    def delete_old_behavior(self, request, queryset):
        """Delete behavior data older than 90 days"""
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=90)
        old_behavior = queryset.filter(created_at__lt=cutoff_date)
        count = old_behavior.count()
        old_behavior.delete()
        self.message_user(request, f'Deleted {count} old behavior records.')
    delete_old_behavior.short_description = "Delete old behavior data (90+ days)"


# UserRecommendation Admin
@admin.register(UserRecommendation)
class UserRecommendationAdmin(admin.ModelAdmin):
    list_display = ['user', 'provider', 'score', 'algorithm_version', 'created_at', 'expires_at']
    list_filter = ['algorithm_version', 'created_at', 'expires_at']
    search_fields = ['user__username', 'provider__business_name']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Recommendation Details', {
            'fields': ('user', 'provider', 'score', 'algorithm_version')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['rebuild_recommendations', 'extend_expiry']
    
    def rebuild_recommendations(self, request, queryset):
        """Rebuild recommendations for selected users"""
        users = set(rec.user for rec in queryset)
        for user in users:
            # Delete existing recommendations for this user
            UserRecommendation.objects.filter(user=user).delete()
        
        self.message_user(
            request, 
            f'Cleared recommendations for {len(users)} users. Run build_recommendations command to regenerate.'
        )
    rebuild_recommendations.short_description = "Clear and rebuild recommendations for selected users"
    
    def extend_expiry(self, request, queryset):
        """Extend expiry by 24 hours"""
        from datetime import timedelta
        updated = queryset.update(expires_at=timezone.now() + timedelta(hours=24))
        self.message_user(request, f'Extended expiry for {updated} recommendations by 24 hours.')
    extend_expiry.short_description = "Extend expiry by 24 hours"


# ABTestVariant Admin
@admin.register(ABTestVariant)
class ABTestVariantAdmin(admin.ModelAdmin):
    list_display = ['user', 'experiment_name', 'variant', 'assigned_at']
    list_filter = ['experiment_name', 'variant', 'assigned_at']
    search_fields = ['user__username', 'user__email', 'experiment_name']
    readonly_fields = ['assigned_at']
    date_hierarchy = 'assigned_at'
    
    fieldsets = (
        ('A/B Test Assignment', {
            'fields': ('user', 'experiment_name', 'variant')
        }),
        ('Assignment Details', {
            'fields': ('assigned_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['reassign_variant', 'export_experiment_data']
    
    def reassign_variant(self, request, queryset):
        """Reassign selected users to different variants"""
        # This would need a form to select new variant
        self.message_user(request, 'Reassignment functionality would require custom form.')
    reassign_variant.short_description = "Reassign users to different variants"
    
    def export_experiment_data(self, request, queryset):
        """Export A/B test data for analysis"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="ab_test_data.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['User ID', 'Username', 'Experiment', 'Variant', 'Assigned At'])
        
        for assignment in queryset:
            writer.writerow([
                assignment.user.id,
                assignment.user.username,
                assignment.experiment_name,
                assignment.variant,
                assignment.assigned_at.strftime('%Y-%m-%d %H:%M:%S')
            ])
        
        return response
    export_experiment_data.short_description = "Export A/B test data to CSV"