import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Key, Shield, AlertCircle, Save, XCircle, Briefcase } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const EditUserForm = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [positions, setPositions] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'trainee',
    status: 'active',
    position_id: '', // Added position_id field
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [changePassword, setChangePassword] = useState(false);

// Inside EditUserForm.jsx, modify the useEffect that fetches user data
useEffect(() => {
  fetchUserData();
  fetchPositions();
}, [userId]);

const fetchUserData = async () => {
  try {
    setLoading(true);
    const userData = await adminService.getUserById(userId);
    console.log('User data from API:', userData); // Debug log
    setFormData({ 
      ...userData, 
      password: '', 
      confirmPassword: '',
      position_id: userData.position_id || '' // Ensure position_id is initialized
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

const fetchPositions = async () => {
  try {
    const data = await adminService.getJobPositions();
    console.log('Raw positions data:', data); // See what's coming from the API
    
    // Remove the filter temporarily to see if it's the problem
    // const activePositions = data.filter(position => position.is_active === 1);
    setPositions(data); // Use all positions for now
    
  } catch (err) {
    console.error('Error fetching positions:', err);
    setError('Failed to load positions. Please try again.');
  }
};


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };

  const toggleChangePassword = () => {
    setChangePassword(!changePassword);
    if (!changePassword) setFormData({ ...formData, password: '', confirmPassword: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
    if (changePassword) {
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
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
      
      // Convert position_id to a number if it's a string and not empty
      if (userData.position_id && typeof userData.position_id === 'string') {
        userData.position_id = parseInt(userData.position_id, 10) || '';
      }
      
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

  // Get current position name for display
  const getCurrentPositionName = () => {
    if (!formData.position_id) return 'None';
    
    const positionId = parseInt(formData.position_id, 10);
    const position = positions.find(p => p.id === positionId);
    
    // Note that the API returns "name" not "position_name"
    if (position) {
      return `${position.name} (${position.department})`;
    } else {
      return 'Unknown';
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
        <Link to="/admin/user-management" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', fontSize: '0.875rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to User Management
        </Link>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Edit User: {formData.username}</h1>
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
              disabled
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#64748b',
                backgroundColor: '#f1f5f9',
                cursor: 'not-allowed'
              }}
            />
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Username cannot be changed</div>
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
                outline: 'none'
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
                outline: 'none'
              }}
            />
            {validationErrors.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                <AlertCircle size={14} /> {validationErrors.email}
              </div>
            )}
          </div>

          {/* Position Field */}
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="position_id" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              <Briefcase size={16} /> Position
            </label>
            <select
  id="position_id"
  name="position_id"
  value={formData.position_id}
  onChange={handleChange}
  style={{
    width: '100%',
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#1e293b',
    outline: 'none',
    backgroundColor: '#ffffff'
  }}
>
  <option value="">-- No Position --</option>
  {positions.map(position => (
    <option key={position.id} value={position.id}>
      {position.name} ({position.department})
    </option>
  ))}
</select>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
              Current position: {getCurrentPositionName()}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="changePassword"
                checked={changePassword}
                onChange={toggleChangePassword}
                style={{ margin: 0 }}
              />
              <label htmlFor="changePassword" style={{ fontSize: '0.875rem', color: '#1e293b', cursor: 'pointer' }}>Change Password</label>
            </div>
          </div>

          {changePassword && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="password" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                  <Key size={16} /> New Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: validationErrors.password ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    outline: 'none'
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
                  placeholder="Confirm new password"
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: validationErrors.confirmPassword ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    outline: 'none'
                  }}
                />
                {validationErrors.confirmPassword && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                    <AlertCircle size={14} /> {validationErrors.confirmPassword}
                  </div>
                )}
              </div>
            </div>
          )}

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
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="trainee">Trainee</option>
                <option value="trainer">Trainer</option>
                <option value="employee">Employee</option>
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
                  backgroundColor: '#ffffff'
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
                transition: 'background-color 0.3s ease'
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
                transition: 'background-color 0.3s ease'
              }}
            >
              <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
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

export default EditUserForm;