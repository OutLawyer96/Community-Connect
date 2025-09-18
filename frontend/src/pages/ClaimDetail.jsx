import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClaimDetail, withdrawClaim } from '../services/claimsService';
import { ClaimStatusBadge, ClaimProgressSteps } from '../components/claims/ClaimStatusBadge';
import { useAuth } from '../contexts/AuthContext';

/**
 * ClaimDetail Component
 * Detailed view of a specific claim with full information and actions
 */
const ClaimDetail = () => {
  const { claimId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchClaimDetail();
  }, [claimId]);

  const fetchClaimDetail = async () => {
    try {
      setLoading(true);
      const claimData = await getClaimDetail(claimId);
      setClaim(claimData);
    } catch (err) {
      setError('Failed to load claim details. Please try again.');
      console.error('Error fetching claim detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawClaim = async () => {
    if (!window.confirm('Are you sure you want to withdraw this claim? This action cannot be undone.')) {
      return;
    }

    try {
      setWithdrawing(true);
      await withdrawClaim(claimId);
      setClaim(prev => ({ ...prev, status: 'withdrawn' }));
    } catch (err) {
      alert('Failed to withdraw claim. Please try again.');
      console.error('Error withdrawing claim:', err);
    } finally {
      setWithdrawing(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading claim details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Claim</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-x-4">
              <button
                onClick={fetchClaimDetail}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/my-claims"
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back to My Claims
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Claim Details</h1>
              <p className="text-gray-600 mt-1">Claim #{claim.id}</p>
            </div>
          </div>
          <ClaimStatusBadge status={claim.status} size="large" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {claim.provider?.business_name}
                  </h3>
                  {claim.provider?.primary_address && (
                    <p className="text-gray-600 mt-1">
                      {claim.provider.primary_address.street}<br />
                      {claim.provider.primary_address.city}, {claim.provider.primary_address.state} {claim.provider.primary_address.zip_code}
                    </p>
                  )}
                </div>
                
                {claim.provider?.phone && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Phone</p>
                    <p className="text-gray-600">{claim.provider.phone}</p>
                  </div>
                )}
                
                {claim.provider?.email && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="text-gray-600">{claim.provider.email}</p>
                  </div>
                )}
                
                {claim.provider?.website && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Website</p>
                    <a 
                      href={claim.provider.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {claim.provider.website}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <Link
                  to={`/providers/${claim.provider?.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Full Business Profile →
                </Link>
              </div>
            </div>

            {/* Claim Progress */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Claim Progress</h2>
              <ClaimProgressSteps status={claim.status} detailed={true} />
            </div>

            {/* Additional Information */}
            {claim.additional_info && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{claim.additional_info}</p>
                </div>
              </div>
            )}

            {/* Business Documents */}
            {claim.business_documents && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Documents</h2>
                <div className="flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Document Uploaded</p>
                    <p className="text-sm text-gray-600">Submitted for verification</p>
                  </div>
                  <a
                    href={claim.business_documents}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </a>
                </div>
              </div>
            )}

            {/* Admin Feedback */}
            {claim.admin_notes && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Feedback</h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">{claim.admin_notes}</p>
                  {claim.reviewed_at && claim.reviewed_by && (
                    <p className="text-sm text-gray-600 mt-3">
                      — {claim.reviewed_by.first_name} {claim.reviewed_by.last_name}, {formatDate(claim.reviewed_at)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Claim Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Claim Summary</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Submitted</p>
                  <p className="text-sm text-gray-600">{formatDate(claim.created_at)}</p>
                </div>
                
                {claim.reviewed_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {claim.status === 'under_review' ? 'Under Review Since' : 'Reviewed'}
                    </p>
                    <p className="text-sm text-gray-600">{formatDate(claim.reviewed_at)}</p>
                  </div>
                )}
                
                {claim.approved_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Approved</p>
                    <p className="text-sm text-gray-600">{formatDate(claim.approved_at)}</p>
                  </div>
                )}
                
                {claim.rejected_at && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rejected</p>
                    <p className="text-sm text-gray-600">{formatDate(claim.rejected_at)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                {claim.status === 'pending' && (
                  <button
                    onClick={handleWithdrawClaim}
                    disabled={withdrawing}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {withdrawing ? 'Withdrawing...' : 'Withdraw Claim'}
                  </button>
                )}
                
                {claim.status === 'rejected' && (
                  <Link
                    to={`/claim-business/${claim.provider?.id}`}
                    state={{ provider: claim.provider }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-center block"
                  >
                    Resubmit Claim
                  </Link>
                )}
                
                <Link
                  to="/my-claims"
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-center block"
                >
                  Back to My Claims
                </Link>
              </div>
            </div>

            {/* Help Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Need Help?</h3>
              <p className="text-sm text-blue-800 mb-4">
                If you have questions about your claim or need assistance, contact our support team.
              </p>
              <div className="space-y-2">
                <a
                  href="mailto:support@communityconnect.com"
                  className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Email Support
                </a>
                <a
                  href="/help/business-claims"
                  className="block text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Claim FAQ
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;