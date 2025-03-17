import React from 'react';
import PropTypes from 'prop-types'; // Optional but recommended for type checking

/**
 * LoadingSpinner Component
 * @param {string} size - The size of the spinner (small, medium, large)
 * @param {string} message - Optional message to display below the spinner
 * @param {boolean} overlay - Whether to display the spinner as an overlay
 */
const LoadingSpinner = ({ size = 'medium', message = 'Loading...', overlay = false }) => {
    // Define sizes for the spinner
    const sizeStyles = {
        small: { width: '24px', height: '24px', borderWidth: '3px' },
        medium: { width: '40px', height: '40px', borderWidth: '4px' },
        large: { width: '60px', height: '60px', borderWidth: '6px' },
    };

    // Spinner container styles
    const containerStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
    };

    // Spinner animation styles
    const spinnerStyle = {
        border: `${sizeStyles[size].borderWidth} solid rgba(0, 0, 0, 0.1)`,
        borderTop: `${sizeStyles[size].borderWidth} solid #3b82f6`, // Blue color for the spinner
        borderRadius: '50%',
        width: sizeStyles[size].width,
        height: sizeStyles[size].height,
        animation: 'spin 1s linear infinite',
    };

    // Message styles
    const messageStyle = {
        fontSize: size === 'small' ? '12px' : '14px',
        color: '#4b5563', // Gray color for the message
        fontWeight: '500',
    };

    // Overlay styles
    const overlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent white overlay
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    };

    // Keyframes for the spin animation (added inline)
    const spinKeyframes = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;

    // Spinner content
    const spinnerContent = (
        <div style={containerStyle}>
            {/* Inject spin keyframes */}
            <style>{spinKeyframes}</style>
            <div style={spinnerStyle}></div>
            {message && <div style={messageStyle}>{message}</div>}
        </div>
    );

    // Render with or without overlay
    if (overlay) {
        return <div style={overlayStyle}>{spinnerContent}</div>;
    }

    return spinnerContent;
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    message: PropTypes.string,
    overlay: PropTypes.bool,
};

export default LoadingSpinner;