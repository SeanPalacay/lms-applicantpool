import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Optional but recommended for type checking
import './styles/alertbanner.css';

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

    return (
        <div className={`alert-banner alert-${type}`}>
            <div className="alert-icon">
                {type === 'success' && <i className="fas fa-check-circle"></i>}
                {type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {type === 'warning' && <i className="fas fa-exclamation-triangle"></i>}
                {type === 'info' && <i className="fas fa-info-circle"></i>}
            </div>
            <div className="alert-message">{message}</div>
            <button className="alert-dismiss" onClick={handleDismiss}>
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