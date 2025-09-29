import apiClient from '../config/axios';
import API_CONFIG, { APP_CONFIG } from '../config/api';

// Cache management
const messageCache = new Map();
const threadCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

const invalidateCache = (pattern) => {
  for (const key of messageCache.keys()) {
    if (key.includes(pattern)) {
      messageCache.delete(key);
    }
  }
  for (const key of threadCache.keys()) {
    if (key.includes(pattern)) {
      threadCache.delete(key);
    }
  }
};

const getCacheKey = (endpoint, params = {}) => {
  const paramString = new URLSearchParams(params).toString();
  return `${endpoint}${paramString ? '?' + paramString : ''}`;
};

const getCachedData = (key, cache = messageCache) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data, cache = messageCache) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const messagingService = {
  /**
   * Get message threads with pagination
   * @param {Object} params - Query parameters
   */
  async getThreads(params = {}) {
    try {
      const cacheKey = getCacheKey('threads', params);
      const cached = getCachedData(cacheKey, threadCache);
      if (cached) {
        return { success: true, data: cached };
      }

      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      
      const url = `${API_CONFIG.ENDPOINTS.MESSAGE_THREADS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.get(url);
      
      setCachedData(cacheKey, response.data, threadCache);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch message threads'
      };
    }
  },

  /**
   * Get messages in a specific thread
   * @param {number} threadId - Thread ID
   * @param {Object} params - Query parameters
   */
  async getMessages(threadId, params = {}) {
    try {
      const cacheKey = getCacheKey(`messages-${threadId}`, params);
      const cached = getCachedData(cacheKey);
      if (cached) {
        return { success: true, data: cached };
      }

      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.page_size) queryParams.append('page_size', params.page_size);
      
      const url = `${API_CONFIG.ENDPOINTS.MESSAGES_IN_THREAD(threadId)}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.get(url);
      
      setCachedData(cacheKey, response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch messages'
      };
    }
  },

  /**
   * Send a new message or create a thread
   * @param {Object} messageData - Message data
   */
  async sendMessage(messageData) {
    try {
      const response = await apiClient.post(API_CONFIG.ENDPOINTS.MESSAGE_SEND, messageData);
      
      // Invalidate relevant caches
      invalidateCache('threads');
      if (messageData.thread) {
        invalidateCache(`messages-${messageData.thread}`);
      }
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message',
        errors: error.response?.data
      };
    }
  },

  /**
   * Start a new conversation with a provider
   * @param {number} providerId - Provider ID
   * @param {string} content - Message content
   */
  async startConversation(providerId, content) {
    const messageData = {
      recipient_id: providerId,
      content
    };
    
    return this.sendMessage(messageData);
  },

  /**
   * Reply to an existing thread
   * @param {number} threadId - Thread ID
   * @param {string} content - Message content
   */
  async replyToThread(threadId, content) {
    const messageData = {
      thread: threadId,
      content
    };
    
    return this.sendMessage(messageData);
  },

  /**
   * Mark thread as read
   * @param {number} threadId - Thread ID
   */
  async markThreadAsRead(threadId) {
    try {
      const response = await apiClient.patch(API_CONFIG.ENDPOINTS.MESSAGE_THREAD_MARK_READ(threadId));
      
      // Invalidate relevant caches
      invalidateCache('threads');
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to mark thread as read'
      };
    }
  },

  /**
   * Get thread details
   * @param {number} threadId - Thread ID
   */
  async getThread(threadId) {
    try {
      const cacheKey = `thread-${threadId}`;
      const cached = getCachedData(cacheKey, threadCache);
      if (cached) {
        return { success: true, data: cached };
      }

      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.MESSAGE_THREADS}${threadId}/`);
      
      setCachedData(cacheKey, response.data, threadCache);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch thread details'
      };
    }
  },

  /**
   * Search messages (not implemented - no backend endpoint)
   * @param {string} query - Search query
   * @param {Object} params - Additional parameters
   */
  async searchMessages(query, params = {}) {
    // TODO: Implement when backend search endpoint is available
    console.warn('Message search not implemented - no backend endpoint');
    return {
      success: false,
      error: 'Message search not implemented'
    };
  },

  /**
   * Format message timestamp
   * @param {string} timestamp - ISO timestamp
   */
  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const isToday = messageDate.getTime() === today.getTime();
    const isYesterday = messageDate.getTime() === today.getTime() - 86400000;
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });
    } else if (isYesterday) {
      return 'Yesterday';
    } else if (now - date < 604800000) { // Within a week
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  },

  /**
   * Format thread last message preview
   * @param {string} content - Message content
   * @param {number} maxLength - Maximum length
   */
  formatMessagePreview(content, maxLength = 50) {
    if (!content) return '';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  },

  /**
   * Get unread message count for a thread
   * @param {Object} thread - Thread object
   * @param {number} currentUserId - Current user ID
   */
  getUnreadCount(thread, currentUserId) {
    if (!thread || !thread.messages) return 0;
    
    return thread.messages.filter(message => 
      message.sender !== currentUserId && !message.is_read
    ).length;
  },

  /**
   * Check if user is participant in thread
   * @param {Object} thread - Thread object
   * @param {number} userId - User ID
   */
  isParticipant(thread, userId) {
    if (!thread || !thread.participants) return false;
    return thread.participants.some(participant => participant.id === userId);
  },

  /**
   * Get other participant in thread
   * @param {Object} thread - Thread object
   * @param {number} currentUserId - Current user ID
   */
  getOtherParticipant(thread, currentUserId) {
    if (!thread || !thread.participants) return null;
    return thread.participants.find(participant => participant.id !== currentUserId);
  },

  /**
   * Sort threads by last message timestamp
   * @param {Array} threads - Array of threads
   */
  sortThreadsByLatest(threads) {
    return threads.sort((a, b) => {
      const aTime = new Date(a.last_message_at || a.created_at);
      const bTime = new Date(b.last_message_at || b.created_at);
      return bTime - aTime;
    });
  },

  /**
   * Filter threads by read status
   * @param {Array} threads - Array of threads
   * @param {boolean} isRead - Read status
   */
  filterThreadsByReadStatus(threads, isRead) {
    if (isRead === undefined || isRead === null) return threads;
    return threads.filter(thread => thread.is_read === isRead);
  },

  /**
   * Group messages by date
   * @param {Array} messages - Array of messages
   */
  groupMessagesByDate(messages) {
    const groups = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    messages.forEach(message => {
      const date = new Date(message.created_at);
      let groupKey;
      
      if (date.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else {
        groupKey = date.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(message);
    });
    
    return groups;
  },

  /**
   * Validate message content
   * @param {string} content - Message content
   */
  validateMessageContent(content) {
    const errors = {};
    
    if (!content || content.trim().length === 0) {
      errors.content = 'Message content is required';
    } else if (content.length > 2000) {
      errors.content = 'Message content must be less than 2000 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validate subject
   * @param {string} subject - Message subject
   */
  validateSubject(subject) {
    const errors = {};
    
    if (!subject || subject.trim().length === 0) {
      errors.subject = 'Subject is required';
    } else if (subject.length > 200) {
      errors.subject = 'Subject must be less than 200 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Clear all cached data
   */
  clearCache() {
    messageCache.clear();
    threadCache.clear();
  },

  /**
   * Optimistic update for sending a message
   * @param {Array} messages - Current messages array
   * @param {Object} newMessage - New message to add
   */
  optimisticAddMessage(messages, newMessage) {
    return [...messages, {
      ...newMessage,
      id: `temp-${Date.now()}`,
      created_at: new Date().toISOString(),
      is_read: false
    }];
  },

  /**
   * Real-time message polling setup
   * @param {number} threadId - Thread ID
   * @param {Function} callback - Callback function for new messages
   */
  startMessagePolling(threadId, callback) {
    const intervalId = setInterval(async () => {
      try {
        const result = await this.getMessages(threadId, { page_size: 10 });
        if (result.success) {
          callback(result.data.results);
        }
      } catch (error) {
        console.error('Message polling error:', error);
      }
    }, APP_CONFIG.MESSAGE_POLL_INTERVAL);
    
    return intervalId;
  },

  /**
   * Stop message polling
   * @param {number} intervalId - Interval ID
   */
  stopMessagePolling(intervalId) {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
};

export default messagingService;