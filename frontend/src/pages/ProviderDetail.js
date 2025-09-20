import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, MapPin, Phone, MessageCircle, Calendar, ArrowLeft,
  CheckCircle, Heart, Share2, User, Shield, Clock, Award, Mail, Globe
} from 'lucide-react';
import apiClient from '../config/axios';
import API_CONFIG from '../config/api';
import { useAuth } from '../contexts/AuthContext';
import { ProviderClaimStatus } from '../components/claims/ClaimStatusBadge';

function ProviderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchProviderDetails = useCallback(async () => {
    try {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.PROVIDER_DETAIL(id));
      setProvider(response.data);
    } catch (error) {
      console.error('Error fetching provider details:', error);
      setError('Failed to load provider details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProviderDetails();
  }, [fetchProviderDetails]);

  const handleClaimClick = () => {
    if (!currentUser) {
      navigate('/login', {
        state: {
          returnTo: `/claim-business/${id}`,
          message: 'Please log in to claim this business.'
        }
      });
      return;
    }
    navigate(`/claim-business/${id}`, { state: { provider } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const renderStars = (rating, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`${size} ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingDistribution = (reviews) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Provider Not Found
            </h1>
            <p className="text-gray-600 mb-6">
              The service provider you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/providers"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Providers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const primaryAddress = provider.addresses?.[0];
  const reviews = provider.reviews || [];
  const ratingDistribution = getRatingDistribution(reviews);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/providers"
            className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Providers
          </Link>
        </div>

        {/* Provider Header Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {provider.business_name}
                  </h1>
                  <ProviderClaimStatus provider={provider} />
                  {provider.is_verified && (
                    <CheckCircle className="w-8 h-8 text-green-500" title="Verified Provider" />
                  )}
                </div>
                
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-6">
                    {renderStars(Math.round(provider.average_rating || 0), 'w-5 h-5')}
                    <span className="ml-2 text-lg font-semibold text-gray-700">
                      {provider.average_rating || 'No ratings'}
                    </span>
                    <span className="ml-2 text-gray-500">
                      ({provider.review_count} reviews)
                    </span>
                  </div>
                </div>

                {primaryAddress && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span>{primaryAddress.city}, {primaryAddress.state}</span>
                  </div>
                )}

                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Joined {formatDate(provider.created_at)}</span>
                  </div>
                  <div className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    <span>{reviews.length} Reviews</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 lg:mt-0 lg:ml-8 flex flex-col space-y-3">
                <button className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Provider
                </button>
                <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  <Heart className="w-4 h-4 mr-2" />
                  Save Favorite
                </button>
                <button className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
                {!provider.is_claimed && (
                  <button
                    onClick={handleClaimClick}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg hover:shadow-lg font-medium"
                  >
                    Claim This Business
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'reviews', label: `Reviews (${reviews.length})` },
                { id: 'services', label: 'Services' },
                { id: 'contact', label: 'Contact' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                  <div className="prose max-w-none text-gray-600">
                    {provider.description ? (
                      provider.description.split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-4">{paragraph}</p>
                      ))
                    ) : (
                      <p>No description available.</p>
                    )}
                  </div>
                </div>

                {provider.services && provider.services.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Services Offered</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {provider.services.slice(0, 6).map((service, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                          {service.price && (
                            <p className="text-blue-600 font-medium mt-2">₹{service.price}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Rating Overview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="text-center lg:text-left mb-4 lg:mb-0">
                      <div className="text-4xl font-bold text-gray-900">
                        {provider.average_rating ? provider.average_rating.toFixed(1) : 'N/A'}
                      </div>
                      <div className="flex items-center justify-center lg:justify-start mt-2">
                        {renderStars(Math.round(provider.average_rating || 0), 'w-5 h-5')}
                      </div>
                      <div className="text-gray-600 mt-1">
                        Based on {reviews.length} reviews
                      </div>
                    </div>

                    <div className="flex-1 lg:ml-12">
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <div key={rating} className="flex items-center mb-2">
                          <span className="text-sm text-gray-600 w-8">{rating}</span>
                          <Star className="w-4 h-4 text-yellow-400 fill-current mr-2" />
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-yellow-400 h-2 rounded-full"
                              style={{
                                width: `${reviews.length > 0 ? (ratingDistribution[rating] / reviews.length) * 100 : 0}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {ratingDistribution[rating]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((review, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {review.user?.first_name} {review.user?.last_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {formatDate(review.created_at)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                            {review.is_verified && (
                              <Shield className="w-4 h-4 text-green-500 ml-2" title="Verified Review" />
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                      <p className="text-gray-600">Be the first to review this provider!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                {provider.services && provider.services.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {provider.services.map((service, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {service.name}
                            </h3>
                            <p className="text-gray-600 mb-4">{service.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>Duration: {service.duration || 'Contact for details'}</span>
                              </div>
                            </div>
                          </div>
                          {service.price && (
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">
                                ₹{service.price}
                              </div>
                              <div className="text-sm text-gray-500">Starting from</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Listed</h3>
                    <p className="text-gray-600">Contact the provider for service details.</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-4">
                      {provider.phone && (
                        <div className="flex items-center">
                          <Phone className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-700">{provider.phone}</span>
                        </div>
                      )}
                      {provider.email && (
                        <div className="flex items-center">
                          <Mail className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-gray-700">{provider.email}</span>
                        </div>
                      )}
                      {provider.website && (
                        <div className="flex items-center">
                          <Globe className="w-5 h-5 text-gray-400 mr-3" />
                          <a 
                            href={provider.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            {provider.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {primaryAddress && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start">
                          <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                          <div>
                            <p className="text-gray-700">{primaryAddress.street}</p>
                            <p className="text-gray-700">
                              {primaryAddress.city}, {primaryAddress.state} {primaryAddress.postal_code}
                            </p>
                            <p className="text-gray-700">{primaryAddress.country}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProviderDetail;