import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, AlertCircle, Loader, ArrowLeft, Check } from 'lucide-react';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate email
        if (!email) {
            setError('Please enter your email address');
            setLoading(false);
            return;
        }

        try {
            // Prepare payload
            const payload = {
                email: email
            };

            console.log('Submitting password reset request for:', email);

            // Send request
            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/forgot_password.php`;
            console.log('Submitting to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            // Check if the response is JSON
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Not JSON, likely an error page
                const text = await response.text();
                console.error('Non-JSON response:', text);
                throw new Error('Server returned an invalid response. Please try again later.');
            }

            // Handle JSON response
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `Request failed: ${response.status} ${response.statusText}`);
            }

            console.log('Password reset request successful!', data);

            // Store the reset token in sessionStorage for security (it's temporary)
            if (data.token && data.email) {
                sessionStorage.setItem('resetToken', data.token);
                sessionStorage.setItem('resetEmail', data.email);
            }

            setSuccess(true);
        } catch (error) {
            console.error('Password reset error:', error);
            setError(error.message || 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const goToLogin = () => {
        navigate('/login');
    };

    const goToResetPassword = () => {
        navigate('/reset');
    };

    return (
        <div className="login-container">
            <div className="login-image-section">
                <div className="login-overlay">
                    <h1 className="login-title">
                        Learning
                        <span className="login-title-highlight">Management</span>
                        System
                    </h1>
                </div>
            </div>

            <div className="login-form-section">
                <div className="login-form-wrapper">
                    <div className="login-logo-container">
                        <img src="/assets/images/logocolor.png" alt="LMS Logo" className="login-logo" />
                    </div>

                    <button 
                        onClick={goToLogin} 
                        className="back-button"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'transparent',
                            border: 'none',
                            color: '#666',
                            cursor: 'pointer',
                            padding: '8px 0',
                            marginBottom: '24px',
                            fontSize: '14px'
                        }}
                    >
                        <ArrowLeft size={16} />
                        <span>Back to Login</span>
                    </button>

                    <h2 className="login-heading">Forgot Password</h2>

                    {success ? (
                        <div 
                            className="success-message"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px',
                                backgroundColor: '#f0fff4',
                                border: '1px solid #c6f6d5',
                                borderRadius: '8px',
                                padding: '24px',
                                marginTop: '24px'
                            }}
                        >
                            <div 
                                className="success-icon"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#68d391',
                                    color: 'white'
                                }}
                            >
                                <Check size={24} />
                            </div>
                            <h3 style={{ margin: '0', color: '#2f855a' }}>Account Found</h3>
                            <p style={{ textAlign: 'center', margin: '0', color: '#4a5568' }}>
                                We've verified your email address <strong>{email}</strong>. 
                                You can now proceed to reset your password.
                            </p>
                            <button
                                onClick={goToResetPassword}
                                className="login-button"
                                style={{ marginTop: '16px' }}
                            >
                                Proceed to Reset Password
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="login-subheading">
                                Enter your account email to reset your password
                            </p>
                            <form className="login-form" onSubmit={handleSubmit}>
                                <div className="login-input-container">
                                    <label htmlFor="email" className="login-label">Email Address</label>
                                    <div className="input-wrapper">
                                        <span className="login-input-icon">
                                            <Mail size={18} />
                                        </span>
                                        <input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="login-input"
                                            placeholder="Enter your email address"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="login-error">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="login-button"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader size={18} className="loading-spinner" />
                                            <span>Verifying...</span>
                                        </>
                                    ) : (
                                        'Continue'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;