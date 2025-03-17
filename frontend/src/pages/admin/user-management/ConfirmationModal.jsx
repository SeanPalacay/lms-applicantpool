import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import './styles/ConfirmationModal.css';

const ConfirmationModal = ({ 
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'  // Can be 'warning', 'danger', 'info'
}) => {
  // Lock scrolling when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);
  
  // Close modal if Escape key is pressed
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onCancel]);
  
  // Prevent click propagation from modal content to backdrop
  const handleContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={handleContentClick}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="close-button" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          {type === 'warning' && (
            <div className="modal-icon warning">
              <AlertTriangle size={24} />
            </div>
          )}
          
          <p className="modal-message">{message}</p>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-button" onClick={onCancel}>
            {cancelText}
          </button>
          <button 
            className={`confirm-button ${type === 'danger' ? 'danger' : ''}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;