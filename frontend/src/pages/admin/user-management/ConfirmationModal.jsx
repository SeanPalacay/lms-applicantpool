import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning'
}) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  const handleContentClick = (e) => e.stopPropagation();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }} onClick={onCancel}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        width: '400px',
        maxWidth: '90%',
        padding: '24px',
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        color: '#1e293b'
      }} onClick={handleContentClick}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{title}</h3>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          {type === 'warning' && (
            <div style={{ backgroundColor: '#fef5e7', borderRadius: '9999px', padding: '12px', color: '#f39c12' }}>
              <AlertTriangle size={24} />
            </div>
          )}
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, textAlign: 'center' }}>{message}</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
          <button
            onClick={onCancel}
            style={{
              backgroundColor: '#ffffff',
              color: '#1E88E5',
              padding: '8px 16px',
              border: '1px solid #1E88E5',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.3s ease',
              ':hover': { backgroundColor: '#E3F2FD' }
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              backgroundColor: type === 'danger' ? '#e74c3c' : '#1E88E5',
              color: '#ffffff',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'background-color 0.3s ease',
              ':hover': type === 'danger' ? { backgroundColor: '#c0392b' } : { backgroundColor: '#1565C0' }
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;