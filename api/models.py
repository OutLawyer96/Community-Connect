from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg

# It's best practice to use a custom user model from the start
class User(AbstractUser):
    ROLE_CHOICES = (
        ('customer', 'Customer'),
        ('provider', 'Provider'),
        ('admin', 'Admin'),
    )
    # The `role` field distinguishes between regular users and service providers
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    # This creates the self-referencing relationship for subcategories
    parent_category = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories')
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

    class Meta:
        # This prevents Django admin from calling it "Categorys"
        verbose_name_plural = "Categories"
        ordering = ['name']

class Provider(models.Model):
    # Implicit id field will be added automatically as BigAutoField PK
    # This creates a one-to-one link to the User model, but allows null for unclaimed listings
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True, 
        unique=True,
        help_text="The user who owns this provider account (null for unclaimed listings)"
    )
    business_name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    # Stores essential provider details like name and contact info
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_claimed = models.BooleanField(default=False)  # Default False for new providers (unclaimed)

    def __str__(self):
        return self.business_name
        
    @property
    def average_rating(self):
        avg = self.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None
        
    @property
    def review_count(self):
        return self.reviews.count()


class Claim(models.Model):
    """Model for business owners to claim their provider listings"""
    CLAIM_STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('under_review', 'Under Review'),
    ]
    
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='claims')
    claimant = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='claims')
    business_documents = models.FileField(upload_to='claim_documents/', blank=True, null=True)
    additional_info = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=CLAIM_STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True, null=True)  # For admin review notes
    verification_token = models.CharField(max_length=100, blank=True, null=True)  # For email verification
    email_verified = models.BooleanField(default=False)
    # Phone verification fields
    phone_verification_code = models.CharField(max_length=10, blank=True, null=True)
    phone_verified = models.BooleanField(default=False)
    phone_verification_sent_at = models.DateTimeField(null=True, blank=True)
    phone_verification_deferred = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviewed_claims'
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        # Allow duplicate claims only if previous claims were rejected
        constraints = [
            models.UniqueConstraint(
                fields=['provider', 'claimant'],
                condition=models.Q(status__in=['pending', 'approved']),
                name='unique_active_claim_per_user_provider'
            )
        ]

    def __str__(self):
        return f"Claim for {self.provider.business_name} by {self.claimant.username}"


class Service(models.Model):
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='services')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='services')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_type = models.CharField(
        max_length=20, 
        choices=[
            ('fixed', 'Fixed Price'),
            ('hourly', 'Per Hour'),
            ('daily', 'Per Day'),
            ('quote', 'Quote Required')
        ],
        default='quote'
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} by {self.provider.business_name}"

class Address(models.Model):
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='addresses')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='United States')
    # Stores location data for map integration
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.street}, {self.city}"
        
    class Meta:
        verbose_name_plural = "Addresses"

class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='reviews')
    # Enables community ratings and reviews
    rating = models.SmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)  # For verified purchases/services

    class Meta:
        # Ensures a user can only review a provider once
        unique_together = ('user', 'provider')
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.username} for {self.provider.business_name}"

class Favorite(models.Model):
    """Allows users to save favorite providers"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'provider')
        
    def __str__(self):
        return f"{self.user.username} favorites {self.provider.business_name}"