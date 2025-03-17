import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, EyeOff, Eye, AlertCircle, Loader } from 'lucide-react';
import './login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // API endpoint
    const API_URL = 'http://localhost:8080/lms-forbes/backend/api/auth/login.php';

    // Function to get the correct dashboard path based on role
    const getDashboardPath = (role) => {
        switch (role) {
            case 'administrator':
                return '/administrator-dashboard';
            case 'trainer':
                return '/trainer-dashboard';
            case 'trainee':
                return '/trainee-dashboard';
            case 'applicant':
                return '/applicant-dashboard';
            default:
                return '/login';
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate inputs
        if (!username || !password) {
            setError('Please enter both username and password');
            setLoading(false);
            return;
        }

        try {
            // Prepare payload
            const payload = {
                username: username,
                password: password
            };

            console.log('Attempting login with:', { 
                username: username,
                password_length: password.length
            });

            // Send request
            const response = await axios.post(API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            });
            
            console.log('Login successful! Response:', response.data);

            const { token, role, full_name } = response.data;
            
            // Store auth info with CORRECT keys for AdminDashboard.jsx and adminService.js
            localStorage.setItem('authToken', token);  // This is used in the dashboard
            localStorage.setItem('userRole', role);    // This is used in the dashboard
            localStorage.setItem('userName', full_name);
            
            // Also store with original keys for backward compatibility
            localStorage.setItem('token', token);
            localStorage.setItem('role', role);
            localStorage.setItem('full_name', full_name);
            
            // Store login time for token expiration checks
            localStorage.setItem('loginTime', new Date().toISOString());
            
            // Navigate to the appropriate dashboard based on role
            const dashboardPath = getDashboardPath(role);
            navigate(dashboardPath);
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle different error types
            if (error.response) {
                // Server responded with error
                console.error('Server response:', {
                    status: error.response.status,
                    data: error.response.data,
                    headers: error.response.headers
                });
                
                if (error.response.status === 401) {
                    setError('Invalid username or password. Please try again.');
                } else if (error.response.status === 400) {
                    setError('Please provide both username and password.');
                } else {
                    setError(error.response.data.error || 'Login failed. Please check your credentials.');
                }
            } else if (error.request) {
                // No response received
                console.error('No response received:', error.request);
                setError('Network error: Could not connect to the server. Please check if the server is running.');
            } else {
                // Something else happened
                console.error('Error setting up request:', error.message);
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
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
                        <img src="/assets/images/logocolor.png" alt="JMH Logo" className="login-logo" />
                    </div>

                    <h2 className="login-heading">Welcome Back</h2>
                    <p className="login-subheading">Sign in to continue to your dashboard</p>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="login-input-container">
                            <label htmlFor="username" className="login-label">Username or Email</label>
                            <div className="input-wrapper">
                                <span className="login-input-icon">
                                    <i className="fas fa-user"></i>
                                </span>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="login-input"
                                    placeholder="Enter your username or email"
                                    required
                                />
                            </div>
                        </div>

                        <div className="login-input-container">
                            <label htmlFor="password" className="login-label">Password</label>
                            <div className="input-wrapper">
                                <span className="login-input-icon">
                                    <i className="fas fa-lock"></i>
                                </span>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="login-input"
                                    placeholder="Enter your password"
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

                        {error && (
                            <div className="login-error">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* <div className="login-options">
                            <div className="remember-me">
                                <input type="checkbox" id="remember" className="remember-checkbox" />
                                <label htmlFor="remember">Remember me</label>
                            </div>
                            <a href="#" className="forgot-password">Forgot password?</a>
                        </div> */}

                        <button
                            type="submit"
                            className="login-button"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader size={18} className="loading-spinner" />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="login-divider">
                        <span>OR</span>
                    </div>

                    <Link to="/register" className="register-button">
                        Create Account
                    </Link>

                    <p className="login-footer">
                        Don't have an account? <Link to="/register" className="login-link">Register now</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;