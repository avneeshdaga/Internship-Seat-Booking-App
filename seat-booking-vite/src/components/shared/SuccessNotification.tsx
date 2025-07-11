import React, { useEffect } from 'react';
import { useSeatStore } from '../../hooks/useSeatStore';

const SuccessNotification: React.FC = () => {
  const { showSuccessAnimation, successMessage, hideSuccess } = useSeatStore();

  useEffect(() => {
    if (showSuccessAnimation) {
      const timer = setTimeout(() => {
        hideSuccess();
      }, 2000); // Hide after 2 seconds

      return () => clearTimeout(timer);
    }
  }, [showSuccessAnimation, hideSuccess]);

  if (!showSuccessAnimation) return null;

  return (
    <div className="success-notification">
      <div className="success-content">
        <div className="success-icon">✅</div>
        <div className="success-text">
          {successMessage.split('\n').map((line, index) => (
            <div key={index} className={index === 0 ? 'success-title' : 'success-detail'}>
              {line}
            </div>
          ))}
        </div>
        <button 
          className="success-close"
          onClick={hideSuccess}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default SuccessNotification;