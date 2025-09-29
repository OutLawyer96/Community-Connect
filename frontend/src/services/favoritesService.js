import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

export const favoritesService = {
  /**
   * Get user's favorite providers with pagination
   * @param {Object} options - Query options
   */
  async getFavorites(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.page_size) params.append('page_size', options.page_size);
      
      const url = `${API_CONFIG.ENDPOINTS.FAVORITES}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch favorites'
      };
    }
  },

  /**
   * Toggle favorite status for a provider with optimistic updates
   * @param {number} providerId - Provider ID to toggle
   * @param {Function} onOptimisticUpdate - Callback for optimistic UI update
   */
  async toggleFavorite(providerId, onOptimisticUpdate = null) {
    // Perform optimistic update first
    if (onOptimisticUpdate) {
      onOptimisticUpdate(providerId);
    }
    
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.FAVORITES_TOGGLE, {
        provider_id: providerId
      });
      
      return {
        success: true,
        data: response.data,
        favorited: response.data.favorited
      };
    } catch (error) {
      // Revert optimistic update on error
      if (onOptimisticUpdate) {
        onOptimisticUpdate(providerId); // Toggle back
      }
      
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update favorite'
      };
    }
  },

  /**
   * Check if a provider is favorited by the current user
   * @param {number} providerId - Provider ID to check
   * @param {Array} favorites - Current favorites list
   */
  isFavorited(providerId, favorites = []) {
    return favorites.some(favorite => favorite.provider === providerId);
  },

  /**
   * Remove favorite by ID (direct removal)
   * @param {number} favoriteId - Favorite record ID
   */
  async removeFavorite(favoriteId) {
    try {
      await apiClient.delete(`${API_CONFIG.ENDPOINTS.FAVORITES}${favoriteId}/`);
      
      return {
        success: true,
        message: 'Removed from favorites'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to remove favorite'
      };
    }
  },

  /**
   * Get favorite count for a provider
   * @param {number} providerId - Provider ID
   */
  async getFavoriteCount(providerId) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.PROVIDERS}${providerId}/favorites/count/`);
      
      return {
        success: true,
        count: response.data.count
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get favorite count'
      };
    }
  },

  /**
   * Optimistic update helper for UI state management
   * @param {Array} favorites - Current favorites array
   * @param {number} providerId - Provider ID to toggle
   * @param {Object} providerData - Provider data for new favorite
   */
  optimisticToggle(favorites, providerId, providerData = null) {
    const existingIndex = favorites.findIndex(fav => fav.provider === providerId);
    
    if (existingIndex !== -1) {
      // Remove existing favorite
      return favorites.filter((_, index) => index !== existingIndex);
    } else {
      // Add new favorite
      const newFavorite = {
        id: `temp-${Date.now()}`, // Temporary ID
        provider: providerId,
        provider_name: providerData?.business_name || 'Unknown Provider',
        created_at: new Date().toISOString(),
        provider_rating: providerData?.average_rating || null,
        provider_address: providerData?.primary_address || null
      };
      
      return [newFavorite, ...favorites];
    }
  }
};

export default favoritesService;