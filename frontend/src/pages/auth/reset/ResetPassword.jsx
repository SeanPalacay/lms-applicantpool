import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, EyeOff, Eye, AlertCircle, Loader, ArrowLeft, Check } from 'lucide-react';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [checking, setChecking] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Extract token and email from URL query parameters or session storage
    const queryParams = new URLSearchParams(location.search);
    const urlToken = queryParams.get('token');
    const urlEmail = queryParams.get('email');
    
    // Use token from URL or from session storage
    const token = urlToken || sessionStorage.getItem('resetToken');
    const email = urlEmail || sessionStorage.getItem('resetEmail');

    // Check token on component mount
    useEffect(() => {
        const checkToken = async () => {
            // If there's no token or email, show error
            if (!token || !email) {
                setError('No reset token found. Please request a new password reset.');
                setChecking(false);
                return;
            }

            // We'll assume the token is valid if we have it
            // In a real application, you could validate it against the server here
            setTokenValid(true);
            setChecking(false);
        };

        checkToken();
    }, [token, email]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate password
        if (!password) {
            setError('Please enter a new password');
            setLoading(false);
            return;
        }

        // Check password strength
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        // Validate password match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Prepare payload
            const payload = {
                token: token,
                email: email,
                password: password
            };

            // Send request
            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/reset_password.php`;
            
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

            console.log('Password reset successful!', data);
            
            // Clear the token from session storage
            sessionStorage.removeItem('resetToken');
            sessionStorage.removeItem('resetEmail');
            
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

    const goToForgotPassword = () => {
        navigate('/forgot');
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
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

                    <h2 className="login-heading">Reset Password</h2>
                    
                    {checking ? (
                        <div className="checking-token" style={{ 
                            textAlign: 'center', 
                            padding: '24px 0',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            <Loader size={24} className="loading-spinner" />
                            <p>Verifying your information...</p>
                        </div>
                    ) : success ? (
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
                            <h3 style={{ margin: '0', color: '#2f855a' }}>Password Reset Successful</h3>
                            <p style={{ textAlign: 'center', margin: '0', color: '#4a5568' }}>
                                Your password has been successfully reset. You can now login with your new password.
                            </p>
                            <button
                                onClick={goToLogin}
                                className="login-button"
                                style={{ marginTop: '16px' }}
                            >
                                Go to Login
                            </button>
                        </div>
                    ) : !tokenValid ? (
                        <div 
                            className="error-message"
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '16px',
                                backgroundColor: '#fff5f5',
                                border: '1px solid #fed7d7',
                                borderRadius: '8px',
                                padding: '24px',
                                marginTop: '24px'
                            }}
                        >
                            <div 
                                className="error-icon"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    backgroundColor: '#fc8181',
                                    color: 'white'
                                }}
                            >
                                <AlertCircle size={24} />
                            </div>
                            <h3 style={{ margin: '0', color: '#c53030' }}>Invalid Reset Request</h3>
                            <p style={{ textAlign: 'center', margin: '0', color: '#4a5568' }}>
                                {error || 'No valid reset token found. Please start the password reset process again.'}
                            </p>
                            <button
                                onClick={goToForgotPassword}
                                className="login-button"
                                style={{ marginTop: '16px' }}
                            >
                                Start New Password Reset
                            </button>
                        </div>
                    ) : (
                        <>
                            <p className="login-subheading">Create a new password for your account</p>
                            <form className="login-form" onSubmit={handleSubmit}>
                                <div className="login-input-container">
                                    <label htmlFor="password" className="login-label">New Password</label>
                                    <div className="input-wrapper">
                                        <span className="login-input-icon">
                                            <Lock size={18} />
                                        </span>
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="login-input"
                                            placeholder="Enter your new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={toggleShowPassword}
                                            title={showPassword ? "Hide password" : "Show password"}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="login-input-container">
                                    <label htmlFor="confirmPassword" className="login-label">Confirm Password</label>
                                    <div className="input-wrapper">
                                        <span className="login-input-icon">
                                            <Lock size={18} />
                                        </span>
                                        <input
                                            id="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="login-input"
                                            placeholder="Confirm your new password"
                                            required
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={toggleShowConfirmPassword}
                                            title={showConfirmPassword ? "Hide password" : "Show password"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
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
                                            <span>Resetting Password...</span>
                                        </>
                                    ) : (
                                        'Reset Password'
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

export default ResetPassword;