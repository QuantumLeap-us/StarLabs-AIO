import React from 'react';
import './LogsModal.css';

interface LogsModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: string[];
}

const LogsModal = ({ isOpen, onClose, logs }: LogsModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="logs-modal-overlay">
            <div className="logs-modal-content">
                <div className="logs-modal-header">
                    <h3 className="logs-modal-title">Account Logs</h3>
                    <button className="logs-modal-close" onClick={onClose}>×</button>
                </div>
                <div className="logs-modal-container">
                    {logs.map((log, index) => (
                        <div key={index} className="logs-modal-item">
                            {log}
                        </div>
                    ))}
                </div>
                <div className="logs-modal-footer">
                    <button className="logs-modal-button" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default LogsModal; 