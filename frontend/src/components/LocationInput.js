import React, { useState, useCallback } from 'react';
import { MapPin, Crosshair, AlertCircle } from 'lucide-react';

/**
 * LocationInput Component
 * Allows users to input location manually or use current location via geolocation
 */
const LocationInput = ({ 
  onLocationChange, 
  placeholder = "Enter city, state or address...",
  className = "",
  initialValue = ""
}) => {
  const [location, setLocation] = useState(initialValue);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [isUsingGeolocation, setIsUsingGeolocation] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Handle manual location input
  const handleLocationChange = (e) => {
    const value = e.target.value;
    setLocation(value);
    
    // Reset coordinates when typing manually
    if (isUsingGeolocation) {
      setIsUsingGeolocation(false);
      setCoordinates({ lat: null, lng: null });
      setGeolocationError(null);
    }

    // Notify parent component
    onLocationChange?.({
      address: value,
      lat: null,
      lng: null,
      source: 'manual'
    });
  };

  // Get current location using geolocation API
  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);
    setGeolocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Reverse geocode to get address
          const address = await reverseGeocode(latitude, longitude);
          
          setCoordinates({ lat: latitude, lng: longitude });
          setLocation(address);
          setIsUsingGeolocation(true);
          setIsLoadingLocation(false);

          // Notify parent component
          onLocationChange?.({
            address,
            lat: latitude,
            lng: longitude,
            source: 'geolocation'
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          
          // Still use coordinates even if reverse geocoding fails
          setCoordinates({ lat: latitude, lng: longitude });
          setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          setIsUsingGeolocation(true);
          setIsLoadingLocation(false);

          onLocationChange?.({
            address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
            lat: latitude,
            lng: longitude,
            source: 'geolocation'
          });
        }
      },
      (error) => {
        setIsLoadingLocation(false);
        
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred while retrieving location';
            break;
        }
        
        setGeolocationError(errorMessage);
        console.error('Geolocation error:', error);
      },
      options
    );
  }, [onLocationChange]);

  // Simple reverse geocoding using a free service (in production, use a proper service)
  const reverseGeocode = async (lat, lng) => {
    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free but rate limited)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CommunityConnect/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Geocoding service unavailable');
      }
      
      const data = await response.json();
      
      if (data && data.display_name) {
        // Extract city and state from the response
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.hamlet;
        const state = address.state;
        
        if (city && state) {
          return `${city}, ${state}`;
        }
        
        // Fallback to display name but try to shorten it
        return data.display_name.split(',').slice(0, 3).join(',');
      }
      
      throw new Error('No address found');
    } catch (error) {
      console.warn('Reverse geocoding failed, using coordinates:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  // Clear location
  const handleClear = () => {
    setLocation('');
    setCoordinates({ lat: null, lng: null });
    setIsUsingGeolocation(false);
    setGeolocationError(null);
    
    onLocationChange?.({
      address: '',
      lat: null,
      lng: null,
      source: 'manual'
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className={`w-5 h-5 ${isUsingGeolocation ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        
        <input
          type="text"
          value={location}
          onChange={handleLocationChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Location input"
        />
        
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {location && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              aria-label="Clear location"
            >
              <span className="sr-only">Clear</span>
              ×
            </button>
          )}
          
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLoadingLocation}
            className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Use current location"
            title="Use current location"
          >
            {isLoadingLocation ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            ) : (
              <Crosshair className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Status indicators */}
      {isUsingGeolocation && coordinates.lat && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <MapPin className="w-4 h-4" />
          <span>Using your current location</span>
          <span className="text-xs text-gray-500">
            ({coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)})
          </span>
        </div>
      )}

      {geolocationError && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4" />
          <span>{geolocationError}</span>
        </div>
      )}

      {/* Helper text */}
      <div className="text-xs text-gray-500">
        Enter an address or city, or click the crosshair icon to use your current location
      </div>
    </div>
  );
};

export default LocationInput;