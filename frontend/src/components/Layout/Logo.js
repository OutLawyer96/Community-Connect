import React from 'react';
// Import your logo (uncomment and adjust the path based on your logo file)
import logoImage from '../../assets/images/logo.jpg';

function Logo({ size = 'default', showText = true, className = '' }) {
  const sizeClasses = {
    small: 'w-6 h-6',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Replace this div with your logo image */}
      {/* Uncomment below and comment out the div when you add your logo */}
      <img 
        src={logoImage} 
        alt="Community Connect Logo" 
        className={`${sizeClasses[size]} object-contain ${showText ? 'mr-3' : ''}`}
      />
      {/* <div className={`${sizeClasses[size]} bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg ${showText ? 'mr-3' : ''}`}></div> */}
      
      {showText && (
        <span className="text-xl font-bold text-gray-900">
          Community Connect
        </span>
      )}
    </div>
  );
}

export default Logo;