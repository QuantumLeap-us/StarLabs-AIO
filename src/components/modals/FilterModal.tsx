import React, { useState } from 'react';
import { FiX, FiLock } from 'react-icons/fi';
import { FaQuestion, FaSkull } from 'react-icons/fa';
import './FilterModal.css';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onFilter: (selectedStatuses: string[]) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, onFilter }) => {
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

    const toggleStatus = (status: string) => {
        setSelectedStatuses(prev => 
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const handleFilter = () => {
        onFilter(selectedStatuses);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="filter-modal-overlay" onClick={onClose}>
            <div className="filter-modal-content" onClick={e => e.stopPropagation()}>
                <div className="filter-modal-container">
                    <h2 className="filter-modal-title">Filter</h2>
                    <p className="filter-modal-description">
                        Select accounts to be removed from the database
                    </p>
                    
                    <div className="filter-modal-options">
                        <button 
                            className={`filter-modal-option wrong-token ${
                                selectedStatuses.includes('wrong token') ? 'selected' : ''
                            }`}
                            onClick={() => toggleStatus('wrong token')}
                        >
                            <FaQuestion className="filter-modal-icon" />
                            Wrong token
                        </button>

                        <button 
                            className={`filter-modal-option suspended ${
                                selectedStatuses.includes('suspended') ? 'selected' : ''
                            }`}
                            onClick={() => toggleStatus('suspended')}
                        >
                            <FaSkull className="filter-modal-icon" />
                            Suspended
                        </button>

                        <button 
                            className={`filter-modal-option locked ${
                                selectedStatuses.includes('locked') ? 'selected' : ''
                            }`}
                            onClick={() => toggleStatus('locked')}
                        >
                            <FiLock className="filter-modal-icon" />
                            Locked
                        </button>
                    </div>

                    <div className="filter-modal-actions">
                        <button 
                            className="filter-modal-button cancel" 
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button 
                            className="filter-modal-button confirm" 
                            onClick={handleFilter}
                            disabled={selectedStatuses.length === 0}
                        >
                            Filter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilterModal; 