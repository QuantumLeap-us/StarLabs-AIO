import React from 'react';
import { ProxyCheckerStatus } from '../types';

interface StatusBarProps {
  status: ProxyCheckerStatus;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  const progress = status.total > 0 
    ? Math.round((status.checked / status.total) * 100) 
    : 0;

  return (
    <div className="status-bar">
      <div className="status-info">
        <div className="status-item">
          <span className="status-label">Total:</span>
          <span className="status-value">{status.total}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Checked:</span>
          <span className="status-value">{status.checked}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Valid:</span>
          <span className="status-value success">{status.valid}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Invalid:</span>
          <span className="status-value error">{status.invalid}</span>
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default StatusBar; 