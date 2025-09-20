import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, LogOut, Home, Users, Building2, FileText, Shield, Bell } from 'lucide-react';
import Logo from './Logo';
import { useNotifications } from '../../contexts/NotificationContext';
// Import your logo (uncomment and adjust the path based on your logo file)
// import logo from '../../assets/images/logo.png'; // or .svg, .jpg

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount, history, markAsRead, markAllAsRead } = useNotifications();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <Logo />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              to="/" 
              className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            <Link 
              to="/providers" 
              className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Users className="w-4 h-4 mr-2" />
              Providers
            </Link>
            <Link 
              to="/claim-business" 
              className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Claim Business
            </Link>
            
            {currentUser ? (
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
                    aria-label={`Notifications (${unreadCount} unread)`}
                    onClick={() => setIsNotifOpen((v) => !v)}
                  >
                    <Bell className="w-5 h-5 text-gray-700" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
                      <div className="flex items-center justify-between px-3 py-2 border-b">
                        <span className="text-sm font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <ul className="max-h-96 overflow-auto divide-y">
                        {(history || []).slice(0, 15).map((n) => (
                          <li key={n.id} className={`px-3 py-2 text-sm ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                {n.title && <div className="font-medium text-gray-900">{n.title}</div>}
                                <div className="text-gray-700">{n.message}</div>
                                <div className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                              </div>
                              {!n.read && (
                                <button
                                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                                  onClick={() => markAsRead(n.id)}
                                >
                                  Mark read
                                </button>
                              )}
                            </div>
                          </li>
                        ))}
                        {(!history || history.length === 0) && (
                          <li className="px-3 py-6 text-sm text-center text-gray-500">No notifications yet</li>
                        )}
                      </ul>
                      <div className="px-3 py-2 text-right border-t">
                        <Link to="/my-claims" className="text-sm text-blue-600 hover:underline" onClick={() => setIsNotifOpen(false)}>
                          View my claims
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link 
                  to="/dashboard" 
                  className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link 
                  to="/my-claims" 
                  className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Claims
                </Link>
                {(currentUser.is_staff || currentUser.is_superuser) && (
                  <Link 
                    to="/admin/claims" 
                    className="flex items-center text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-danger-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all transform hover:scale-105"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              className="flex items-center text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Link>
            <Link 
              to="/providers" 
              className="flex items-center text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              <Users className="w-4 h-4 mr-2" />
              Providers
            </Link>
            <Link 
              to="/claim-business" 
              className="flex items-center text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              <Building2 className="w-4 h-4 mr-2" />
              Claim Business
            </Link>
            
            {currentUser ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="flex items-center text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link 
                  to="/my-claims" 
                  className="flex items-center text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  My Claims
                </Link>
                {(currentUser.is_staff || currentUser.is_superuser) && (
                  <Link 
                    to="/admin/claims" 
                    className="flex items-center text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center w-full text-left text-gray-700 hover:text-danger-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="text-gray-700 hover:text-primary-600 hover:bg-gray-50 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;