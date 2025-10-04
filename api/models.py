from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError
from django.db.models import Avg
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from datetime import timedelta

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
        """Return the full URL for the avatar image or None if no avatar uploaded"""
        if self.avatar:
            return self.avatar.url
        return None

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
    """
    Represents a specific service or offering provided by a provider.
    
    Examples: "Plumbing Repair", "Electrical Installation", "Lawn Mowing"
    This is NOT the provider's schedule/availability - see Availability model for that.
    
    Each service has a category, pricing information, and description.
    A provider can offer multiple services (e.g., a handyman might offer both
    plumbing and electrical services).
    """
    provider = models.ForeignKey(
        Provider, 
        on_delete=models.CASCADE, 
        related_name='services',
        help_text='The provider offering this service'
    )
    category = models.ForeignKey(
        Category, 
        on_delete=models.CASCADE, 
        related_name='services',
        help_text='Category this service belongs to (e.g., Plumbing, Electrical)'
    )
    name = models.CharField(
        max_length=150,
        help_text='Service name (e.g., "Emergency Plumbing Repair")'
    )
    description = models.TextField(
        blank=True, 
        null=True,
        help_text='Detailed description of what this service includes'
    )
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text='Service price (interpretation depends on price_type)'
    )
    price_type = models.CharField(
        max_length=20, 
        choices=[
            ('fixed', 'Fixed Price'),
            ('hourly', 'Per Hour'),
            ('daily', 'Per Day'),
            ('quote', 'Quote Required')
        ],
        default='quote',
        help_text='How the price is charged (fixed, hourly, daily, or requires quote)'
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this service is currently being offered'
    )
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
    """
    Represents a provider's weekly schedule and operating hours.
    
    This model defines WHEN a provider is available for work (e.g., "Monday 9am-5pm").
    This is NOT the services they offer - see Service model for that.
    
    Each provider can have multiple availability entries (one per day of the week,
    or multiple time slots per day). Used to show customers when a provider can
    be booked for appointments.
    
    Example: A plumber might be available Monday-Friday 8am-6pm, but not weekends.
    """
    DAY_CHOICES = [
        ('monday', 'Monday'),
        ('tuesday', 'Tuesday'),
        ('wednesday', 'Wednesday'),
        ('thursday', 'Thursday'),
        ('friday', 'Friday'),
        ('saturday', 'Saturday'),
        ('sunday', 'Sunday'),
    ]
    
    provider = models.ForeignKey(
        Provider, 
        on_delete=models.CASCADE, 
        related_name='availability',
        help_text='The provider whose schedule this represents'
    )
    day_of_week = models.CharField(
        max_length=10, 
        choices=DAY_CHOICES,
        help_text='Day of the week for this availability slot'
    )
    start_time = models.TimeField(
        help_text='Time when provider becomes available (must be before end_time)'
    )
    end_time = models.TimeField(
        help_text='Time when provider stops being available (must be after start_time)'
    )
    is_available = models.BooleanField(
        default=True,
        help_text='Whether the provider is actually available during this time slot'
    )
    
    class Meta:
        unique_together = ('provider', 'day_of_week')
        ordering = ['day_of_week', 'start_time']
        constraints = [
            models.CheckConstraint(
                check=models.Q(start_time__lt=models.F('end_time')),
                name='availability_start_before_end',
            ),
        ]
    
    def clean(self):
        """Validate that start_time is before end_time"""
        super().clean()
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({
                'end_time': 'End time must be after start time.',
                'start_time': 'Start time must be before end time.',
            })
    
    def __str__(self):
        return f"{self.provider.business_name} - {self.get_day_of_week_display()}: {self.start_time}-{self.end_time}"

class Review(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('flagged', 'Flagged for Review')
    ]
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='reviews')
    # Enables community ratings and reviews
    rating = models.SmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Moderation fields
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    moderation_notes = models.TextField(blank=True, null=True)
    moderated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='moderated_reviews'
    )
    moderated_at = models.DateTimeField(null=True, blank=True)
    reported_count = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)  # For verified purchases/services
    
    # Optional purchase verification fields
    purchase_verified = models.BooleanField(default=False)
    purchase_verification = models.ForeignKey(
        'PurchaseVerification',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews'
    )

    class Meta:
        # Ensures a user can only review a provider once
        unique_together = ('user', 'provider')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['reported_count']),
            models.Index(fields=['purchase_verified']),
        ]

    def __str__(self):
        return f"Review by {self.user.username} for {self.provider.business_name}"

    def report(self):
        """Increment the reported_count and set status to flagged if threshold reached"""
        self.reported_count += 1
        if self.reported_count >= 3 and self.status == 'approved':
            self.status = 'flagged'
            self.save()
        return self.reported_count


class ReviewReport(models.Model):
    """Model for storing user reports about reviews"""
    REASON_CHOICES = [
        ('spam', 'Spam or Advertising'),
        ('offensive', 'Offensive Content'),
        ('irrelevant', 'Irrelevant Content'),
        ('fake', 'Suspected Fake Review'),
        ('conflict', 'Conflict of Interest'),
        ('other', 'Other')
    ]
    
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='reports')
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='review_reports'
    )
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    details = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_reports'
    )
    resolution_notes = models.TextField(blank=True, null=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('review', 'reporter')  # Prevent duplicate reports
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['resolved']),
            models.Index(fields=['reason']),
        ]

    def __str__(self):
        return f"Report on review {self.review.id} by {self.reporter.username}"

    def resolve(self, resolved_by, notes=None):
        """Mark the report as resolved"""
        self.resolved = True
        self.resolved_by = resolved_by
        self.resolution_notes = notes
        self.resolved_at = timezone.now()
        self.save()


class PurchaseVerification(models.Model):
    """Model for verifying that a review is from a legitimate customer"""
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='purchase_verifications')
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='purchase_verifications'
    )
    transaction_date = models.DateTimeField()
    transaction_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    verification_method = models.CharField(max_length=50)  # e.g., 'receipt', 'booking_system', 'manual'
    verification_details = models.JSONField(null=True, blank=True)  # Store method-specific details
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_purchases'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_valid = models.BooleanField(default=True)

    class Meta:
        ordering = ['-transaction_date']
        indexes = [
            models.Index(fields=['provider', 'customer', '-transaction_date']),
            models.Index(fields=['is_valid']),
        ]

    def __str__(self):
        return f"Purchase by {self.customer.username} from {self.provider.business_name}"

class Favorite(models.Model):
    """Allows users to save favorite providers"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    provider = models.ForeignKey(Provider, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'provider')
        
    def __str__(self):
        return f"{self.user.username} favorites {self.provider.business_name}"


class UserBehavior(models.Model):
    ACTION_CHOICES = [
        ('view', 'View Provider'),
        ('search', 'Search Providers'),
        ('favorite', 'Add to Favorites'),
        ('contact', 'Contact Provider'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    provider = models.ForeignKey('Provider', on_delete=models.CASCADE, null=True, blank=True)
    search_query = models.TextField(null=True, blank=True)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)
    location_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    session_id = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_userbehavior'
        indexes = [
            models.Index(fields=['user', 'action_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['provider']),
            models.Index(fields=['session_id']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user or 'Anonymous'} - {self.action_type} - {self.created_at}"


class UserRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.ForeignKey('Provider', on_delete=models.CASCADE)
    score = models.FloatField()
    algorithm_version = models.CharField(max_length=50, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'api_userrecommendation'
        unique_together = ['user', 'provider']
        indexes = [
            models.Index(fields=['user', '-score']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['algorithm_version']),
        ]
        ordering = ['-score']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username} -> {self.provider.business_name} ({self.score:.2f})"


class ABTestVariant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    experiment_name = models.CharField(max_length=100)
    variant = models.CharField(max_length=50)
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_abtestvariant'
        unique_together = ['user', 'experiment_name']
        indexes = [
            models.Index(fields=['user', 'experiment_name']),
            models.Index(fields=['experiment_name', 'variant']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.experiment_name}: {self.variant}"


class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('review', 'Review'),
        ('claim', 'Claim'),
        ('message', 'Message'),
        ('system', 'System'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Generic foreign key for linking to any model instance
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    content_object = GenericForeignKey('content_type', 'object_id')
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'notification_type']),
            models.Index(fields=['user', 'is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_notification_type_display()}: {self.title}"


class NotificationPreference(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    email_for_reviews = models.BooleanField(default=True)
    email_for_claims = models.BooleanField(default=True)
    email_for_messages = models.BooleanField(default=True)
    email_for_system = models.BooleanField(default=True)
    in_app_enabled = models.BooleanField(default=True)
    
    def __str__(self):
        return f"{self.user.username}'s notification preferences"


class MessageThread(models.Model):
    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customer_threads', limit_choices_to={'role': 'customer'})
    provider = models.ForeignKey(User, on_delete=models.CASCADE, related_name='provider_threads', limit_choices_to={'role': 'provider'})
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('customer', 'provider')
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"Thread between {self.customer.username} and {self.provider.username}"
    
    def get_other_participant(self, user):
        """Get the other participant in the thread"""
        return self.provider if user == self.customer else self.customer


class Message(models.Model):
    thread = models.ForeignKey(MessageThread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['thread', 'created_at']),
            models.Index(fields=['sender', 'created_at']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} in thread {self.thread.id}"

# Note: GIS fields disabled for Windows development environment
# In production with PostGIS, uncomment the following:
# if HAS_GIS:
#     Address.add_to_class('location', gis_models.PointField(srid=4326, null=True, blank=True))


class UserBehavior(models.Model):
    ACTION_CHOICES = [
        ('view', 'View Provider'),
        ('search', 'Search Providers'),
        ('favorite', 'Add to Favorites'),
        ('contact', 'Contact Provider'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    provider = models.ForeignKey('Provider', on_delete=models.CASCADE, null=True, blank=True)
    search_query = models.TextField(null=True, blank=True)
    category = models.ForeignKey('Category', on_delete=models.SET_NULL, null=True, blank=True)
    location_lat = models.DecimalField(max_digits=10, decimal_places=8, null=True, blank=True)
    location_lng = models.DecimalField(max_digits=11, decimal_places=8, null=True, blank=True)
    session_id = models.CharField(max_length=40, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_userbehavior'
        indexes = [
            models.Index(fields=['user', 'action_type']),
            models.Index(fields=['created_at']),
            models.Index(fields=['provider']),
            models.Index(fields=['session_id']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user or 'Anonymous'} - {self.action_type} - {self.created_at}"


class UserRecommendation(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    provider = models.ForeignKey('Provider', on_delete=models.CASCADE)
    score = models.FloatField()
    algorithm_version = models.CharField(max_length=50, default='v1.0')
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'api_userrecommendation'
        unique_together = ['user', 'provider']
        indexes = [
            models.Index(fields=['user', '-score']),
            models.Index(fields=['expires_at']),
            models.Index(fields=['algorithm_version']),
        ]
        ordering = ['-score']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.user.username} -> {self.provider.business_name} ({self.score:.2f})"


class ABTestVariant(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    experiment_name = models.CharField(max_length=100)
    variant = models.CharField(max_length=50)
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'api_abtestvariant'
        unique_together = ['user', 'experiment_name']
        indexes = [
            models.Index(fields=['user', 'experiment_name']),
            models.Index(fields=['experiment_name', 'variant']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.experiment_name}: {self.variant}"