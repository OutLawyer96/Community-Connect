import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

export const reviewsService = {
  /**
   * Get user's reviews with pagination
   * @param {Object} options - Query options
   */
  async getUserReviews(options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.page_size) params.append('page_size', options.page_size);
      if (options.ordering) params.append('ordering', options.ordering);
      
      const url = `${API_CONFIG.ENDPOINTS.USER_REVIEWS}${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch reviews'
      };
    }
  },

  /**
   * Get reviews for a specific provider
   * @param {number} providerId - Provider ID
   * @param {Object} options - Query options
   */
  async getProviderReviews(providerId, options = {}) {
    try {
      const params = new URLSearchParams();
      
      if (options.page) params.append('page', options.page);
      if (options.page_size) params.append('page_size', options.page_size);
      if (options.ordering) params.append('ordering', options.ordering);
      
      const url = `${API_CONFIG.ENDPOINTS.PROVIDER_DETAIL(providerId)}/reviews/${params.toString() ? '?' + params.toString() : ''}`;
      const response = await apiClient.get(url);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch provider reviews'
      };
    }
  },

  /**
   * Create a new review
   * @param {number} providerId - Provider ID
   * @param {Object} reviewData - Review data (rating, comment)
   */
  async createReview(providerId, reviewData) {
    try {
      const response = await apiClient.post(
        `${API_CONFIG.ENDPOINTS.PROVIDER_DETAIL(providerId)}/reviews/`,
        reviewData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        error: errorData?.message || 'Failed to create review',
        errors: errorData // Include field-specific errors
      };
    }
  },

  /**
   * Update an existing review
   * @param {number} reviewId - Review ID
   * @param {Object} reviewData - Updated review data
   */
  async updateReview(reviewId, reviewData) {
    try {
      const response = await apiClient.patch(
        `/api/reviews/${reviewId}/`,
        reviewData
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        error: errorData?.message || 'Failed to update review',
        errors: errorData
      };
    }
  },

  /**
   * Delete a review
   * @param {number} reviewId - Review ID
   */
  async deleteReview(reviewId) {
    try {
      await apiClient.delete(`/api/reviews/${reviewId}/`);
      
      return {
        success: true,
        message: 'Review deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete review'
      };
    }
  },

  /**
   * Get comprehensive provider analytics
   * @param {number} providerId - Provider ID
   */
  async getProviderAnalytics(providerId) {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROVIDER_ANALYTICS(providerId));
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch analytics'
      };
    }
  },

  /**
   * Get review statistics for a provider
   * @param {number} providerId - Provider ID
   */
  async getReviewStats(providerId) {
    try {
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.PROVIDER_DETAIL(providerId)}/review-stats/`);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch review statistics'
      };
    }
  },

  /**
   * Validate review data before submission
   * @param {Object} reviewData - Review data to validate
   */
  validateReview(reviewData) {
    const errors = {};
    
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      errors.rating = 'Rating must be between 1 and 5 stars';
    }
    
    if (reviewData.comment && reviewData.comment.length < 10) {
      errors.comment = 'Comment must be at least 10 characters long';
    }
    
    if (reviewData.comment && reviewData.comment.length > 1000) {
      errors.comment = 'Comment cannot exceed 1000 characters';
    }
    
    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Calculate average rating from reviews array
   * @param {Array} reviews - Array of review objects
   */
  calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return null;
    
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  },

  /**
   * Get rating distribution from reviews array
   * @param {Array} reviews - Array of review objects
   */
  getRatingDistribution(reviews) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    reviews.forEach(review => {
      distribution[review.rating] = (distribution[review.rating] || 0) + 1;
    });
    
    return distribution;
  },

  /**
   * Format review date for display
   * @param {string} dateString - ISO date string
   */
  formatReviewDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    
    return date.toLocaleDateString();
  },

  /**
   * Check if user can review a provider (hasn't reviewed already)
   * @param {number} providerId - Provider ID
   * @param {Array} userReviews - User's existing reviews
   */
  canReview(providerId, userReviews = []) {
    return !userReviews.some(review => review.provider_id === providerId);
  }
};

export default reviewsService;