import React from 'react';

// Loading Spinner Component
export function LoadingSpinner({ size = 'default', className = '' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-500 ${sizeClasses[size]} ${className}`}></div>
  );
}

// Full Page Loading
export function PageLoading({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="large" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}

// Provider Card Skeleton
export function ProviderCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 bg-gray-300 rounded"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6"></div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="h-6 bg-gray-300 rounded w-24"></div>
        <div className="h-8 bg-gray-300 rounded w-20"></div>
      </div>
    </div>
  );
}

// Provider List Skeleton
export function ProviderListSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, index) => (
        <ProviderCardSkeleton key={index} />
      ))}
    </div>
  );
}

// Provider Detail Skeleton
export function ProviderDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-32 h-32 bg-gray-300 rounded-lg"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-300 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            <div className="flex space-x-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-5 h-5 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="h-6 bg-gray-300 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex space-x-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-6 bg-gray-300 rounded w-20"></div>
            ))}
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="p-6 space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Button Loading State
export function LoadingButton({ 
  loading, 
  children, 
  className = '', 
  disabled = false,
  ...props 
}) {
  return (
    <button
      className={`relative ${className} ${(loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <LoadingSpinner size="small" className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  );
}

// Search Results Skeleton
export function SearchResultsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search filters skeleton */}
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex gap-4">
          <div className="flex-1 h-12 bg-gray-300 rounded-lg"></div>
          <div className="w-48 h-12 bg-gray-300 rounded-lg"></div>
          <div className="w-24 h-12 bg-gray-300 rounded-lg"></div>
        </div>
      </div>

      {/* Results skeleton */}
      <ProviderListSkeleton count={9} />
    </div>
  );
}

export default {
  LoadingSpinner,
  PageLoading,
  ProviderCardSkeleton,
  ProviderListSkeleton,
  ProviderDetailSkeleton,
  LoadingButton,
  SearchResultsSkeleton
};