import React from 'react';
import './NotificationBadge.css';

const NotificationBadge = ({ 
  count = 0, 
  maxCount = 99, 
  showZero = false, 
  size = 'normal',
  color = 'primary',
  pulse = false,
  className = '' 
}) => {
  // Don't render if count is 0 and showZero is false
  if (count === 0 && !showZero) {
    return null;
  }

  // Format count display
  const displayCount = count > maxCount ? `${maxCount}+` : count;

  return (
    <span 
      className={`notification-badge notification-badge--${size} notification-badge--${color} ${pulse ? 'notification-badge--pulse' : ''} ${className}`}
    >
      {displayCount}
    </span>
  );
};

export default NotificationBadge;