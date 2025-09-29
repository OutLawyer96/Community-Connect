import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { BarChart3, TrendingUp, Star, Heart, Calendar, Users, Loader } from 'lucide-react';

function ProviderAnalytics() {
  const { currentUser } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual analyticsService.getProviderAnalytics() when created
      const response = await fetch(`/api/providers/${currentUser?.provider?.id}/analytics/`, {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-primary-500" />
            <p className="mt-2 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadAnalytics}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">No analytics data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Provider Analytics</h1>
          <p className="text-gray-600 mt-2">
            Insights and performance metrics for {analytics.business_name}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <Star className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_reviews}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics.average_rating ? analytics.average_rating.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <BarChart3 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_services}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <Heart className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Favorites</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.total_favorites}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Rating Distribution */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating Distribution</h3>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = analytics.rating_distribution?.[rating] || 0;
                const percentage = analytics.total_reviews > 0 ? (count / analytics.total_reviews) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center">
                    <div className="flex items-center w-20">
                      <span className="text-sm font-medium text-gray-700 mr-2">{rating}</span>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-16 text-right">
                      {count} ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Trends */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance</h3>
            <div className="space-y-4">
              {analytics.recent_reviews_trend?.map((period, index) => (
                <div key={period.period} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {period.period.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-gray-600">
                        {period.count} reviews
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {period.average_rating ? period.average_rating.toFixed(1) : 'N/A'}
                    </p>
                    <p className="text-xs text-gray-600">avg rating</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly Review Chart */}
        {analytics.monthly_review_counts?.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Review Activity</h3>
            <div className="flex items-end space-x-2 h-64">
              {analytics.monthly_review_counts.map((month) => {
                const maxCount = Math.max(...analytics.monthly_review_counts.map(m => m.count));
                const height = maxCount > 0 ? (month.count / maxCount) * 100 : 0;
                
                return (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-primary-500 rounded-t-sm flex items-end justify-center text-white text-xs font-medium"
                      style={{ height: `${height}%`, minHeight: month.count > 0 ? '20px' : '0' }}
                    >
                      {month.count > 0 && month.count}
                    </div>
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      {new Date(month.month + '-01').toLocaleDateString('en-US', { 
                        month: 'short',
                        year: '2-digit'
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left">
              <Users className="w-6 h-6 text-primary-500 mb-2" />
              <p className="font-medium text-gray-900">View All Reviews</p>
              <p className="text-sm text-gray-600">Read and respond to customer feedback</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left">
              <BarChart3 className="w-6 h-6 text-primary-500 mb-2" />
              <p className="font-medium text-gray-900">Update Services</p>
              <p className="text-sm text-gray-600">Manage your service offerings</p>
            </button>
            
            <button className="p-4 border border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left">
              <TrendingUp className="w-6 h-6 text-primary-500 mb-2" />
              <p className="font-medium text-gray-900">Improve Rating</p>
              <p className="text-sm text-gray-600">Tips to enhance customer satisfaction</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderAnalytics;