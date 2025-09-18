import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * NotificationContext
 * Manages global notifications for the application
 */
const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

/**
 * NotificationProvider Component
 * Provides notification functionality throughout the app
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info', // default type
      duration: 5000, // default duration
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove notification after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Claim-specific notification helpers
  const notifyClaimSubmitted = (businessName) => {
    addNotification({
      type: 'success',
      title: 'Claim Submitted',
      message: `Your claim for "${businessName}" has been submitted successfully.`,
      duration: 7000,
    });
  };

  const notifyClaimApproved = (businessName) => {
    addNotification({
      type: 'success',
      title: 'Claim Approved',
      message: `Congratulations! Your claim for "${businessName}" has been approved.`,
      duration: 10000,
    });
  };

  const notifyClaimRejected = (businessName, reason) => {
    addNotification({
      type: 'error',
      title: 'Claim Rejected',
      message: `Your claim for "${businessName}" has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
      duration: 10000,
    });
  };

  const notifyClaimUnderReview = (businessName) => {
    addNotification({
      type: 'info',
      title: 'Claim Under Review',
      message: `Your claim for "${businessName}" is now under review by our team.`,
      duration: 7000,
    });
  };

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    // Claim-specific helpers
    notifyClaimSubmitted,
    notifyClaimApproved,
    notifyClaimRejected,
    notifyClaimUnderReview,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

/**
 * NotificationContainer Component
 * Renders all active notifications
 */
const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

/**
 * NotificationItem Component
 * Individual notification display
 */
const NotificationItem = ({ notification, onRemove }) => {
  const { type, title, message } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className={`
      ${getBgColor()} border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-full
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          {title && (
            <h4 className="text-sm font-semibold text-gray-900 mb-1">
              {title}
            </h4>
          )}
          <p className="text-sm text-gray-700">
            {message}
          </p>
        </div>
        <button
          onClick={onRemove}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

/**
 * Hook for claim status notifications
 * Provides easy-to-use functions for common claim notifications
 */
export const useClaimNotifications = () => {
  const { 
    notifyClaimSubmitted, 
    notifyClaimApproved, 
    notifyClaimRejected, 
    notifyClaimUnderReview,
    addNotification 
  } = useNotifications();

  const notifyClaimStatusChange = (claim, previousStatus = null) => {
    const businessName = claim.provider?.business_name || 'the business';
    
    switch (claim.status) {
      case 'pending':
        if (previousStatus !== 'pending') {
          notifyClaimSubmitted(businessName);
        }
        break;
      case 'under_review':
        if (previousStatus !== 'under_review') {
          notifyClaimUnderReview(businessName);
        }
        break;
      case 'approved':
        if (previousStatus !== 'approved') {
          notifyClaimApproved(businessName);
        }
        break;
      case 'rejected':
        if (previousStatus !== 'rejected') {
          notifyClaimRejected(businessName, claim.admin_notes);
        }
        break;
      case 'withdrawn':
        addNotification({
          type: 'info',
          title: 'Claim Withdrawn',
          message: `Your claim for "${businessName}" has been withdrawn.`,
          duration: 7000,
        });
        break;
      default:
        break;
    }
  };

  return {
    notifyClaimSubmitted,
    notifyClaimApproved,
    notifyClaimRejected,
    notifyClaimUnderReview,
    notifyClaimStatusChange,
  };
};

export default NotificationContext;