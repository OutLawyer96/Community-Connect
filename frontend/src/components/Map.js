import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useSpring, animated } from '@react-spring/web';
import { APP_CONFIG } from '../config/api';
import { getProviderAddress } from '../utils/mapUtils';
import { useGoogleMaps } from '../hooks/useGoogleMaps';
import GoogleMapsLoader from './GoogleMapsLoader';
import { useScale } from '../utils/animations';

const ProvidersMap = ({ 
  providers = [], 
  onBoundsChanged,
  onPlaceSelected,
  className = "w-full h-96 rounded-lg overflow-hidden shadow-lg border border-gray-200"
}) => {
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [clusterer, setClusterer] = useState(null);

  const {
    map,
    onMapLoad,
    onMapUnmount,
    handleBoundsChanged,
    fitBounds
  } = useGoogleMaps({ onBoundsChanged, onPlaceSelected });

  // Map container style
  const mapContainerStyle = {
    width: '100%',
    height: '100%'
  };

  // Map options
  const mapOptions = {
    zoom: APP_CONFIG.MAP.DEFAULT_ZOOM,
    center: APP_CONFIG.MAP.DEFAULT_CENTER,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };

  // Filter providers with valid coordinates and standardize address format
  const validProviders = providers
    .map(provider => ({
      ...provider,
      address: getProviderAddress(provider)
    }))
    .filter(provider => provider.address);

  // Initialize marker clusterer
  const initializeClusterer = useCallback(() => {
    if (map && validProviders.length > 0) {
      const newClusterer = new MarkerClusterer({
        map,
        markers: [],
        ...APP_CONFIG.MAP.CLUSTER_OPTIONS
      });
      setClusterer(newClusterer);
    }
  }, [map, validProviders.length]);

  // Effect to initialize clusterer when map loads
  useEffect(() => {
    initializeClusterer();
    return () => {
      if (clusterer) {
        clusterer.clearMarkers();
      }
    };
  }, [initializeClusterer]);

  // Effect to fit map bounds to show all providers
  useEffect(() => {
    if (validProviders.length > 1) {
      fitBounds(validProviders.map(p => ({ lat: p.address.lat, lng: p.address.lng })));
    }
  }, [validProviders, fitBounds]);

  // Handle marker click
  const handleMarkerClick = (provider) => {
    setSelectedProvider(provider);
  };

  // Handle info window close
  const handleInfoWindowClose = () => {
    setSelectedProvider(null);
  };

  return (
    <GoogleMapsLoader>
      <div className={className}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          options={mapOptions}
          onLoad={onMapLoad}
          onUnmount={onMapUnmount}
          onBoundsChanged={handleBoundsChanged}
        >
          <MarkerClusterer options={APP_CONFIG.MAP.CLUSTER_OPTIONS}>
            {(clusterer) =>
              validProviders.map((provider) => (
                <MarkerF
                  key={`provider-${provider.id}`}
                  position={{ lat: provider.address.lat, lng: provider.address.lng }}
                  clusterer={clusterer}
                  onClick={() => handleMarkerClick(provider)}
                  title={provider.business_name}
                />
              ))
            }
          </MarkerClusterer>

          {selectedProvider && (
            <InfoWindowF
              position={{ 
                lat: selectedProvider.address.lat, 
                lng: selectedProvider.address.lng 
              }}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {selectedProvider.business_name}
                </h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Service:</span> {selectedProvider.category?.name || 'General Services'}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Location:</span> {selectedProvider.address.city}, {selectedProvider.address.state}
                  </p>
                  <p className="text-gray-600">
                    <span className="font-medium">Contact:</span> {selectedProvider.phone}
                  </p>
                  {(selectedProvider.average_rating || selectedProvider.rating) && (
                    <div className="flex items-center">
                      <span className="font-medium text-gray-600">Rating:</span>
                      <div className="ml-2 flex items-center">
                        <span className="text-yellow-500">★</span>
                        <span className="ml-1 text-gray-700">
                          {selectedProvider.average_rating || selectedProvider.rating}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedProvider.description && (
                    <p className="text-gray-600 mt-2 text-xs leading-relaxed">
                      {selectedProvider.description.substring(0, 100)}
                      {selectedProvider.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200">
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>
        
        {validProviders.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
            <p className="text-gray-600">No providers with location data found</p>
          </div>
        )}
      </div>
    </GoogleMapsLoader>
  );
};

export default ProvidersMap;