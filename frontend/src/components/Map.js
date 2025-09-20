import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { APP_CONFIG } from '../config/api';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ProvidersMap = ({ providers = [] }) => {
  const [mapCenter] = useState([APP_CONFIG.MAP.DEFAULT_CENTER.lat, APP_CONFIG.MAP.DEFAULT_CENTER.lng]);
  const [mapZoom] = useState(APP_CONFIG.MAP.DEFAULT_ZOOM);

  // Custom marker icon for providers
  const providerIcon = new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Filter providers with valid coordinates
  const validProviders = providers.filter(provider => 
    provider.addresses && 
    provider.addresses.length > 0 &&
    provider.addresses[0].latitude &&
    provider.addresses[0].longitude
  );

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url={APP_CONFIG.MAP.TILE_URL}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {validProviders.map((provider, index) => {
          const address = provider.addresses[0];
          return (
            <Marker
              key={`provider-${provider.id || index}`}
              position={[parseFloat(address.latitude), parseFloat(address.longitude)]}
              icon={providerIcon}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">
                    {provider.business_name}
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p className="text-gray-600">
                      <span className="font-medium">Service:</span> {provider.category?.name || 'General Services'}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Location:</span> {address.city}, {address.state}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Contact:</span> {provider.phone}
                    </p>
                    {provider.rating && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-600">Rating:</span>
                        <div className="ml-2 flex items-center">
                          <span className="text-yellow-500">★</span>
                          <span className="ml-1 text-gray-700">{provider.rating}</span>
                        </div>
                      </div>
                    )}
                    {provider.description && (
                      <p className="text-gray-600 mt-2 text-xs leading-relaxed">
                        {provider.description.substring(0, 100)}
                        {provider.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {validProviders.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-75">
          <p className="text-gray-600">No providers with location data found</p>
        </div>
      )}
    </div>
  );
};

export default ProvidersMap;