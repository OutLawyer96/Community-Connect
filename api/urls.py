from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    # API Root and Documentation
    path('', views.api_root, name='api_root'),
    path('docs/', views.api_docs, name='api_docs'),
    
    # Authentication endpoints
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/dashboard/', views.user_dashboard, name='user_dashboard'),
    
    # Category endpoints
    path('categories/', views.CategoryListView.as_view(), name='category_list'),
    
    # Provider endpoints
    path('providers/', views.ProviderListView.as_view(), name='provider_list'),
    path('providers/<int:pk>/', views.ProviderDetailView.as_view(), name='provider_detail'),
    path('providers/create/', views.ProviderCreateView.as_view(), name='provider_create'),
    path('providers/<int:pk>/update/', views.ProviderUpdateView.as_view(), name='provider_update'),
    path('providers/<int:provider_id>/recommendations/', views.recommendations_view, name='provider_recommendations'),
    
    # Service endpoints
    path('providers/<int:provider_id>/services/', views.ServiceListView.as_view(), name='service_list'),
    path('services/create/', views.ServiceCreateView.as_view(), name='service_create'),
    
    # Address endpoints
    path('providers/<int:provider_id>/addresses/', views.AddressListView.as_view(), name='address_list'),
    path('addresses/create/', views.AddressCreateView.as_view(), name='address_create'),
    
    # Review endpoints
    path('providers/<int:provider_id>/reviews/', views.ReviewListView.as_view(), name='review_list'),
    path('providers/<int:provider_id>/reviews/create/', views.ReviewCreateView.as_view(), name='review_create'),
    
    # Search endpoint
    path('search/', views.search_providers, name='search_providers'),
    
    # Claim endpoints
    path('claims/', views.ClaimListCreateView.as_view(), name='claim_list_create'),
    path('claims/<int:pk>/', views.ClaimDetailView.as_view(), name='claim_detail'),
    path('claims/<int:claim_id>/verify-email/', views.verify_claim_email, name='verify_claim_email'),
    path('claims/<int:claim_id>/approve/', views.approve_claim, name='approve_claim'),
    path('claims/<int:claim_id>/reject/', views.reject_claim, name='reject_claim'),
    path('unclaimed-providers/', views.unclaimed_providers, name='unclaimed_providers'),
]