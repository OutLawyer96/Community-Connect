from django.shortcuts import render
from django.contrib.auth import login, logout
from django.db.models import Q, Avg, Count, Case, When, FloatField, Value
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
import math

from .models import Category, Provider, User, Service, Address, Review, Favorite, Claim, Availability
from .serializers import (
    CategorySerializer, ProviderSerializer, ProviderListSerializer, 
    UserSerializer, ServiceSerializer, AddressSerializer, 
    ReviewSerializer, LoginSerializer, ClaimSerializer, ClaimCreateSerializer
)
from .permissions import ClaimCreatePermission, ClaimOwnerPermission
from .utils import send_claim_verification_email, approve_claim as approve_claim_util, reject_claim as reject_claim_util


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula"""
    if not all([lat1, lon1, lat2, lon2]):
        return None
    
    # Convert latitude and longitude from degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


# Custom throttle classes for claim endpoints
class ClaimCreateThrottle(UserRateThrottle):
    """Throttle for claim creation - 3 claims per hour per user"""
    scope = 'claim_create'
    rate = '3/hour'


class ClaimViewThrottle(UserRateThrottle):
    """Throttle for general claim viewing - 100 requests per hour per user"""
    scope = 'claim_view'
    rate = '100/hour'


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
                'stats': '/api/categories/stats/',
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
                },
                'GET /categories/stats/': {
                    'description': 'List all active categories with counts of active providers offering services in each category',
                    'response': [
                        {
                            'id': 1,
                            'name': 'Plumbing',
                            'provider_count': 45,
                            'color': 'bg-blue-500'
                        }
                    ]
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

# Category statistics view
@api_view(['GET'])
@permission_classes([AllowAny])
def category_stats(request):
    """
    Return list of active categories annotated with provider counts.
    Counts distinct active providers that have at least one active service in the category.
    """
    try:
        # Annotate categories with distinct provider counts via active services and active providers
        queryset = (
            Category.objects.filter(is_active=True)
            .annotate(
                provider_count=Count(
                    'services__provider',
                    filter=Q(services__is_active=True, services__provider__is_active=True),
                    distinct=True,
                )
            )
            .order_by('name')
        )

        # Simple rotating color palette for UI usage
        palette = [
            'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500',
            'bg-emerald-500', 'bg-red-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
        ]

        data = []
        for idx, cat in enumerate(queryset):
            data.append({
                'id': cat.id,
                'name': cat.name,
                'provider_count': int(cat.provider_count or 0),
                'color': palette[idx % len(palette)],
            })

        return Response(data)
    except Exception:
        return Response({'error': 'Unable to fetch category statistics'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
        
        # Optimize queryset to prevent N+1 queries
        queryset = queryset.select_related('user').prefetch_related(
            'addresses', 
            'services', 
            'reviews'
        )
        
        # Enhanced search functionality with PostgreSQL full-text search
        search = self.request.query_params.get('search', None)
        if search:
            # Use PostgreSQL full-text search if available, fallback to basic search
            try:
                from django.db import connection
                if connection.vendor == 'postgresql' and hasattr(Provider, 'search_vector'):
                    # Use persisted search vector for efficient searching
                    search_query = SearchQuery(search)
                    queryset = queryset.filter(
                        search_vector=search_query
                    ).annotate(
                        rank=SearchRank('search_vector', search_query)
                    ).order_by('-rank')
                else:
                    raise ImportError("PostgreSQL not available")
            except (ImportError, Exception):
                # Fallback to basic search if PostgreSQL search not available
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
        
        # Filter by state
        state = self.request.query_params.get('state', None)
        if state:
            queryset = queryset.filter(addresses__state__icontains=state)
        
        # Filter by claimed status
        is_claimed = self.request.query_params.get('is_claimed')
        if is_claimed is not None:
            queryset = queryset.filter(is_claimed=is_claimed.lower() in ['true','1','yes'])
        
        # Filter by minimum rating
        min_rating = self.request.query_params.get('min_rating', None)
        if min_rating:
            queryset = queryset.annotate(
                avg_rating=Avg('reviews__rating')
            ).filter(avg_rating__gte=min_rating)
        
        # Price range filtering with aggregation
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        if min_price or max_price:
            from django.db.models import Min, Max, Avg as AvgPrice
            # Annotate with min, max, and average prices from services
            queryset = queryset.annotate(
                min_service_price=Min('services__price'),
                max_service_price=Max('services__price'),
                avg_service_price=AvgPrice('services__price')
            )
            if min_price:
                try:
                    min_price_val = float(min_price)
                    queryset = queryset.filter(min_service_price__gte=min_price_val)
                except (ValueError, TypeError):
                    pass
            if max_price:
                try:
                    max_price_val = float(max_price)
                    queryset = queryset.filter(min_service_price__lte=max_price_val)
                except (ValueError, TypeError):
                    pass
            queryset = queryset.distinct()
        else:
            # Always include price annotations for serializer, even when not filtering
            from django.db.models import Min, Max, Avg as AvgPrice
            queryset = queryset.annotate(
                min_service_price=Min('services__price'),
                max_service_price=Max('services__price'),
                avg_service_price=AvgPrice('services__price')
            )

        # Enhanced availability filtering
        available_today = self.request.query_params.get('available_today', None)
        available_day = self.request.query_params.get('available_day', None)
        available_at = self.request.query_params.get('available_at', None)
        
        if available_today and available_today.lower() == 'true':
            today = timezone.now().strftime('%A').lower()
            queryset = queryset.filter(
                availability__day_of_week=today,
                availability__is_available=True
            ).distinct()
        elif available_day:
            # Filter by specific day of week
            valid_days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            if available_day.lower() in valid_days:
                queryset = queryset.filter(
                    availability__day_of_week=available_day.lower(),
                    availability__is_available=True
                ).distinct()
        elif available_at:
            # Filter by specific datetime
            try:
                from django.utils.dateparse import parse_datetime
                target_datetime = parse_datetime(available_at)
                if target_datetime:
                    day_of_week = target_datetime.strftime('%A').lower()
                    target_time = target_datetime.time()
                    
                    queryset = queryset.filter(
                        availability__day_of_week=day_of_week,
                        availability__start_time__lte=target_time,
                        availability__end_time__gte=target_time,
                        availability__is_available=True
                    ).distinct()
            except (ValueError, TypeError):
                pass

        # Service category filtering (enhanced)
        service_category = self.request.query_params.get('service_category', None)
        if service_category:
            queryset = queryset.filter(services__category_id=service_category).distinct()

        # Verified providers filter
        verified_only = self.request.query_params.get('verified_only', None)
        if verified_only and verified_only.lower() == 'true':
            queryset = queryset.filter(is_verified=True)
        
        # Distance-based filtering and annotation
        lat = self.request.query_params.get('lat', None)
        lng = self.request.query_params.get('lng', None)
        radius = self.request.query_params.get('radius', None)
        distance_annotated = False
        
        if lat and lng:
            try:
                lat = float(lat)
                lng = float(lng)
                radius = float(radius) if radius else 50  # Default 50km radius
                
                # Use Haversine formula for distance calculation using raw SQL
                # This calculates distance in kilometers
                from django.db.models import F, Value
                from django.db import models
                import math
                
                # Convert to radians for calculation
                lat_rad = math.radians(lat)
                lng_rad = math.radians(lng)
                
                # Haversine formula implementation in raw SQL
                haversine_sql = f"""
                    6371 * 2 * ASIN(
                        SQRT(
                            POWER(SIN(RADIANS(%s - addresses.latitude) / 2), 2) +
                            COS(RADIANS(addresses.latitude)) * COS(RADIANS(%s)) * 
                            POWER(SIN(RADIANS(%s - addresses.longitude) / 2), 2)
                        )
                    )
                """
                
                # Annotate with distance calculation
                queryset = queryset.annotate(
                    distance=Case(
                        When(
                            addresses__latitude__isnull=False,
                            addresses__longitude__isnull=False,
                            then=models.ExpressionWrapper(
                                models.RawSQL(haversine_sql, [lat, lat, lng]),
                                output_field=models.FloatField()
                            )
                        ),
                        default=Value(999999),  # Very large distance for providers without coordinates
                        output_field=models.FloatField()
                    )
                )
                distance_annotated = True
                
                # Filter by radius if specified
                if radius:
                    queryset = queryset.filter(
                        Q(distance__lte=radius) | Q(distance__isnull=True)
                    )
                
            except (ValueError, TypeError):
                pass
        
        # Sorting functionality
        ordering = self.request.query_params.get('ordering', None)
        valid_orderings = ['distance', '-distance', 'rating', '-rating', 'price', '-price', 'relevance', 'name', '-name']
        
        if ordering and ordering in valid_orderings:
            if ordering in ['rating', '-rating']:
                # Check if avg_rating already exists from min_rating filter
                if 'avg_rating' not in [f.name for f in queryset.query.annotations]:
                    queryset = queryset.annotate(avg_rating=Avg('reviews__rating'))
                queryset = queryset.order_by('avg_rating' if ordering == 'rating' else '-avg_rating')
            elif ordering in ['price', '-price']:
                from django.db.models import Min
                queryset = queryset.annotate(min_price=Min('services__price'))
                queryset = queryset.order_by('min_price' if ordering == 'price' else '-min_price')
            elif ordering in ['name', '-name']:
                queryset = queryset.order_by('business_name' if ordering == 'name' else '-business_name')
            elif ordering == 'relevance':
                # Only use relevance ordering when there's a search query
                search = self.request.query_params.get('search', None)
                if search:
                    try:
                        from django.db import connection
                        if connection.vendor == 'postgresql' and hasattr(Provider, 'search_vector'):
                            # Use persisted search vector for relevance ordering
                            search_query = SearchQuery(search)
                            queryset = queryset.annotate(
                                rank=SearchRank('search_vector', search_query)
                            ).order_by('-rank')
                        else:
                            raise ImportError("PostgreSQL not available")
                    except (ImportError, Exception):
                        # Fallback if PostgreSQL search not available - order by text similarity
                        queryset = queryset.extra(
                            select={
                                'similarity': "similarity(business_name, %s)"
                            },
                            select_params=[search],
                        ).order_by('-similarity')
            elif ordering in ['distance', '-distance']:
                # Distance ordering only works when lat/lng are provided and annotated
                if distance_annotated:
                    queryset = queryset.order_by('distance' if ordering == 'distance' else '-distance')
        else:
            # Default ordering: claimed providers first, then by rating
            if 'avg_rating' not in [f.name for f in queryset.query.annotations]:
                queryset = queryset.annotate(avg_rating=Avg('reviews__rating'))
            queryset = queryset.order_by('-is_claimed', '-avg_rating')
        
        return queryset.distinct()

class ProviderSearchSuggestionsView(generics.ListAPIView):
    """Provide search suggestions for providers and services"""
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]
    throttle_scope = 'search_suggestions'
    
    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        
        if len(query) < 2:
            return Response({
                'suggestions': {
                    'providers': [],
                    'services': [],
                    'categories': [],
                    'locations': []
                },
                'total_count': 0
            })
        
        # Get provider suggestions with additional info
        provider_suggestions = Provider.objects.filter(
            business_name__icontains=query,
            is_active=True
        ).select_related().values(
            'id', 'business_name', 'is_verified', 'is_claimed'
        )[:5]
        
        providers = [{
            'id': p['id'],
            'name': p['business_name'],
            'type': 'provider',
            'verified': p['is_verified'],
            'claimed': p['is_claimed']
        } for p in provider_suggestions]
        
        # Get service suggestions with provider info
        service_suggestions = Service.objects.filter(
            name__icontains=query,
            provider__is_active=True,
            is_active=True
        ).select_related('provider', 'category').values(
            'id', 'name', 'provider__business_name', 'provider__id', 'category__name'
        ).distinct()[:5]
        
        services = [{
            'id': s['id'],
            'name': s['name'],
            'type': 'service',
            'provider_name': s['provider__business_name'],
            'provider_id': s['provider__id'],
            'category': s['category__name']
        } for s in service_suggestions]
        
        # Get category suggestions
        category_suggestions = Category.objects.filter(
            name__icontains=query,
            is_active=True
        ).values('id', 'name')[:3]
        
        categories = [{
            'id': c['id'],
            'name': c['name'],
            'type': 'category'
        } for c in category_suggestions]
        
        # Get location suggestions (cities and states)
        location_suggestions = Address.objects.filter(
            Q(city__icontains=query) | Q(state__icontains=query)
        ).values('city', 'state').distinct()[:3]
        
        locations = [{
            'name': f"{loc['city']}, {loc['state']}",
            'city': loc['city'],
            'state': loc['state'],
            'type': 'location'
        } for loc in location_suggestions]
        
        total_count = len(providers) + len(services) + len(categories) + len(locations)
        
        return Response({
            'suggestions': {
                'providers': providers,
                'services': services,
                'categories': categories,
                'locations': locations
            },
            'total_count': total_count,
            'query': query
        })

class LocationSuggestionsView(generics.ListAPIView):
    """Provide location-based suggestions"""
    permission_classes = [AllowAny]
    
    def get(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        
        if len(query) < 2:
            return Response({'suggestions': []})
        
        # Get city suggestions
        cities = Address.objects.filter(
            city__icontains=query
        ).values_list('city', 'state').distinct()[:10]
        
        suggestions = [f"{city}, {state}" for city, state in cities]
        
        return Response({'suggestions': suggestions})

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
        'claims_count': user.claims.count() if hasattr(user, 'claims') else 0,
    }
    
    if user.role == 'provider':
        try:
            provider = user.provider
            data['provider'] = ProviderSerializer(provider).data
        except Provider.DoesNotExist:
            data['provider'] = None
    
    return Response(data)


# =====================
# CLAIM MANAGEMENT VIEWS
# =====================

class ClaimListCreateView(generics.ListCreateAPIView):
    """
    List all claims or create a new claim.
    
    GET: Return a list of all claims for the authenticated user
    POST: Create a new claim for a provider
    """
    parser_classes = [MultiPartParser, FormParser]
    
    def get_permissions(self):
        """Different permissions for GET vs POST"""
        if self.request.method == 'POST':
            return [ClaimCreatePermission()]
        return [IsAuthenticated()]
    
    def get_throttles(self):
        """Different throttles for GET vs POST"""
        if self.request.method == 'POST':
            return [ClaimCreateThrottle()]
        return [ClaimViewThrottle()]
    
    def get_queryset(self):
        """Return claims based on user role"""
        user = self.request.user
        if user.is_staff:
            # Staff can see all claims
            return Claim.objects.all().order_by('-created_at')
        else:
            # Regular users see only their own claims
            return Claim.objects.filter(claimant=user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ClaimCreateSerializer
        return ClaimSerializer
    
    def perform_create(self, serializer):
        """Save the claim and send verification email"""
        claim = serializer.save()
        try:
            send_claim_verification_email(claim)
        except Exception as e:
            # Log the error but don't fail the claim creation
            print(f"Failed to send verification email: {e}")
            # In production, use proper logging
            # logger.error(f"Failed to send verification email for claim {claim.id}: {e}")


class ClaimDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a claim instance.
    
    Only claimants can update their own claims (before approval)
    Only staff can update claim status and admin notes
    """
    serializer_class = ClaimSerializer
    permission_classes = [IsAuthenticated, ClaimOwnerPermission]
    throttle_classes = [ClaimViewThrottle]
    
    def get_queryset(self):
        # Base queryset - ClaimOwnerPermission will handle object-level filtering
        return Claim.objects.all()
    
    def update(self, request, *args, **kwargs):
        claim = self.get_object()
        user = request.user
        
        # Only allow updates if user is staff or if it's their pending claim
        if not user.is_staff and (claim.claimant != user or claim.status != 'pending'):
            return Response(
                {'error': 'You can only update your own pending claims.'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_claim_email(request, claim_id):
    """
    Verify claim email using verification token
    """
    try:
        claim = Claim.objects.get(id=claim_id)
    except Claim.DoesNotExist:
        return Response(
            {'error': 'Claim not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Security check: only claimant or staff can verify
    if claim.claimant != request.user and not request.user.is_staff:
        return Response(
            {'error': 'Permission denied. You can only verify your own claims.'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    token = request.data.get('token')
    if not token:
        return Response(
            {'error': 'Verification token is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if claim.verification_token == token:
        claim.email_verified = True
        claim.verification_token = None  # Invalidate token after use
        claim.save()
        return Response({'message': 'Email verified successfully'})
    else:
        return Response(
            {'error': 'Invalid verification token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unclaimed_providers(request):
    """
    Get list of unclaimed providers that can be claimed with enhanced filtering
    """
    # Base queryset for unclaimed providers
    providers = Provider.objects.filter(is_claimed=False, is_active=True).select_related('user')
    
    # Search functionality
    search = request.query_params.get('search')
    if search:
        providers = providers.filter(
            Q(business_name__icontains=search) |
            Q(description__icontains=search) |
            Q(email__icontains=search) |
            Q(phone__icontains=search)
        )
    
    # City filter
    city = request.query_params.get('city')
    if city:
        providers = providers.filter(addresses__city__icontains=city).distinct()
    
    # State filter
    state = request.query_params.get('state')
    if state:
        providers = providers.filter(addresses__state__icontains=state).distinct()
    
    # Business category filter via services
    category = request.query_params.get('category')
    if category:
        providers = providers.filter(services__category_id=category).distinct()
    
    # Verification status filter
    verified = request.query_params.get('verified')
    if verified is not None:
        is_verified = verified.lower() in ['true', '1', 'yes']
        providers = providers.filter(is_verified=is_verified)
    
    # Ordering
    ordering = request.query_params.get('ordering', '-created_at')
    valid_orderings = ['business_name', '-business_name', 'created_at', '-created_at', 'updated_at', '-updated_at']
    if ordering in valid_orderings:
        providers = providers.order_by(ordering)
    else:
        providers = providers.order_by('-created_at')
    
    # Count total before pagination for metadata
    total_count = providers.count()
    
    # Add pagination
    paginator = StandardResultsSetPagination()
    paginated_providers = paginator.paginate_queryset(providers, request)
    
    serializer = ProviderListSerializer(paginated_providers, many=True)
    
    # Enhanced response with metadata
    response_data = paginator.get_paginated_response(serializer.data).data
    response_data['meta'] = {
        'total_unclaimed': total_count,
        'applied_filters': {
            'search': search,
            'city': city,
            'state': state,
            'category': category,
            'verified': verified,
            'ordering': ordering
        },
        'filter_options': {
            'available_cities': list(
                Provider.objects.filter(is_claimed=False, is_active=True)
                .values_list('addresses__city', flat=True)
                .distinct()
                .exclude(addresses__city__isnull=True)
                .exclude(addresses__city='')[:50]  # Limit for performance
            ),
            'available_states': list(
                Provider.objects.filter(is_claimed=False, is_active=True)
                .values_list('addresses__state', flat=True)
                .distinct()
                .exclude(addresses__state__isnull=True)
                .exclude(addresses__state='')
            ),
            'ordering_options': [
                {'value': 'business_name', 'label': 'Business Name (A-Z)'},
                {'value': '-business_name', 'label': 'Business Name (Z-A)'},
                {'value': 'created_at', 'label': 'Oldest First'},
                {'value': '-created_at', 'label': 'Newest First'},
                {'value': 'updated_at', 'label': 'Recently Updated'},
                {'value': '-updated_at', 'label': 'Least Recently Updated'}
            ]
        }
    }
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_claim(request, claim_id):
    """
    Admin endpoint to approve a claim
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can approve claims'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        claim = Claim.objects.get(id=claim_id)
    except Claim.DoesNotExist:
        return Response(
            {'error': 'Claim not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    admin_notes = request.data.get('admin_notes', '')
    
    try:
        success = approve_claim_util(claim, request.user, admin_notes)
        if success:
            return Response({
                'message': 'Claim approved successfully',
                'claim': ClaimSerializer(claim).data
            })
        else:
            return Response(
                {'error': 'Failed to approve claim. It may already be claimed or in invalid state.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': f'Error approving claim: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_claim(request, claim_id):
    """
    Admin endpoint to reject a claim
    """
    if not request.user.is_staff:
        return Response(
            {'error': 'Only staff can reject claims'}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        claim = Claim.objects.get(id=claim_id)
    except Claim.DoesNotExist:
        return Response(
            {'error': 'Claim not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    admin_notes = request.data.get('admin_notes', '')
    
    try:
        success = reject_claim_util(claim, request.user, admin_notes)
        if success:
            return Response({
                'message': 'Claim rejected',
                'claim': ClaimSerializer(claim).data
            })
        else:
            return Response(
                {'error': 'Failed to reject claim. It may be in invalid state.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Exception as e:
        return Response(
            {'error': f'Error rejecting claim: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )