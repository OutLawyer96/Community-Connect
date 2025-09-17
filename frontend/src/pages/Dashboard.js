import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Settings, Star, Heart, Calendar } from 'lucide-react';

function Dashboard() {
  const { currentUser } = useAuth();

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
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
              Edit Profile
            </button>
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
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
              View Reviews
            </button>
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
            <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors">
              View Favorites
            </button>
          </div>
        </div>

        {currentUser?.role === 'provider' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Provider Tools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Profile</h3>
                <p className="text-gray-600 mb-4">
                  Update your business information, services, and contact details.
                </p>
                <button className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                  Manage Profile
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Ratings</h3>
                <p className="text-gray-600 mb-4">
                  View and respond to customer reviews and ratings.
                </p>
                <button className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                  View Reviews
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;