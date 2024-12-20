import { FiCheck, FiX } from 'react-icons/fi'
import { useState } from 'react'

interface EditModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (value: string) => void
  value: string
  type: 'Token' | 'Proxy'
}

const EditModal = ({ isOpen, onClose, onSave, value, type }: EditModalProps) => {
  const [inputValue, setInputValue] = useState(value)
  
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Edit {type}</h3>
        </div>
        
        <div className="modal-divider"></div>
        
        <div className="modal-body">
          <input 
            type="text" 
            className="modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={`Enter ${type.toLowerCase()}`}
          />
        </div>
        
        <div className="modal-footer">
          <button className="modal-btn save-btn" onClick={() => onSave(inputValue)}>
            <FiCheck size={16} />
            Save
          </button>
          <button className="modal-btn cancel-btn" onClick={onClose}>
            <FiX size={16} />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditModal