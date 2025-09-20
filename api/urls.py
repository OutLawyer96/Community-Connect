from django.urls import path
from . import views

urlpatterns = [
    # Basic endpoints
    path('', views.api_root, name='api-root'),
    
    # Provider endpoints
    path('providers/', views.ProviderListView.as_view(), name='provider-list'),
    path('providers/<int:pk>/', views.ProviderDetailView.as_view(), name='provider-detail'),
    
    # Search endpoints
    path('search/', views.search_providers, name='search-providers'),
    path('search/suggestions/', views.ProviderSearchSuggestionsView.as_view(), name='search-suggestions'),
    path('search/locations/', views.LocationSuggestionsView.as_view(), name='location-suggestions'),
    
    # Category endpoints
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
]
