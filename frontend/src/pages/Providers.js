import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Clock, Grid, List, Map, DollarSign } from 'lucide-react';
import apiClient from '../config/axios';
import API_CONFIG, { APP_CONFIG } from '../config/api';
import ProvidersMap from '../components/Map';
import SearchFilters from '../components/SearchFilters';
import { ProviderClaimStatus } from '../components/claims/ClaimStatusBadge';

function Providers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'map'
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    city: searchParams.get('city') || '',
    min_rating: searchParams.get('min_rating') || '',
    status: searchParams.get('status') || '',
    lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
    lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null,
    radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')) : null,
    min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')) : null,
    max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')) : null,
    available_at: searchParams.get('available_at') || '',
    available_today: searchParams.get('available_today') === 'true',
    verified_only: searchParams.get('verified_only') === 'true',
    ordering: searchParams.get('ordering') || '',
  }));
  const abortRef = useRef(null);

  const fetchProviders = React.useCallback(async () => {
    try {
      setLoading(true);
      // cancel any in-flight request
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        
        if (key === 'status') {
          if (value === 'claimed') params.append('is_claimed', 'true');
          else if (value === 'unclaimed') params.append('is_claimed', 'false');
        } else if (key === 'radius') {
          // Only send radius if both lat and lng exist
          if (filters.lat && filters.lng) {
            // Radius is already in kilometers from map bounds
            params.append('radius', value);
          }
        } else if (key === 'available_today' || key === 'verified_only') {
          if (value === true) params.append(key, 'true');
        } else {
          params.append(key, value);
        }
      });
      
      params.append('page', currentPage);
      params.append('page_size', APP_CONFIG.DEFAULT_PAGE_SIZE);
      
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.PROVIDERS}?${params}`, { signal: controller.signal });
      const data = response.data;
      
      setProviders(data.results || data || []);
      setTotalPages(data.total_pages || 1);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Error fetching providers:', error);
      setProviders([]); // Set empty array as fallback
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  const fetchCategories = React.useCallback(async () => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CATEGORIES);
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array as fallback
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // React to URL parameter changes for back/forward navigation
  useEffect(() => {
    const incoming = {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      city: searchParams.get('city') || '',
      min_rating: searchParams.get('min_rating') || '',
      status: searchParams.get('status') || '',
      lat: searchParams.get('lat') ? parseFloat(searchParams.get('lat')) : null,
      lng: searchParams.get('lng') ? parseFloat(searchParams.get('lng')) : null,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')) : null,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')) : null,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')) : null,
      available_at: searchParams.get('available_at') || '',
      available_today: searchParams.get('available_today') === 'true',
      verified_only: searchParams.get('verified_only') === 'true',
      ordering: searchParams.get('ordering') || '',
    };
    setFilters(prev => {
      const changed = Object.keys(incoming).some(k => prev[k] !== incoming[k]);
      return changed ? { ...prev, ...incoming } : prev;
    });
  }, [searchParams]);

  // Fetch providers whenever filters change
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Keep URL in sync with filters for bookmarkable results
  useEffect(() => {
    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '' && v !== false) {
        params[k] = v;
      }
    });
    setSearchParams(params); // push into history
  }, [filters, setSearchParams]);

  const handleSearchFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      min_rating: '',
      status: '',
      lat: null,
      lng: null,
      radius: null,
      min_price: null,
      max_price: null,
      available_at: '',
      available_today: false,
      verified_only: false,
      ordering: '',
    });
  };

  // Handle map bounds changes for viewport-based provider loading
  const handleBoundsChanged = (locationData) => {
    if (!locationData) return;
    
    setFilters(prev => ({
      ...prev,
      lat: locationData.lat,
      lng: locationData.lng,
      radius: locationData.radiusKm
    }));
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const ProviderCard = ({ provider }) => (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all card-hover border border-gray-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {provider.business_name}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {provider.description || 'Professional service provider'}
            </p>
          </div>
          <div className="flex items-center ml-4">
            <ProviderClaimStatus provider={provider} compact />
            {provider.average_rating ? (
              <div className="flex items-center bg-warning-50 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-warning-500 fill-current mr-1" />
                <span className="text-sm font-medium text-warning-700">
                  {provider.average_rating}
                </span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">No ratings yet</span>
            )}
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {provider.primary_address && (
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-2" />
              {provider.primary_address.city}, {provider.primary_address.state}
              {provider.distance != null && provider.distance !== 999999 && (
                <span className="ml-2 text-primary-600 font-medium">
                  ({provider.distance.toFixed(1)} km away)
                </span>
              )}
            </div>
          )}
          
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            {provider.review_count} reviews
          </div>

          {/* Price Range Display */}
          {(provider.min_service_price != null || provider.max_service_price != null) && (
            <div className="flex items-center text-gray-600 text-sm">
              <DollarSign className="w-4 h-4 mr-2" />
              <span>
                {provider.min_service_price && provider.max_service_price ? (
                  provider.min_service_price === provider.max_service_price ? (
                    `$${provider.min_service_price}`
                  ) : (
                    `$${provider.min_service_price} - $${provider.max_service_price}`
                  )
                ) : provider.min_service_price ? (
                  `From $${provider.min_service_price}`
                ) : (
                  `Up to $${provider.max_service_price}`
                )}
                {provider.avg_service_price && (
                  <span className="text-gray-500 ml-1">
                    (avg: ${provider.avg_service_price.toFixed(0)})
                  </span>
                )}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Link
            to={`/providers/${provider.id}`}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all transform hover:scale-105"
          >
            View Details
          </Link>
          {!provider.is_claimed && (
            <button
              onClick={() => navigate(`/claim-business/${provider.id}`, { state: { provider } })}
              className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg text-sm"
            >
              Claim
            </button>
          )}
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const ProviderListItem = ({ provider }) => (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {provider.business_name}
            </h3>
            {provider.average_rating && (
              <div className="flex items-center bg-warning-50 px-2 py-1 rounded-lg ml-4">
                <Star className="w-4 h-4 text-warning-500 fill-current mr-1" />
                <span className="text-sm font-medium text-warning-700">
                  {provider.average_rating}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-gray-600 mb-3">
            {provider.description || 'Professional service provider'}
          </p>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {provider.primary_address && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {provider.primary_address.city}, {provider.primary_address.state}
                {provider.distance != null && provider.distance !== 999999 && (
                  <span className="ml-2 text-primary-600 font-medium">
                    ({provider.distance.toFixed(1)} km away)
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {provider.review_count} reviews
            </div>
            {/* Price Range Display */}
            {(provider.min_service_price != null || provider.max_service_price != null) && (
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>
                  {provider.min_service_price && provider.max_service_price ? (
                    provider.min_service_price === provider.max_service_price ? (
                      `$${provider.min_service_price}`
                    ) : (
                      `$${provider.min_service_price} - $${provider.max_service_price}`
                    )
                  ) : provider.min_service_price ? (
                    `From $${provider.min_service_price}`
                  ) : (
                    `Up to $${provider.max_service_price}`
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <Link
          to={`/providers/${provider.id}`}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg font-medium hover:shadow-lg transition-all transform hover:scale-105"
        >
          View Details
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Find Service Providers
          </h1>
          
          {/* Advanced Search Filters - Temporarily disabled */}
          {/* <SearchFilters 
            categories={categories}
            onSearch={handleSearchFilters}
          /> */}
          
          {/* Temporary Basic Filters */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {(categories || []).map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <input
                type="text"
                placeholder="City"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* View Mode Controls */}
          <div className="flex items-center justify-end space-x-2 mt-4">
            <span className="text-sm text-gray-600">View:</span>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg ${viewMode === 'map' ? 'bg-primary-100 text-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Map className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading providers...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {providers.length} providers found
              </p>
            </div>

            {providers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No providers found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or filters
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'map' ? (
                  <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Service Providers in India
                      </h3>
                      <ProvidersMap 
                        providers={providers} 
                        onBoundsChanged={handleBoundsChanged}
                      />
                    </div>
                    
                    {/* Provider count below map */}
                    <div className="text-center py-4">
                      <p className="text-gray-600">
                        Showing {providers.length} provider{providers.length !== 1 ? 's' : ''} on the map
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className={
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "space-y-4"
                  }>
                    {(providers || []).map((provider, index) => (
                      viewMode === 'grid' ? (
                        <ProviderCard key={index} provider={provider} />
                      ) : (
                        <ProviderListItem key={index} provider={provider} />
                      )
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center mt-8">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-4 py-2 mx-1">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 mx-1 bg-white border border-gray-300 rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Providers;
