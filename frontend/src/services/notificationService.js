import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

// Cache management
const notificationCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const invalidateCache = (pattern) => {
  for (const key of notificationCache.keys()) {
    if (key.includes(pattern)) {
      notificationCache.delete(key);
    }
  }
};

const getCacheKey = (endpoint, params = {}) => {
  const paramString = new URLSearchParams(params).toString();
  return `${endpoint}${paramString ? '?' + paramString : ''}`;
};

const getCachedData = (key) => {
  const cached = notificationCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  notificationCache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  notificationCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const notificationService = {
  /**
   * Get notifications with filtering and pagination
   * @param {Object} params - Query parameters
   */
  async getNotifications(params = {}) {
    try {
      const cacheKey = getCacheKey('notifications', params);
      const cached = getCachedData(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      if (params.is_read !== undefined) queryParams.append('is_read', params.is_read);
      if (params.type) queryParams.append('type', params.type);
      
      const url = `${API_CONFIG.ENDPOINTS.NOTIFICATIONS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.get(url);
      
      setCachedData(cacheKey, response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch notifications'
      };
    }
  },

  /**
   * Mark notifications as read
   * @param {Array} notificationIds - Array of notification IDs to mark as read
   */
  async markAsRead(notificationIds = []) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATION_MARK_READ, {
        notification_ids: notificationIds
      });
      
      // Invalidate cache
      invalidateCache('notifications');
      invalidateCache('stats');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark notifications as read'
      };
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.NOTIFICATION_MARK_READ, {
        notification_ids: []
      });
      
      // Invalidate cache
      invalidateCache('notifications');
      invalidateCache('stats');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark all notifications as read'
      };
    }
  },

  /**
   * Get notification statistics (unread counts)
   */
  async getNotificationStats() {
    try {
      const cacheKey = getCacheKey('stats');
      const cached = getCachedData(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATION_STATS);
      
      setCachedData(cacheKey, response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch notification stats'
      };
    }
  },

  /**
   * Get user notification preferences
   */
  async getPreferences() {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.NOTIFICATION_PREFERENCES);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch notification preferences'
      };
    }
  },

  /**
   * Update user notification preferences
   * @param {Object} preferences - Preference settings
   */
  async updatePreferences(preferences) {
    try {
      const response = await apiClient.patch(API_CONFIG.ENDPOINTS.NOTIFICATION_PREFERENCES, preferences);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update notification preferences',
        errors: error.response?.data
      };
    }
  },

  /**
   * Filter notifications by type
   * @param {Array} notifications - Array of notifications
   * @param {string} type - Notification type to filter by
   */
  filterByType(notifications, type) {
    if (!type || type === 'all') return notifications;
    return notifications.filter(notification => notification.notification_type === type);
  },

  /**
   * Filter notifications by read status
   * @param {Array} notifications - Array of notifications
   * @param {boolean} isRead - Read status to filter by
   */
  filterByReadStatus(notifications, isRead) {
    if (isRead === undefined || isRead === null) return notifications;
    return notifications.filter(notification => notification.is_read === isRead);
  },

  /**
   * Get notification type icon
   * @param {string} type - Notification type
   */
  getNotificationIcon(type) {
    const icons = {
      review: '⭐',
      claim: '📋',
      message: '💬',
      system: '🔔'
    };
    return icons[type] || '📢';
  },

  /**
   * Get notification type color
   * @param {string} type - Notification type
   */
  getNotificationColor(type) {
    const colors = {
      review: '#f59e0b',
      claim: '#3b82f6',
      message: '#10b981',
      system: '#6b7280'
    };
    return colors[type] || '#6b7280';
  },

  /**
   * Format notification timestamp
   * @param {string} timestamp - ISO timestamp
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  },

  /**
   * Generate URL for notification related object
   * @param {Object} notification - Notification object
   */
  getNotificationUrl(notification) {
    if (notification.related_object_url) {
      return notification.related_object_url;
    }
    
    // Fallback URL generation
    switch (notification.notification_type) {
      case 'review':
        return '/dashboard';
      case 'claim':
        return '/my-claims';
      case 'message':
        return '/messages';
      case 'system':
      default:
        return '/notifications';
    }
  },

  /**
   * Clear all cached data
   */
  clearCache() {
    notificationCache.clear();
  },

  /**
   * Optimistic update for marking notifications as read
   * @param {Array} notifications - Current notifications array
   * @param {Array} markedIds - IDs of notifications marked as read
   */
  optimisticMarkAsRead(notifications, markedIds) {
    return notifications.map(notification => 
      markedIds.includes(notification.id) 
        ? { ...notification, is_read: true }
        : notification
    );
  },

  /**
   * Group notifications by date
   * @param {Array} notifications - Array of notifications
   */
  groupByDate(notifications) {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    notifications.forEach(notification => {
      const date = new Date(notification.created_at);
      let groupKey;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(notification);
    });
    
    return groups;
  }
};

export default notificationService;