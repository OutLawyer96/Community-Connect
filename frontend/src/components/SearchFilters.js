import React, { useState, useCallback, useEffect } from 'react';
import { Search, Filter, MapPin, Star, X, Calendar, Clock, SortAsc } from 'lucide-react';
import AutocompleteSearch from './AutocompleteSearch';
import LocationInput from './LocationInput';
import PriceRangeSlider from './PriceRangeSlider';

function SearchFilters({ onSearch, onFilter, categories = [] }) {
  const [filters, setFilters] = useState({
    search: '',
    lat: null,
    lng: null,
    location: '',
    category: '',
    min_rating: '',
    status: '',
    min_price: null,
    max_price: null,
    radius: 25,
    available_at: '',
    available_today: false,
    verified_only: false,
    ordering: ''
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);

  // Debounce function for search
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchFilters) => {
      onSearch(searchFilters);
    }, 300),
    [onSearch]
  );

  // Update filters and trigger search
  const updateFilters = useCallback((newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // Clean up null/empty values before sending
    const cleanFilters = Object.entries(updatedFilters).reduce((acc, [key, value]) => {
      if (value !== null && value !== '' && value !== false) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    debouncedSearch(cleanFilters);
  }, [filters, debouncedSearch]);

  // Handle autocomplete selection
  const handleAutocompleteSelect = (item) => {
    const updates = { search: item.name };
    
    // If it's a location, also set location data
    if (item.type === 'location') {
      updates.location = item.name;
      // Could also set lat/lng if available from the suggestion
    }
    
    // If it's a category, set the category filter
    if (item.type === 'category') {
      updates.category = item.id;
    }
    
    updateFilters(updates);
  };

  // Handle location change
  const handleLocationChange = (locationData) => {
    updateFilters({
      location: locationData.address,
      lat: locationData.lat,
      lng: locationData.lng
    });
  };

  // Handle price range change
  const handlePriceRangeChange = (priceRange) => {
    updateFilters({
      min_price: priceRange.min > 0 ? priceRange.min : null,
      max_price: priceRange.max < 1000 ? priceRange.max : null
    });
  };

  // Handle availability datetime change
  const handleAvailabilityChange = (e) => {
    const value = e.target.value;
    updateFilters({
      available_at: value,
      available_today: false // Clear available_today when setting specific time
    });
  };

  // Handle available today toggle
  const handleAvailableTodayChange = (e) => {
    const checked = e.target.checked;
    updateFilters({
      available_today: checked,
      available_at: checked ? '' : filters.available_at // Clear specific time when using today
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      lat: null,
      lng: null,
      location: '',
      category: '',
      min_rating: '',
      status: '',
      min_price: null,
      max_price: null,
      radius: 25,
      available_at: '',
      available_today: false,
      verified_only: false,
      ordering: ''
    };
    setFilters(clearedFilters);
    onSearch({});
  };

  // Sorting options
  const sortingOptions = [
    { value: '', label: 'Best Match' },
    { value: 'distance', label: 'Nearest First' },
    { value: '-distance', label: 'Farthest First' },
    { value: '-rating', label: 'Highest Rated' },
    { value: 'rating', label: 'Lowest Rated' },
    { value: 'price', label: 'Lowest Price' },
    { value: '-price', label: 'Highest Price' },
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'name', label: 'A-Z' },
    { value: '-name', label: 'Z-A' }
  ];

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => 
    value !== null && value !== '' && value !== false
  ).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      {/* Main Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="flex-1">
          <AutocompleteSearch
            onSelect={handleAutocompleteSelect}
            placeholder="Search for services, providers, or categories..."
            className="w-full"
          />
        </div>
        
        <div className="lg:w-80">
          <LocationInput
            onLocationChange={handleLocationChange}
            placeholder="Enter location or use current location"
            initialValue={filters.location}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg flex items-center gap-2 transition-colors relative ${
              showFilters 
                ? 'bg-primary-50 border-primary-200 text-primary-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-5 h-5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="border-t pt-6 mt-4 space-y-6">
          {/* First row: Category, Rating, Status, Sorting */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Rating</label>
              <select
                value={filters.min_rating}
                onChange={(e) => updateFilters({ min_rating: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
                <option value="1">1+ Stars</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Status</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilters({ status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Businesses</option>
                <option value="claimed">Claimed</option>
                <option value="unclaimed">Available to Claim</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <SortAsc className="w-4 h-4 inline mr-1" />
                Sort By
              </label>
              <select
                value={filters.ordering}
                onChange={(e) => updateFilters({ ordering: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {sortingOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Second row: Price Range and Distance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PriceRangeSlider
                onRangeChange={handlePriceRangeChange}
                min={0}
                max={1000}
                step={10}
                initialMin={filters.min_price || 0}
                initialMax={filters.max_price || 1000}
              />
            </div>

            {(filters.lat && filters.lng) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Search Radius
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    value={filters.radius}
                    onChange={(e) => updateFilters({ radius: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>1 mile</span>
                    <span className="font-medium">{filters.radius} miles</span>
                    <span>50 miles</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Third row: Availability and Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Availability
                </label>
                <button
                  onClick={() => setShowAvailability(!showAvailability)}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  {showAvailability ? 'Hide' : 'Show'} Options
                </button>
              </div>
              
              {showAvailability && (
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.available_today}
                      onChange={handleAvailableTodayChange}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Available today</span>
                  </label>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Or select specific date & time:
                    </label>
                    <input
                      type="datetime-local"
                      value={filters.available_at}
                      onChange={handleAvailabilityChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Options</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.verified_only}
                    onChange={(e) => updateFilters({ verified_only: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Verified providers only</span>
                </label>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div className="flex justify-end">
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear All Filters
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {filters.search && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Search: {filters.search}
            </span>
          )}
          {filters.location && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Location: {filters.location}
            </span>
          )}
          {filters.category && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Category: {categories.find(c => c.id === parseInt(filters.category))?.name}
            </span>
          )}
          {filters.min_rating && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              {filters.min_rating}+ Rating
            </span>
          )}
          {(filters.min_price || filters.max_price) && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
              Price: ${filters.min_price || 0} - ${filters.max_price || '1000+'}
            </span>
          )}
          {filters.verified_only && (
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              Verified Only
            </span>
          )}
          {filters.available_today && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Available Today
            </span>
          )}
          {filters.available_at && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              Available: {new Date(filters.available_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchFilters;