import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../services/notificationService';
import { 
  Bell, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  MessageSquare, 
  Star,
  FileText,
  Filter,
  Settings,
  MoreVertical
} from 'lucide-react';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total_unread: 0 });
  const [preferences, setPreferences] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadNotifications();
    loadStats();
    loadPreferences();
  }, [filter, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        page_size: PAGE_SIZE
      };

      if (filter !== 'all') {
        if (filter === 'unread') {
          params.is_read = false;
        } else {
          params.type = filter;
        }
      }

      const result = await notificationService.getNotifications(params);
      
      if (result.success) {
        setNotifications(result.data.results || []);
        setTotalPages(Math.ceil(result.data.count / PAGE_SIZE));
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load notifications');
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await notificationService.getNotificationStats();
      if (result.success) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const loadPreferences = async () => {
    try {
      const result = await notificationService.getPreferences();
      if (result.success) {
        setPreferences(result.data);
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    }
  };

  const handleSavePreferences = async () => {
    try {
      const result = await notificationService.updatePreferences(preferences);
      if (result.success) {
        // Refresh stats and notifications
        loadStats();
        loadNotifications();
        setShowPreferences(false);
      } else {
        setError(result.error || 'Failed to save preferences');
      }
    } catch (err) {
      setError('Failed to save preferences');
      console.error('Error saving preferences:', err);
    }
  };

  const handleMarkAsRead = async (notificationIds) => {
    try {
      const result = await notificationService.markAsRead(notificationIds);
      if (result.success) {
        // Optimistic update
        setNotifications(prev => 
          notificationService.optimisticMarkAsRead(prev, notificationIds)
        );
        setSelectedIds([]);
        loadStats();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to mark notifications as read');
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead();
      if (result.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setSelectedIds([]);
        loadStats();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all as read:', err);
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;

    switch (bulkAction) {
      case 'mark_read':
        await handleMarkAsRead(selectedIds);
        break;
      default:
        break;
    }
    setBulkAction('');
  };

  const handleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n.id));
    }
  };

  const handleSelectNotification = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'review':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'claim':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'system':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatRelativeTime = (timestamp) => {
    return notificationService.formatTimestamp(timestamp);
  };

  const groupedNotifications = notificationService.groupByDate(notifications);

  if (loading && page === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Bell className="w-6 h-6 mr-2" />
                Notifications
              </h1>
              <p className="text-gray-600 mt-1">
                {stats.total_unread > 0 
                  ? `You have ${stats.total_unread} unread notification${stats.total_unread === 1 ? '' : 's'}`
                  : 'You\'re all caught up!'
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreferences(!showPreferences)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Notification preferences"
              >
                <Settings className="w-5 h-5" />
              </button>
              {stats.total_unread > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex items-center space-x-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'unread', label: 'Unread' },
                  { key: 'review', label: 'Reviews' },
                  { key: 'claim', label: 'Claims' },
                  { key: 'message', label: 'Messages' },
                  { key: 'system', label: 'System' }
                ].map(filterOption => (
                  <button
                    key={filterOption.key}
                    onClick={() => {
                      setFilter(filterOption.key);
                      setPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Bulk actions */}
            {selectedIds.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedIds.length} selected
                </span>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">Bulk actions</option>
                  <option value="mark_read">Mark as read</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preferences Panel */}
        {showPreferences && preferences && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email notifications for reviews</label>
                  <p className="text-xs text-gray-500">Receive emails when someone reviews your services</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_for_reviews}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_for_reviews: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email notifications for claims</label>
                  <p className="text-xs text-gray-500">Receive emails about claim status updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_for_claims}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_for_claims: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email notifications for messages</label>
                  <p className="text-xs text-gray-500">Receive emails when you get new messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_for_messages}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_for_messages: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email notifications for system updates</label>
                  <p className="text-xs text-gray-500">Receive emails about system announcements and updates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.email_for_system}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_for_system: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700">In-app notifications</label>
                  <p className="text-xs text-gray-500">Show notifications within the app</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.in_app_enabled}
                    onChange={(e) => setPreferences(prev => ({ ...prev, in_app_enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setPreferences(null);
                  loadPreferences();
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Notifications list */}
        <div className="bg-white rounded-lg shadow-sm">
          {notifications.length > 0 ? (
            <>
              {/* Select all header */}
              <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">
                    Select all notifications
                  </span>
                </label>
              </div>

              {/* Grouped notifications */}
              {Object.entries(groupedNotifications).map(([dateGroup, groupNotifications]) => (
                <div key={dateGroup}>
                  <div className="px-6 py-2 bg-gray-50 border-b border-gray-100">
                    <h3 className="text-sm font-medium text-gray-900">{dateGroup}</h3>
                  </div>
                  {groupNotifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`px-6 py-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                        !notification.is_read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <label className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(notification.id)}
                            onChange={() => handleSelectNotification(notification.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </label>
                        
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.notification_type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                              </p>
                              <div className="flex items-center mt-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatRelativeTime(notification.created_at)}
                                {notification.related_object_url && (
                                  <Link
                                    to={notification.related_object_url}
                                    className="ml-4 text-blue-600 hover:text-blue-800"
                                  >
                                    View →
                                  </Link>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {!notification.is_read && (
                                <button
                                  onClick={() => handleMarkAsRead([notification.id])}
                                  className="text-blue-600 hover:text-blue-800 text-xs"
                                  title="Mark as read"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
              <p className="text-gray-600">
                {filter === 'all' 
                  ? "You don't have any notifications yet."
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;