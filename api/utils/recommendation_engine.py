"""
Core recommendation algorithm utilities for the AI-driven recommendation system.
Implements collaborative filtering, content-based, and location-based recommendation engines.
"""

import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from django.db.models import Count, Avg
from django.conf import settings
import pickle
import os
import logging
import math
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class CollaborativeFilteringEngine:
    """Collaborative filtering using matrix factorization with SVD"""
    
    def __init__(self, n_components=50):
        self.n_components = n_components
        self.svd = TruncatedSVD(n_components=n_components, random_state=42)
        self.user_factors = None
        self.provider_factors = None
        self.user_index_map = {}
        self.provider_index_map = {}
        self.is_trained = False
        
    def build_interaction_matrix(self):
        """Build user-item interaction matrix from UserBehavior, Reviews, and Favorites"""
        from api.models import UserBehavior, Review, Favorite, User, Provider
        
        # Collect interactions with different weights
        interactions = []
        
        # Favorites (weight: 3.0)
        favorites = Favorite.objects.select_related('user', 'provider')
        for fav in favorites:
            interactions.append({
                'user_id': fav.user.id,
                'provider_id': fav.provider.id,
                'score': 3.0
            })
        
        # Reviews (weight: rating value)
        reviews = Review.objects.select_related('user', 'provider')
        for review in reviews:
            interactions.append({
                'user_id': review.user.id,
                'provider_id': review.provider.id,
                'score': float(review.rating)
            })
        
        # Views (weight: 1.0)
        views = UserBehavior.objects.filter(
            action_type='view',
            user__isnull=False,
            provider__isnull=False
        ).select_related('user', 'provider')
        
        for view in views:
            interactions.append({
                'user_id': view.user.id,
                'provider_id': view.provider.id,
                'score': 1.0
            })
        
        # Contacts (weight: 2.0)
        contacts = UserBehavior.objects.filter(
            action_type='contact',
            user__isnull=False,
            provider__isnull=False
        ).select_related('user', 'provider')
        
        for contact in contacts:
            interactions.append({
                'user_id': contact.user.id,
                'provider_id': contact.provider.id,
                'score': 2.0
            })
        
        if not interactions:
            logger.warning("No interactions found for collaborative filtering")
            return None
        
        # Convert to DataFrame and aggregate
        df = pd.DataFrame(interactions)
        interaction_matrix = df.groupby(['user_id', 'provider_id'])['score'].max().reset_index()
        
        # Create pivot table
        matrix = interaction_matrix.pivot(
            index='user_id', 
            columns='provider_id', 
            values='score'
        ).fillna(0)
        
        # Create index mappings
        self.user_index_map = {user_id: idx for idx, user_id in enumerate(matrix.index)}
        self.provider_index_map = {provider_id: idx for idx, provider_id in enumerate(matrix.columns)}
        
        return matrix.values
    
    def train(self):
        """Train the SVD model on interaction matrix"""
        try:
            interaction_matrix = self.build_interaction_matrix()
            if interaction_matrix is None:
                return False
            
            # Apply SVD
            self.user_factors = self.svd.fit_transform(interaction_matrix)
            self.provider_factors = self.svd.components_.T
            
            self.is_trained = True
            logger.info(f"Collaborative filtering model trained with {len(self.user_index_map)} users and {len(self.provider_index_map)} providers")
            return True
            
        except Exception as e:
            logger.error(f"Error training collaborative filtering model: {e}")
            return False
    
    def get_user_similarities(self, user_id, top_k=50):
        """Calculate user similarities based on factors"""
        if not self.is_trained or user_id not in self.user_index_map:
            return []
        
        user_idx = self.user_index_map[user_id]
        user_vector = self.user_factors[user_idx].reshape(1, -1)
        
        # Calculate cosine similarity with all users
        similarities = cosine_similarity(user_vector, self.user_factors)[0]
        
        # Get top similar users (excluding self)
        similar_users = []
        for idx, similarity in enumerate(similarities):
            if idx != user_idx and similarity > 0.1:  # Threshold for meaningful similarity
                # Find user_id from index
                user_id_from_idx = None
                for uid, uidx in self.user_index_map.items():
                    if uidx == idx:
                        user_id_from_idx = uid
                        break
                
                if user_id_from_idx:
                    similar_users.append((user_id_from_idx, similarity))
        
        # Sort by similarity and return top_k
        similar_users.sort(key=lambda x: x[1], reverse=True)
        return similar_users[:top_k]
    
    def predict_scores(self, user_id, provider_ids):
        """Predict scores for given providers for a user"""
        if not self.is_trained or user_id not in self.user_index_map:
            return {}
        
        user_idx = self.user_index_map[user_id]
        user_vector = self.user_factors[user_idx]
        
        scores = {}
        for provider_id in provider_ids:
            if provider_id in self.provider_index_map:
                provider_idx = self.provider_index_map[provider_id]
                provider_vector = self.provider_factors[provider_idx]
                
                # Calculate predicted score
                score = np.dot(user_vector, provider_vector)
                scores[provider_id] = max(0, score)  # Ensure non-negative scores
        
        return scores
    
    def save_model(self, filepath):
        """Save trained model to disk"""
        if not self.is_trained:
            return False
        
        try:
            model_data = {
                'svd': self.svd,
                'user_factors': self.user_factors,
                'provider_factors': self.provider_factors,
                'user_index_map': self.user_index_map,
                'provider_index_map': self.provider_index_map,
                'n_components': self.n_components,
                'is_trained': self.is_trained
            }
            
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)
            return True
            
        except Exception as e:
            logger.error(f"Error saving collaborative filtering model: {e}")
            return False
    
    def load_model(self, filepath):
        """Load trained model from disk"""
        try:
            if not os.path.exists(filepath):
                return False
            
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.svd = model_data['svd']
            self.user_factors = model_data['user_factors']
            self.provider_factors = model_data['provider_factors']
            self.user_index_map = model_data['user_index_map']
            self.provider_index_map = model_data['provider_index_map']
            self.n_components = model_data['n_components']
            self.is_trained = model_data['is_trained']
            
            return True
            
        except Exception as e:
            logger.error(f"Error loading collaborative filtering model: {e}")
            return False


class ContentBasedEngine:
    """Content-based recommendations using provider categories and services"""
    
    def __init__(self):
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        self.provider_features = None
        self.provider_index_map = {}
        self.is_trained = False
    
    def build_provider_features(self):
        """Build feature matrix for providers based on categories and services"""
        from api.models import Provider
        
        providers = Provider.objects.filter(is_active=True).prefetch_related(
            'services__category', 'services'
        )
        
        if not providers.exists():
            return None
        
        provider_texts = []
        provider_ids = []
        
        for provider in providers:
            # Combine business name, description, categories, and services
            text_components = [
                provider.business_name or '',
                provider.description or '',
            ]
            
            # Add category names
            categories = set()
            for service in provider.services.all():
                if service.category:
                    categories.add(service.category.name)
            text_components.extend(list(categories))
            
            # Add service names and descriptions
            for service in provider.services.all():
                text_components.append(service.name or '')
                text_components.append(service.description or '')
            
            provider_text = ' '.join(text_components)
            provider_texts.append(provider_text)
            provider_ids.append(provider.id)
        
        # Create index mapping
        self.provider_index_map = {pid: idx for idx, pid in enumerate(provider_ids)}
        
        return provider_texts
    
    def train(self):
        """Train TF-IDF vectorizer on provider features"""
        try:
            provider_texts = self.build_provider_features()
            if not provider_texts:
                return False
            
            self.provider_features = self.tfidf_vectorizer.fit_transform(provider_texts)
            self.is_trained = True
            
            logger.info(f"Content-based model trained with {len(provider_texts)} providers")
            return True
            
        except Exception as e:
            logger.error(f"Error training content-based model: {e}")
            return False
    
    def get_similar_providers(self, provider_id, top_k=20):
        """Find similar providers based on content similarity"""
        if not self.is_trained or provider_id not in self.provider_index_map:
            return []
        
        provider_idx = self.provider_index_map[provider_id]
        provider_vector = self.provider_features[provider_idx]
        
        # Calculate cosine similarity
        similarities = cosine_similarity(provider_vector, self.provider_features)[0]
        
        # Get similar providers (excluding self)
        similar_providers = []
        for idx, similarity in enumerate(similarities):
            if idx != provider_idx and similarity > 0.1:
                # Find provider_id from index
                provider_id_from_idx = None
                for pid, pidx in self.provider_index_map.items():
                    if pidx == idx:
                        provider_id_from_idx = pid
                        break
                
                if provider_id_from_idx:
                    similar_providers.append((provider_id_from_idx, similarity))
        
        # Sort by similarity
        similar_providers.sort(key=lambda x: x[1], reverse=True)
        return similar_providers[:top_k]
    
    def get_user_preferences(self, user_id):
        """Get user preferences based on their interaction history"""
        from api.models import UserBehavior, Favorite, Review
        
        # Get providers user has interacted with
        interacted_providers = set()
        
        # From favorites
        favorites = Favorite.objects.filter(user_id=user_id)
        interacted_providers.update(fav.provider_id for fav in favorites)
        
        # From reviews
        reviews = Review.objects.filter(user_id=user_id)
        interacted_providers.update(review.provider_id for review in reviews)
        
        # From behavior (views, contacts)
        behaviors = UserBehavior.objects.filter(
            user_id=user_id,
            provider__isnull=False
        )
        interacted_providers.update(behavior.provider_id for behavior in behaviors)
        
        return list(interacted_providers)
    
    def predict_scores(self, user_id, provider_ids):
        """Predict content-based scores for providers based on user preferences"""
        if not self.is_trained:
            return {}
        
        user_preferences = self.get_user_preferences(user_id)
        if not user_preferences:
            return {}
        
        scores = {}
        
        for provider_id in provider_ids:
            if provider_id not in self.provider_index_map:
                continue
            
            # Calculate average similarity to user's preferred providers
            similarities = []
            for pref_provider_id in user_preferences:
                if pref_provider_id in self.provider_index_map:
                    pref_idx = self.provider_index_map[pref_provider_id]
                    target_idx = self.provider_index_map[provider_id]
                    
                    # Calculate similarity
                    pref_vector = self.provider_features[pref_idx]
                    target_vector = self.provider_features[target_idx]
                    similarity = cosine_similarity(pref_vector, target_vector)[0, 0]
                    similarities.append(similarity)
            
            if similarities:
                scores[provider_id] = np.mean(similarities)
        
        return scores


class LocationBasedEngine:
    """Location-based recommendations using geographic proximity"""
    
    def __init__(self, default_radius_km=50):
        self.default_radius_km = default_radius_km
    
    def calculate_distance(self, lat1, lng1, lat2, lng2):
        """Calculate distance between two coordinates using Haversine formula"""
        if not all([lat1, lng1, lat2, lng2]):
            return float('inf')
        
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth radius in kilometers
        return 6371 * c
    
    def get_user_location_preferences(self, user_id):
        """Get user's location preferences from their behavior"""
        from api.models import UserBehavior
        
        # Get locations where user has searched or viewed providers
        behaviors = UserBehavior.objects.filter(
            user_id=user_id,
            location_lat__isnull=False,
            location_lng__isnull=False
        ).order_by('-created_at')[:50]  # Last 50 location-based interactions
        
        if not behaviors:
            return None
        
        # Calculate centroid of user's activity
        lats = [float(b.location_lat) for b in behaviors]
        lngs = [float(b.location_lng) for b in behaviors]
        
        centroid_lat = sum(lats) / len(lats)
        centroid_lng = sum(lngs) / len(lngs)
        
        return (centroid_lat, centroid_lng)
    
    def predict_scores(self, user_id, provider_ids, user_location=None):
        """Predict location-based scores for providers"""
        from api.models import Provider
        
        # Use provided location or infer from user behavior
        if user_location:
            user_lat, user_lng = user_location
        else:
            location_prefs = self.get_user_location_preferences(user_id)
            if not location_prefs:
                return {}
            user_lat, user_lng = location_prefs
        
        scores = {}
        
        # Get provider locations
        providers = Provider.objects.filter(
            id__in=provider_ids,
            addresses__latitude__isnull=False,
            addresses__longitude__isnull=False
        ).prefetch_related('addresses')
        
        for provider in providers:
            # Use primary address or first available address
            address = provider.primary_address
            if not address:
                addresses = provider.addresses.filter(
                    latitude__isnull=False,
                    longitude__isnull=False
                )
                if addresses.exists():
                    address = addresses.first()
            
            if address and address.latitude and address.longitude:
                distance = self.calculate_distance(
                    user_lat, user_lng,
                    float(address.latitude), float(address.longitude)
                )
                
                # Convert distance to score (closer = higher score)
                # Use exponential decay with configurable radius
                if distance <= self.default_radius_km:
                    score = math.exp(-distance / self.default_radius_km)
                else:
                    score = 0.1  # Minimum score for distant providers
                
                scores[provider.id] = score
        
        return scores


class HybridRecommendationEngine:
    """Hybrid recommendation engine combining all approaches"""
    
    def __init__(self, weights=None):
        self.weights = weights or {
            'collaborative': 0.5,
            'content': 0.3,
            'location': 0.2
        }
        
        self.cf_engine = CollaborativeFilteringEngine()
        self.content_engine = ContentBasedEngine()
        self.location_engine = LocationBasedEngine()
    
    def train_all_engines(self):
        """Train all recommendation engines"""
        results = {
            'collaborative': self.cf_engine.train(),
            'content': self.content_engine.train(),
            'location': True  # Location engine doesn't need training
        }
        
        logger.info(f"Hybrid engine training results: {results}")
        return results
    
    def generate_recommendations(self, user_id, candidate_providers=None, top_k=20, user_location=None):
        """Generate hybrid recommendations for a user"""
        from api.models import Provider
        
        # Get candidate providers if not provided
        if candidate_providers is None:
            candidate_providers = list(
                Provider.objects.filter(is_active=True).values_list('id', flat=True)
            )
        
        # Get scores from each engine
        cf_scores = self.cf_engine.predict_scores(user_id, candidate_providers)
        content_scores = self.content_engine.predict_scores(user_id, candidate_providers)
        location_scores = self.location_engine.predict_scores(user_id, candidate_providers, user_location)
        
        # Combine scores
        combined_scores = {}
        
        for provider_id in candidate_providers:
            score = 0.0
            total_weight = 0.0
            
            # Collaborative filtering score
            if provider_id in cf_scores:
                score += cf_scores[provider_id] * self.weights['collaborative']
                total_weight += self.weights['collaborative']
            
            # Content-based score
            if provider_id in content_scores:
                score += content_scores[provider_id] * self.weights['content']
                total_weight += self.weights['content']
            
            # Location-based score
            if provider_id in location_scores:
                score += location_scores[provider_id] * self.weights['location']
                total_weight += self.weights['location']
            
            # Normalize by total weight used
            if total_weight > 0:
                combined_scores[provider_id] = score / total_weight
        
        # Sort by score and return top_k
        sorted_recommendations = sorted(
            combined_scores.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return sorted_recommendations[:top_k]


class ColdStartHandler:
    """Handle recommendations for new users with no behavior history"""
    
    def get_popular_providers(self, category_ids=None, location=None, top_k=10):
        """Get popular providers based on ratings and reviews"""
        from api.models import Provider
        
        queryset = Provider.objects.filter(is_active=True)
        
        # Filter by categories if provided
        if category_ids:
            queryset = queryset.filter(services__category__in=category_ids).distinct()
        
        # Add location filtering if provided
        if location:
            lat, lng = location
            # Simple distance filtering (could be enhanced)
            queryset = queryset.filter(
                addresses__latitude__isnull=False,
                addresses__longitude__isnull=False
            )
        
        # Order by rating and review count
        popular_providers = queryset.annotate(
            avg_rating=Avg('reviews__rating'),
            review_count=Count('reviews')
        ).filter(
            avg_rating__gte=4.0,  # High-rated providers
            review_count__gte=5   # Minimum reviews for reliability
        ).order_by('-avg_rating', '-review_count')
        
        return list(popular_providers[:top_k].values_list('id', flat=True))
    
    def get_category_based_recommendations(self, user_id, top_k=10):
        """Get recommendations based on user's initial preferences or demographics"""
        # This could be enhanced with demographic data or initial preference surveys
        # For now, return diverse popular providers across different categories
        from api.models import Category
        
        categories = Category.objects.all()[:5]  # Get diverse categories
        recommendations = []
        
        for category in categories:
            category_providers = self.get_popular_providers(
                category_ids=[category.id],
                top_k=2
            )
            recommendations.extend(category_providers)
        
        return recommendations[:top_k]