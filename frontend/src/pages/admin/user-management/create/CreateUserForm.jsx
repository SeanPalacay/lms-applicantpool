import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Key, Shield, AlertCircle } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/CreateUserForm.css'; // Adjusted import

const CreateUserForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'trainee',
    status: 'active'
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) errors.username = 'Username is required';
    else if (formData.username.length < 3) errors.username = 'Username must be at least 3 characters';
    
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { confirmPassword, ...userData } = formData;
      await adminService.createUser(userData);
      
      setSuccess('User created successfully!');
      setTimeout(() => navigate('/admin/user-management'), 1500);
    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="user-form-container">
      {error && <AlertBanner message={error} type="error" />}
      {success && <AlertBanner message={success} type="success" />}
      
      <div className="page-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/admin/user-management')}>
            <ArrowLeft size={16} />
            <span>Back to User Management</span>
          </button>
          <h1>Create New User</h1>
        </div>
      </div>
      
      <div className="user-form-card">
        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-group">
            <label htmlFor="username">
              <User size={16} />
              <span>Username</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              className={validationErrors.username ? 'error' : ''}
            />
            {validationErrors.username && (
              <div className="error-message">
                <AlertCircle size={14} />
                {validationErrors.username}
              </div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">
                <Key size={16} />
                <span>Password</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                className={validationErrors.password ? 'error' : ''}
              />
              {validationErrors.password && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  {validationErrors.password}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">
                <Key size={16} />
                <span>Confirm Password</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                className={validationErrors.confirmPassword ? 'error' : ''}
              />
              {validationErrors.confirmPassword && (
                <div className="error-message">
                  <AlertCircle size={14} />
                  {validationErrors.confirmPassword}
                </div>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="full_name">
              <User size={16} />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
              className={validationErrors.full_name ? 'error' : ''}
            />
            {validationErrors.full_name && (
              <div className="error-message">
                <AlertCircle size={14} />
                {validationErrors.full_name}
              </div>
            )}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} />
              <span>Email</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              className={validationErrors.email ? 'error' : ''}
            />
            {validationErrors.email && (
              <div className="error-message">
                <AlertCircle size={14} />
                {validationErrors.email}
              </div>
            )}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">
                <Shield size={16} />
                <span>Role</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="trainee">Trainee</option>
                <option value="trainer">Trainer</option>
                <option value="applicant">Applicant</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="status">
                <span>Status</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="form-actions">
            <Link to="/admin/user-management" className="button cancel-button">
              Cancel
            </Link>
            <button type="submit" className="button submit-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
      
      {loading && <LoadingSpinner overlay={true} />}
    </div>
  );
};

export default CreateUserForm;