import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { User, Star, Heart, FileText } from 'lucide-react';
import { getMyClaims } from '../services/claimsService';

function Dashboard() {
  const { currentUser } = useAuth();
  const [claims, setClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimsError, setClaimsError] = useState(null);

  useEffect(() => {
    const loadClaims = async () => {
      try {
        setClaimsLoading(true);
        const data = await getMyClaims({ page_size: 5 });
        setClaims(data.results || data || []);
      } catch (e) {
        setClaimsError('Failed to load your claims');
      } finally {
        setClaimsLoading(false);
      }
    };
    if (currentUser) loadClaims();
  }, [currentUser]);

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

        {currentUser?.role === 'provider' && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Provider Tools</h2>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews & Ratings</h3>
                <p className="text-gray-600 mb-4">
                  View and respond to customer reviews and ratings.
                </p>
                <Link to="/providers" className="inline-flex items-center bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all">
                  View Reviews
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