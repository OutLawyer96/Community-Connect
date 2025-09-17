from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Category, Provider, Service, Address, Review, Favorite

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
    list_display = ['business_name', 'user', 'is_active', 'average_rating']
    list_filter = ['is_active']
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