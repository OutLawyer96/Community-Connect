from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Avg
from .models import Category, Provider, User, Service, Address, Review

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
    class Meta:
        model = Address
        fields = ['id', 'street', 'city', 'state', 'postal_code', 'latitude', 'longitude']

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
        read_only=True
    )
    services = ServiceSerializer(many=True, read_only=True)
    addresses = AddressSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Provider
        fields = ['user', 'business_name', 'description', 'created_at', 
                 'services', 'addresses', 'reviews', 'average_rating', 'review_count']
        
    def get_average_rating(self, obj):
        avg = obj.reviews.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else None
        
    def get_review_count(self, obj):
        return obj.reviews.count()

class ProviderListSerializer(serializers.ModelSerializer):
    """Lighter serializer for list views to improve performance"""
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    primary_address = serializers.SerializerMethodField()
    
    class Meta:
        model = Provider
        fields = ['user', 'business_name', 'description', 'average_rating', 
                 'review_count', 'primary_address']
        
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