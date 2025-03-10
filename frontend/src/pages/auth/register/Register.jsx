import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './register.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        role: 'applicant' // Default role
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    // API endpoint
    const API_URL = 'http://localhost:8080/lms-forbes/backend/api/auth/register.php';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        // Validate form data
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.username || !formData.password) {
            setError('All fields are required');
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            // Prepare data for submission
            const payload = {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                username: formData.username,
                password: formData.password,
                role: formData.role,
                full_name: `${formData.firstName} ${formData.lastName}`
            };

            console.log('Submitting registration:', { ...payload, password: '***' });

            const response = await axios.post(API_URL, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Registration successful:', response.data);
            setSuccess('Registration successful! You can now log in.');
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            console.error('Registration error:', error);
            
            if (error.response) {
                setError(error.response.data.error || 'Registration failed. Please try again.');
            } else if (error.request) {
                setError('Network error: Could not connect to the server.');
            } else {
                setError('An unexpected error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-image-section">
                <div className="register-overlay">
                    <h1 className="register-title">
                        Join Our
                        <span className="register-title-highlight"> Learning </span>
                        Community
                    </h1>
                </div>
            </div>

            <div className="register-form-section">
                <div className="register-logo-container">
                    <img src="/assets/images/logocolor.png" alt="JMH Logo" className="register-logo" />
                </div>

                <h2 className="register-heading">Create an Account</h2>

                <div className="register-form-container">
                    <form onSubmit={handleSubmit}>
                        <div className="register-input-row">
                            <div className="register-input-container">
                                <input
                                    type="text"
                                    name="firstName"
                                    placeholder="First Name"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    className="register-input"
                                    required
                                />
                            </div>

                            <div className="register-input-container">
                                <input
                                    type="text"
                                    name="lastName"
                                    placeholder="Last Name"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    className="register-input"
                                    required
                                />
                            </div>
                        </div>

                        <div className="register-input-container">
                            <input
                                type="text"
                                name="username"
                                placeholder="Username"
                                value={formData.username}
                                onChange={handleChange}
                                className="register-input"
                                required
                            />
                            <span className="register-input-icon">
                                <i className="fas fa-user"></i>
                            </span>
                        </div>

                        <div className="register-input-container">
                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={formData.email}
                                onChange={handleChange}
                                className="register-input"
                                required
                            />
                            <span className="register-input-icon">
                                <i className="fas fa-envelope"></i>
                            </span>
                        </div>

                        <div className="register-input-container">
                            <input
                                type="password"
                                name="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                                className="register-input"
                                required
                            />
                            <span className="register-input-icon">
                                <i className="fas fa-lock"></i>
                            </span>
                        </div>

                        <div className="register-input-container">
                            <input
                                type="password"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="register-input"
                                required
                            />
                            <span className="register-input-icon">
                                <i className="fas fa-lock"></i>
                            </span>
                        </div>

                        <div className="register-role-container">
                            <label className="register-role-label">Select your role:</label>
                            <div className="register-role-options">
                                <div className="register-role-option">
                                    <input
                                        type="radio"
                                        id="administrator"
                                        name="role"
                                        value="administrator"
                                        checked={formData.role === 'administrator'}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="administrator">Administrator</label>
                                </div>
                                
                                <div className="register-role-option">
                                    <input
                                        type="radio"
                                        id="trainer"
                                        name="role"
                                        value="trainer"
                                        checked={formData.role === 'trainer'}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="trainer">Trainer</label>
                                </div>
                                
                                <div className="register-role-option">
                                    <input
                                        type="radio"
                                        id="trainee"
                                        name="role"
                                        value="trainee"
                                        checked={formData.role === 'trainee'}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="trainee">Trainee</label>
                                </div>

                                <div className="register-role-option">
                                    <input
                                        type="radio"
                                        id="applicant"
                                        name="role"
                                        value="applicant"
                                        checked={formData.role === 'applicant'}
                                        onChange={handleChange}
                                    />
                                    <label htmlFor="applicant">Applicant</label>
                                </div>
                            </div>
                        </div>

                        {error && <div className="register-error">{error}</div>}
                        {success && <div className="register-success">{success}</div>}

                        <div className="register-footer">
                            Already have an account? <Link to="/login" className="register-link">Log In</Link>
                        </div>

                        <button
                            type="submit"
                            className="register-button"
                            disabled={loading}
                        >
                            {loading ? 'REGISTERING...' : 'REGISTER'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;