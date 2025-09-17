from django.shortcuts import render
from django.contrib.auth import login, logout
from django.db.models import Q, Avg
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination

from .models import Category, Provider, User, Service, Address, Review, Favorite
from .serializers import (
    CategorySerializer, ProviderSerializer, ProviderListSerializer, 
    UserSerializer, ServiceSerializer, AddressSerializer, 
    ReviewSerializer, LoginSerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

# API Root View
@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request):
    """
    Welcome to Community Connect API
    
    A comprehensive REST API for connecting communities with local service providers.
    """
    return Response({
        'message': 'Welcome to Community Connect API',
        'version': '1.0.0',
        'description': 'Connect communities with trusted local service providers',
        'endpoints': {
            'Authentication': {
                'register': '/api/auth/register/',
                'login': '/api/auth/login/',
                'logout': '/api/auth/logout/',
                'dashboard': '/api/auth/dashboard/',
            },
            'Categories': {
                'list': '/api/categories/',
            },
            'Providers': {
                'list': '/api/providers/',
                'detail': '/api/providers/{id}/',
                'create': '/api/providers/create/',
                'update': '/api/providers/{id}/update/',
                'recommendations': '/api/providers/{id}/recommendations/',
            },
            'Services': {
                'list_by_provider': '/api/providers/{provider_id}/services/',
                'create': '/api/services/create/',
            },
            'Addresses': {
                'list_by_provider': '/api/providers/{provider_id}/addresses/',
                'create': '/api/addresses/create/',
            },
            'Reviews': {
                'list_by_provider': '/api/providers/{provider_id}/reviews/',
                'create': '/api/providers/{provider_id}/reviews/create/',
            },
            'Search': {
                'search_providers': '/api/search/',
            }
        },
        'documentation': 'Visit http://localhost:8000/api/docs/ for detailed API documentation',
        'stats': {
            'total_providers': Provider.objects.filter(is_active=True).count(),
            'total_categories': Category.objects.filter(is_active=True).count(),
            'total_reviews': Review.objects.count(),
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def api_docs(request):
    """
    Community Connect API Documentation
    
    This endpoint provides detailed documentation for all available API endpoints.
    """
    return Response({
        'title': 'Community Connect API Documentation',
        'version': '1.0.0',
        'base_url': 'http://localhost:8000/api/',
        'authentication': {
            'type': 'Token Authentication',
            'header': 'Authorization: Token <your_token>',
            'note': 'Get your token by calling /api/auth/login/ endpoint'
        },
        'endpoints': {
            'auth': {
                'POST /auth/register/': {
                    'description': 'Register a new user',
                    'parameters': {
                        'username': 'string (required)',
                        'email': 'string (required)',
                        'password': 'string (required)',
                        'first_name': 'string (required)',
                        'last_name': 'string (required)',
                        'role': 'string (customer/provider)',
                        'phone': 'string (optional)'
                    },
                    'response': 'User object and authentication token'
                },
                'POST /auth/login/': {
                    'description': 'Login user',
                    'parameters': {
                        'username': 'string (required)',
                        'password': 'string (required)'
                    },
                    'response': 'User object and authentication token'
                },
                'POST /auth/logout/': {
                    'description': 'Logout user (requires authentication)',
                    'response': 'Success message'
                },
                'GET /auth/dashboard/': {
                    'description': 'Get user dashboard data (requires authentication)',
                    'response': 'User profile and dashboard information'
                }
            },
            'providers': {
                'GET /providers/': {
                    'description': 'List all service providers with search and filtering',
                    'parameters': {
                        'search': 'string (optional) - Search in business name, description, services',
                        'category': 'integer (optional) - Filter by category ID',
                        'city': 'string (optional) - Filter by city',
                        'min_rating': 'integer (optional) - Minimum rating filter',
                        'page': 'integer (optional) - Page number for pagination'
                    },
                    'response': 'Paginated list of providers'
                },
                'GET /providers/{id}/': {
                    'description': 'Get detailed information about a specific provider',
                    'response': 'Provider details with services, addresses, and reviews'
                },
                'POST /providers/create/': {
                    'description': 'Create a new provider profile (requires authentication)',
                    'parameters': {
                        'business_name': 'string (required)',
                        'description': 'string (optional)',
                        'phone': 'string (optional)',
                        'email': 'string (optional)',
                        'website': 'string (optional)'
                    }
                }
            },
            'categories': {
                'GET /categories/': {
                    'description': 'List all service categories',
                    'response': 'List of categories with subcategories'
                }
            },
            'search': {
                'GET /search/': {
                    'description': 'Advanced search for providers',
                    'parameters': {
                        'q': 'string (optional) - Text search query',
                        'lat': 'float (optional) - Latitude for location search',
                        'lng': 'float (optional) - Longitude for location search',
                        'radius': 'float (optional) - Search radius in miles (default: 10)'
                    }
                }
            }
        },
        'example_requests': {
            'Register new user': {
                'method': 'POST',
                'url': '/api/auth/register/',
                'body': {
                    'username': 'newuser',
                    'email': 'user@example.com',
                    'password': 'securepassword',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'role': 'customer'
                }
            },
            'Search providers': {
                'method': 'GET',
                'url': '/api/providers/?search=plumbing&city=Springfield&min_rating=4'
            },
            'Get provider details': {
                'method': 'GET',
                'url': '/api/providers/1/'
            }
        }
    })

# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login user and return token"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user).data,
            'token': token.key
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout user and delete token"""
    try:
        request.user.auth_token.delete()
        return Response({'message': 'Successfully logged out'})
    except:
        return Response({'error': 'Error logging out'}, status=status.HTTP_400_BAD_REQUEST)

# Category Views
class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

# Provider Views
class ProviderListView(generics.ListAPIView):
    serializer_class = ProviderListSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        queryset = Provider.objects.filter(is_active=True)
        
        # Search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(business_name__icontains=search) | 
                Q(description__icontains=search) |
                Q(services__name__icontains=search) |
                Q(services__description__icontains=search)
            ).distinct()
        
        # Filter by category
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(services__category_id=category).distinct()
        
        # Filter by city
        city = self.request.query_params.get('city', None)
        if city:
            queryset = queryset.filter(addresses__city__icontains=city)
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).filter(avg_rating__gte=min_rating)
        
        return queryset

class ProviderDetailView(generics.RetrieveAPIView):
    queryset = Provider.objects.filter(is_active=True)
    serializer_class = ProviderSerializer
    permission_classes = [AllowAny]

class ProviderCreateView(generics.CreateAPIView):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only users with 'provider' role can create provider profiles
        if self.request.user.role != 'provider':
            self.request.user.role = 'provider'
            self.request.user.save()
        serializer.save(user=self.request.user)

class ProviderUpdateView(generics.UpdateAPIView):
    queryset = Provider.objects.all()
    serializer_class = ProviderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only update their own provider profile
        return Provider.objects.filter(user=self.request.user)

# Service Views
class ServiceListView(generics.ListAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        provider_id = self.kwargs.get('provider_id')
        return Service.objects.filter(provider_id=provider_id, is_active=True)

class ServiceCreateView(generics.CreateAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        provider = Provider.objects.get(user=self.request.user)
        serializer.save(provider=provider)

# Address Views
class AddressListView(generics.ListAPIView):
    serializer_class = AddressSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        provider_id = self.kwargs.get('provider_id')
        return Address.objects.filter(provider_id=provider_id)

class AddressCreateView(generics.CreateAPIView):
    queryset = Address.objects.all()
    serializer_class = AddressSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        provider = Provider.objects.get(user=self.request.user)
        serializer.save(provider=provider)

# Review Views
class ReviewListView(generics.ListAPIView):
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        provider_id = self.kwargs.get('provider_id')
        return Review.objects.filter(provider_id=provider_id)

class ReviewCreateView(generics.CreateAPIView):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        provider_id = self.kwargs.get('provider_id')
        serializer.save(user=self.request.user, provider_id=provider_id)

# Recommendation View
@api_view(['GET'])
@permission_classes([AllowAny])
def recommendations_view(request, provider_id):
    """Get recommended providers based on categories and ratings"""
    try:
        current_provider = Provider.objects.get(pk=provider_id)
        
        # Get categories from current provider's services
        categories = Category.objects.filter(services__provider=current_provider).distinct()
        
        # Find other providers in the same categories
        recommended = Provider.objects.filter(
            services__category__in=categories,
            is_active=True
        ).exclude(pk=provider_id).annotate(
            avg_rating=Avg('reviews__rating')
        ).order_by('-avg_rating', '-review_count')[:5]
        
        serializer = ProviderListSerializer(recommended, many=True)
        return Response(serializer.data)
        
    except Provider.DoesNotExist:
        return Response({'error': 'Provider not found'}, status=404)

# Search View with advanced filtering
@api_view(['GET'])
@permission_classes([AllowAny])
def search_providers(request):
    """Advanced search with location, rating, and category filters"""
    queryset = Provider.objects.filter(is_active=True)
    
    # Text search
    q = request.GET.get('q', '')
    if q:
        queryset = queryset.filter(
            Q(business_name__icontains=q) |
            Q(description__icontains=q) |
            Q(services__name__icontains=q)
        ).distinct()
    
    # Location-based search
    lat = request.GET.get('lat')
    lng = request.GET.get('lng')
    radius = request.GET.get('radius', 10)  # Default 10 miles
    
    if lat and lng:
        # This is a simplified distance calculation
        # In production, you might want to use PostGIS for more accurate results
        from django.db.models import F
        import math
        
        lat = float(lat)
        lng = float(lng)
        radius = float(radius)
        
        # Simple bounding box calculation
        lat_range = radius / 69.0  # Approximate miles per degree latitude
        lng_range = radius / (69.0 * math.cos(math.radians(lat)))
        
        queryset = queryset.filter(
            addresses__latitude__range=(lat - lat_range, lat + lat_range),
            addresses__longitude__range=(lng - lng_range, lng + lng_range)
        )
    
    serializer = ProviderListSerializer(queryset, many=True)
    return Response(serializer.data)

# Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_dashboard(request):
    """Get user's dashboard data"""
    user = request.user
    data = {
        'user': UserSerializer(user).data,
        'reviews_count': user.reviews.count(),
        'favorites_count': user.favorites.count() if hasattr(user, 'favorites') else 0,
    }
    
    if user.role == 'provider':
        try:
            provider = user.provider
            data['provider'] = ProviderSerializer(provider).data
        except Provider.DoesNotExist:
            data['provider'] = None
    
    return Response(data)