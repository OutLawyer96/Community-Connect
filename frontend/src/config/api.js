// API Configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api',
  TIMEOUT: process.env.REACT_APP_API_TIMEOUT || 10000,
  ENDPOINTS: {
    // Authentication
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    DASHBOARD: '/auth/dashboard/',
    
    // Providers
    PROVIDERS: '/providers/',
    PROVIDER_CREATE: '/providers/create/',
    PROVIDER_DETAIL: (id) => `/providers/${id}/`,
    PROVIDER_UPDATE: (id) => `/providers/${id}/update/`,
    PROVIDER_REVIEWS: (id) => `/providers/${id}/reviews/`,
    PROVIDER_REVIEW_CREATE: (id) => `/providers/${id}/reviews/create/`,
    
    // Categories
    CATEGORIES: '/categories/',
    
    // Search
    SEARCH: '/search/',
    
    // Claims
    CLAIMS: '/claims/',
    CLAIM_DETAIL: (id) => `/claims/${id}/`,
    CLAIM_VERIFY_EMAIL: (id) => `/claims/${id}/verify-email/`,
    CLAIM_APPROVE: (id) => `/claims/${id}/approve/`,
    CLAIM_REJECT: (id) => `/claims/${id}/reject/`,
    UNCLAIMED_PROVIDERS: '/unclaimed-providers/',
  }
};

// App Configuration
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_NAME || 'Community Connect',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  
  // Pagination
  DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 12,
  MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE) || 100,
  
  // Map Configuration
  MAP: {
    DEFAULT_CENTER: {
      lat: parseFloat(process.env.REACT_APP_DEFAULT_LAT) || 28.6139, // New Delhi
      lng: parseFloat(process.env.REACT_APP_DEFAULT_LNG) || 77.2090
    },
    DEFAULT_ZOOM: parseInt(process.env.REACT_APP_DEFAULT_ZOOM) || 10,
    TILE_URL: process.env.REACT_APP_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  },
  
  // UI Configuration
  THEME: {
    PRIMARY_COLOR: process.env.REACT_APP_PRIMARY_COLOR || '#0ea5e9',
    SECONDARY_COLOR: process.env.REACT_APP_SECONDARY_COLOR || '#d946ef'
  },
  
  // Features Toggle
  FEATURES: {
    MAP_ENABLED: process.env.REACT_APP_ENABLE_MAP !== 'false',
    REVIEWS_ENABLED: process.env.REACT_APP_ENABLE_REVIEWS !== 'false',
    SEARCH_ENABLED: process.env.REACT_APP_ENABLE_SEARCH !== 'false'
  }
};

export default API_CONFIG;