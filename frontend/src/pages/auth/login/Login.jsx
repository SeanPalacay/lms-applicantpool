import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, EyeOff, Eye, AlertCircle, Loader, Key } from 'lucide-react';
import './login.css';

// Get API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const Login = () => {
    const [loginMode, setLoginMode] = useState('credentials'); // 'credentials' or 'accessCode'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [accessCode, setAccessCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showAccessCode, setShowAccessCode] = useState(false);
    const navigate = useNavigate();

    // Function to get the correct dashboard path based on role
    const getDashboardPath = (role) => {
        switch (role) {
            case 'administrator':
                return '/administrator-dashboard';
            case 'trainer':
                return '/trainer-dashboard';
            case 'trainee':
                return '/trainee-dashboard';
            case 'employee':
                return '/employee-dashboard'; 
            case 'applicant':
                return '/applicant-dashboard';
            default:
                return '/login';
        }
    };

    const handleCredentialsLogin = async (e) => {
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
            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/login.php`;
            console.log('Logging in to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            await handleLoginResponse(response);
        } catch (error) {
            handleLoginError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccessCodeLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validate input
        if (!accessCode) {
            setError('Please enter your access code');
            setLoading(false);
            return;
        }

        try {
            // Prepare payload - FIXED: using 'code' as the key name
            const payload = {
                code: accessCode
            };

            console.log('Attempting login with access code');

            // Send request
            const url = `${API_BASE_URL}/lms-forbes/backend/api/auth/login_code.php`;
            console.log('Logging in to:', url);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            await handleLoginResponse(response);
        } catch (error) {
            handleLoginError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleLoginResponse = async (response) => {
        // First try to parse the response as JSON
        const contentType = response.headers.get("content-type");
        
        if (!response.ok) {
            if (contentType && contentType.includes("application/json")) {
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Login failed: ${response.status} ${response.statusText}`);
                } catch (e) {
                    if (e instanceof SyntaxError) {
                        // JSON parse error
                        const errorText = await response.text();
                        throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
                    }
                    throw e;
                }
            } else {
                const errorText = await response.text();
                throw new Error(`Login failed: ${response.status} ${response.statusText} - ${errorText}`);
            }
        }

        const data = await response.json();
        console.log('Login successful! Response:', data);

        const { token, role, full_name, user_id } = data;

        // Store auth info 
        localStorage.setItem('authToken', token);
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', full_name);
        localStorage.setItem('userId', user_id);

        // Also store with original keys for backward compatibility
        localStorage.setItem('token', token);
        localStorage.setItem('role', role);
        localStorage.setItem('full_name', full_name);

        // Store login time for token expiration checks
        localStorage.setItem('loginTime', new Date().toISOString());

        // Navigate to the appropriate dashboard based on role
        const dashboardPath = getDashboardPath(role);
        navigate(dashboardPath);
    };

    const handleLoginError = (error) => {
        console.error('Login error:', error);

        // Extract the error message
        let errorMessage = error.message || 'An unexpected error occurred. Please try again.';
        
        // If it's a network error
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            setError('Network error: Could not connect to the server. Please check if the server is running.');
            return;
        }
        
        // If the error message is from our API
        if (errorMessage.includes('Login failed')) {
            // Try to extract the actual error message from our server
            const matches = errorMessage.match(/- (.+)$/);
            if (matches && matches[1]) {
                try {
                    // Try to parse it as JSON
                    const jsonError = JSON.parse(matches[1]);
                    if (jsonError.error) {
                        setError(jsonError.error);
                        return;
                    }
                } catch (e) {
                    // If it's not JSON, use the extracted text
                    setError(matches[1]);
                    return;
                }
            }
            
            // If we can't extract a specific message, provide a generic one based on status
            const status = errorMessage.match(/\d+/)?.[0];
            if (status === '401') {
                setError(loginMode === 'credentials' 
                    ? 'Invalid username or password. Please try again.' 
                    : 'Invalid access code. Please check and try again.');
            } else if (status === '400') {
                setError(loginMode === 'credentials'
                    ? 'Please provide both username and password.'
                    : 'Please provide your access code.');
            } else if (status === '500') {
                setError('Server error: Unable to process your login. Please try again later.');
            } else if (status === '404') {
                setError('Login service not found. Please contact the administrator.');
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } else {
            // Use the error message directly
            setError(errorMessage);
        }
    };

    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const toggleShowAccessCode = () => {
        setShowAccessCode(!showAccessCode);
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

                    <div className="login-mode-toggle" style={{
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    backgroundColor: '#f5f5f5',
    padding: '4px',
    borderRadius: '8px'
}}>
    <button 
        type="button"
        className={`toggle-btn ${loginMode === 'credentials' ? 'active' : ''}`}
        onClick={() => setLoginMode('credentials')}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: loginMode === 'credentials' ? '#fff' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '14px',
            fontWeight: '500',
            color: loginMode === 'credentials' ? '#3b82f6' : '#666',
            flex: '1',
            boxShadow: loginMode === 'credentials' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
        }}
    >
        <User size={16} style={{ strokeWidth: '2.5' }} /> 
        <span style={{ marginTop: '2px' }}>Staff Login</span>
    </button>
    <button 
        type="button"
        className={`toggle-btn ${loginMode === 'accessCode' ? 'active' : ''}`}
        onClick={() => setLoginMode('accessCode')}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: loginMode === 'accessCode' ? '#fff' : 'transparent',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '14px',
            fontWeight: '500',
            color: loginMode === 'accessCode' ? '#3b82f6' : '#666',
            flex: '1',
            boxShadow: loginMode === 'accessCode' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
        }}
    >
        <Key size={16} style={{ strokeWidth: '2.5' }} /> 
        <span style={{ marginTop: '2px' }}>Applicant Login</span>
    </button>
</div>

                    {loginMode === 'credentials' ? (
                        <form className="login-form" onSubmit={handleCredentialsLogin}>
                            <div className="login-input-container">
                                <label htmlFor="username" className="login-label">Username or Email</label>
                                <div className="input-wrapper">
                                    <span className="login-input-icon">
                                        <User size={18} />
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
                                        <Lock size={18} />
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
                    ) : (
                        <form className="login-form" onSubmit={handleAccessCodeLogin}>
                            <div className="login-input-container">
                                <label htmlFor="accessCode" className="login-label">Access Code</label>
                                <div className="input-wrapper">
                                    <span className="login-input-icon">
                                        <Key size={18} />
                                    </span>
                                    <input
                                        id="accessCode"
                                        type={showAccessCode ? "text" : "password"}
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value)}
                                        className="login-input"
                                        placeholder="Enter your access code"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={toggleShowAccessCode}
                                        title={showAccessCode ? "Hide code" : "Show code"}
                                    >
                                        {showAccessCode ? <EyeOff size={18} /> : <Eye size={18} />}
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
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>
                    )}

<div style={{ marginTop: '20px', textAlign: 'center' }}>
  <p style={{ fontSize: '14px', color: '#666' }}>
    Don't have an account? 
    <button 
      type="button" 
      style={{ 
        background: 'none', 
        border: 'none', 
        color: '#007bff', 
        textDecoration: 'underline', 
        cursor: 'pointer', 
        padding: 0, 
        fontSize: '14px' 
      }} 
      onClick={() => navigate('/register')}
    >
      Register here
    </button>
  </p>
</div>
                </div>
            </div>
        </div>
    );
};

export default Login;