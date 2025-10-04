// components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = '' }) => {
  const sizeClasses = {
    small: 'w-6 h-6 border-2',
    medium: 'w-8 h-8 border-3',
    large: 'w-12 h-12 border-4',
  }[size] || 'w-8 h-8 border-3';

  const textClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
  }[size] || 'text-base';

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses}`}
      ></div>
      {text && <p className={`text-gray-500 font-medium ${textClass}`}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;