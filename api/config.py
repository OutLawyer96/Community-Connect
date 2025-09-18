"""
Configuration constants for data generation and application settings
"""
import os
from decouple import config

# Data Generation Settings
class DataConfig:
    # Provider and Customer Generation
    NUM_PROVIDERS = config('NUM_PROVIDERS', default=1000, cast=int)
    NUM_CUSTOMERS = config('NUM_CUSTOMERS', default=500, cast=int)
    NUM_REVIEWS = config('NUM_REVIEWS', default=2000, cast=int)
    
    # Geographic Settings
    DEFAULT_COUNTRY = config('DEFAULT_COUNTRY', default='India')
    DEFAULT_REGIONS = config('DEFAULT_REGIONS', default='Delhi,Mumbai,Bangalore,Chennai,Kolkata').split(',')
    
    # Business Categories
    BUSINESS_CATEGORIES = config('BUSINESS_CATEGORIES', 
        default='Home Services,Automotive,Beauty & Wellness,Education,Healthcare').split(',')
    
    # Review Settings
    MIN_REVIEW_RATING = config('MIN_REVIEW_RATING', default=1, cast=int)
    MAX_REVIEW_RATING = config('MAX_REVIEW_RATING', default=5, cast=int)
    
    # Performance Settings
    BATCH_SIZE = config('BATCH_SIZE', default=100, cast=int)
    ENABLE_BULK_CREATE = config('ENABLE_BULK_CREATE', default=True, cast=bool)

# Application Constants
class AppConfig:
    # Pagination
    DEFAULT_PAGE_SIZE = config('DEFAULT_PAGE_SIZE', default=12, cast=int)
    MAX_PAGE_SIZE = config('MAX_PAGE_SIZE', default=100, cast=int)
    
    # API Rate Limiting
    API_RATE_LIMIT = config('API_RATE_LIMIT', default=100, cast=int)
    API_RATE_PERIOD = config('API_RATE_PERIOD', default=3600, cast=int)  # seconds
    
    # File Upload
    MAX_FILE_SIZE = config('MAX_FILE_SIZE', default=5242880, cast=int)  # 5MB
    ALLOWED_IMAGE_TYPES = config('ALLOWED_IMAGE_TYPES', default='jpg,jpeg,png,gif').split(',')
    
    # Cache Settings
    CACHE_TIMEOUT = config('CACHE_TIMEOUT', default=300, cast=int)  # 5 minutes
    
    # Search Settings
    SEARCH_RESULTS_PER_PAGE = config('SEARCH_RESULTS_PER_PAGE', default=20, cast=int)
    MAX_SEARCH_RESULTS = config('MAX_SEARCH_RESULTS', default=1000, cast=int)

# Business Logic Constants
class BusinessConfig:
    # Provider Settings
    MIN_BUSINESS_NAME_LENGTH = 3
    MAX_BUSINESS_NAME_LENGTH = 100
    MIN_DESCRIPTION_LENGTH = 10
    MAX_DESCRIPTION_LENGTH = 1000
    
    # Review Settings
    MIN_REVIEW_LENGTH = 5
    MAX_REVIEW_LENGTH = 500
    REVIEW_MODERATION_ENABLED = True
    
    # Rating Calculations
    MIN_REVIEWS_FOR_AVERAGE = 3
    FEATURED_PROVIDER_MIN_RATING = 4.0
    FEATURED_PROVIDER_MIN_REVIEWS = 10
    
    # Service Areas
    MAX_SERVICE_RADIUS_KM = 50
    DEFAULT_SERVICE_RADIUS_KM = 10

# Location Constants
class LocationConfig:
    # Indian Major Cities with Coordinates
    MAJOR_CITIES = [
        {'name': 'Mumbai', 'state': 'Maharashtra', 'lat': 19.0760, 'lng': 72.8777, 'pin': '400001'},
        {'name': 'Delhi', 'state': 'Delhi', 'lat': 28.7041, 'lng': 77.1025, 'pin': '110001'},
        {'name': 'Bangalore', 'state': 'Karnataka', 'lat': 12.9716, 'lng': 77.5946, 'pin': '560001'},
        {'name': 'Hyderabad', 'state': 'Telangana', 'lat': 17.3850, 'lng': 78.4867, 'pin': '500001'},
        {'name': 'Ahmedabad', 'state': 'Gujarat', 'lat': 23.0225, 'lng': 72.5714, 'pin': '380001'},
        {'name': 'Chennai', 'state': 'Tamil Nadu', 'lat': 13.0827, 'lng': 80.2707, 'pin': '600001'},
        {'name': 'Kolkata', 'state': 'West Bengal', 'lat': 22.5726, 'lng': 88.3639, 'pin': '700001'},
        {'name': 'Pune', 'state': 'Maharashtra', 'lat': 18.5204, 'lng': 73.8567, 'pin': '411001'},
        {'name': 'Jaipur', 'state': 'Rajasthan', 'lat': 26.9124, 'lng': 75.7873, 'pin': '302001'},
        {'name': 'Surat', 'state': 'Gujarat', 'lat': 21.1702, 'lng': 72.8311, 'pin': '395001'},
    ]
    
    # City center coordinates for different purposes  
    CITY_CENTERS = {
        'Delhi': {'lat': 28.6139, 'lng': 77.2090},
        'Mumbai': {'lat': 19.0760, 'lng': 72.8777},
        'Bangalore': {'lat': 12.9716, 'lng': 77.5946},
        'Chennai': {'lat': 13.0827, 'lng': 80.2707},
        'Kolkata': {'lat': 22.5726, 'lng': 88.3639},
        'Hyderabad': {'lat': 17.3850, 'lng': 78.4867},
        'Pune': {'lat': 18.5204, 'lng': 73.8567},
        'Ahmedabad': {'lat': 23.0225, 'lng': 72.5714},
        'Jaipur': {'lat': 26.9124, 'lng': 75.7873},
        'Surat': {'lat': 21.1702, 'lng': 72.8311}
    }
    
    # Default coordinates for India center
    INDIA_CENTER = {'lat': 20.5937, 'lng': 78.9629}
    DEFAULT_ZOOM = 5

# Export all configs
__all__ = ['DataConfig', 'AppConfig', 'BusinessConfig', 'LocationConfig']