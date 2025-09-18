import apiClient from '../config/axios';
import API_CONFIG from '../config/api';

/**
 * Claims API Service
 * Handles all claim-related API operations
 */

// Get unclaimed providers that can be claimed
export const getUnclaimedProviders = async (params = {}) => {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.UNCLAIMED_PROVIDERS, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 12,
        search: params.search || '',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch unclaimed providers');
  }
};

// Get user's claims
export const getMyClaims = async (params = {}) => {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLAIMS, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 10,
        ...params
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch claims');
  }
};

// Get all claims (admin only)
export const getAllClaims = async (params = {}) => {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLAIMS, {
      params: {
        page: params.page || 1,
        page_size: params.pageSize || 20,
        status: params.status || '',
        ...params
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch all claims');
  }
};

// Get specific claim details
export const getClaimDetail = async (claimId) => {
  try {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch claim details');
  }
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
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to update claim');
  }
};

// Delete a claim (only pending claims)
export const deleteClaim = async (claimId) => {
  try {
    await apiClient.delete(API_CONFIG.ENDPOINTS.CLAIM_DETAIL(claimId));
    return { success: true };
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to delete claim');
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

export default {
  getUnclaimedProviders,
  getMyClaims,
  getAllClaims,
  getClaimDetail,
  submitClaim,
  updateClaim,
  deleteClaim,
  verifyClaimEmail,
  approveClaim,
  rejectClaim,
  getClaimStatusColor,
  getClaimStatusLabel,
  canEditClaim,
  canManageClaims
};