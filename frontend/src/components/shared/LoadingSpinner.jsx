import React from 'react';
import PropTypes from 'prop-types'; // Optional but recommended for type checking
import './styles/loading.css';

/**
 * LoadingSpinner Component
 * @param {string} size - The size of the spinner (small, medium, large)
 * @param {string} message - Optional message to display below the spinner
 * @param {boolean} overlay - Whether to display the spinner as an overlay
 */
const LoadingSpinner = ({ size = 'medium', message = 'Loading...', overlay = false }) => {
    const spinnerContent = (
        <div className={`loading-container loading-${size}`}>
            <div className="loading-spinner">
                <div className="loading-spinner-inner"></div>
            </div>
            {message && <div className="loading-message">{message}</div>}
        </div>
    );

    if (overlay) {
        return (
            <div className="loading-overlay">
                {spinnerContent}
            </div>
        );
    }

    return spinnerContent;
};

LoadingSpinner.propTypes = {
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    message: PropTypes.string,
    overlay: PropTypes.bool
};

export default LoadingSpinner;