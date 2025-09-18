import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, MapPin, Star, Clock, DollarSign, Grid, List, Map } from 'lucide-react';
import apiClient from '../config/axios';
import API_CONFIG, { APP_CONFIG } from '../config/api';
import ProvidersMap from '../components/Map';
import SearchFilters from '../components/SearchFilters';
import Pagination from '../components/Pagination';

function Providers() {
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'map'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    city: '',
    min_rating: ''
  });

  useEffect(() => {
    fetchProviders();
    fetchCategories();
  }, [filters, currentPage]);

  const fetchProviders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', currentPage);
      params.append('page_size', APP_CONFIG.DEFAULT_PAGE_SIZE);
      
      const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.PROVIDERS}?${params}`);
      const data = response.data;
      
      setProviders(data.results || data || []);
      setTotalPages(Math.ceil((data.count || data.length || 0) / APP_CONFIG.DEFAULT_PAGE_SIZE));
      setTotalItems(data.count || data.length || 0);
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CATEGORIES);
      setCategories(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([]); // Set empty array as fallback
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      city: '',
      min_rating: ''
    });
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
            </div>
          )}
          
          <div className="flex items-center text-gray-600 text-sm">
            <Clock className="w-4 h-4 mr-2" />
            {provider.review_count} reviews
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            to={`/providers/${provider.user}`}
            className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all transform hover:scale-105"
          >
            View Details
          </Link>
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
              </div>
            )}
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {provider.review_count} reviews
            </div>
          </div>
        </div>
        
        <Link
          to={`/providers/${provider.user}`}
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
          
          {/* Filters */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              
              <select
                value={filters.min_rating}
                onChange={(e) => handleFilterChange('min_rating', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
              >
                <Filter className="w-4 h-4 mr-1" />
                Clear Filters
              </button>
              
              <div className="flex items-center space-x-2">
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
                      <ProvidersMap providers={providers} />
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Providers;