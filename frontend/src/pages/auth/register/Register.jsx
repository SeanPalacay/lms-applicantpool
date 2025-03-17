import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { 
    User, 
    Mail, 
    Lock, 
    Eye, 
    EyeOff, 
    AlertCircle, 
    CheckCircle, 
    ArrowRight, 
    ArrowLeft, 
    Check, 
    ShieldCheck, 
    BookOpen, 
    GraduationCap, 
    UserPlus,
    Loader
} from 'lucide-react';
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState('');

    // API endpoint
    const API_URL = 'http://localhost:8080/lms-forbes/backend/api/auth/register.php';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });

        if (name === 'password') {
            checkPasswordStrength(value);
        }
    };

    const checkPasswordStrength = (password) => {
        if (!password) {
            setPasswordStrength(0);
            setPasswordFeedback('');
            return;
        }

        // Calculate strength (basic implementation)
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 25;
        
        // Character variety checks
        if (/[A-Z]/.test(password)) strength += 25; // Uppercase
        if (/[0-9]/.test(password)) strength += 25; // Numbers
        if (/[^A-Za-z0-9]/.test(password)) strength += 25; // Special chars
        
        setPasswordStrength(strength);
        
        // Set feedback message
        if (strength < 25) {
            setPasswordFeedback('Weak: Try a longer password');
        } else if (strength < 50) {
            setPasswordFeedback('Fair: Add uppercase letters and numbers');
        } else if (strength < 75) {
            setPasswordFeedback('Good: Add special characters');
        } else {
            setPasswordFeedback('Strong password!');
        }
    };

    // Handle form navigation
    const nextStep = (e) => {
        e.preventDefault();
        
        // Validate first step
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.email) {
                setError('Please fill out all fields');
                return;
            }
            
            if (!isValidEmail(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
        }
        
        setError('');
        setStep(step + 1);
    };

    const prevStep = (e) => {
        e.preventDefault();
        setError('');
        setStep(step - 1);
    };

    const isValidEmail = (email) => {
        return /\S+@\S+\.\S+/.test(email);
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

    // Toggle password visibility
    const toggleShowPassword = () => {
        setShowPassword(!showPassword);
    };
    
    const toggleShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    // Render progress indicator
    const renderProgress = () => {
        return (
            <div className="register-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <span className="step-label">Personal Info</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <span className="step-label">Account Setup</span>
                </div>
                <div className="progress-line"></div>
                <div className={`progress-step ${step === 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <span className="step-label">Role Selection</span>
                </div>
            </div>
        );
    };

    // Render step 1 - Personal Information
    const renderStepOne = () => {
        return (
            <>
                <div className="register-input-row">
                    <div className="register-input-container">
                        <label htmlFor="firstName" className="register-label">First Name</label>
                        <input
                            type="text"
                            id="firstName"
                            name="firstName"
                            placeholder="Enter first name"
                            value={formData.firstName}
                            onChange={handleChange}
                            className="register-input"
                            required
                        />
                    </div>

                    <div className="register-input-container">
                        <label htmlFor="lastName" className="register-label">Last Name</label>
                        <input
                            type="text"
                            id="lastName"
                            name="lastName"
                            placeholder="Enter last name"
                            value={formData.lastName}
                            onChange={handleChange}
                            className="register-input"
                            required
                        />
                    </div>
                </div>

                <div className="register-input-container">
                    <label htmlFor="email" className="register-label">Email Address</label>
                    <div className="input-wrapper">
                        <span className="register-input-icon">
                            <Mail size={18} />
                        </span>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email address"
                            value={formData.email}
                            onChange={handleChange}
                            className="register-input"
                            required
                        />
                    </div>
                </div>
                
                <div className="form-navigation">
                    <button
                        type="button"
                        className="register-next-button"
                        onClick={nextStep}
                    >
                        Continue to Account Setup
                        <ArrowRight size={18} />
                    </button>
                </div>
            </>
        );
    };

    // Render step 2 - Account Setup
    const renderStepTwo = () => {
        return (
            <>
                <div className="register-input-container">
                    <label htmlFor="username" className="register-label">Username</label>
                    <div className="input-wrapper">
                        <span className="register-input-icon">
                            <User size={18} />
                        </span>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Choose a username"
                            value={formData.username}
                            onChange={handleChange}
                            className="register-input"
                            required
                        />
                    </div>
                </div>

                <div className="register-input-container">
                    <label htmlFor="password" className="register-label">Password</label>
                    <div className="input-wrapper">
                        <span className="register-input-icon">
                            <Lock size={18} />
                        </span>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            className="register-input"
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
                    
                    {formData.password && (
                        <div className="password-strength">
                            <div className="strength-bar">
                                <div className="strength-fill" style={{ width: `${passwordStrength}%`, background: passwordStrength < 25 ? '#e74c3c' : passwordStrength < 50 ? '#f39c12' : passwordStrength < 75 ? '#3498db' : '#2ecc71' }}></div>
                            </div>
                            <span className="strength-text" style={{ color: passwordStrength < 25 ? '#e74c3c' : passwordStrength < 50 ? '#f39c12' : passwordStrength < 75 ? '#3498db' : '#2ecc71' }}>{passwordFeedback}</span>
                        </div>
                    )}
                </div>

                <div className="register-input-container">
                    <label htmlFor="confirmPassword" className="register-label">Confirm Password</label>
                    <div className="input-wrapper">
                        <span className="register-input-icon">
                            <i className="fas fa-lock"></i>
                        </span>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="register-input"
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
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <div className="password-mismatch">Passwords do not match</div>
                    )}
                </div>

                <div className="form-navigation">
                    <button
                        type="button"
                        className="register-back-button"
                        onClick={prevStep}
                    >
                        <ArrowLeft size={18} />
                        Back
                    </button>
                    <button
                        type="button"
                        className="register-next-button"
                        onClick={nextStep}
                        disabled={!formData.username || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                    >
                        Continue to Role Selection
                        <ArrowRight size={18} />
                    </button>
                </div>
            </>
        );
    };

    // Render step 3 - Role Selection
    const renderStepThree = () => {
        return (
            <>
                <div className="register-role-container">
                    <label className="register-role-label">Select your role in the system:</label>
                    <div className="register-role-options">
                        <div className={`role-card ${formData.role === 'administrator' ? 'selected' : ''}`} onClick={() => handleChange({ target: { name: 'role', value: 'administrator' } })}>
                            <div className="role-icon admin-icon">
                                <ShieldCheck size={20} />
                            </div>
                            <div className="role-info">
                                <h4>Administrator</h4>
                                <p>Manage the entire learning system</p>
                            </div>
                            <div className="role-select">
                                <input
                                    type="radio"
                                    id="administrator"
                                    name="role"
                                    value="administrator"
                                    checked={formData.role === 'administrator'}
                                    onChange={handleChange}
                                />
                                <div className="checkmark"></div>
                            </div>
                        </div>

                        <div className={`role-card ${formData.role === 'trainer' ? 'selected' : ''}`} onClick={() => handleChange({ target: { name: 'role', value: 'trainer' } })}>
                            <div className="role-icon trainer-icon">
                                <BookOpen size={20} />
                            </div>
                            <div className="role-info">
                                <h4>Trainer</h4>
                                <p>Create and manage courses</p>
                            </div>
                            <div className="role-select">
                                <input
                                    type="radio"
                                    id="trainer"
                                    name="role"
                                    value="trainer"
                                    checked={formData.role === 'trainer'}
                                    onChange={handleChange}
                                />
                                <div className="checkmark"></div>
                            </div>
                        </div>

                        <div className={`role-card ${formData.role === 'trainee' ? 'selected' : ''}`} onClick={() => handleChange({ target: { name: 'role', value: 'trainee' } })}>
                            <div className="role-icon trainee-icon">
                                <GraduationCap size={20} />
                            </div>
                            <div className="role-info">
                                <h4>Trainee</h4>
                                <p>Access and complete courses</p>
                            </div>
                            <div className="role-select">
                                <input
                                    type="radio"
                                    id="trainee"
                                    name="role"
                                    value="trainee"
                                    checked={formData.role === 'trainee'}
                                    onChange={handleChange}
                                />
                                <div className="checkmark"></div>
                            </div>
                        </div>

                        <div className={`role-card ${formData.role === 'applicant' ? 'selected' : ''}`} onClick={() => handleChange({ target: { name: 'role', value: 'applicant' } })}>
                            <div className="role-icon applicant-icon">
                                <UserPlus size={20} />
                            </div>
                            <div className="role-info">
                                <h4>Applicant</h4>
                                <p>Apply for available programs</p>
                            </div>
                            <div className="role-select">
                                <input
                                    type="radio"
                                    id="applicant"
                                    name="role"
                                    value="applicant"
                                    checked={formData.role === 'applicant'}
                                    onChange={handleChange}
                                />
                                <div className="checkmark"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-navigation">
                    <button
                        type="button"
                        className="register-back-button"
                        onClick={prevStep}
                    >
                        <i className="fas fa-arrow-left"></i>
                        Back
                    </button>
                    <button
                        type="submit"
                        className="register-submit-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader size={18} className="loading-spinner" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Create Account</span>
                                <Check size={18} />
                            </>
                        )}
                    </button>
                </div>
            </>
        );
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
                <div className="register-form-wrapper">
                    <div className="register-logo-container">
                        <img src="/assets/images/logocolor.png" alt="JMH Logo" className="register-logo" />
                    </div>

                    <h2 className="register-heading">Create an Account</h2>
                    <p className="register-subheading">Join our learning platform in just a few steps</p>

                    {renderProgress()}

                    {error && (
                        <div className="register-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="register-success">
                            <CheckCircle size={18} />
                            <span>{success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="register-form">
                        {step === 1 && renderStepOne()}
                        {step === 2 && renderStepTwo()}
                        {step === 3 && renderStepThree()}
                    </form>

                    <p className="register-footer">
                        Already have an account? <Link to="/login" className="register-link">Log In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;