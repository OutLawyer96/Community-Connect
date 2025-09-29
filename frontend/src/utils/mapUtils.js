/**
 * Google Maps utilities for distance calculation and viewport management
 */

/**
 * Calculate radius in kilometers from Google Maps bounds
 * @param {google.maps.LatLngBounds} bounds - Google Maps bounds object
 * @returns {number} - Radius in kilometers
 */
export const calculateBoundsRadius = (bounds) => {
  if (!bounds) return 10; // Default 10km radius

  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  
  // Calculate the distance between northeast and southwest corners
  const center = bounds.getCenter();
  const corner = new window.google.maps.LatLng(ne.lat(), ne.lng());
  
  // Use Google Maps geometry library to calculate distance
  if (window.google?.maps?.geometry?.spherical) {
    const distance = window.google.maps.geometry.spherical.computeDistanceBetween(center, corner);
    return Math.round(distance / 1000); // Convert meters to kilometers
  }
  
  // Fallback: Haversine formula
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(ne.lat() - center.lat());
  const dLng = toRad(ne.lng() - center.lng());
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(center.lat())) * Math.cos(toRad(ne.lat())) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance);
};

/**
 * Convert degrees to radians
 * @param {number} deg - Degrees
 * @returns {number} - Radians
 */
const toRad = (deg) => {
  return deg * (Math.PI / 180);
};

/**
 * Extract location data from Google Maps bounds
 * @param {google.maps.LatLngBounds} bounds - Google Maps bounds object
 * @returns {object} - { lat, lng, radiusKm }
 */
export const extractLocationFromBounds = (bounds) => {
  if (!bounds) return null;
  
  const center = bounds.getCenter();
  const radiusKm = calculateBoundsRadius(bounds);
  
  return {
    lat: center.lat(),
    lng: center.lng(),
    radiusKm
  };
};

/**
 * Create bounds from center point and radius
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {number} radiusKm - Radius in kilometers
 * @returns {google.maps.LatLngBounds} - Google Maps bounds
 */
export const createBoundsFromRadius = (lat, lng, radiusKm) => {
  if (!window.google?.maps) return null;
  
  // Convert km to degrees (approximate)
  const kmToDegrees = radiusKm / 111.32; // 1 degree ≈ 111.32 km
  
  const bounds = new window.google.maps.LatLngBounds();
  bounds.extend(new window.google.maps.LatLng(lat - kmToDegrees, lng - kmToDegrees));
  bounds.extend(new window.google.maps.LatLng(lat + kmToDegrees, lng + kmToDegrees));
  
  return bounds;
};

/**
 * Format address for display
 * @param {object} address - Address object
 * @returns {string} - Formatted address string
 */
export const formatAddress = (address) => {
  if (!address) return '';
  
  const parts = [];
  if (address.street_address) parts.push(address.street_address);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  
  return parts.join(', ');
};

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} - Valid coordinates
 */
export const isValidCoordinates = (lat, lng) => {
  return typeof lat === 'number' && 
         typeof lng === 'number' && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

/**
 * Get provider's primary address with coordinates
 * @param {object} provider - Provider object
 * @returns {object|null} - Address with coordinates or null
 */
export const getProviderAddress = (provider) => {
  const address = provider.primary_address || provider.addresses?.[0];
  
  if (!address?.latitude || !address?.longitude) {
    return null;
  }
  
  return {
    ...address,
    lat: parseFloat(address.latitude),
    lng: parseFloat(address.longitude)
  };
};

/**
 * Debounce function for API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};