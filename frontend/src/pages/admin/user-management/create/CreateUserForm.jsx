import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Key, Shield, AlertCircle, Save, XCircle } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

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
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b',
      position: 'relative'
    }}>
      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}
      
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => navigate('/admin/user-management')}>
          <ArrowLeft size={16} /> Back to User Management
        </div>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Create New User</h1>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="username" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              <User size={16} /> Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              style={{
                width: '100%',
                padding: '8px',
                border: validationErrors.username ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
            {validationErrors.username && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                <AlertCircle size={14} /> {validationErrors.username}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                <Key size={16} /> Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter password"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: validationErrors.password ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  outline: 'none',
                  ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                }}
              />
              {validationErrors.password && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                  <AlertCircle size={14} /> {validationErrors.password}
                </div>
              )}
            </div>
            <div>
              <label htmlFor="confirmPassword" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                <Key size={16} /> Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: validationErrors.confirmPassword ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  outline: 'none',
                  ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                }}
              />
              {validationErrors.confirmPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                  <AlertCircle size={14} /> {validationErrors.confirmPassword}
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="full_name" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              <User size={16} /> Full Name
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
              style={{
                width: '100%',
                padding: '8px',
                border: validationErrors.full_name ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
            {validationErrors.full_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                <AlertCircle size={14} /> {validationErrors.full_name}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              <Mail size={16} /> Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter email address"
              style={{
                width: '100%',
                padding: '8px',
                border: validationErrors.email ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
            {validationErrors.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                <AlertCircle size={14} /> {validationErrors.email}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label htmlFor="role" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                <Shield size={16} /> Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                }}
              >
                <option value="trainee">Trainee</option>
                <option value="trainer">Trainer</option>
                <option value="applicant">Applicant</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <Link
              to="/admin/user-management"
              style={{
                backgroundColor: '#ffffff',
                color: '#1E88E5',
                padding: '8px 16px',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                textDecoration: 'none',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#E3F2FD' }
              }}
            >
              <XCircle size={16} /> Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': loading ? {} : { backgroundColor: '#1565C0' }
              }}
            >
              <Save size={16} /> {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
      
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
};

export default CreateUserForm;