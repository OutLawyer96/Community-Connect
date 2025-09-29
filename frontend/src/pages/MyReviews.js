import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, MessageSquare, Loader, Edit, Trash2 } from 'lucide-react';

function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual reviewsService.getUserReviews() when created
      const response = await fetch('/api/reviews/mine/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load reviews');
      
      const data = await response.json();
      setReviews(data.results || data);
    } catch (error) {
      setError('Failed to load your reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (review) => {
    setEditingReview(review.id);
    setEditText(review.comment);
    setEditRating(review.rating);
  };

  const handleCancelEdit = () => {
    setEditingReview(null);
    setEditText('');
    setEditRating(5);
  };

  const handleSaveEdit = async (reviewId) => {
    try {
      setUpdating(true);
      // TODO: Replace with actual reviewsService.updateReview() when created
      const response = await fetch(`/api/reviews/${reviewId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: editText,
          rating: editRating
        })
      });
      
      if (!response.ok) throw new Error('Failed to update review');
      
      const updatedReview = await response.json();
      setReviews(prev => prev.map(review => 
        review.id === reviewId ? { ...review, ...updatedReview } : review
      ));
      
      handleCancelEdit();
    } catch (error) {
      console.error('Error updating review:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      // TODO: Replace with actual reviewsService.deleteReview() when created
      const response = await fetch(`/api/reviews/${reviewId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete review');
      
      setReviews(prev => prev.filter(review => review.id !== reviewId));
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-primary-500" />
            <p className="mt-2 text-gray-600">Loading your reviews...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={loadReviews}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
          <p className="text-gray-600 mt-2">
            {reviews.length === 0 
              ? "You haven't written any reviews yet." 
              : `You have written ${reviews.length} ${reviews.length === 1 ? 'review' : 'reviews'}.`
            }
          </p>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
            <p className="text-gray-600 mb-6">
              Start using services and share your experiences with others!
            </p>
            <Link 
              to="/providers"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link 
                        to={`/providers/${review.provider_id}`}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {review.provider_name}
                      </Link>
                    </h3>
                    
                    {editingReview === review.id ? (
                      <div className="space-y-4">
                        {/* Rating Editor */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                          </label>
                          <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                type="button"
                                onClick={() => setEditRating(rating)}
                                className="focus:outline-none"
                              >
                                <Star 
                                  className={`w-6 h-6 ${
                                    rating <= editRating 
                                      ? 'text-yellow-400 fill-current' 
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Comment Editor */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Comment
                          </label>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Share your experience..."
                          />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleSaveEdit(review.id)}
                            disabled={updating}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
                          >
                            {updating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Rating Display */}
                        <div className="flex items-center mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < review.rating 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {review.rating} star{review.rating !== 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Comment Display */}
                        {review.comment && (
                          <p className="text-gray-700 mb-3">{review.comment}</p>
                        )}

                        {/* Date */}
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>
                            Reviewed on {new Date(review.created_at).toLocaleDateString()}
                            {review.updated_at !== review.created_at && (
                              <span className="ml-2">(edited)</span>
                            )}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {editingReview !== review.id && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditClick(review)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit review"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete review"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReviews;