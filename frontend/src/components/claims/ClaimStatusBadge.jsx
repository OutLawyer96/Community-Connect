import React from 'react';
import { getClaimStatusColor, getClaimStatusLabel } from '../../services/claimsService';

/**
 * ClaimStatusBadge Component
 * Displays a colored badge indicating the current status of a claim
 */
const ClaimStatusBadge = ({ status, size = 'md', showIcon = true, announce = false, ariaLabel }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const getStatusIcon = (status) => {
    const iconClasses = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';
    
    switch (status) {
      case 'pending':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        );
      case 'approved':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'under_review':
        return (
          <svg className={iconClasses} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const label = getClaimStatusLabel(status);
  const a11y = announce
    ? { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true', 'aria-label': ariaLabel || `Claim status: ${label}` }
    : { 'aria-label': ariaLabel || `Claim status: ${label}` };
  return (
    <span
      {...a11y}
      title={label}
      data-status={status}
      className={`
      inline-flex items-center gap-1 font-medium rounded-full
      ${getClaimStatusColor(status)}
      ${sizeClasses[size]}
    `}
    >
      {showIcon && getStatusIcon(status)}
      {label}
    </span>
  );
};

/**
 * ClaimStatusIndicator Component
 * More detailed status indicator with additional information
 */
export const ClaimStatusIndicator = ({ claim, showTimestamp = true }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusMessage = (claim) => {
    switch (claim.status) {
      case 'pending':
        return `Submitted ${formatDate(claim.created_at)}`;
      case 'approved':
        return `Approved ${claim.reviewed_at ? formatDate(claim.reviewed_at) : ''}`;
      case 'rejected':
        return `Rejected ${claim.reviewed_at ? formatDate(claim.reviewed_at) : ''}`;
      case 'under_review':
        return `Under review since ${formatDate(claim.updated_at)}`;
      default:
        return '';
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <ClaimStatusBadge status={claim.status} />
      {showTimestamp && (
        <span className="text-xs text-gray-500">
          {getStatusMessage(claim)}
        </span>
      )}
      {claim.status === 'rejected' && claim.admin_notes && (
        <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <strong>Admin Note:</strong> {claim.admin_notes}
        </div>
      )}
    </div>
  );
};

/**
 * ProviderClaimStatus Component
 * Shows claim status on provider cards
 */
export const ProviderClaimStatus = ({ provider, compact = false }) => {
  if (provider.is_claimed) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-green-600`}>
        <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} fill-current`} viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <span className="font-medium">Claimed</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'} text-orange-600`}>
      <svg className={`${compact ? 'w-3 h-3' : 'w-4 h-4'} fill-current`} viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="font-medium">Available to Claim</span>
    </div>
  );
};

/**
 * ClaimProgressSteps Component
 * Shows the progress of a claim through the workflow
 */
export const ClaimProgressSteps = ({ claim, status, emailVerified }) => {
  const st = status || claim?.status;
  const ev = typeof emailVerified === 'boolean' ? emailVerified : !!claim?.email_verified;
  const steps = [
    { key: 'submitted', label: 'Submitted', completed: true },
    { key: 'email_verified', label: 'Email Verified', completed: ev },
    { key: 'under_review', label: 'Under Review', completed: ['under_review', 'approved', 'rejected'].includes(st) },
    { key: 'completed', label: 'Completed', completed: ['approved', 'rejected'].includes(st) }
  ];

  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => (
        <div key={step.key} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
            ${step.completed 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {step.completed ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              index + 1
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`
              w-12 h-1 mx-2
              ${step.completed ? 'bg-blue-600' : 'bg-gray-200'}
            `} />
          )}
        </div>
      ))}
    </div>
  );
};

export default ClaimStatusBadge;