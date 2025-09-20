import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

// Simple in-memory cache and inflight map
const _cache = new Map(); // key -> { data, expiry }
const _inflight = new Map(); // key -> promise

const cacheKey = (url, params = {}) => `${url}?${new URLSearchParams(params).toString()}`;

// Invalidate helpers
const invalidateCache = (predicate) => {
  for (const key of Array.from(_cache.keys())) {
    try {
      if (predicate(key)) _cache.delete(key);
    } catch (_) {
      // no-op
    }
  }
};
const invalidateByPrefix = (prefix) => invalidateCache((k) => k.startsWith(prefix));

const withResilience = async (
  fn,
  { key, ttlMs = 0, retries = 2, baseDelay = 300, signal } = {}
) => {
  // Serve from cache if fresh
  if (ttlMs > 0 && key && _cache.has(key)) {
    const entry = _cache.get(key);
    if (Date.now() < entry.expiry) return entry.data;
    _cache.delete(key);
  }

  // Deduplicate inflight requests
  if (key && _inflight.has(key)) {
    return _inflight.get(key);
  }

  const run = (async () => {
    let attempt = 0;
    let lastErr;
    while (attempt <= retries) {
      try {
        const data = await fn();
        if (ttlMs > 0 && key) {
          _cache.set(key, { data, expiry: Date.now() + ttlMs });
        }
        return data;
      } catch (err) {
        lastErr = err;
        // If aborted, don't retry
        const aborted = err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError' || err?.name === 'AbortError';
        if (aborted) break;
        const status = err?.response?.status;
        // Do not retry on 4xx except 429
        if (status && status !== 429 && status >= 400 && status < 500) break;
        // backoff
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((res) => setTimeout(res, delay));
        attempt += 1;
      }
    }
    throw lastErr || new Error('Request failed');
  })();

  if (key) _inflight.set(key, run);
  try {
    const res = await run;
    return res;
  } finally {
    if (key) _inflight.delete(key);
  }
};

/**
 * Claims API Service
 * Handles all claim-related API operations
 */

// Get unclaimed providers that can be claimed
export const getUnclaimedProviders = async (params = {}, options = {}) => {
  const merged = {
    page: params.page || 1,
    page_size: params.pageSize || 12,
    search: params.search || '',
    ...params,
  };
  const key = cacheKey(API_CONFIG.ENDPOINTS.UNCLAIMED_PROVIDERS, merged);
  return withResilience(
    async () => {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.UNCLAIMED_PROVIDERS, { params: merged, signal: options.signal });
      return response.data;
    },
    { key, ttlMs: 30_000, retries: 2, signal: options.signal }
  ).catch((error) => {
    throw new Error(error.response?.data?.detail || 'Failed to fetch unclaimed providers');
  });
};

// Get user's claims
export const getMyClaims = async (params = {}, options = {}) => {
  const merged = {
    page: params.page || 1,
    page_size: params.pageSize || 10,
    ...params,
  };
  const key = cacheKey(API_CONFIG.ENDPOINTS.CLAIMS, merged);
  return withResilience(
    async () => {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLAIMS, { params: merged, signal: options.signal });
      return response.data;
    },
    { key, ttlMs: 15_000, retries: 2, signal: options.signal }
  ).catch((error) => {
    throw new Error(error.response?.data?.detail || 'Failed to fetch claims');
  });
};

// Backward-compatible alias used by older pages
export const getUserClaims = async (params = {}, options = {}) => getMyClaims(params, options);

// Get all claims (admin only)
export const getAllClaims = async (params = {}, options = {}) => {
  const merged = {
    page: params.page || 1,
    page_size: params.pageSize || 20,
    status: params.status || '',
    ...params,
  };
  const key = cacheKey(API_CONFIG.ENDPOINTS.CLAIMS, merged);
  return withResilience(
    async () => {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLAIMS, { params: merged, signal: options.signal });
      return response.data;
    },
    { key, ttlMs: 10_000, retries: 2, signal: options.signal }
  ).catch((error) => {
    throw new Error(error.response?.data?.detail || 'Failed to fetch all claims');
  });
};

// Get specific claim details
export const getClaimDetail = async (claimId, options = {}) => {
  const key = cacheKey(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
  return withResilience(
    async () => {
      const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId), { signal: options.signal });
      return response.data;
    },
    { key, ttlMs: 10_000, retries: 1, signal: options.signal }
  ).catch((error) => {
    throw new Error(error.response?.data?.detail || 'Failed to fetch claim details');
  });
};

// Submit a new claim
export const submitClaim = async (claimData) => {
  try {
    const formData = new FormData();
    
    // Add basic claim data
    formData.append('provider', claimData.provider);
    if (claimData.additional_info) {
      formData.append('additional_info', claimData.additional_info);
    }
    
    // Add business documents if provided
    if (claimData.business_documents) {
      formData.append('business_documents', claimData.business_documents);
    }
    
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.CLAIMS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Claims list may change
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIMS);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to submit claim');
  }
};

// Update a claim (only pending claims)
export const updateClaim = async (claimId, updateData) => {
  try {
    const formData = new FormData();
    
    // Add updated data
    if (updateData.additional_info !== undefined) {
      formData.append('additional_info', updateData.additional_info);
    }
    
    // Add new business documents if provided
    if (updateData.business_documents) {
      formData.append('business_documents', updateData.business_documents);
    }
    
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    // Invalidate lists and detail cache
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIMS);
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to update claim');
  }
};

// Delete a claim (only pending claims)
export const deleteClaim = async (claimId) => {
  try {
    await apiClient.delete(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIMS);
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    return { success: true };
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to delete claim');
  }
};

// Withdraw a claim (fallbacks to delete when dedicated endpoint is absent)
export const withdrawClaim = async (claimId) => {
  try {
    await apiClient.delete(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIMS);
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    return { success: true };
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to withdraw claim');
  }
};

// Verify email for claim
export const verifyClaimEmail = async (claimId, token) => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.CLAIM_VERIFY_EMAIL(claimId), {
      token
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to verify email');
  }
};

// Admin: Approve a claim
export const approveClaim = async (claimId, adminNotes = '') => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.CLAIM_APPROVE(claimId), {
      admin_notes: adminNotes
    });
    // Approval affects lists, detail, and possibly unclaimed providers
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIMS);
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    if (API_CONFIG.ENDPOINTS.UNCLAIMED_PROVIDERS) {
      invalidateByPrefix(API_CONFIG.ENDPOINTS.UNCLAIMED_PROVIDERS);
    }
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to approve claim');
  }
};

// Admin: Reject a claim
export const rejectClaim = async (claimId, adminNotes = '') => {
  try {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.CLAIM_REJECT(claimId), {
      admin_notes: adminNotes
    });
    // Rejection affects lists and detail; unclaimed providers likely unchanged
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIMS);
    invalidateByPrefix(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to reject claim');
  }
};

// Utility function to get claim status color
export const getClaimStatusColor = (status) => {
  const statusColors = {
    'pending': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'rejected': 'bg-red-100 text-red-800',
    'under_review': 'bg-blue-100 text-blue-800'
  };
  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

// Utility function to format claim status
export const getClaimStatusLabel = (status) => {
  const statusLabels = {
    'pending': 'Pending Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'under_review': 'Under Review'
  };
  return statusLabels[status] || status;
};

// Utility function to check if claim can be edited
export const canEditClaim = (claim, currentUser) => {
  return claim.status === 'pending' && 
         claim.claimant === currentUser?.id && 
         !currentUser?.is_staff;
};

// Utility function to check if user can approve/reject claims
export const canManageClaims = (currentUser) => {
  return currentUser?.is_staff || currentUser?.is_superuser;
};

const claimsService = {
  getUnclaimedProviders,
  getMyClaims,
  getUserClaims,
  getAllClaims,
  getClaimDetail,
  submitClaim,
  updateClaim,
  deleteClaim,
  withdrawClaim,
  verifyClaimEmail,
  approveClaim,
  rejectClaim,
  getClaimStatusColor,
  getClaimStatusLabel,
  canEditClaim,
  canManageClaims
};

export default claimsService;