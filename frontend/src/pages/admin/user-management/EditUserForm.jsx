import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Key, Shield, AlertCircle } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/EditUserForm.css';

const EditUserForm = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'trainee',
    status: 'active',
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await adminService.getUserById(userId);
      setFormData({
        ...userData,
        password: '',
        confirmPassword: '',
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching user:', err);
      setError('Failed to load user data. Please try again.');
      if (err.message.includes('Authentication') || err.message.includes('login')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null,
      });
    }
  };

  const toggleChangePassword = () => {
    setChangePassword(!changePassword);
    if (!changePassword) {
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = 'Invalid email format';
    if (changePassword) {
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 6)
        errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = 'Passwords do not match';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      setError(null);
      const { confirmPassword, username, ...userData } = formData;
      if (!changePassword) delete userData.password;
      await adminService.updateUser(userId, userData);
      setSuccess('User updated successfully!');
      setTimeout(() => navigate('/admin/user-management'), 1500);
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err.message || 'Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.username) return <LoadingSpinner />;

  return (
    <div className="user-form-container">
      {error && <AlertBanner message={error} type="error" />}
      {success && <AlertBanner message={success} type="success" />}
      <div className="page-header">
        <div className="header-left">
          <Link to="/admin/user-management" className="back-button">
            <ArrowLeft size={16} className="icon" />
            <span>Back to User Management</span>
          </Link>
          <h1 className="page-title">Edit User: {formData.username}</h1>
        </div>
      </div>
      <div className="user-form-card">
        <form onSubmit={handleSubmit} className="user-form">
          {/* Username Section */}
          <div className="form-group">
            <label htmlFor="username">
              <User size={16} className="field-icon" />
              <span>Username</span>
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              disabled
              className="disabled"
            />
            <div className="helper-text">Username cannot be changed</div>
          </div>

          {/* Full Name Section */}
          <div className="form-group">
            <label htmlFor="full_name">
              <User size={16} className="field-icon" />
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

          {/* Email Section */}
          <div className="form-group">
            <label htmlFor="email">
              <Mail size={16} className="field-icon" />
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

          {/* Change Password Section */}
          {/* <div className="form-group checkbox-group-container">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={toggleChangePassword}
              />
              <label htmlFor="changePassword">Change Password</label>
            </div>
          </div> */}

          {/* Conditional Password Fields */}
          {changePassword && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">
                  <Key size={16} className="field-icon" />
                  <span>New Password</span>
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
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
                  <Key size={16} className="field-icon" />
                  <span>Confirm Password</span>
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
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
          )}

          {/* Role and Status Section */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">
                <Shield size={16} className="field-icon" />
                <span>Role</span>
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="select-field"
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
                className="select-field"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Link to="/admin/user-management" className="button cancel-button">
              Cancel
            </Link>
            <button type="submit" className="button submit-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      {loading && <LoadingSpinner overlay={true} />}
    </div>
  );
};

export default EditUserForm;