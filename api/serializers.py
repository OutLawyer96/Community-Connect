from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Avg
from .models import Category, Provider, User, Service, Address, Review, Claim, Availability

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'password']
        
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user

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
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
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
        
    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None
        
    def get_review_count(self, obj):
        return obj.reviews.count()
        
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