import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { User, Star, Heart, FileText, BarChart3, TrendingUp } from 'lucide-react';
import { getMyClaims } from '../services/claimsService';
import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

function Dashboard() {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setClaimsLoading(true);
        
        // Fetch dashboard data
        const dashboardResponse = await apiClient.get(API_CONFIG.ENDPOINTS.DASHBOARD);
        setDashboardData(dashboardResponse.data);
        
        // Fetch claims data
        const claimsData = await getMyClaims({ page_size: 5 });
        setClaims(claimsData.results || claimsData || []);
      } catch (e) {
        setClaimsError('Failed to load dashboard data');
        console.error('Dashboard error:', e);
      } finally {
        setLoading(false);
        setClaimsLoading(false);
      }
    };
    
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {currentUser?.first_name || currentUser?.username}!
          </h1>
          <p className="text-gray-600 mt-2">
            {currentUser?.role === 'provider' 
              ? 'Manage your business profile and services' 
              : 'Discover services and manage your reviews'
            }
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600">Manage your account</p>
              </div>
            </div>
            <Link 
              to="/profile"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-center"
            >
              Edit Profile
            </Link>
          </div>

          {/* Reviews Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-warning-400 to-orange-400 rounded-full flex items-center justify-center mr-4">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reviews</h3>
                <p className="text-sm text-gray-600">Your reviews & ratings</p>
              </div>
            </div>
            {dashboardData && (
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">{dashboardData.reviews_count}</div>
                <div className="text-sm text-gray-600">total reviews</div>
              </div>
            )}
            <Link 
              to="/my-reviews"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-center"
            >
              View Reviews
            </Link>
          </div>

          {/* Favorites Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-red-400 to-pink-400 rounded-full flex items-center justify-center mr-4">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Favorites</h3>
                <p className="text-sm text-gray-600">Saved providers</p>
              </div>
            </div>
            {dashboardData && (
              <div className="mb-4">
                <div className="text-2xl font-bold text-gray-900">{dashboardData.favorites_count}</div>
                <div className="text-sm text-gray-600">saved providers</div>
              </div>
            )}
            <Link 
              to="/favorites"
              className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-center"
            >
              View Favorites
            </Link>
          </div>

          {/* My Claims Card */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">My Claims</h3>
                <p className="text-sm text-gray-600">Recent claim activity</p>
              </div>
            </div>
            {claimsLoading ? (
              <div className="text-gray-500 text-sm">Loading claims…</div>
            ) : claimsError ? (
              <div className="text-red-600 text-sm">{claimsError}</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900 mb-2">{claims.length}</div>
                <div className="text-sm text-gray-600 mb-4">recent {claims.length === 1 ? 'claim' : 'claims'}</div>
                <div className="flex gap-2">
                  <Link to="/my-claims" className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-center transition-colors">
                    View Claims
                  </Link>
                  <Link to="/claim-business" className="flex-1 bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 px-4 rounded-lg text-center hover:shadow-lg transition-all">
                    Claim Business
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        {dashboardData && (dashboardData.recent_reviews?.length > 0 || dashboardData.recent_favorites?.length > 0) && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Reviews */}
              {dashboardData.recent_reviews?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reviews</h3>
                  <div className="space-y-3">
                    {dashboardData.recent_reviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{review.provider_name}</p>
                          <p className="text-sm text-gray-600 truncate">{review.comment}</p>
                          <p className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/my-reviews" className="block mt-4 text-sm text-primary-600 hover:text-primary-500">
                    View all reviews →
                  </Link>
                </div>
              )}

              {/* Recent Favorites */}
              {dashboardData.recent_favorites?.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Favorites</h3>
                  <div className="space-y-3">
                    {dashboardData.recent_favorites.slice(0, 3).map((favorite) => (
                      <div key={favorite.id} className="flex items-center space-x-3">
                        <Heart className="w-4 h-4 text-red-500 fill-current flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{favorite.provider_name}</p>
                          <p className="text-xs text-gray-500">{new Date(favorite.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link to="/favorites" className="block mt-4 text-sm text-primary-600 hover:text-primary-500">
                    View all favorites →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {currentUser?.role === 'provider' && dashboardData?.provider_analytics && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Provider Analytics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {/* Total Reviews */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Star className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Reviews</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.provider_analytics.total_reviews}</p>
                  </div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                    <TrendingUp className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardData.provider_analytics.average_rating || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Services */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Services</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.provider_analytics.total_services}</p>
                  </div>
                </div>
              </div>

              {/* Total Favorites */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                    <Heart className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Favorites</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.provider_analytics.total_favorites}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Profile</h3>
                <p className="text-gray-600 mb-4">
                  Update your business information, services, and contact details.
                </p>
                <Link to="/providers" className="inline-flex items-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                  Manage Profile
                </Link>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Analytics</h3>
                <p className="text-gray-600 mb-4">
                  View comprehensive analytics and performance metrics.
                </p>
                <Link 
                  to="/provider-analytics" 
                  className="inline-flex items-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;