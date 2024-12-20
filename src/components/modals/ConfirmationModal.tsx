import { FiX, FiCheck } from 'react-icons/fi';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
}

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }: ConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="confirmation-modal">
                <div className="modal-header">
                    <h3>{title}</h3>
                </div>
                
                <div className="modal-content">
                    <p className="confirmation-message">{message}</p>
                </div>

                <div className="modal-footer">
                    <button className="modal-btn cancel-btn" onClick={onClose}>
                        <FiX size={16} />
                        Cancel
                    </button>
                    <button className="modal-btn confirm-btn" onClick={onConfirm}>
                        <FiCheck size={16} />
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;