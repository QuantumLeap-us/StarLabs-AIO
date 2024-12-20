import React from 'react';

interface ProxyProgressProps {
  total: number;
  checked: number;
  success: number;
  error: number;
}

const ProxyProgress: React.FC<ProxyProgressProps> = ({ total, checked, success, error }) => {
  const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

  return (
    <div className="proxy-progress">
      <div className="proxy-progress-label">PROGRESS</div>
      <div className="proxy-progress-counter">
        <div className="proxy-progress-numbers">
          <span className="proxy-progress-current">{checked}</span>
          <span className="proxy-progress-separator">/</span>
          <span className="proxy-progress-total">{total}</span>
        </div>
        <div className="proxy-progress-bar">
          <div 
            className="proxy-progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="proxy-progress-details">
          <div className="proxy-progress-detail success">
            <span className="proxy-detail-label">Success:</span>
            <span className="proxy-detail-value">
              {success}
              <span className="proxy-detail-total">/{total}</span>
            </span>
          </div>
          <div className="proxy-progress-detail error">
            <span className="proxy-detail-label">Error:</span>
            <span className="proxy-detail-value">
              {error}
              <span className="proxy-detail-total">/{total}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProxyProgress; 