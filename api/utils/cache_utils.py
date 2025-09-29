"""
Caching utilities for the recommendation system.
Handles recommendation caching, invalidation, and cache warming strategies.
"""

from django.core.cache import cache
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging
import hashlib
import json
from typing import List, Dict, Any, Optional

from api.models import UserRecommendation, User, Provider

logger = logging.getLogger(__name__)


class RecommendationCache:
    """
    Manages caching for recommendation system to improve performance
    """
    
    # Cache key prefixes
    USER_RECOMMENDATIONS_PREFIX = 'user_recs'
    PROVIDER_FEATURES_PREFIX = 'provider_features'
    USER_BEHAVIOR_PREFIX = 'user_behavior'
    ALGORITHM_MODEL_PREFIX = 'algo_model'
    COLD_START_RECS_PREFIX = 'cold_start'
    POPULAR_PROVIDERS_PREFIX = 'popular_providers'
    
    # Default cache timeouts (in seconds)
    DEFAULT_TIMEOUTS = {
        'user_recommendations': 3600,  # 1 hour
        'provider_features': 7200,     # 2 hours
        'user_behavior': 1800,         # 30 minutes
        'algorithm_models': 86400,     # 24 hours
        'cold_start': 3600,           # 1 hour
        'popular_providers': 1800,    # 30 minutes
    }
    
    def __init__(self):
        self.cache_timeouts = getattr(
            settings, 
            'RECOMMENDATION_CACHE_TIMEOUTS', 
            self.DEFAULT_TIMEOUTS
        )
    
    def get_cache_key(self, prefix: str, identifier: str, **kwargs) -> str:
        """
        Generate cache key with optional parameters
        
        Args:
            prefix: Cache key prefix
            identifier: Main identifier (e.g., user_id)
            **kwargs: Additional parameters to include in key
        
        Returns:
            Hashed cache key
        """
        key_parts = [prefix, str(identifier)]
        
        # Add sorted kwargs for consistent key generation
        if kwargs:
            sorted_params = sorted(kwargs.items())
            param_str = '&'.join([f"{k}={v}" for k, v in sorted_params])
            key_parts.append(param_str)
        
        key_string = ':'.join(key_parts)
        
        # Hash long keys to avoid cache key size limits
        if len(key_string) > 200:
            key_hash = hashlib.md5(key_string.encode()).hexdigest()
            return f"{prefix}:{key_hash}"
        
        return key_string
    
    def cache_user_recommendations(
        self, 
        user_id: int, 
        recommendations: List[Dict], 
        algorithm_version: str = None,
        location: str = None
    ) -> bool:
        """
        Cache user recommendations
        
        Args:
            user_id: User ID
            recommendations: List of recommendation dictionaries
            algorithm_version: Algorithm version used
            location: User location context
        
        Returns:
            True if cached successfully
        """
        try:
            cache_key = self.get_cache_key(
                self.USER_RECOMMENDATIONS_PREFIX,
                user_id,
                algo=algorithm_version,
                loc=location
            )
            
            cache_data = {
                'recommendations': recommendations,
                'algorithm_version': algorithm_version,
                'location': location,
                'cached_at': timezone.now().isoformat(),
                'user_id': user_id
            }
            
            timeout = self.cache_timeouts['user_recommendations']
            cache.set(cache_key, cache_data, timeout)
            
            logger.debug(f"Cached recommendations for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache recommendations for user {user_id}: {e}")
            return False
    
    def get_user_recommendations(
        self, 
        user_id: int, 
        algorithm_version: str = None,
        location: str = None
    ) -> Optional[List[Dict]]:
        """
        Get cached user recommendations
        
        Args:
            user_id: User ID
            algorithm_version: Algorithm version to match
            location: Location context to match
        
        Returns:
            Cached recommendations or None
        """
        try:
            cache_key = self.get_cache_key(
                self.USER_RECOMMENDATIONS_PREFIX,
                user_id,
                algo=algorithm_version,
                loc=location
            )
            
            cached_data = cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for user {user_id} recommendations")
                return cached_data['recommendations']
            
            logger.debug(f"Cache miss for user {user_id} recommendations")
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached recommendations for user {user_id}: {e}")
            return None
    
    def cache_provider_features(self, provider_id: int, features: Dict[str, Any]) -> bool:
        """
        Cache provider feature vectors for ML algorithms
        
        Args:
            provider_id: Provider ID
            features: Feature dictionary
        
        Returns:
            True if cached successfully
        """
        try:
            cache_key = self.get_cache_key(self.PROVIDER_FEATURES_PREFIX, provider_id)
            
            cache_data = {
                'features': features,
                'cached_at': timezone.now().isoformat(),
                'provider_id': provider_id
            }
            
            timeout = self.cache_timeouts['provider_features']
            cache.set(cache_key, cache_data, timeout)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache features for provider {provider_id}: {e}")
            return False
    
    def get_provider_features(self, provider_id: int) -> Optional[Dict[str, Any]]:
        """
        Get cached provider features
        
        Args:
            provider_id: Provider ID
        
        Returns:
            Cached features or None
        """
        try:
            cache_key = self.get_cache_key(self.PROVIDER_FEATURES_PREFIX, provider_id)
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return cached_data['features']
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached features for provider {provider_id}: {e}")
            return None
    
    def cache_user_behavior_summary(
        self, 
        user_id: int, 
        behavior_summary: Dict[str, Any]
    ) -> bool:
        """
        Cache user behavior summary for quick access
        
        Args:
            user_id: User ID
            behavior_summary: Behavior summary dictionary
        
        Returns:
            True if cached successfully
        """
        try:
            cache_key = self.get_cache_key(self.USER_BEHAVIOR_PREFIX, user_id)
            
            cache_data = {
                'behavior_summary': behavior_summary,
                'cached_at': timezone.now().isoformat(),
                'user_id': user_id
            }
            
            timeout = self.cache_timeouts['user_behavior']
            cache.set(cache_key, cache_data, timeout)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache behavior summary for user {user_id}: {e}")
            return False
    
    def get_user_behavior_summary(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Get cached user behavior summary
        
        Args:
            user_id: User ID
        
        Returns:
            Cached behavior summary or None
        """
        try:
            cache_key = self.get_cache_key(self.USER_BEHAVIOR_PREFIX, user_id)
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return cached_data['behavior_summary']
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached behavior summary for user {user_id}: {e}")
            return None
    
    def cache_algorithm_model(
        self, 
        algorithm_name: str, 
        model_data: Any, 
        version: str = None
    ) -> bool:
        """
        Cache trained ML models
        
        Args:
            algorithm_name: Name of the algorithm
            model_data: Serialized model data
            version: Model version
        
        Returns:
            True if cached successfully
        """
        try:
            cache_key = self.get_cache_key(
                self.ALGORITHM_MODEL_PREFIX,
                algorithm_name,
                version=version
            )
            
            cache_data = {
                'model_data': model_data,
                'algorithm_name': algorithm_name,
                'version': version,
                'cached_at': timezone.now().isoformat()
            }
            
            timeout = self.cache_timeouts['algorithm_models']
            cache.set(cache_key, cache_data, timeout)
            
            logger.info(f"Cached model for algorithm {algorithm_name} v{version}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache model for {algorithm_name}: {e}")
            return False
    
    def get_algorithm_model(
        self, 
        algorithm_name: str, 
        version: str = None
    ) -> Optional[Any]:
        """
        Get cached ML model
        
        Args:
            algorithm_name: Name of the algorithm
            version: Model version
        
        Returns:
            Cached model data or None
        """
        try:
            cache_key = self.get_cache_key(
                self.ALGORITHM_MODEL_PREFIX,
                algorithm_name,
                version=version
            )
            
            cached_data = cache.get(cache_key)
            
            if cached_data:
                logger.debug(f"Cache hit for model {algorithm_name} v{version}")
                return cached_data['model_data']
            
            logger.debug(f"Cache miss for model {algorithm_name} v{version}")
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached model for {algorithm_name}: {e}")
            return None
    
    def cache_cold_start_recommendations(
        self, 
        recommendations: List[Dict],
        category: str = None,
        location: str = None
    ) -> bool:
        """
        Cache cold start recommendations for new users
        
        Args:
            recommendations: List of recommendations
            category: Service category filter
            location: Location context
        
        Returns:
            True if cached successfully
        """
        try:
            cache_key = self.get_cache_key(
                self.COLD_START_RECS_PREFIX,
                'global',
                category=category,
                location=location
            )
            
            cache_data = {
                'recommendations': recommendations,
                'category': category,
                'location': location,
                'cached_at': timezone.now().isoformat()
            }
            
            timeout = self.cache_timeouts['cold_start']
            cache.set(cache_key, cache_data, timeout)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache cold start recommendations: {e}")
            return False
    
    def get_cold_start_recommendations(
        self, 
        category: str = None,
        location: str = None
    ) -> Optional[List[Dict]]:
        """
        Get cached cold start recommendations
        
        Args:
            category: Service category filter
            location: Location context
        
        Returns:
            Cached recommendations or None
        """
        try:
            cache_key = self.get_cache_key(
                self.COLD_START_RECS_PREFIX,
                'global',
                category=category,
                location=location
            )
            
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return cached_data['recommendations']
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached cold start recommendations: {e}")
            return None
    
    def cache_popular_providers(
        self, 
        providers: List[Dict],
        category: str = None,
        location: str = None,
        time_period: str = 'week'
    ) -> bool:
        """
        Cache popular providers for quick access
        
        Args:
            providers: List of popular providers
            category: Service category
            location: Location context
            time_period: Time period for popularity calculation
        
        Returns:
            True if cached successfully
        """
        try:
            cache_key = self.get_cache_key(
                self.POPULAR_PROVIDERS_PREFIX,
                time_period,
                category=category,
                location=location
            )
            
            cache_data = {
                'providers': providers,
                'category': category,
                'location': location,
                'time_period': time_period,
                'cached_at': timezone.now().isoformat()
            }
            
            timeout = self.cache_timeouts['popular_providers']
            cache.set(cache_key, cache_data, timeout)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to cache popular providers: {e}")
            return False
    
    def get_popular_providers(
        self, 
        category: str = None,
        location: str = None,
        time_period: str = 'week'
    ) -> Optional[List[Dict]]:
        """
        Get cached popular providers
        
        Args:
            category: Service category
            location: Location context
            time_period: Time period for popularity
        
        Returns:
            Cached providers or None
        """
        try:
            cache_key = self.get_cache_key(
                self.POPULAR_PROVIDERS_PREFIX,
                time_period,
                category=category,
                location=location
            )
            
            cached_data = cache.get(cache_key)
            
            if cached_data:
                return cached_data['providers']
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached popular providers: {e}")
            return None
    
    def invalidate_user_cache(self, user_id: int) -> bool:
        """
        Invalidate all cache entries for a specific user
        
        Args:
            user_id: User ID
        
        Returns:
            True if invalidation attempted
        """
        try:
            # Pattern matching isn't universally supported, so we'll clear known patterns
            patterns_to_clear = [
                f"{self.USER_RECOMMENDATIONS_PREFIX}:{user_id}:*",
                f"{self.USER_BEHAVIOR_PREFIX}:{user_id}*"
            ]
            
            # Clear specific known keys
            for pattern in patterns_to_clear:
                # For Redis backends that support pattern deletion
                if hasattr(cache, 'delete_pattern'):
                    cache.delete_pattern(pattern)
                else:
                    # Fallback: clear common variations
                    base_keys = [
                        f"{self.USER_RECOMMENDATIONS_PREFIX}:{user_id}",
                        f"{self.USER_BEHAVIOR_PREFIX}:{user_id}"
                    ]
                    cache.delete_many(base_keys)
            
            logger.debug(f"Invalidated cache for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to invalidate cache for user {user_id}: {e}")
            return False
    
    def invalidate_provider_cache(self, provider_id: int) -> bool:
        """
        Invalidate cache entries related to a specific provider
        
        Args:
            provider_id: Provider ID
        
        Returns:
            True if invalidation attempted
        """
        try:
            keys_to_clear = [
                f"{self.PROVIDER_FEATURES_PREFIX}:{provider_id}",
                f"{self.POPULAR_PROVIDERS_PREFIX}:*",  # Provider changes may affect popularity
                f"{self.COLD_START_RECS_PREFIX}:*"     # May affect cold start recommendations
            ]
            
            for key_pattern in keys_to_clear:
                if '*' in key_pattern:
                    if hasattr(cache, 'delete_pattern'):
                        cache.delete_pattern(key_pattern)
                else:
                    cache.delete(key_pattern)
            
            logger.debug(f"Invalidated cache for provider {provider_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to invalidate cache for provider {provider_id}: {e}")
            return False
    
    def warm_cache_for_user(self, user_id: int) -> bool:
        """
        Pre-warm cache with recommendations for a user
        
        Args:
            user_id: User ID
        
        Returns:
            True if warming attempted
        """
        try:
            from api.utils.recommendation_engine import HybridRecommendationEngine
            
            # Initialize recommendation engine
            engine = HybridRecommendationEngine()
            
            # Generate and cache recommendations
            recommendations = engine.get_recommendations(user_id, limit=20)
            
            if recommendations:
                return self.cache_user_recommendations(
                    user_id, 
                    recommendations,
                    algorithm_version=engine.get_version()
                )
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to warm cache for user {user_id}: {e}")
            return False
    
    def warm_popular_providers_cache(self) -> bool:
        """
        Pre-warm cache with popular providers
        
        Returns:
            True if warming successful
        """
        try:
            from django.db.models import Count
            from datetime import datetime, timedelta
            
            # Calculate popular providers from recent behavior
            week_ago = timezone.now() - timedelta(days=7)
            
            popular_providers = Provider.objects.filter(
                is_active=True,
                userbehavior__created_at__gte=week_ago,
                userbehavior__action_type__in=['view', 'contact', 'favorite']
            ).annotate(
                interaction_count=Count('userbehavior')
            ).order_by('-interaction_count')[:50]
            
            provider_data = []
            for provider in popular_providers:
                provider_data.append({
                    'id': provider.id,
                    'name': provider.name,
                    'interaction_count': provider.interaction_count,
                    'rating': float(provider.rating) if provider.rating else 0,
                })
            
            return self.cache_popular_providers(provider_data, time_period='week')
            
        except Exception as e:
            logger.error(f"Failed to warm popular providers cache: {e}")
            return False
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """
        Get cache statistics and health information
        
        Returns:
            Dictionary with cache statistics
        """
        try:
            stats = {
                'cache_backend': str(cache.__class__),
                'timeouts_configured': self.cache_timeouts,
                'prefixes': {
                    'user_recommendations': self.USER_RECOMMENDATIONS_PREFIX,
                    'provider_features': self.PROVIDER_FEATURES_PREFIX,
                    'user_behavior': self.USER_BEHAVIOR_PREFIX,
                    'algorithm_models': self.ALGORITHM_MODEL_PREFIX,
                    'cold_start': self.COLD_START_RECS_PREFIX,
                    'popular_providers': self.POPULAR_PROVIDERS_PREFIX,
                }
            }
            
            # Try to get cache-specific stats if available
            if hasattr(cache, 'get_stats'):
                stats['backend_stats'] = cache.get_stats()
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {'error': str(e)}
    
    def clear_all_recommendation_cache(self) -> bool:
        """
        Clear all recommendation-related cache entries
        WARNING: This will clear all cached recommendations!
        
        Returns:
            True if clearing attempted
        """
        try:
            patterns_to_clear = [
                f"{self.USER_RECOMMENDATIONS_PREFIX}:*",
                f"{self.PROVIDER_FEATURES_PREFIX}:*",
                f"{self.USER_BEHAVIOR_PREFIX}:*",
                f"{self.ALGORITHM_MODEL_PREFIX}:*",
                f"{self.COLD_START_RECS_PREFIX}:*",
                f"{self.POPULAR_PROVIDERS_PREFIX}:*"
            ]
            
            for pattern in patterns_to_clear:
                if hasattr(cache, 'delete_pattern'):
                    cache.delete_pattern(pattern)
            
            logger.warning("Cleared all recommendation cache entries")
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear recommendation cache: {e}")
            return False


# Global cache instance
recommendation_cache = RecommendationCache()