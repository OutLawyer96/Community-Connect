import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

export const profileService = {
  /**
   * Get current user profile data
   */
  async getProfile() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.DASHBOARD);
      return {
        success: true,
        data: response.data.user
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch profile'
      };
    }
  },

  /**
   * Update user profile with multipart support for avatar uploads
   * @param {FormData|Object} profileData - Profile data to update
   */
  async updateProfile(profileData) {
    try {
      const isFormData = profileData instanceof FormData;
      
      const response = await apiClient.patch(
        API_CONFIG.ENDPOINTS.PROFILE,
        profileData,
        {
          headers: {
            ...(isFormData && { 'Content-Type': 'multipart/form-data' })
          }
        }
      );
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const errorData = error.response?.data;
      return {
        success: false,
        error: errorData?.message || 'Failed to update profile',
        errors: errorData // Include field-specific errors
      };
    }
  },

  /**
   * Validate avatar file before upload
   * @param {File} file - Avatar file to validate
   */
  validateAvatar(file) {
    const errors = [];
    
    if (!file) return { valid: true, errors: [] };
    
    // Check file size (2MB limit)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      errors.push('Avatar file size cannot exceed 2MB');
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      errors.push('Only JPEG and PNG files are allowed for avatar');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Get avatar URL for a user
   * @param {Object} user - User object
   */
  getAvatarUrl(user) {
    return user?.avatar_url || null;
  }
};

export default profileService;