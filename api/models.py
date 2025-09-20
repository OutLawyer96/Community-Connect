from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg

# Conditional imports for PostgreSQL and GIS features
try:
    import psycopg2  # Check if PostgreSQL adapter is available first
    from django.contrib.postgres.search import SearchVector, SearchVectorField
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False

# For now, disable GIS on Windows due to GDAL dependency issues
# In production with proper PostGIS setup, this would be enabled
HAS_GIS = False
# try:
#     from django.contrib.gis.db import models as gis_models
#     from django.contrib.gis.geos import Point
#     HAS_GIS = True
# except ImportError:
#     HAS_GIS = False

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
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    def get_avatar_url(self):
        """Return the full URL for the avatar image or a default placeholder URL"""
        if self.avatar:
            return self.avatar.url
        return '/static/images/default-avatar.png'

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

    # Add SearchVectorField for full-text search (conditional on PostgreSQL)
    # This field will be maintained automatically via save() method
    # In production with PostgreSQL, a GIN index should be added for performance
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update search vector if PostgreSQL is available
        if HAS_POSTGRES and hasattr(self, 'search_vector'):
            self.update_search_vector()

    def update_search_vector(self):
        """Update the search vector for this provider (PostgreSQL only)"""
        if not HAS_POSTGRES or not hasattr(self, 'search_vector'):
            return
            
        from django.db import connection
        if connection.vendor == 'postgresql':
            # Use raw SQL for efficient search vector update including services
            with connection.cursor() as cursor:
                cursor.execute("""
                    UPDATE api_provider 
                    SET search_vector = 
                        setweight(to_tsvector('english', COALESCE(business_name, '')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
                        setweight(to_tsvector('english', COALESCE(
                            (SELECT string_agg(s.name, ' ') 
                             FROM api_service s 
                             WHERE s.provider_id = %s AND s.is_active = true), '')), 'A') ||
                        setweight(to_tsvector('english', COALESCE(
                            (SELECT string_agg(s.description, ' ') 
                             FROM api_service s 
                             WHERE s.provider_id = %s AND s.is_active = true), '')), 'C')
                    WHERE id = %s
                """, [self.pk, self.pk, self.pk])

    def __str__(self):
        return self.business_name
        
    @property
    def average_rating(self):
        avg = self.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None
        
    @property
    def review_count(self):
        return self.reviews.count()

# Conditionally add SearchVectorField for PostgreSQL after model definition
# Note: This field is also added to migrations (0007_add_search_vector_postgresql.py)
# to ensure proper database compatibility between SQLite and PostgreSQL
if HAS_POSTGRES:
    # Add search_vector field to Provider model dynamically
    Provider.add_to_class(
        'search_vector', 
        SearchVectorField(null=True, blank=True, help_text="Auto-maintained search vector for full-text search")
    )


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

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update provider's search vector when service changes
        if hasattr(self.provider, 'update_search_vector'):
            self.provider.update_search_vector()

    def delete(self, *args, **kwargs):
        provider = self.provider
        super().delete(*args, **kwargs)
        # Update provider's search vector when service is deleted
        if hasattr(provider, 'update_search_vector'):
            provider.update_search_vector()

    def __str__(self):
        return f"{self.name} by {self.provider.business_name}"

class Address(models.Model):
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='addresses')
    street = models.CharField(max_length=255)
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20)
    country = models.CharField(max_length=100, default='United States')
    # Legacy fields for backward compatibility and primary location data
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    is_primary = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Populate PointField from lat/lng if GIS is available
        # Note: Disabled for now due to GDAL requirements on Windows
        # if HAS_GIS and hasattr(self, 'location') and self.latitude is not None and self.longitude is not None:
        #     self.location = Point(float(self.longitude), float(self.latitude), srid=4326)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.street}, {self.city}"
        
    class Meta:
        verbose_name_plural = "Addresses"

class Availability(models.Model):
    """Provider availability and operating hours"""
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ('provider', 'day_of_week')
        ordering = ['day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.provider.business_name} - {self.get_day_of_week_display()}: {self.start_time}-{self.end_time}"

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

# Note: GIS fields disabled for Windows development environment
# In production with PostGIS, uncomment the following:
# if HAS_GIS:
#     Address.add_to_class('location', gis_models.PointField(srid=4326, null=True, blank=True))