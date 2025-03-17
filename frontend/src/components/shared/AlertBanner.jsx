import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Optional but recommended for type checking

/**
 * Alert Banner Component
 * @param {string} message - The message to display in the alert
 * @param {string} type - The type of alert (success, error, warning, info)
 * @param {number} duration - How long the alert should be displayed in ms (0 for no auto-dismiss)
 * @param {function} onDismiss - Callback function when the alert is dismissed
 */
const AlertBanner = ({ message, type = 'info', duration = 0, onDismiss = null }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Reset visibility when message changes
        setVisible(true);
        
        // Set up auto-dismiss if duration is provided
        if (duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onDismiss) onDismiss();
            }, duration);
            
            // Clean up timer on unmount or when message changes
            return () => clearTimeout(timer);
        }
    }, [message, duration, onDismiss]);

    const handleDismiss = () => {
        setVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!visible) return null;

    // Define styles based on type
    const alertStyles = {
        success: { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#34d399' },
        error: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#f87171' },
        warning: { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fbbf24' },
        info: { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#60a5fa' },
    };

    const containerStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderRadius: '8px',
        border: '1px solid',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        marginBottom: '16px',
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
        ...alertStyles[type],
    };

    const iconStyle = {
        marginRight: '12px',
        fontSize: '20px',
    };

    const messageStyle = {
        flex: 1,
        fontSize: '14px',
        fontWeight: '500',
    };

    const dismissButtonStyle = {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'inherit',
        fontSize: '16px',
        marginLeft: '12px',
    };

    return (
        <div style={containerStyle}>
            <div style={iconStyle}>
                {type === 'success' && <i className="fas fa-check-circle"></i>}
                {type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                {type === 'info' && <i className="fas fa-info-circle"></i>}
            </div>
            <div style={messageStyle}>{message}</div>
            <button style={dismissButtonStyle} onClick={handleDismiss}>
                <i className="fas fa-times"></i>
            </button>
        </div>
    );
};

AlertBanner.propTypes = {
    message: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
    duration: PropTypes.number,
    onDismiss: PropTypes.func
};

export default AlertBanner;