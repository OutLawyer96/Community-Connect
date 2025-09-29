const API_CONFIG = {
  BASE_URL: 'http://127.0.0.1:8000/api',
  TIMEOUT: 30000,
  
  ENDPOINTS: {
    // Authentication endpoints
    REGISTER: '/auth/register/',
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    DASHBOARD: '/auth/dashboard/',
    
    // Provider endpoints
    PROVIDERS: '/providers/',
    PROVIDER_DETAIL: (id) => `/providers/${id}/`,
    PROVIDER_CREATE: '/providers/create/',
    PROVIDER_UPDATE: (id) => `/providers/${id}/update/`,
    
    // Category endpoints
    CATEGORIES: '/categories/',
    
    // Search endpoints
    SEARCH: '/search/',
    SEARCH_SUGGESTIONS: '/search/suggestions/',
    LOCATION_SUGGESTIONS: '/search/locations/',
    
    // Claim endpoints
    CLAIMS: '/claims/',
    CLAIM_DETAIL: (id) => `/claims/${id}/`,
    CLAIM_VERIFY_EMAIL: (id) => `/claims/${id}/verify-email/`,
    CLAIM_APPROVE: (id) => `/claims/${id}/approve/`,
    CLAIM_REJECT: (id) => `/claims/${id}/reject/`,
    UNCLAIMED_PROVIDERS: '/providers/unclaimed/',
    
    // Profile endpoints
    PROFILE: '/profile/',
    
    // Favorites endpoints
    FAVORITES: '/favorites/',
    FAVORITES_TOGGLE: '/favorites/toggle/',
    
    // Reviews endpoints
    USER_REVIEWS: '/reviews/mine/',
    
    // Provider analytics
    PROVIDER_ANALYTICS: (id) => `/providers/${id}/analytics/`,
    
    // Notification endpoints
    NOTIFICATIONS: '/notifications/',
    NOTIFICATION_MARK_READ: '/notifications/mark-read/',
    NOTIFICATION_STATS: '/notifications/stats/',
    NOTIFICATION_PREFERENCES: '/preferences/',
    
    // Messaging endpoints
    MESSAGE_THREADS: '/messages/threads/',
    MESSAGE_THREAD_DETAIL: (id) => `/messages/threads/${id}/`,
    MESSAGES_IN_THREAD: (id) => `/messages/threads/${id}/`,
    MESSAGE_THREAD_MARK_READ: (id) => `/messages/threads/${id}/mark_read/`,
    MESSAGE_SEND: '/messages/send/'
  }
};

export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  ITEMS_PER_PAGE: 12,
  NOTIFICATION_POLL_INTERVAL: 15000, // 15 seconds
  MESSAGE_POLL_INTERVAL: 10000, // 10 seconds
  NOTIFICATION_RETRY_ATTEMPTS: 3,
  MESSAGE_RETRY_ATTEMPTS: 3,
  MAX_SEARCH_RESULTS: 100,
  SEARCH_DEBOUNCE_MS: 300,
  MAP_ZOOM_LEVEL: 13,
  MAP: {
    GOOGLE_MAPS_API_KEY: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || process.env.REACT_APP_MAP_API_KEY,
    DEFAULT_CENTER: { lat: 20.5937, lng: 78.9629 },
    DEFAULT_ZOOM: 5,
    CLUSTER_OPTIONS: { maxZoom: 15, gridSize: 60 },
    PLACES_OPTIONS: { componentRestrictions: { country: 'in' }, types: ['(cities)'] },
    VIEWPORT_PADDING: 0.02
  }
};

export default API_CONFIG;
