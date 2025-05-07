import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Check, Loader, Upload, X, FileText } from 'lucide-react';
import './register.css';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [step, setStep] = useState(1);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordFeedback, setPasswordFeedback] = useState('');
    const fileInputRef = useRef(null);

    const API_URL = 'http://localhost:8080/lms-forbes/backend/api/auth/register.php';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'password') checkPasswordStrength(value);
    };

    const checkPasswordStrength = (password) => {
        if (!password) {
            setPasswordStrength(0);
            setPasswordFeedback('');
            return;
        }
        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;
        if (/[^A-Za-z0-9]/.test(password)) strength += 25;
        setPasswordStrength(strength);
        setPasswordFeedback(
            strength < 25 ? 'Weak: Try a longer password' :
            strength < 50 ? 'Fair: Add uppercase letters and numbers' :
            strength < 75 ? 'Good: Add special characters' :
            'Strong password!'
        );
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file) => {
        const validTypes = ['application/pdf'];
        if (!validTypes.includes(file.type)) {
            setError('Please upload a PDF file.');
            setSelectedFile(null);
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('File size should be less than 5MB.');
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
        setError('');
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const nextStep = (e) => {
        e.preventDefault();
        if (step === 1) {
            if (!formData.firstName || !formData.lastName || !formData.email) {
                setError('Please fill out all fields');
                return;
            }
            if (!isValidEmail(formData.email)) {
                setError('Please enter a valid email address');
                return;
            }
        } else if (step === 2) {
            if (!selectedFile) {
                setError('Please upload your resume');
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

    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        setUploading(true);

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !selectedFile) {
            setError('All fields and resume are required');
            setLoading(false);
            setUploading(false);
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            setUploading(false);
            return;
        }
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            setUploading(false);
            return;
        }

        try {
            const formPayload = new FormData();
            formPayload.append('first_name', formData.firstName);
            formPayload.append('last_name', formData.lastName);
            formPayload.append('email', formData.email);
            formPayload.append('password', formData.password);
            formPayload.append('role', 'applicant');
            formPayload.append('full_name', `${formData.firstName} ${formData.lastName}`);
            formPayload.append('file', selectedFile);
            formPayload.append('description', 'Resume');
            formPayload.append('record_type', 'applicant');
            formPayload.append('category', 'evaluations');

            console.log('Submitting registration with resume:', {
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                role: 'applicant',
                resume: selectedFile.name
            });

            const response = await axios.post(API_URL, formPayload, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            console.log('Registration successful:', response.data);
            setSuccess('Registration successful! You can now log in with your access code.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (error) {
            console.error('Registration error:', error);
            setError(
                error.response?.data.error || 
                (error.request ? 'Network error: Could not connect to the server.' : 
                'An unexpected error occurred. Please try again.')
            );
        } finally {
            setLoading(false);
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const toggleShowPassword = () => setShowPassword(!showPassword);
    const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

    const renderProgress = () => (
        <div className="register-progress">
            <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                <div className="step-number">1</div>
                <span className="step-label">Personal Info</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                <div className="step-number">2</div>
                <span className="step-label">Resume Upload</span>
            </div>
            <div className="progress-line"></div>
            <div className={`progress-step ${step === 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <span className="step-label">Account Setup</span>
            </div>
        </div>
    );

    const renderStepOne = () => (
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
                    <span className="register-input-icon"><Mail size={18} /></span>
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
                <button type="button" className="register-next-button" onClick={nextStep}>
                    Continue to Resume Upload <ArrowRight size={18} />
                </button>
            </div>
        </>
    );

    const renderStepTwo = () => (
        <>
            <div className="register-input-container">
                <label className="register-label">Upload Resume (PDF only)</label>
                <div 
                    className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                >
                    {!selectedFile ? (
                        <div className="upload-placeholder">
                            <Upload size={48} className={dragActive ? 'upload-icon-active' : ''} />
                            <h3>Drag & Drop your resume here</h3>
                            <p>or</p>
                            <label className="upload-button">
                                Browse Files
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="application/pdf"
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                            </label>
                            <p className="upload-instructions">
                                Acceptable file type: PDF<br />
                                Maximum file size: 5MB
                            </p>
                        </div>
                    ) : (
                        <div className="selected-file">
                            <div className="file-info">
                                <FileText size={24} />
                                <div>
                                    <span className="file-name">{selectedFile.name}</span>
                                    <span className="file-size">{formatFileSize(selectedFile.size)}</span>
                                </div>
                                <button 
                                    type="button" 
                                    className="clear-file-button"
                                    onClick={clearSelectedFile}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="form-navigation">
                <button type="button" className="register-back-button" onClick={prevStep}>
                    <ArrowLeft size={18} /> Back
                </button>
                <button type="button" className="register-next-button" onClick={nextStep}>
                    Continue to Account Setup <ArrowRight size={18} />
                </button>
            </div>
        </>
    );

    const renderStepThree = () => (
        <>
            <div className="register-input-container">
                <label htmlFor="password" className="register-label">Password</label>
                <div className="input-wrapper">
                    <span className="register-input-icon"><Lock size={18} /></span>
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
                    <button type="button" className="password-toggle" onClick={toggleShowPassword}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {formData.password && (
                    <div className="password-strength">
                        <div className="strength-bar">
                            <div className="strength-fill" style={{
                                width: `${passwordStrength}%`,
                                background: passwordStrength < 25 ? '#e74c3c' : passwordStrength < 50 ? '#f39c12' : passwordStrength < 75 ? '#3498db' : '#2ecc71'
                            }}></div>
                        </div>
                        <span className="strength-text" style={{ color: passwordStrength < 25 ? '#e74c3c' : passwordStrength < 50 ? '#f39c12' : passwordStrength < 75 ? '#3498db' : '#2ecc71' }}>{passwordFeedback}</span>
                    </div>
                )}
            </div>
            <div className="register-input-container">
                <label htmlFor="confirmPassword" className="register-label">Confirm Password</label>
                <div className="input-wrapper">
                    <span className="register-input-icon"><Lock size={18} /></span>
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
                    <button type="button" className="password-toggle" onClick={toggleShowConfirmPassword}>
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="password-mismatch">Passwords do not match</div>
                )}
            </div>
            <div className="form-navigation">
                <button type="button" className="register-back-button" onClick={prevStep}>
                    <ArrowLeft size={18} /> Back
                </button>
                <button
                    type="submit"
                    className="register-submit-button"
                    disabled={loading || !formData.password || !formData.confirmPassword || formData.password !== formData.confirmPassword}
                >
                    {loading ? (
                        <>
                            <Loader size={18} className="loading-spinner" />
                            Creating Account... ({uploadProgress}%)
                        </>
                    ) : (
                        <>Create Account <Check size={18} /></>
                    )}
                </button>
            </div>
        </>
    );

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="register-container">
            <div className="register-image-section">
                <div className="register-overlay">
                    <h1 className="register-title">Join Our <span className="register-title-highlight">Learning</span> Community</h1>
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
                    {error && <div className="register-error"><AlertCircle size={18} /> <span>{error}</span></div>}
                    {success && <div className="register-success"><CheckCircle size={18} /> <span>{success}</span></div>}
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