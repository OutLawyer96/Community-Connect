import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Star, Trash2, Loader } from 'lucide-react';

function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual favoritesService.getFavorites() when created
      const response = await fetch('/api/favorites/', {
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to load favorites');
      
      const data = await response.json();
      setFavorites(data.results || data);
    } catch (error) {
      setError('Failed to load your favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (favoriteId, providerId) => {
    try {
      setRemovingIds(prev => new Set([...prev, favoriteId]));
      
      // TODO: Replace with favoritesService.toggleFavorite() when created
      const response = await fetch('/api/favorites/toggle/', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider_id: providerId })
      });
      
      if (!response.ok) throw new Error('Failed to remove favorite');
      
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    } finally {
      setRemovingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(favoriteId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Loader className="w-8 h-8 animate-spin mx-auto text-primary-500" />
            <p className="mt-2 text-gray-600">Loading your favorites...</p>
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
              onClick={loadFavorites}
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
          <h1 className="text-3xl font-bold text-gray-900">My Favorites</h1>
          <p className="text-gray-600 mt-2">
            {favorites.length === 0 
              ? "You haven't saved any providers yet." 
              : `You have ${favorites.length} saved ${favorites.length === 1 ? 'provider' : 'providers'}.`
            }
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
            <p className="text-gray-600 mb-6">
              Start browsing providers and save the ones you like!
            </p>
            <Link 
              to="/providers"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium rounded-lg hover:shadow-lg transition-all"
            >
              Browse Providers
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        <Link 
                          to={`/providers/${favorite.provider}`}
                          className="hover:text-primary-600 transition-colors"
                        >
                          {favorite.provider_name}
                        </Link>
                      </h3>
                      
                      {favorite.provider_rating && (
                        <div className="flex items-center mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${
                                  i < Math.floor(favorite.provider_rating) 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {favorite.provider_rating.toFixed(1)}
                          </span>
                        </div>
                      )}

                      {favorite.provider_address && (
                        <div className="flex items-center text-sm text-gray-600 mb-3">
                          <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>
                            {favorite.provider_address.city}, {favorite.provider_address.state}
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-gray-500">
                        Saved on {new Date(favorite.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemoveFavorite(favorite.id, favorite.provider)}
                      disabled={removingIds.has(favorite.id)}
                      className="ml-4 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Remove from favorites"
                    >
                      {removingIds.has(favorite.id) ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <Link 
                      to={`/providers/${favorite.provider}`}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-center transition-colors text-sm"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Favorites;