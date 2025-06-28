import React from 'react';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "text-carmine" }) => {
  return (
    <div className="flex justify-center items-center">
      <div className={`loading-spinner ${className}`}></div>
    </div>
  );
};

export default LoadingSpinner;
