import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationBadge from './NotificationBadge';
import './MessageButton.css';

const MessageButton = ({ 
  providerId, 
  providerName, 
  unreadCount = 0,
  size = 'normal',
  variant = 'primary',
  showLabel = true,
  disabled = false,
  className = '' 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (disabled || isLoading) return;

    try {
      setIsLoading(true);
      
      // Navigate to messages page with provider context
      if (providerId) {
        navigate(`/messages?provider=${providerId}`);
      } else {
        navigate('/messages');
      }
    } catch (error) {
      console.error('Error navigating to messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = providerId 
    ? `Message ${providerName || 'Provider'}`
    : 'Messages';

  const ariaLabel = unreadCount > 0 
    ? `${buttonText} (${unreadCount} unread)`
    : buttonText;

  return (
    <button
      className={`message-button message-button--${size} message-button--${variant} ${disabled ? 'message-button--disabled' : ''} ${className}`}
      onClick={handleClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <div className="message-button__content">
        <div className="message-button__icon">
          {isLoading ? (
            <div className="message-button__spinner">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadCount > 0 && (
                <NotificationBadge 
                  count={unreadCount} 
                  size={size === 'small' ? 'small' : 'normal'}
                  color="danger"
                  pulse={true}
                />
              )}
            </>
          )}
        </div>
        
        {showLabel && (
          <span className="message-button__label">
            {providerId ? (
              <>
                Message {providerName && (
                  <span className="message-button__provider-name">
                    {providerName}
                  </span>
                )}
              </>
            ) : (
              'Messages'
            )}
          </span>
        )}
      </div>
    </button>
  );
};

export default MessageButton;