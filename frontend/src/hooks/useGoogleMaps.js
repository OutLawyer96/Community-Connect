import { useState, useCallback, useRef } from 'react';
import { extractLocationFromBounds, debounce } from '../utils/mapUtils';

/**
 * Custom hook for Google Maps functionality
 * Provides map state management and event handlers
 */
export const useGoogleMaps = ({ onBoundsChanged, onPlaceSelected } = {}) => {
  const [map, setMap] = useState(null);
  const [bounds, setBounds] = useState(null);
  const [center, setCenter] = useState(null);
  const [zoom, setZoom] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  const boundsChangedTimeoutRef = useRef(null);

  // Debounced bounds change handler
  const debouncedBoundsChange = useCallback(
    debounce((newBounds) => {
      if (onBoundsChanged && newBounds) {
        const locationData = extractLocationFromBounds(newBounds);
        if (locationData) {
          onBoundsChanged(locationData);
        }
      }
    }, 500),
    [onBoundsChanged]
  );

  // Handle map load
  const onMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  // Handle map unmount
  const onMapUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Handle bounds change
  const handleBoundsChanged = useCallback(() => {
    if (map) {
      const newBounds = map.getBounds();
      setBounds(newBounds);
      
      // Clear existing timeout
      if (boundsChangedTimeoutRef.current) {
        clearTimeout(boundsChangedTimeoutRef.current);
      }
      
      // Set new timeout for debounced call
      boundsChangedTimeoutRef.current = setTimeout(() => {
        debouncedBoundsChange(newBounds);
      }, 500);
    }
  }, [map, debouncedBoundsChange]);

  // Handle center change
  const handleCenterChanged = useCallback(() => {
    if (map) {
      const newCenter = map.getCenter();
      setCenter(newCenter);
    }
  }, [map]);

  // Handle zoom change
  const handleZoomChanged = useCallback(() => {
    if (map) {
      const newZoom = map.getZoom();
      setZoom(newZoom);
    }
  }, [map]);

  // Handle place selection
  const handlePlaceSelected = useCallback((place) => {
    if (place && place.geometry && map) {
      const location = place.geometry.location;
      
      // Update map center
      map.panTo(location);
      map.setZoom(14);
      
      // Call callback if provided
      if (onPlaceSelected) {
        onPlaceSelected({
          place,
          location: {
            lat: location.lat(),
            lng: location.lng()
          },
          address: place.formatted_address
        });
      }
    }
  }, [map, onPlaceSelected]);

  // Fit bounds to markers
  const fitBounds = useCallback((markers) => {
    if (map && markers && markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      markers.forEach(marker => {
        if (marker.lat && marker.lng) {
          bounds.extend(new window.google.maps.LatLng(marker.lat, marker.lng));
        }
      });
      
      map.fitBounds(bounds);
    }
  }, [map]);

  // Pan to location
  const panToLocation = useCallback((lat, lng, zoom = 14) => {
    if (map) {
      const location = new window.google.maps.LatLng(lat, lng);
      map.panTo(location);
      map.setZoom(zoom);
    }
  }, [map]);

  return {
    map,
    bounds,
    center,
    zoom,
    isLoading,
    setIsLoading,
    onMapLoad,
    onMapUnmount,
    handleBoundsChanged,
    handleCenterChanged,
    handleZoomChanged,
    handlePlaceSelected,
    fitBounds,
    panToLocation
  };
};

/**
 * Custom hook for marker clustering
 */
export const useMarkerClusterer = (map, markers = [], options = {}) => {
  const [clusterer, setClusterer] = useState(null);

  // Initialize clusterer when map and markers are available
  const initializeClusterer = useCallback(async () => {
    if (map && window.google?.maps && markers.length > 0) {
      try {
        const { MarkerClusterer } = await import('@googlemaps/markerclusterer');
        
        const newClusterer = new MarkerClusterer({ 
          map, 
          markers: [],
          ...options 
        });
        
        setClusterer(newClusterer);
        return newClusterer;
      } catch (error) {
        console.error('Failed to initialize marker clusterer:', error);
      }
    }
    return null;
  }, [map, markers.length, options]);

  // Add markers to clusterer
  const addMarkers = useCallback((newMarkers) => {
    if (clusterer && newMarkers) {
      clusterer.addMarkers(newMarkers);
    }
  }, [clusterer]);

  // Clear all markers
  const clearMarkers = useCallback(() => {
    if (clusterer) {
      clusterer.clearMarkers();
    }
  }, [clusterer]);

  return {
    clusterer,
    initializeClusterer,
    addMarkers,
    clearMarkers
  };
};