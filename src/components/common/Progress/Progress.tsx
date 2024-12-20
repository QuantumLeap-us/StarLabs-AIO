import { forwardRef, useImperativeHandle, useState } from 'react';
import './Progress.css';

interface ProgressProps {
  moduleId: string;
  initialTotal?: number;
}

interface ProgressStats {
  current: number;
  total: number;
  success: number;
  failed: number;
}

export interface ProgressRef {
  setTotal: (total: number) => void;
  setCurrent: (current: number) => void;
  increment: () => void;
  reset: () => void;
  updateStats: (success: number, failed: number) => void;
}

const Progress = forwardRef<ProgressRef, ProgressProps>(({ initialTotal = 0 }, ref) => {
  const [progress, setProgress] = useState<ProgressStats>({ 
    current: 0, 
    total: initialTotal,
    success: 0,
    failed: 0
  });

  useImperativeHandle(ref, () => ({
    setTotal: (total: number) => {
      setProgress(prev => ({ ...prev, total }));
    },
    setCurrent: (current: number) => {
      setProgress(prev => ({ ...prev, current: Math.min(current, prev.total) }));
    },
    increment: () => {
      setProgress(prev => ({
        ...prev,
        current: Math.min(prev.current + 1, prev.total)
      }));
    },
    updateStats: (success: number, failed: number) => {
      setProgress(prev => ({ ...prev, success, failed }));
    },
    reset: () => {
      setProgress(prev => ({ ...prev, current: 0, success: 0, failed: 0 }));
    }
  }));

  return (
    <div className="status-section">
      <div className="status-box">
        <div className="status-label">PROGRESS</div>
        <div className="status-counter">
          <div className="status-numbers">
            <span className="current">{progress.current}</span>
            <span className="separator">/</span>
            <span className="total">{progress.total}</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` 
              }}
            />
          </div>
          <div className="status-details">
            <div className="status-detail success">
              <span className="detail-label">Success:</span>
              <span className="detail-value">
                {progress.success}
                <span className="detail-total">/{progress.total}</span>
              </span>
            </div>
            <div className="status-detail failed">
              <span className="detail-label">Failed:</span>
              <span className="detail-value">
                {progress.failed}
                <span className="detail-total">/{progress.total}</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default Progress; 