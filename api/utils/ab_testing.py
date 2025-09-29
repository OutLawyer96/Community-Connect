"""
A/B Testing framework for recommendation system experiments.
Manages user assignment to test variants and tracks conversion metrics.
"""

import hashlib
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple

from django.contrib.auth import get_user_model
from django.db.models import Count, Avg
from django.utils import timezone
from django.conf import settings

from api.models import ABTestVariant

User = get_user_model()
logger = logging.getLogger(__name__)


class ABTestManager:
    """
    Manages A/B testing experiments for the recommendation system
    """
    
    def __init__(self):
        self.experiments = self.load_experiment_configs()
    
    def load_experiment_configs(self) -> Dict[str, Dict[str, Any]]:
        """
        Load experiment configurations from settings or default configs
        
        Returns:
            Dictionary of experiment configurations
        """
        default_experiments = {
            'recommendation_weights': {
                'name': 'Recommendation Algorithm Weights',
                'description': 'Test different weight combinations for hybrid recommendations',
                'active': True,
                'start_date': '2024-01-01',
                'end_date': '2024-12-31',
                'variants': {
                    'balanced': {
                        'description': 'Equal weights for all algorithms',
                        'weight': 0.5,
                        'config': {
                            'collaborative_weight': 0.33,
                            'content_weight': 0.33,
                            'location_weight': 0.34
                        }
                    },
                    'collaborative_heavy': {
                        'description': 'Favor collaborative filtering',
                        'weight': 0.25,
                        'config': {
                            'collaborative_weight': 0.6,
                            'content_weight': 0.2,
                            'location_weight': 0.2
                        }
                    },
                    'content_heavy': {
                        'description': 'Favor content-based recommendations',
                        'weight': 0.25,
                        'config': {
                            'collaborative_weight': 0.2,
                            'content_weight': 0.6,
                            'location_weight': 0.2
                        }
                    }
                }
            },
            'cold_start_strategy': {
                'name': 'Cold Start Recommendation Strategy',
                'description': 'Test different strategies for new users',
                'active': True,
                'start_date': '2024-01-01',
                'end_date': '2024-12-31',
                'variants': {
                    'popular_providers': {
                        'description': 'Show most popular providers globally',
                        'weight': 0.5,
                        'config': {'strategy': 'popular_providers'}
                    },
                    'category_based': {
                        'description': 'Show providers based on user profile categories',
                        'weight': 0.5,
                        'config': {'strategy': 'category_based'}
                    }
                }
            }
        }
        
        # Try to load from settings, fallback to defaults
        return getattr(settings, 'AB_TEST_EXPERIMENTS', default_experiments)
    
    def assign_user_to_variant(self, user: User, experiment_name: str) -> str:
        """
        Assign user to an experiment variant using consistent hashing
        
        Args:
            user: User instance
            experiment_name: Name of the experiment
        
        Returns:
            Assigned variant name
        """
        if experiment_name not in self.experiments:
            logger.warning(f"Unknown experiment: {experiment_name}")
            return 'control'
        
        experiment = self.experiments[experiment_name]
        
        # Check if experiment is active
        if not self.is_experiment_active(experiment_name):
            return 'control'
        
        # Check if user already has assignment
        existing_assignment = ABTestVariant.objects.filter(
            user=user,
            experiment_name=experiment_name
        ).first()
        
        if existing_assignment:
            return existing_assignment.variant
        
        # Generate consistent hash for user + experiment
        hash_input = f"{user.id}:{experiment_name}".encode('utf-8')
        hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)
        normalized_hash = (hash_value % 1000) / 1000.0  # 0.0 to 1.0
        
        # Assign to variant based on weights
        cumulative_weight = 0.0
        assigned_variant = 'control'
        
        for variant_name, variant_config in experiment['variants'].items():
            cumulative_weight += variant_config['weight']
            if normalized_hash <= cumulative_weight:
                assigned_variant = variant_name
                break
        
        # Save assignment
        ABTestVariant.objects.create(
            user=user,
            experiment_name=experiment_name,
            variant=assigned_variant,
            assigned_at=timezone.now()
        )
        
        logger.debug(f"Assigned user {user.id} to variant {assigned_variant} for {experiment_name}")
        return assigned_variant
    
    def is_experiment_active(self, experiment_name: str) -> bool:
        """
        Check if an experiment is currently active
        
        Args:
            experiment_name: Name of the experiment
        
        Returns:
            True if experiment is active
        """
        if experiment_name not in self.experiments:
            return False
        
        experiment = self.experiments[experiment_name]
        
        if not experiment.get('active', False):
            return False
        
        now = timezone.now().date()
        start_date = datetime.strptime(experiment['start_date'], '%Y-%m-%d').date()
        end_date = datetime.strptime(experiment['end_date'], '%Y-%m-%d').date()
        
        return start_date <= now <= end_date
    
    def get_user_variant(self, user: User, experiment_name: str) -> str:
        """
        Get user's assigned variant for an experiment
        
        Args:
            user: User instance
            experiment_name: Name of the experiment
        
        Returns:
            User's assigned variant or 'control' if not assigned
        """
        try:
            assignment = ABTestVariant.objects.get(
                user=user,
                experiment_name=experiment_name
            )
            return assignment.variant
        except ABTestVariant.DoesNotExist:
            # Assign user to variant if not already assigned
            return self.assign_user_to_variant(user, experiment_name)
    
    def get_recommendation_weights(self, user: User) -> Dict[str, float]:
        """
        Get recommendation algorithm weights for user based on A/B test
        
        Args:
            user: User instance
        
        Returns:
            Dictionary with algorithm weights
        """
        variant = self.get_user_variant(user, 'recommendation_weights')
        experiment = self.experiments.get('recommendation_weights', {})
        variant_config = experiment.get('variants', {}).get(variant, {})
        
        # Return variant config or default weights
        return variant_config.get('config', {
            'collaborative_weight': 0.33,
            'content_weight': 0.33,
            'location_weight': 0.34
        })
    
    def get_cold_start_strategy(self, user: User) -> str:
        """
        Get cold start strategy for user based on A/B test
        
        Args:
            user: User instance
        
        Returns:
            Cold start strategy name
        """
        variant = self.get_user_variant(user, 'cold_start_strategy')
        experiment = self.experiments.get('cold_start_strategy', {})
        variant_config = experiment.get('variants', {}).get(variant, {})
        
        return variant_config.get('config', {}).get('strategy', 'popular_providers')
    
    def track_conversion(
        self, 
        user: User, 
        experiment_name: str, 
        conversion_type: str = 'click',
        value: float = 1.0
    ) -> bool:
        """
        Track a conversion event for A/B testing analysis
        
        Args:
            user: User instance
            experiment_name: Name of the experiment
            conversion_type: Type of conversion (click, favorite, contact, etc.)
            value: Conversion value (default: 1.0)
        
        Returns:
            True if tracking was successful
        """
        try:
            # Get or create user's experiment assignment
            assignment, created = ABTestVariant.objects.get_or_create(
                user=user,
                experiment_name=experiment_name,
                defaults={
                    'variant': self.assign_user_to_variant(user, experiment_name),
                    'assigned_at': timezone.now()
                }
            )
            
            # Update conversion data
            conversions = assignment.conversion_data or {}
            
            if conversion_type not in conversions:
                conversions[conversion_type] = {'count': 0, 'total_value': 0.0}
            
            conversions[conversion_type]['count'] += 1
            conversions[conversion_type]['total_value'] += value
            
            assignment.conversion_data = conversions
            assignment.save()
            
            logger.debug(f"Tracked {conversion_type} conversion for user {user.id} in {experiment_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to track conversion: {e}")
            return False
    
    def get_experiment_stats(self, experiment_name: str) -> Dict[str, Any]:
        """
        Get detailed statistics for an experiment
        
        Args:
            experiment_name: Name of the experiment
        
        Returns:
            Dictionary with experiment statistics
        """
        if experiment_name not in self.experiments:
            return {'error': f'Unknown experiment: {experiment_name}'}
        
        # Get all assignments for this experiment
        assignments = ABTestVariant.objects.filter(experiment_name=experiment_name)
        
        if not assignments.exists():
            return {
                'experiment_name': experiment_name,
                'total_users': 0,
                'variants': {}
            }
        
        total_users = assignments.count()
        variant_stats = {}
        
        # Calculate stats for each variant
        for variant_name in self.experiments[experiment_name]['variants'].keys():
            variant_assignments = assignments.filter(variant=variant_name)
            variant_count = variant_assignments.count()
            
            # Calculate conversion metrics
            total_conversions = {}
            for assignment in variant_assignments:
                if assignment.conversion_data:
                    for conv_type, conv_data in assignment.conversion_data.items():
                        if conv_type not in total_conversions:
                            total_conversions[conv_type] = {'count': 0, 'total_value': 0.0}
                        
                        total_conversions[conv_type]['count'] += conv_data['count']
                        total_conversions[conv_type]['total_value'] += conv_data['total_value']
            
            # Calculate conversion rates
            conversion_rates = {}
            for conv_type, conv_data in total_conversions.items():
                conversion_rates[conv_type] = {
                    'rate': conv_data['count'] / variant_count if variant_count > 0 else 0,
                    'total_conversions': conv_data['count'],
                    'avg_value': conv_data['total_value'] / conv_data['count'] if conv_data['count'] > 0 else 0
                }
            
            variant_stats[variant_name] = {
                'user_count': variant_count,
                'percentage': (variant_count / total_users * 100) if total_users > 0 else 0,
                'conversion_rates': conversion_rates
            }
        
        return {
            'experiment_name': experiment_name,
            'total_users': total_users,
            'variants': variant_stats,
            'experiment_config': self.experiments[experiment_name]
        }
    
    def get_all_experiment_stats(self) -> Dict[str, Dict[str, Any]]:
        """
        Get statistics for all experiments
        
        Returns:
            Dictionary with stats for all experiments
        """
        all_stats = {}
        
        for experiment_name in self.experiments.keys():
            all_stats[experiment_name] = self.get_experiment_stats(experiment_name)
        
        return all_stats
    
    def cleanup_expired_assignments(self, days: int = 90) -> int:
        """
        Clean up old experiment assignments
        
        Args:
            days: Delete assignments older than this many days
        
        Returns:
            Number of deleted assignments
        """
        cutoff_date = timezone.now() - timedelta(days=days)
        
        deleted_count, _ = ABTestVariant.objects.filter(
            assigned_at__lt=cutoff_date
        ).delete()
        
        logger.info(f"Cleaned up {deleted_count} expired A/B test assignments")
        return deleted_count
    
    def force_assign_user(
        self, 
        user: User, 
        experiment_name: str, 
        variant: str
    ) -> bool:
        """
        Force assign a user to a specific variant (for testing purposes)
        
        Args:
            user: User instance
            experiment_name: Name of the experiment
            variant: Variant to assign
        
        Returns:
            True if assignment was successful
        """
        if experiment_name not in self.experiments:
            logger.error(f"Unknown experiment: {experiment_name}")
            return False
        
        if variant not in self.experiments[experiment_name]['variants']:
            logger.error(f"Unknown variant {variant} for experiment {experiment_name}")
            return False
        
        # Delete existing assignment
        ABTestVariant.objects.filter(
            user=user,
            experiment_name=experiment_name
        ).delete()
        
        # Create new assignment
        ABTestVariant.objects.create(
            user=user,
            experiment_name=experiment_name,
            variant=variant,
            assigned_at=timezone.now()
        )
        
        logger.info(f"Force assigned user {user.id} to variant {variant} for {experiment_name}")
        return True

    def cleanup_ended_experiments(self, days: int = 30) -> int:
        """
        Clean up assignments for experiments that have ended
        
        Args:
            days: Clean up experiments that ended more than this many days ago
        
        Returns:
            Number of cleaned up assignments
        """
        deleted_count = 0
        now = timezone.now().date()
        cutoff_date = now - timedelta(days=days)
        
        for experiment_name, experiment_config in self.experiments.items():
            try:
                end_date = datetime.strptime(experiment_config['end_date'], '%Y-%m-%d').date()
                
                # If experiment has ended and is past cutoff, clean up assignments
                if end_date < cutoff_date:
                    count, _ = ABTestVariant.objects.filter(
                        experiment_name=experiment_name
                    ).delete()
                    deleted_count += count
                    logger.info(f"Cleaned up {count} assignments for ended experiment {experiment_name}")
                    
            except (KeyError, ValueError) as e:
                logger.warning(f"Invalid experiment config for {experiment_name}: {e}")
        
        return deleted_count


# Convenience functions for easy access
def track_conversion(
    user, 
    experiment_name: str, 
    conversion_type: str = 'click',
    value: float = 1.0
):
    """Convenience function to track conversion events"""
    manager = ABTestManager()
    return manager.track_conversion(user, experiment_name, conversion_type, value)


def get_experiment_stats(experiment_name):
    """Convenience function to get experiment statistics"""
    manager = ABTestManager()
    return manager.get_experiment_stats(experiment_name)