from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from .models import User, Category, Provider, Service, Address, Review, Favorite, Claim
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