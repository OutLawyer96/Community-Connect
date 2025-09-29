import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { getMyClaims } from '../services/claimsService';
import notificationService from '../services/notificationService';

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
  const [preferences, setPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_notification_prefs')) || {
        enableClaimPolling: true,
        pollIntervalMs: 30000,
        stickyImportant: true,
        enableServerNotifications: true,
        serverPollIntervalMs: 15000,
      };
    } catch {
      return { 
        enableClaimPolling: true, 
        pollIntervalMs: 30000, 
        stickyImportant: true,
        enableServerNotifications: true,
        serverPollIntervalMs: 15000,
      };
    }
  });
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cc_notification_history')) || [];
    } catch {
      return [];
    }
  });
  const [serverNotifications, setServerNotifications] = useState([]);
  const [unreadServerCount, setUnreadServerCount] = useState(0);
  const lastClaimStatusesRef = useRef({});
  const pollingRef = useRef(null);
  const serverPollingRef = useRef(null);
  const abortRef = useRef(null);
  const serverAbortRef = useRef(null);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info', // default type
      duration: 5000, // default duration
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);
    setHistory(prev => {
      const next = [{ ...newNotification, createdAt: Date.now(), read: false }, ...prev].slice(0, 100);
      localStorage.setItem('cc_notification_history', JSON.stringify(next));
      return next;
    });

    // Auto-remove notification after duration
    if (!preferences.stickyImportant || (preferences.stickyImportant && newNotification.type === 'info')) {
      if (newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    }

    return id;
  }, [preferences.stickyImportant]);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Server notification polling
  const pollServerNotifications = useCallback(async () => {
    if (!preferences.enableServerNotifications) return;
    
    try {
      serverAbortRef.current?.abort();
      const controller = new AbortController();
      serverAbortRef.current = controller;
      
      const [notificationsResult, statsResult] = await Promise.all([
        notificationService.getNotifications({ page_size: 20, is_read: false }),
        notificationService.getNotificationStats()
      ]);
      
      if (notificationsResult.success) {
        setServerNotifications(notificationsResult.data.results || []);
      }
      
      if (statsResult.success) {
        setUnreadServerCount(statsResult.data.total_unread || 0);
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Error polling server notifications:', error);
    }
  }, [preferences.enableServerNotifications]);

  // Preferences persistence
  useEffect(() => {
    localStorage.setItem('cc_notification_prefs', JSON.stringify(preferences));
  }, [preferences]);

  // Server notification polling setup
  useEffect(() => {
    const hasToken = !!localStorage.getItem('token');
    if (!hasToken || !preferences.enableServerNotifications) return;

    // Initial load
    pollServerNotifications();
    
    // Set up polling
    serverPollingRef.current = setInterval(pollServerNotifications, preferences.serverPollIntervalMs);
    
    return () => {
      clearInterval(serverPollingRef.current);
      serverAbortRef.current?.abort();
    };
  }, [preferences.enableServerNotifications, preferences.serverPollIntervalMs, pollServerNotifications]);

  // Unread helpers - combine local and server counts
  const unreadCount = useMemo(() => {
    const localUnread = (history || []).filter(h => !h.read).length;
    return localUnread + unreadServerCount;
  }, [history, unreadServerCount]);

  const markAsRead = useCallback(async (id) => {
    // Check if it's a server notification
    const serverNotification = serverNotifications.find(n => n.id === id);
    if (serverNotification) {
      try {
        const result = await notificationService.markAsRead([id]);
        if (result.success) {
          setServerNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, is_read: true } : n)
          );
          setUnreadServerCount(prev => Math.max(0, prev - 1));
        }
      } catch (error) {
        console.error('Error marking server notification as read:', error);
      }
    } else {
      // Handle local notification
      setHistory(prev => {
        const next = prev.map(h => (h.id === id ? { ...h, read: true } : h));
        localStorage.setItem('cc_notification_history', JSON.stringify(next));
        return next;
      });
    }
  }, [serverNotifications]);

  const markAllAsRead = useCallback(async () => {
    // Mark all server notifications as read
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setServerNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        );
        setUnreadServerCount(0);
      }
    } catch (error) {
      console.error('Error marking all server notifications as read:', error);
    }

    // Mark all local notifications as read
    setHistory(prev => {
      const next = prev.map(h => (h.read ? h : { ...h, read: true }));
      localStorage.setItem('cc_notification_history', JSON.stringify(next));
      return next;
    });
  }, []);

  // Combined history - merge local and server notifications
  const combinedHistory = useMemo(() => {
    const serverHistory = serverNotifications.map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.notification_type,
      createdAt: new Date(n.created_at).getTime(),
      read: n.is_read,
      isServer: true,
      relatedUrl: n.related_object_url
    }));
    
    const localHistory = history.map(h => ({
      ...h,
      isServer: false
    }));
    
    return [...serverHistory, ...localHistory]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 100);
  }, [serverNotifications, history]);

  // Lightweight polling for claim status changes
  useEffect(() => {
    const hasToken = !!localStorage.getItem('token');
    if (!hasToken || !preferences.enableClaimPolling) return;
    const poll = async () => {
      try {
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const data = await getMyClaims({ page_size: 20 }, { signal: controller.signal });
        const claims = data.results || data || [];
        const last = lastClaimStatusesRef.current || {};

        claims.forEach((c) => {
          const prevStatus = last[c.id];
          if (prevStatus && prevStatus !== c.status) {
            // surface important transitions
            if (c.status === 'approved') {
              addNotification({ type: 'success', title: 'Claim Approved', message: `Your claim for "${c.provider?.business_name || 'the business'}" was approved.`, duration: preferences.stickyImportant ? 0 : 10000 });
            } else if (c.status === 'rejected') {
              addNotification({ type: 'error', title: 'Claim Rejected', message: `Your claim for "${c.provider?.business_name || 'the business'}" was rejected.`, duration: preferences.stickyImportant ? 0 : 10000 });
            } else if (c.status === 'under_review') {
              addNotification({ type: 'info', title: 'Claim Under Review', message: `Your claim for "${c.provider?.business_name || 'the business'}" is under review.`, duration: 7000 });
            }
          }
          last[c.id] = c.status;
        });

        lastClaimStatusesRef.current = last;
      } catch (e) {
        if (e?.name === 'AbortError') return;
        // ignore polling errors
      }
    };

    // kick off immediately, then interval
    poll();
    pollingRef.current = setInterval(poll, preferences.pollIntervalMs);
    return () => {
      clearInterval(pollingRef.current);
      abortRef.current?.abort();
    };
  }, [preferences.enableClaimPolling, preferences.pollIntervalMs, preferences.stickyImportant, addNotification]);

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
    preferences,
    setPreferences,
    history: combinedHistory,
    setHistory,
    unreadCount,
    markAsRead,
    markAllAsRead,
    serverNotifications,
    unreadServerCount,
    pollServerNotifications,
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
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full" aria-live="polite" aria-relevant="additions removals">
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