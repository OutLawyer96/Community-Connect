from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Avg
from .models import (Category, Provider, User, Service, Address, Review, ReviewReport, Claim, Availability, Favorite,
                     Notification, NotificationPreference, MessageThread, Message, UserBehavior, 
                     UserRecommendation, ABTestVariant)

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password', 'avatar_url']
        
    def get_avatar_url(self, obj):
        return obj.get_avatar_url()
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for profile updates with avatar upload validation"""
    avatar_url = serializers.SerializerMethodField(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'avatar', 'avatar_url']
        read_only_fields = ['id', 'username']
        
    def get_avatar_url(self, obj):
        return obj.get_avatar_url()
        
    def validate_avatar(self, value):
        """Validate avatar upload"""
        if value:
            # Check file size (2MB limit)
            if value.size > 2 * 1024 * 1024:
                raise serializers.ValidationError(
                    "Avatar file size cannot exceed 2MB."
                )
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/jpg', 'image/png']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only JPEG and PNG files are allowed for avatar."
                )
        
        return value

class FavoriteSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_rating = serializers.SerializerMethodField()
    provider_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Favorite
        fields = ['id', 'provider', 'provider_name', 'provider_rating', 'provider_address', 'created_at']
        read_only_fields = ['user', 'created_at']
        
    def get_provider_rating(self, obj):
        avg = obj.provider.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None
        
    def get_provider_address(self, obj):
        address = obj.provider.addresses.first()
        return AddressSerializer(address).data if address else None

class UserReviewSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    provider_id = serializers.IntegerField(source='provider.id', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'provider', 'provider_id', 'provider_name', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']

class ProviderAnalyticsSerializer(serializers.Serializer):
    """Serializer for provider analytics data"""
    provider_id = serializers.IntegerField()
    business_name = serializers.CharField()
    total_reviews = serializers.IntegerField()
    average_rating = serializers.FloatField()
    total_services = serializers.IntegerField()
    total_favorites = serializers.IntegerField()
    recent_reviews_trend = serializers.ListField(child=serializers.DictField())
    rating_distribution = serializers.DictField()
    monthly_review_counts = serializers.ListField(child=serializers.DictField())

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'parent_category', 'subcategories']

class AddressSerializer(serializers.ModelSerializer):
    # Add distance field for search results (calculated dynamically)
    distance = serializers.SerializerMethodField()
    
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'postal_code', 'latitude', 'longitude', 'distance']
    
    def get_distance(self, obj):
        # Return distance if it was annotated in the queryset
        return getattr(obj, 'distance', None)

class AvailabilitySerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = Availability
        fields = ['id', 'day_of_week', 'day_of_week_display', 'start_time', 'end_time', 'is_available']

class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Service
        fields = ['id', 'name', 'description', 'price', 'category', 'category_name']

class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at']

class ReviewReportSerializer(serializers.ModelSerializer):
    reporter_username = serializers.CharField(source='reporter.username', read_only=True)
    review_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ReviewReport
        fields = ['id', 'review', 'review_details', 'reporter', 'reporter_username', 'reason', 'details', 'created_at', 'resolved']
        read_only_fields = ['reporter', 'created_at', 'resolved']
    
    def get_review_details(self, obj):
        if not obj.review:
            return None
        return {
            'id': obj.review.id,
            'rating': obj.review.rating,
            'comment': obj.review.comment,
            'user': obj.review.user.username if obj.review.user else None
        }
class ProviderSerializer(serializers.ModelSerializer):
    user = serializers.SlugRelatedField(
        slug_field='username',
        read_only=True,
        allow_null=True
    )
    services = ServiceSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    availability = AvailabilitySerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Provider
        fields = ['user', 'business_name', 'description', 'created_at', 'is_claimed',
                 'services', 'addresses', 'availability', 'reviews', 'average_rating', 'review_count']
        
    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None
        
    def get_review_count(self, obj):
        return obj.reviews.count()

class ProviderListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views to improve performance"""
    user = serializers.SlugRelatedField(
        slug_field='username',
        read_only=True,
        allow_null=True
    )
    average_rating = serializers.FloatField(source='annotated_avg_rating', read_only=True)
    review_count = serializers.IntegerField(source='annotated_review_count', read_only=True)
    primary_address = serializers.SerializerMethodField()
    
    # Price and distance annotations (read-only fields for queryset annotations)
    distance = serializers.FloatField(read_only=True)
    min_service_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    max_service_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    avg_service_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Provider
        fields = ['id', 'user', 'business_name', 'description', 'is_claimed', 'average_rating', 
                 'review_count', 'primary_address', 'distance', 'min_service_price', 
                 'max_service_price', 'avg_service_price']
        
    def get_primary_address(self, obj):
        address = obj.addresses.first()
        return AddressSerializer(address).data if address else None

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')

class ClaimSerializer(serializers.ModelSerializer):
    claimant_username = serializers.CharField(source='claimant.username', read_only=True)
    provider_name = serializers.CharField(source='provider.business_name', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = Claim
        fields = [
            'id', 'provider', 'provider_name', 'claimant', 'claimant_username',
            'business_documents', 'additional_info', 'status', 'admin_notes',
            'verification_token', 'email_verified', 'created_at', 'updated_at',
            'reviewed_by', 'reviewed_by_username', 'reviewed_at'
        ]
        read_only_fields = ['verification_token', 'reviewed_by', 'reviewed_at', 'admin_notes']
        
    def validate(self, data):
        # Ensure a user can't claim the same provider multiple times
        claimant = self.context['request'].user
        provider = data.get('provider')
        
        if provider and Claim.objects.filter(provider=provider, claimant=claimant).exists():
            raise serializers.ValidationError('You have already submitted a claim for this provider.')
            
        return data

class ClaimCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating claims"""
    class Meta:
        model = Claim
        fields = ['provider', 'business_documents', 'additional_info']
    
    def validate_business_documents(self, value):
        """Validate uploaded business documents"""
        if value:
            # Check file size (5MB limit)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError(
                    "File size cannot exceed 5MB."
                )
            
            # Check file type
            allowed_types = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'image/jpeg',
                'image/jpg',
                'image/png'
            ]
            
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Only PDF, DOC, DOCX, JPG, JPEG, and PNG files are allowed."
                )
        
        return value
        
    def validate(self, attrs):
        """Validate claim creation"""
        provider = attrs.get('provider')
        user = self.context['request'].user
        
        # Check if provider is already claimed
        if provider.is_claimed:
            raise serializers.ValidationError(
                "This provider has already been claimed and verified."
            )
        
        # Check for duplicate claims by same user (only allow if previously rejected)
        existing_claim = Claim.objects.filter(
            provider=provider, 
            claimant=user
        ).exclude(status='rejected').first()
        
        if existing_claim:
            raise serializers.ValidationError(
                f"You already have a {existing_claim.status} claim for this provider."
            )
        
        return attrs
        
    def create(self, validated_data):
        validated_data['claimant'] = self.context['request'].user
        return super().create(validated_data)


class NotificationSerializer(serializers.ModelSerializer):
    related_object_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'is_read', 'email_sent', 'created_at', 'related_object_url']
        read_only_fields = ['id', 'created_at', 'email_sent', 'related_object_url']
    
    def get_related_object_url(self, obj):
        """Generate frontend URLs based on content_type and object_id"""
        if not obj.content_object:
            return None
            
        if obj.notification_type == 'review' and hasattr(obj.content_object, 'provider'):
            return f"/providers/{obj.content_object.provider.id}#reviews"
        elif obj.notification_type == 'claim' and hasattr(obj.content_object, 'provider'):
            return f"/my-claims/{obj.content_object.id}"
        elif obj.notification_type == 'message':
            return "/messages"
        
        return None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_for_reviews', 'email_for_claims', 'email_for_messages', 'email_for_system', 'in_app_enabled']
    
    def validate(self, attrs):
        """Ensure at least one notification method is enabled"""
        if not attrs.get('in_app_enabled', True) and not any([
            attrs.get('email_for_reviews', True),
            attrs.get('email_for_claims', True), 
            attrs.get('email_for_messages', True),
            attrs.get('email_for_system', True)
        ]):
            raise serializers.ValidationError(
                "At least one notification method must be enabled."
            )
        return attrs


class MessageThreadSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = MessageThread
        fields = ['id', 'other_participant', 'last_message', 'unread_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        """Get the other participant's information"""
        current_user = self.context['request'].user
        other_user = obj.get_other_participant(current_user)
        
        return {
            'id': other_user.id,
            'username': other_user.username,
            'first_name': other_user.first_name,
            'last_name': other_user.last_name,
            'role': other_user.role,
            'avatar_url': other_user.get_avatar_url()
        }
    
    def get_last_message(self, obj):
        """Get last message preview"""
        last_message = obj.messages.last()
        if last_message:
            return {
                'content': last_message.content[:150] + ('...' if len(last_message.content) > 150 else ''),
                'sender': last_message.sender.username,
                'created_at': last_message.created_at
            }
        return None
    
    def get_unread_count(self, obj):
        """Get unread message count for current user"""
        current_user = self.context['request'].user
        return obj.messages.exclude(sender=current_user).filter(is_read=False).count()


class MessageSerializer(serializers.ModelSerializer):
    sender_info = serializers.SerializerMethodField()
    formatted_timestamp = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'content', 'sender_info', 'is_read', 'created_at', 'formatted_timestamp']
        read_only_fields = ['id', 'sender_info', 'created_at', 'formatted_timestamp']
    
    def get_sender_info(self, obj):
        """Get sender details"""
        return {
            'id': obj.sender.id,
            'username': obj.sender.username,
            'first_name': obj.sender.first_name,
            'last_name': obj.sender.last_name,
            'avatar_url': obj.sender.get_avatar_url()
        }
    
    def get_formatted_timestamp(self, obj):
        """Format timestamp for display"""
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff < timedelta(minutes=1):
            return "Just now"
        elif diff < timedelta(hours=1):
            return f"{diff.seconds // 60} minutes ago"
        elif diff < timedelta(days=1):
            return f"{diff.seconds // 3600} hours ago"
        elif diff < timedelta(days=7):
            return f"{diff.days} days ago"
        else:
            return obj.created_at.strftime("%B %d, %Y")


class MessageCreateSerializer(serializers.ModelSerializer):
    recipient_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = Message
        fields = ['content', 'recipient_id']
    
    def validate_content(self, value):
        """Validate message content"""
        if len(value.strip()) < 1:
            raise serializers.ValidationError("Message content cannot be empty.")
        if len(value) > 2000:
            raise serializers.ValidationError("Message content cannot exceed 2000 characters.")
        return value.strip()
    
    def validate_recipient_id(self, value):
        """Validate recipient exists and is appropriate role"""
        try:
            recipient = User.objects.get(id=value)
            current_user = self.context['request'].user
            
            # Customers can message providers, providers can message customers
            if current_user.role == 'customer' and recipient.role != 'provider':
                raise serializers.ValidationError("Customers can only message providers.")
            elif current_user.role == 'provider' and recipient.role != 'customer':
                raise serializers.ValidationError("Providers can only message customers.")
            
            if current_user.id == value:
                raise serializers.ValidationError("Cannot send message to yourself.")
                
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Recipient not found.")
    
    def create(self, validated_data):
        """Create message and thread if needed"""
        recipient_id = validated_data.pop('recipient_id')
        recipient = User.objects.get(id=recipient_id)
        sender = self.context['request'].user
        
        # Determine customer and provider for thread
        if sender.role == 'customer':
            customer, provider = sender, recipient
        else:
            customer, provider = recipient, sender
        
        # Get or create thread
        thread, created = MessageThread.objects.get_or_create(
            customer=customer,
            provider=provider
        )
        
        # Create message
        message = Message.objects.create(
            thread=thread,
            sender=sender,
            content=validated_data['content']
        )
        
        # Update thread timestamp
        thread.save()  # This triggers auto_now on updated_at
        
        return message


class UserBehaviorSerializer(serializers.ModelSerializer):
    """Serializer for logging user behavior actions"""
    
    class Meta:
        model = UserBehavior
        fields = ['id', 'user', 'action_type', 'provider', 'search_query', 'category', 
                 'location_lat', 'location_lng', 'session_id', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate(self, data):
        """Validate behavior data based on action type"""
        action_type = data.get('action_type')
        
        if action_type == 'search':
            if not data.get('search_query'):
                raise serializers.ValidationError(
                    "Search query is required for search actions"
                )
        elif action_type in ['view', 'favorite', 'contact']:
            if not data.get('provider'):
                raise serializers.ValidationError(
                    f"Provider is required for {action_type} actions"
                )
        
        return data


class RecommendationSerializer(serializers.ModelSerializer):
    """Enhanced provider serializer with recommendation data"""
    provider = serializers.SerializerMethodField()
    recommendation_score = serializers.FloatField(source='score')
    algorithm_version = serializers.CharField()
    confidence_level = serializers.SerializerMethodField()
    explanation = serializers.SerializerMethodField()
    
    class Meta:
        model = UserRecommendation
        fields = ['provider', 'recommendation_score', 'algorithm_version', 
                 'confidence_level', 'explanation', 'created_at']
    
    def get_provider(self, obj):
        """Return full provider data"""
        from .serializers import ProviderListSerializer
        return ProviderListSerializer(obj.provider, context=self.context).data
    
    def get_confidence_level(self, obj):
        """Calculate confidence level based on score"""
        if obj.score >= 0.8:
            return 'high'
        elif obj.score >= 0.6:
            return 'medium'
        else:
            return 'low'
    
    def get_explanation(self, obj):
        """Generate recommendation explanation"""
        score = obj.score
        if score >= 0.8:
            return "Highly recommended based on your preferences and activity"
        elif score >= 0.6:
            return "Recommended based on similar users' preferences"
        else:
            return "Suggested based on location and category matching"


class ABTestVariantSerializer(serializers.ModelSerializer):
    """Serializer for A/B test variant assignments"""
    
    class Meta:
        model = ABTestVariant
        fields = ['id', 'user', 'experiment_name', 'variant', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']


class EnhancedProviderListSerializer(serializers.ModelSerializer):
    """Enhanced provider list serializer with optional recommendation score"""
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    services = ServiceSerializer(many=True, read_only=True)
    primary_address = AddressSerializer(read_only=True)
    is_claimed = serializers.SerializerMethodField()
    recommendation_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Provider
        fields = ['id', 'business_name', 'description', 'email', 'phone', 'website', 
                 'average_rating', 'review_count', 'services', 'primary_address', 
                 'is_claimed', 'recommendation_score', 'created_at']
    
    def get_average_rating(self, obj):
        return obj.reviews.aggregate(avg_rating=Avg('rating'))['avg_rating']
    
    def get_review_count(self, obj):
        return obj.reviews.count()
    
    def get_is_claimed(self, obj):
        return hasattr(obj, 'claim') and obj.claim.status == 'approved'
    
    def get_recommendation_score(self, obj):
        """Include recommendation score if available in context"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Check if this provider has a recommendation for the current user
            try:
                recommendation = UserRecommendation.objects.get(
                    user=request.user, 
                    provider=obj
                )
                return recommendation.score
            except UserRecommendation.DoesNotExist:
                pass
        return None