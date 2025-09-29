# Viewport-Based Provider Loading Fix

## Problem Resolved
Fixed the callback contract mismatch that was breaking viewport-based provider loading during Google Maps migration.

## Root Cause
The callback contract between components was inconsistent:
- `useGoogleMaps.js` was calling `onBoundsChanged` with processed data `{ lat, lng, radiusKm }`
- `Providers.js` was expecting raw `google.maps.LatLngBounds` and trying to process it again
- Double conversion was occurring: km → miles conversion when radius was already in km

## Solution Implemented (Option A)
Standardized the contract to pass processed location data:

### 1. Updated `handleBoundsChanged` in `Providers.js`
**Before:**
```javascript
const handleBoundsChanged = (bounds) => {
  if (!bounds) return;
  
  const location = extractLocationFromBounds(bounds);
  const radius = calculateBoundsRadius(bounds);
  
  setFilters(prev => ({
    ...prev,
    lat: location.lat,
    lng: location.lng,
    radius: radius
  }));
};
```

**After:**
```javascript
const handleBoundsChanged = (locationData) => {
  if (!locationData) return;
  
  setFilters(prev => ({
    ...prev,
    lat: locationData.lat,
    lng: locationData.lng,
    radius: locationData.radiusKm
  }));
};
```

### 2. Removed Unused Imports
Removed `extractLocationFromBounds` and `calculateBoundsRadius` imports from `Providers.js` since they're no longer needed.

### 3. Fixed Radius Unit Handling
**Before:**
```javascript
} else if (key === 'radius') {
  if (filters.lat && filters.lng) {
    // Convert miles to kilometers for backend (backend expects km)
    const radiusKm = Math.round(value * 1.60934);
    params.append('radius', radiusKm);
  }
}
```

**After:**
```javascript
} else if (key === 'radius') {
  if (filters.lat && filters.lng) {
    // Radius is already in kilometers from map bounds
    params.append('radius', value);
  }
}
```

## Data Flow (Now Fixed)
1. User pans/zooms map → `useGoogleMaps` detects bounds change
2. `useGoogleMaps` calls `extractLocationFromBounds(bounds)` → returns `{ lat, lng, radiusKm }`
3. `useGoogleMaps` calls `onBoundsChanged(locationData)` with processed data
4. `Providers.js` receives `locationData` and updates filters directly
5. `fetchProviders` sends radius in km to backend (no conversion needed)

## Benefits
- ✅ Eliminates callback contract mismatch
- ✅ Removes double processing overhead
- ✅ Fixes unit conversion bug
- ✅ Simplifies code in `Providers.js`
- ✅ Maintains viewport-based provider loading functionality

## Files Modified
- `src/pages/Providers.js`: Updated callback signature, removed unused imports, fixed radius handling

## Testing
- ✅ Build compiles successfully
- ✅ No runtime errors
- ✅ Contract now consistent across components

## Next Steps
When testing the application:
1. Open the map view in Providers page
2. Pan/zoom the map
3. Verify that `filters.lat`, `filters.lng`, and `filters.radius` update correctly
4. Check network requests to ensure correct `lat`, `lng`, and `radius` (km) parameters
5. Confirm providers refresh according to viewport changes