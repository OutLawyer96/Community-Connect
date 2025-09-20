import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getMyClaims } from '../services/claimsService';
import ClaimStatusBadge, { ClaimProgressSteps } from '../components/claims/ClaimStatusBadge';
import { useAuth } from '../contexts/AuthContext';

/**
 * MyClaims Component
 * Page for users to view and manage their submitted claims
 */
const MyClaims = () => {
  useAuth(); // initialize auth context
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState(''); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState(''); // yyyy-mm-dd

  useEffect(() => {
    fetchUserClaims();
  }, []);

  const fetchUserClaims = async () => {
    try {
      setLoading(true);
      const response = await getMyClaims();
      setClaims(response.results || response);
    } catch (err) {
      setError('Failed to load your claims. Please try again.');
      console.error('Error fetching user claims:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helpers
  const normalize = (s) => (s || '').toString().toLowerCase();
  const parseDate = (d) => (d ? new Date(d) : null);
  const dateWithin = useCallback((createdAt) => {
    const created = new Date(createdAt);
    if (Number.isNaN(created.getTime())) return false;
    const from = parseDate(dateFrom);
    const to = parseDate(dateTo);
    if (from && created < new Date(from.getFullYear(), from.getMonth(), from.getDate())) return false;
    if (to) {
      // include entire end day
      const end = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
      if (created >= end) return false;
    }
    return true;
  }, [dateFrom, dateTo]);

  // Filter claims based on selected filter + search + date range
  const filteredClaims = useMemo(() => {
    const q = normalize(search);
    return claims.filter((claim) => {
      // status filter via tabs
      if (filter !== 'all') {
        if (filter === 'pending') {
          if (!['pending', 'under_review'].includes(claim.status)) return false;
        } else if (claim.status !== filter) {
          return false;
        }
      }

      // date range (created_at)
      if ((dateFrom || dateTo) && !dateWithin(claim.created_at)) return false;

      // search across business name and admin notes / additional info
      if (q) {
        const hay = [
          claim.provider?.business_name,
          claim.admin_notes,
          claim.additional_info,
        ]
          .map(normalize)
          .join(' ');
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [claims, filter, search, dateFrom, dateTo, dateWithin]);

  // Group claims by status for statistics
  const claimStats = claims.reduce((acc, claim) => {
    acc[claim.status] = (acc[claim.status] || 0) + 1;
    return acc;
  }, {});

  const getStatusCount = (status) => claimStats[status] || 0;

  const exportCsv = useCallback(() => {
    const rows = [
      ['ID', 'Business', 'Status', 'Submitted', 'Reviewed At', 'Admin Notes'],
      ...filteredClaims.map((c) => [
        c.id,
        c.provider?.business_name || '',
        c.status,
        c.created_at,
        c.reviewed_at || '',
        (c.admin_notes || '').replace(/\s+/g, ' ').trim(),
      ]),
    ];

    const csv = rows
      .map((r) => r
        .map((v) => {
          const s = String(v ?? '');
          // escape quotes, wrap if needed
          const escaped = '"' + s.replace(/"/g, '""') + '"';
          return /[",\n]/.test(s) ? escaped : s;
        })
        .join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    a.download = `my-claims-${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredClaims]);

  const SkeletonCard = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-1" />
            <div className="h-3 bg-gray-200 rounded w-1/4" />
          </div>
          <div className="ml-6 w-24 h-6 bg-gray-200 rounded" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Claims</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchUserClaims}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Claims</h1>
            <p className="text-gray-600 mt-2">
              Track and manage your business claim submissions
            </p>
          </div>
          <Link
            to="/claim-business"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Claim New Business
          </Link>
        </div>

        {/* Actions + Advanced Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="flex gap-3">
              <button
                onClick={exportCsv}
                disabled={filteredClaims.length === 0}
                className={`px-4 py-2 rounded-lg text-white transition-colors ${filteredClaims.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                aria-disabled={filteredClaims.length === 0}
              >
                Export CSV
              </button>
              <button
                onClick={fetchUserClaims}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
              >
                Refresh
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full md:w-auto">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search business or notes..."
                className="border rounded-lg px-3 py-2 w-full"
                aria-label="Search claims"
              />
              <div className="flex items-center gap-2">
                <label htmlFor="date-from" className="text-sm text-gray-600 whitespace-nowrap">From</label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="date-to" className="text-sm text-gray-600 whitespace-nowrap">To</label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-full"
                />
              </div>
              <button
                onClick={() => { setSearch(''); setDateFrom(''); setDateTo(''); }}
                className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50 text-gray-700"
                aria-label="Clear filters"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold text-gray-900">{claims.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getStatusCount('pending') + getStatusCount('under_review')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('approved')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{getStatusCount('rejected')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'All Claims', count: claims.length },
                { key: 'pending', label: 'Pending', count: getStatusCount('pending') + getStatusCount('under_review') },
                { key: 'approved', label: 'Approved', count: getStatusCount('approved') },
                { key: 'rejected', label: 'Rejected', count: getStatusCount('rejected') },
                { key: 'withdrawn', label: 'Withdrawn', count: getStatusCount('withdrawn') }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`
                    py-4 px-6 border-b-2 font-medium text-sm transition-colors
                    ${filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs
                      ${filter === tab.key
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Claims List */}
        {loading ? (
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No Claims Yet' : `No ${filter} Claims`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't submitted any business claims yet."
                : `You don't have any ${filter} claims at the moment.`
              }
            </p>
            <Link
              to="/claim-business"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Claim Your First Business
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredClaims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {claim.provider?.business_name}
                      </h3>
                      {claim.provider?.primary_address && (
                        <p className="text-gray-600 mb-2">
                          {claim.provider.primary_address.street}, {claim.provider.primary_address.city}, {claim.provider.primary_address.state}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Submitted on {new Date(claim.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="ml-6 text-right">
                      <ClaimStatusBadge status={claim.status} />
                      {claim.status === 'under_review' && claim.updated_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Under review since {new Date(claim.updated_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Progress Steps */}
                  <div className="mb-6">
                    <ClaimProgressSteps status={claim.status} />
                  </div>

                  {/* Additional Information */}
                  {claim.additional_info && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Information:</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {claim.additional_info}
                      </p>
                    </div>
                  )}

                  {/* Admin Feedback */}
                  {claim.admin_notes && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Feedback:</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                        {claim.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <div className="flex space-x-4">
                      <Link
                        to={`/my-claims/${claim.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </Link>
                      {claim.provider?.id && (
                        <Link
                          to={`/providers/${claim.provider.id}`}
                          className="text-gray-600 hover:text-gray-800 text-sm font-medium"
                        >
                          View Business
                        </Link>
                      )}
                    </div>
                    
                    {claim.status === 'rejected' && (
                      <Link
                        to={`/claim-business/${claim.provider?.id}`}
                        state={{ provider: claim.provider }}
                        className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Resubmit Claim
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyClaims;