import React, { useState, useEffect } from "react";
import {
  GoogleMap,
  MarkerF,
  InfoWindowF,
  MarkerClusterer,
} from "@react-google-maps/api";
import { APP_CONFIG } from "../config/api";
import { getProviderAddress } from "../utils/mapUtils";
import { useGoogleMaps } from "../hooks/useGoogleMaps";
import GoogleMapsLoader from "./GoogleMapsLoader";

const ProvidersMap = ({
  providers = [],
  onBoundsChanged,
  onPlaceSelected,
  className = "w-full h-96 rounded-lg overflow-hidden shadow-lg border border-gray-200",
}) => {
  const [selectedProvider, setSelectedProvider] = useState(null);

  const { map, onMapLoad, onMapUnmount, handleBoundsChanged, fitBounds } =
    useGoogleMaps({ onBoundsChanged, onPlaceSelected });

  // Map container style
  const mapContainerStyle = {
    width: "100%",
    height: "100%",
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
        featureType: "poi",
        elementType: "labels",
        stylers: [{ visibility: "off" }],
      },
    ],
  };

  // Filter providers with valid coordinates
  const validProviders = providers
    .map((provider) => ({
      ...provider,
      address: getProviderAddress(provider),
    }))
    .filter(
      (provider) =>
        provider.address && provider.address.lat && provider.address.lng
    );

  // Effect to fit map bounds to show all providers when the list changes
  useEffect(() => {
    if (map && validProviders.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      validProviders.forEach((p) => {
        bounds.extend({ lat: p.address.lat, lng: p.address.lng });
      });
      map.fitBounds(bounds);

      // Prevent zooming in too far for a single marker
      if (validProviders.length === 1) {
        const listener = window.google.maps.event.addListenerOnce(
          map,
          "idle",
          () => {
            if (map.getZoom() > 15) map.setZoom(15);
          }
        );
        return () => window.google.maps.event.removeListener(listener);
      }
    }
  }, [map, validProviders]); // Re-run when map or providers change

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
                  position={provider.address}
                  clusterer={clusterer}
                  onClick={() => handleMarkerClick(provider)}
                  title={provider.business_name}
                />
              ))
            }
          </MarkerClusterer>

          {selectedProvider && (
            <InfoWindowF
              position={selectedProvider.address}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-lg text-gray-800 mb-2">
                  {selectedProvider.business_name}
                </h3>
                <div className="space-y-1 text-sm">
                  {/* Your InfoWindow content here */}
                </div>
              </div>
            </InfoWindowF>
          )}
        </GoogleMap>

        {validProviders.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75 z-10">
            <p className="text-gray-600">
              No providers with location data found
            </p>
          </div>
        )}
      </div>
    </GoogleMapsLoader>
  );
};

export default ProvidersMap;
