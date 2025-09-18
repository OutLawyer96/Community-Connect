import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { submitClaim } from '../../services/claimsService';
import { useAuth } from '../../contexts/AuthContext';
import { useClaimNotifications } from '../../contexts/NotificationContext';

/**
 * ClaimForm Component
 * Form for submitting a business claim
 */
const ClaimForm = () => {
  const { providerId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyClaimSubmitted } = useClaimNotifications();
  
  // Get provider data from navigation state or props
  const provider = location.state?.provider;
  
  const [formData, setFormData] = useState({
    additional_info: '',
    business_documents: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate('/login', { 
        state: { 
          returnTo: `/claim-business/${providerId}`,
          message: 'Please log in to claim a business' 
        } 
      });
    }
  }, [user, navigate, providerId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({
      ...prev,
      business_documents: file
    }));
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        business_documents: files[0]
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const claimData = {
        provider: providerId,
        additional_info: formData.additional_info,
        business_documents: formData.business_documents
      };

      await submitClaim(claimData);
      setSuccess(true);
      
      // Show success notification
      notifyClaimSubmitted(provider?.business_name || 'the business');
      
      // Redirect to claims page after success
      setTimeout(() => {
        navigate('/my-claims');
      }, 2000);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Claim Submitted Successfully!</h2>
            <p className="text-gray-600 mb-6">
              Your claim for <strong>{provider?.business_name}</strong> has been submitted for review. 
              We'll notify you via email once our team has reviewed your claim.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/my-claims')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View My Claims
              </button>
              <button
                onClick={() => navigate('/claim-business')}
                className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Claim Another Business
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Claim Your Business
          </h1>
          {provider && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {provider.business_name}
              </h2>
              {provider.primary_address && (
                <p className="text-gray-600">
                  {provider.primary_address.street}, {provider.primary_address.city}, {provider.primary_address.state}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit}>
            {/* Additional Information */}
            <div className="mb-6">
              <label htmlFor="additional_info" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Information
              </label>
              <textarea
                id="additional_info"
                name="additional_info"
                value={formData.additional_info}
                onChange={handleInputChange}
                rows={4}
                placeholder="Please provide any additional information about your ownership of this business, such as how long you've owned it, your role, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                This information helps us verify your claim faster.
              </p>
            </div>

            {/* Business Documents Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Business Documents (Optional)
              </label>
              <div 
                className={`
                  relative border-2 border-dashed rounded-lg p-6 transition-colors
                  ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
                  ${formData.business_documents ? 'border-green-400 bg-green-50' : ''}
                `}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                {formData.business_documents ? (
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-900 font-medium">
                      {formData.business_documents.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(formData.business_documents.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, business_documents: null }))}
                      className="mt-2 text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, or image files up to 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload business registration, license, or other ownership documents to help verify your claim.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className={`
                  flex-1 py-3 px-4 rounded-lg font-medium transition-colors
                  ${loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                  }
                  text-white
                `}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Claim'
                )}
              </button>
              
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Information Box */}
          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• We'll send you an email confirmation</li>
              <li>• Our team will review your claim within 3-5 business days</li>
              <li>• You'll be notified of the outcome via email</li>
              <li>• If approved, you'll gain full access to manage your business listing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimForm;