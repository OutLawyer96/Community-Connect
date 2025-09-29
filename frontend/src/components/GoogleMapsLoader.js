import React from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { APP_CONFIG } from '../config/api';

const libraries = ['places', 'geometry'];

/**
 * Google Maps Loader Component
 * Provides a centralized way to load Google Maps API with required libraries
 */
const GoogleMapsLoader = ({ children, fallback = null }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: APP_CONFIG.MAP.GOOGLE_MAPS_API_KEY,
    libraries: libraries,
    version: 'weekly'
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-1">Maps Error</h3>
          <p className="text-sm text-red-600">
            Failed to load Google Maps. Please check your API key and network connection.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return fallback || (
      <div className="flex items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading Maps...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default GoogleMapsLoader;