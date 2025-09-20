import React, { useState, useEffect, useCallback } from 'react';
import { getAllClaims, approveClaim, rejectClaim } from '../services/claimsService';
import ClaimStatusBadge from '../components/claims/ClaimStatusBadge';
import { useAuth } from '../contexts/AuthContext';

/**
 * AdminClaimManager Component
 * Administrative interface for reviewing and managing business claims
 */
const AdminClaimManager = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaims, setSelectedClaims] = useState(new Set());
  const [processingBulk, setProcessingBulk] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [ordering, setOrdering] = useState('-created_at'); // '-created_at' newest first
  const [stats, setStats] = useState({ loading: true, total: 0, pending: 0, under_review: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: 10
  });

  // Check if user has admin permissions
  const isAdmin = user?.is_staff || user?.is_superuser;

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        page_size: pagination.pageSize,
        search: searchTerm,
        status: filter === 'all' ? undefined : filter,
        created_from: dateFrom || undefined,
        created_to: dateTo || undefined,
        ordering,
      };
      
      const response = await getAllClaims(params);
      setClaims(response.results || []);
      setPagination(prev => ({
        ...prev,
        totalPages: Math.ceil((response.count || 0) / prev.pageSize),
        totalCount: response.count || 0
      }));
    } catch (err) {
      setError('Failed to load claims. Please try again.');
      console.error('Error fetching claims:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, searchTerm, filter, dateFrom, dateTo, ordering]);

  const fetchStats = useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      const base = {
        search: searchTerm,
        created_from: dateFrom || undefined,
        created_to: dateTo || undefined,
      };
      const fetchCount = async (extra = {}) => {
        const resp = await getAllClaims({ ...base, ...extra, page: 1, page_size: 1 });
        return resp.count || 0;
      };
      const [total, pending, under_review, approved, rejected] = await Promise.all([
        fetchCount(),
        fetchCount({ status: 'pending' }),
        fetchCount({ status: 'under_review' }),
        fetchCount({ status: 'approved' }),
        fetchCount({ status: 'rejected' }),
      ]);
      setStats({ loading: false, total, pending, under_review, approved, rejected });
    } catch (e) {
      // Non-blocking; leave previous stats if error
      setStats(prev => ({ ...prev, loading: false }));
      console.error('Error fetching claim stats:', e);
    }
  }, [searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    if (isAdmin) {
      fetchClaims();
      fetchStats();
    }
  }, [filter, searchTerm, pagination.page, isAdmin, fetchClaims, fetchStats]);

  const handleClaimAction = async (claimId, action, notes = '') => {
    try {
      if (action === 'approve') {
        await approveClaim(claimId, notes);
      } else if (action === 'reject') {
        await rejectClaim(claimId, notes);
      }
      
      // Update the claim in the local state
      setClaims(prev => prev.map(claim => 
        claim.id === claimId 
          ? { 
              ...claim, 
              status: action === 'approve' ? 'approved' : 'rejected',
              admin_notes: notes,
              reviewed_at: new Date().toISOString(),
              reviewed_by: user
            }
          : claim
      ));
      
      // Remove from selected claims
      setSelectedClaims(prev => {
        const newSet = new Set(prev);
        newSet.delete(claimId);
        return newSet;
      });
      
    } catch (err) {
      alert(`Failed to ${action} claim. Please try again.`);
      console.error(`Error ${action}ing claim:`, err);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedClaims.size === 0) {
      alert('Please select claims to process.');
      return;
    }

    const notes = prompt(`Enter notes for ${action}ing selected claims (optional):`);
    if (notes === null) return; // User cancelled

    setProcessingBulk(true);
    const promises = Array.from(selectedClaims).map(claimId => 
      handleClaimAction(claimId, action, notes)
    );

    try {
      await Promise.all(promises);
      setSelectedClaims(new Set());
    } catch (err) {
      console.error('Error with bulk action:', err);
    } finally {
      setProcessingBulk(false);
    }
  };

  const toggleSelectClaim = (claimId) => {
    setSelectedClaims(prev => {
      const newSet = new Set(prev);
      if (newSet.has(claimId)) {
        newSet.delete(claimId);
      } else {
        newSet.add(claimId);
      }
      return newSet;
    });
  };

  const selectAllClaims = () => {
    const pendingClaims = claims.filter(claim => claim.status === 'pending' || claim.status === 'under_review');
    setSelectedClaims(new Set(pendingClaims.map(claim => claim.id)));
  };

  const clearSelection = () => {
    setSelectedClaims(new Set());
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading claims...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Claim Management</h1>
            <p className="text-gray-600 mt-2">
              Review and manage business claim submissions
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Total Claims: {pagination.totalCount}
          </div>
        </div>

        {/* Analytics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'from-gray-500 to-gray-700', bg: 'bg-gray-100', text: 'text-gray-700' },
            { label: 'Pending', value: stats.pending, color: 'from-yellow-500 to-yellow-600', bg: 'bg-yellow-100', text: 'text-yellow-700' },
            { label: 'Under Review', value: stats.under_review, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-100', text: 'text-blue-700' },
            { label: 'Approved', value: stats.approved, color: 'from-green-500 to-green-600', bg: 'bg-green-100', text: 'text-green-700' },
            { label: 'Rejected', value: stats.rejected, color: 'from-red-500 to-red-600', bg: 'bg-red-100', text: 'text-red-700' },
          ].map((c) => (
            <div key={c.label} className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.text}`}>{stats.loading ? '—' : c.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${c.color} opacity-80`} />
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Status Filter */}
            <div className="flex space-x-4">
              {[
                { key: 'all', label: 'All Claims' },
                { key: 'pending', label: 'Pending' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => {
                    setFilter(filterOption.key);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-sm transition-colors
                    ${filter === filterOption.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search by business name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <label htmlFor="admin-date-from" className="text-sm text-gray-600 whitespace-nowrap">From</label>
              <input
                id="admin-date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="admin-date-to" className="text-sm text-gray-600 whitespace-nowrap">To</label>
              <input
                id="admin-date-to"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="admin-ordering" className="text-sm text-gray-600 whitespace-nowrap">Sort</label>
              <select
                id="admin-ordering"
                value={ordering}
                onChange={(e) => { setOrdering(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="-created_at">Newest first</option>
                <option value="created_at">Oldest first</option>
                <option value="status">Status A→Z</option>
                <option value="-status">Status Z→A</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedClaims.size > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {selectedClaims.size} claim{selectedClaims.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={clearSelection}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear selection
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    disabled={processingBulk}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    Bulk Approve
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    disabled={processingBulk}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    Bulk Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Claims Table */}
        {error ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchClaims}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : claims.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Claims Found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No business claims have been submitted yet.'
                : `No ${filter} claims found.`
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Table Header with Select All */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={claims.filter(c => c.status === 'pending' || c.status === 'under_review').length > 0 && 
                           claims.filter(c => c.status === 'pending' || c.status === 'under_review').every(c => selectedClaims.has(c.id))}
                  onChange={(e) => e.target.checked ? selectAllClaims() : clearSelection()}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Select All Reviewable
                </span>
              </div>
            </div>

            {/* Claims List */}
            <div className="divide-y divide-gray-200">
              {claims.map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  isSelected={selectedClaims.has(claim.id)}
                  onToggleSelect={() => toggleSelectClaim(claim.id)}
                  onApprove={(notes) => handleClaimAction(claim.id, 'approve', notes)}
                  onReject={(notes) => handleClaimAction(claim.id, 'reject', notes)}
                  formatDate={formatDate}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((pagination.page - 1) * pagination.pageSize) + 1} to{' '}
                    {Math.min(pagination.page * pagination.pageSize, pagination.totalCount)} of{' '}
                    {pagination.totalCount} claims
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * ClaimRow Component
 * Individual claim row in the admin table
 */
const ClaimRow = ({ claim, isSelected, onToggleSelect, onApprove, onReject, formatDate }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [actionNotes, setActionNotes] = useState('');
  const [showActionDialog, setShowActionDialog] = useState(null);

  const canBeActioned = claim.status === 'pending' || claim.status === 'under_review';

  const handleAction = (action) => {
    if (action === 'approve') {
      onApprove(actionNotes);
    } else if (action === 'reject') {
      onReject(actionNotes);
    }
    setActionNotes('');
    setShowActionDialog(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          {canBeActioned && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {claim.provider?.business_name}
              </h3>
              <ClaimStatusBadge status={claim.status} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <p><strong>Claimant:</strong> {claim.user?.first_name} {claim.user?.last_name}</p>
                <p><strong>Email:</strong> {claim.user?.email}</p>
                <p><strong>Submitted:</strong> {formatDate(claim.created_at)}</p>
              </div>
              <div>
                {claim.provider?.primary_address && (
                  <p><strong>Address:</strong> {claim.provider.primary_address.street}, {claim.provider.primary_address.city}, {claim.provider.primary_address.state}</p>
                )}
                {claim.reviewed_at && (
                  <p><strong>Reviewed:</strong> {formatDate(claim.reviewed_at)}</p>
                )}
              </div>
            </div>

            {/* Additional Info Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            {/* Expanded Details */}
            {showDetails && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                {claim.additional_info && (
                  <div>
                    <p className="font-medium text-gray-700">Additional Information:</p>
                    <p className="text-gray-600 whitespace-pre-wrap">{claim.additional_info}</p>
                  </div>
                )}
                
                {claim.business_documents && (
                  <div>
                    <p className="font-medium text-gray-700">Documents:</p>
                    <a
                      href={claim.business_documents}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Uploaded Documents
                    </a>
                  </div>
                )}
                
                {claim.admin_notes && (
                  <div>
                    <p className="font-medium text-gray-700">Admin Notes:</p>
                    <p className="text-gray-600">{claim.admin_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canBeActioned && (
          <div className="flex space-x-2 ml-4">
            <button
              onClick={() => setShowActionDialog('approve')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => setShowActionDialog('reject')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Action Dialog */}
      {showActionDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showActionDialog === 'approve' ? 'Approve' : 'Reject'} Claim
            </h3>
            <p className="text-gray-600 mb-4">
              {showActionDialog === 'approve' 
                ? 'Add any notes for the business owner (optional):'
                : 'Please provide a reason for rejection:'
              }
            </p>
            <textarea
              value={actionNotes}
              onChange={(e) => setActionNotes(e.target.value)}
              placeholder={showActionDialog === 'approve' 
                ? 'Congratulations! Your claim has been approved...'
                : 'Your claim was rejected because...'
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowActionDialog(null);
                  setActionNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showActionDialog)}
                className={`
                  px-4 py-2 rounded-lg text-white transition-colors
                  ${showActionDialog === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                  }
                `}
              >
                {showActionDialog === 'approve' ? 'Approve' : 'Reject'} Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClaimManager;