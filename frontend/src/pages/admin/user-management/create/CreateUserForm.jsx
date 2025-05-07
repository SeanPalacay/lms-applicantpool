import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Key, Shield, AlertCircle, Save, XCircle, Copy, RefreshCw, Briefcase } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

// Function to generate a random code
const generateRandomCode = (length = 8) => {
  // Define characters to use (alphanumeric + some special characters)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let result = '';
  
  // Create a random string
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
};

const CreateUserForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [positions, setPositions] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    email: '',
    role: 'trainee',
    status: 'active',
    position_id: '',
    access_code: generateRandomCode(10)
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  
  useEffect(() => {
    // When role changes to applicant, adjust username and password
    if (formData.role === 'applicant') {
      setFormData(prev => ({
        ...prev,
        username: `APP_${prev.access_code.substring(0, 5)}`,
        password: prev.access_code,
        confirmPassword: prev.access_code
      }));
    }
    
    // Fetch positions when component mounts
    fetchPositions();
  }, [formData.role, formData.access_code]);
  
  const fetchPositions = async () => {
    try {
      const data = await adminService.getJobPositions();
      console.log('Raw positions data:', data);
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error('Invalid position data: Expected an array');
      }
      
      // Just use all positions since we don't see is_active in the API response
      setPositions(data);
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError('Failed to load positions. Please try again.');
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If changing role to applicant, setup access code
    if (name === 'role' && value === 'applicant') {
      const accessCode = formData.access_code || generateRandomCode(10);
      setFormData({ 
        ...formData, 
        [name]: value,
        username: `APP_${accessCode.substring(0, 5)}`,
        password: accessCode,
        confirmPassword: accessCode
      });
    } else if (name === 'role' && formData.role === 'applicant') {
      // If changing away from applicant role, clear automatic settings
      setFormData({ 
        ...formData, 
        [name]: value,
        username: '',
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: null });
    }
  };
  
  const regenerateCode = () => {
    const newCode = generateRandomCode(10);
    setFormData(prev => ({
      ...prev,
      access_code: newCode,
      username: prev.role === 'applicant' ? `APP_${newCode.substring(0, 5)}` : prev.username,
      password: prev.role === 'applicant' ? newCode : prev.password,
      confirmPassword: prev.role === 'applicant' ? newCode : prev.confirmPassword
    }));
    setCodeCopied(false);
  };
  
  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(formData.access_code)
      .then(() => {
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (formData.role !== 'applicant') {
      // Normal validation for non-applicant users
      if (!formData.username.trim()) errors.username = 'Username is required';
      else if (formData.username.length < 3) errors.username = 'Username must be at least 3 characters';
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    } else {
      // Applicant validation
      if (!formData.access_code) errors.access_code = 'Access code is required';
    }
    
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
      
      // Create a copy of form data
      const userData = { ...formData };
      delete userData.confirmPassword;
      
      // Handle the role-specific logic
      if (userData.role === 'applicant') {
        // Ensure access_code is set
        if (!userData.access_code) {
          userData.access_code = generateRandomCode(10);
          userData.username = `APP_${userData.access_code.substring(0, 5)}`;
          userData.password = userData.access_code;
        }
      } else {
        // Remove access_code for non-applicant users
        delete userData.access_code;
      }
      
      // Convert position_id to a number if it's a string and not empty
      if (userData.position_id && typeof userData.position_id === 'string') {
        userData.position_id = parseInt(userData.position_id, 10) || '';
      }
      
      await adminService.createUser(userData);
      
      if (userData.role === 'applicant') {
        setSuccess(`Applicant created successfully! Access code: ${userData.access_code}`);
      } else {
        setSuccess('User created successfully!');
      }
      
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
          {/* Role select field - moved to top so it affects other fields */}
          <div style={{ marginBottom: '24px' }}>
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
          
          {/* Position selection field */}
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
              Assign a job position to this user (optional)
            </div>
          </div>
          
{formData.role === 'applicant' && (
  <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#e3f2fd', borderRadius: '8px', border: '1px solid #90caf9' }}>
    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0d47a1', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Key size={16} /> Applicant Access Code
    </h3>
    <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#1565c0' }}>
      This code will be used by the applicant to log in to the system. Make sure to share it securely with them.
    </p>
    
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <input
        type="text"
        value={formData.access_code}
        onChange={(e) => setFormData(prev => ({
          ...prev,
          access_code: e.target.value,
          username: `APP_${e.target.value.substring(0, 5)}`,
          password: e.target.value,
          confirmPassword: e.target.value
        }))}
        style={{
          flex: '1',
          padding: '12px',
          border: '1px solid #64b5f6',
          borderRadius: '8px 0 0 0',
          fontSize: '16px',
          fontFamily: 'monospace',
          backgroundColor: '#fff',
          color: '#0d47a1',
          fontWeight: '600'
        }}
      />
      <button
        type="button"
        onClick={regenerateCode}
        title="Generate new code"
        style={{
          padding: '12px',
          backgroundColor: '#1e88e5',
          color: 'white',
          border: 'none',
          borderRadius: '0 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer'
        }}
      >
        <RefreshCw size={16} />
      </button>
    </div>
    
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <button
        type="button"
        onClick={copyCodeToClipboard}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: codeCopied ? '#2e7d32' : '#1565c0',
          color: 'white',
          border: 'none',
          borderRadius: '0 0 8px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          transition: 'background-color 0.3s ease'
        }}
      >
        <Copy size={16} /> {codeCopied ? 'Copied!' : 'Copy Access Code to Clipboard'}
      </button>
    </div>
    
    <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#1565c0' }}>
      Generated Username: <strong>{formData.username}</strong>
    </p>
  </div>
)}
          
          {/* Username field - only for non-applicant users */}
          {formData.role !== 'applicant' && (
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
                  outline: 'none'
                }}
              />
              {validationErrors.username && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                  <AlertCircle size={14} /> {validationErrors.username}
                </div>
              )}
            </div>
          )}

          {/* Password fields - only for non-applicant users */}
          {formData.role !== 'applicant' && (
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
                  placeholder="Confirm password"
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

          <div style={{ marginBottom: '24px' }}>
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
                textDecoration: 'none'
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
                fontSize: '0.875rem'
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