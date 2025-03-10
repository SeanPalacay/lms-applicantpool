import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './login.css';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
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

// Replace your existing handleLogin function with this one

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
                <div className="login-logo-container">
                    <img src="/assets/images/logocolor.png" alt="JMH Logo" className="login-logo" />
                </div>

                <h2 className="login-heading">Log In</h2>

                <div className="login-form-container">
                    <div className="login-input-container">
                        <input
                            type="text"
                            placeholder="Username or Email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="login-input"
                            required
                        />
                        <span className="login-input-icon">
                            <i className="fas fa-user"></i>
                        </span>
                    </div>

                    <div className="login-input-container">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            required
                        />
                        <span className="login-input-icon">
                            <i className="fas fa-lock"></i>
                        </span>
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <div className="login-footer">
                        Don't have an account? <Link to="/register" className="login-link">Register now</Link>
                    </div>

                    <button
                        type="submit"
                        className="login-button"
                        onClick={handleLogin}
                        disabled={loading}
                    >
                        {loading ? 'LOGGING IN...' : 'LOG IN'}
                    </button>
                    
                    <div className="login-register-button-container">
                        <Link to="/register" className="login-register-button">
                            REGISTER NEW ACCOUNT
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;