from django.urls import path
from . import views

urlpatterns = [
    # Basic endpoints
    path('', views.api_root, name='api-root'),
    
    # Authentication endpoints
    path('auth/register/', views.register_view, name='auth-register'),
    path('auth/login/', views.login_view, name='auth-login'),
    path('auth/logout/', views.logout_view, name='auth-logout'),
    path('auth/dashboard/', views.user_dashboard, name='auth-dashboard'),
    
    # Provider endpoints
    path('providers/', views.ProviderListView.as_view(), name='provider-list'),
    path('providers/<int:pk>/', views.ProviderDetailView.as_view(), name='provider-detail'),
    
    # Search endpoints
    path('search/', views.search_providers, name='search-providers'),
    path('search/suggestions/', views.ProviderSearchSuggestionsView.as_view(), name='search-suggestions'),
    path('search/locations/', views.LocationSuggestionsView.as_view(), name='location-suggestions'),
    
    # Category endpoints
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    
    # Profile endpoints
    path('profile/', views.ProfileUpdateView.as_view(), name='profile-update'),
    
    # Favorites endpoints
    path('favorites/', views.FavoriteListView.as_view(), name='favorite-list'),
    path('favorites/toggle/', views.FavoriteToggleView.as_view(), name='favorite-toggle'),
    
    # User Reviews endpoints
    path('reviews/mine/', views.UserReviewListView.as_view(), name='user-reviews'),
    
    # Provider Analytics endpoints
    path('providers/<int:pk>/analytics/', views.ProviderAnalyticsView.as_view(), name='provider-analytics'),
    
    # Claim endpoints
    path('claims/', views.ClaimListCreateView.as_view(), name='claims'),
    path('claims/<int:pk>/', views.ClaimDetailView.as_view(), name='claim-detail'),
    path('claims/<int:claim_id>/verify-email/', views.verify_claim_email, name='claim-verify-email'),
    path('claims/<int:claim_id>/approve/', views.approve_claim, name='claim-approve'),
    path('claims/<int:claim_id>/reject/', views.reject_claim, name='claim-reject'),
    path('providers/unclaimed/', views.unclaimed_providers, name='unclaimed-providers'),
    
    # Review moderation endpoints
    path('reviews/<int:pk>/report/', views.ReviewReportCreateView.as_view(), name='review-report'),
    path('reviews/<int:pk>/moderate/', views.ReviewModerationView.as_view(), name='review-moderate'),
    path('reviews/moderation/stats/', views.ReviewModerationStatsView.as_view(), name='review-moderation-stats'),
    path('reviews/moderation/queue/', views.ReviewModerationQueueView.as_view(), name='review-moderation-queue'),
    path('reviews/reports/', views.ReviewReportListView.as_view(), name='review-report-list'),
    path('reviews/reports/<int:pk>/', views.ReviewReportDetailView.as_view(), name='review-report-detail'),
    path('reviews/reports/<int:pk>/resolve/', views.ReviewReportResolveView.as_view(), name='review-report-resolve'),
    
    # Purchase verification endpoints
    path('purchase-verification/create/', views.PurchaseVerificationCreateView.as_view(), name='purchase-verification-create'),
    path('purchase-verification/<int:pk>/', views.PurchaseVerificationDetailView.as_view(), name='purchase-verification-detail'),
    path('purchase-verification/validate/', views.PurchaseVerificationValidateView.as_view(), name='purchase-verification-validate'),
    
    # Notification endpoints
    path('notifications/', views.NotificationListView.as_view(), name='notification-list'),
    path('notifications/mark-read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path('notifications/stats/', views.NotificationStatsView.as_view(), name='notification-stats'),
    path('preferences/', views.NotificationPreferenceView.as_view(), name='notification-preferences'),
    
    # Messaging endpoints
    path('messages/threads/', views.MessageThreadListView.as_view(), name='message-threads'),
    path('messages/threads/<int:pk>/', views.MessageThreadDetailView.as_view(), name='message-thread-detail'),
    path('messages/send/', views.MessageCreateView.as_view(), name='message-create'),
    
    # Recommendation system endpoints
    path('recommendations/', views.PersonalizedRecommendationsView.as_view(), name='personalized-recommendations'),
    path('behavior/log/', views.LogUserBehaviorView.as_view(), name='log-behavior'),
    path('ab-test/assign/', views.ABTestAssignmentView.as_view(), name='ab-test-assign'),
]
