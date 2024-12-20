import React from 'react';
import { FiX } from 'react-icons/fi';
import '../styles/CheckTypeModal.css';

interface CheckTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'rabby' | 'debank') => void;
}

export const CheckTypeModal: React.FC<CheckTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="check-type-modal-overlay">
      <div className="check-type-modal">
        <button className="check-type-modal-close" onClick={onClose}>
          <FiX size={20} />
        </button>
        <h2>Select Check Type</h2>
        <div className="check-type-buttons">
          <button 
            className="check-type-btn rabby"
            onClick={() => onSelect('rabby')}
          >
            Rabby
          </button>
          <button 
            className="check-type-btn debank"
            onClick={() => onSelect('debank')}
          >
            DeBank
          </button>
        </div>
      </div>
    </div>
  );
}; 