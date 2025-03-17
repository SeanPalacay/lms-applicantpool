import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Key, Eye, EyeOff, Save, AlertTriangle, 
  Clock, RefreshCw, CheckCircle, Loader
} from 'lucide-react';
import traineeService from '../../../services/traineeService';
import './styles/TraineeProfile.css';

// Recreate the isTokenExpired function since it's not exported
const isTokenExpired = () => {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) return true;
  const expirationTime = new Date(loginTime).getTime() + (24 * 60 * 60 * 1000);
  return new Date().getTime() > expirationTime;
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

const TraineeProfile = () => {
  const [profile, setProfile] = useState({
    id: '',
    username: '',
    full_name: '',
    email: '',
    role: 'trainee',
    status: 'active',
    created_at: '',
    last_login: ''
  });
  
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        
        // Get profile data
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            throw new Error('No token found. Please log in again.');
          }
          
          if (isTokenExpired()) {
            localStorage.removeItem('authToken');
            throw new Error('Session expired. Please log in again.');
          }
          
          // Get profile data
          const profileEndpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/profile.php`;
          const profileResponse = await fetch(profileEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!profileResponse.ok) {
            if (profileResponse.status === 401) {
              localStorage.removeItem('authToken');
              throw new Error('Authentication failed. Please login again.');
            }
            const errorText = await profileResponse.text();
            throw new Error(`HTTP error: ${profileResponse.status} - ${errorText}`);
          }
          
          const profileData = await profileResponse.json();
          setProfile(profileData);
          
          // Update localStorage
          localStorage.setItem('userName', profileData.full_name);
          
          // Get activity data
          const activityEndpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/activity.php`;
          const activityResponse = await fetch(activityEndpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!activityResponse.ok) {
            if (activityResponse.status === 401) {
              localStorage.removeItem('authToken');
              throw new Error('Authentication failed. Please login again.');
            }
            const errorText = await activityResponse.text();
            throw new Error(`HTTP error: ${activityResponse.status} - ${errorText}`);
          }
          
          const activityData = await activityResponse.json();
          setActivity(activityData);
          
          setLoading(false);
        } catch (err) {
          setError(err.message || 'Failed to load profile data');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, []);
  
  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset success message when form is changed
    if (updateSuccess) {
      setUpdateSuccess(false);
    }
  };
  
  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    setPasswordFormErrors(prev => ({
      ...prev,
      [name]: null
    }));
    
    // Reset success message when form is changed
    if (passwordChangeSuccess) {
      setPasswordChangeSuccess(false);
    }
  };
  
  // Update profile
  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found. Please log in again.');
      }
      
      if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
      }
      
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/update_profile.php`;
      
      // Only update name and email (username can't be changed)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          email: profile.email
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      
      // Update localStorage with full_name
      localStorage.setItem('userName', data.full_name || profile.full_name);
      
      setUpdateSuccess(true);
      setIsSubmitting(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };
  
  // Validate password form
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordData.current_password) {
      errors.current_password = 'Current password is required';
    }
    
    if (!passwordData.new_password) {
      errors.new_password = 'New password is required';
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = 'Password must be at least 8 characters long';
    }
    
    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }
    
    return errors;
  };
  
  // Change password
  const changePassword = async (e) => {
    e.preventDefault();
    
    // Validate form
    const formErrors = validatePasswordForm();
    if (Object.keys(formErrors).length > 0) {
      setPasswordFormErrors(formErrors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found. Please log in again.');
      }
      
      if (isTokenExpired()) {
        localStorage.removeItem('authToken');
        throw new Error('Session expired. Please log in again.');
      }
      
      const endpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/change_password.php`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setPasswordFormErrors({
            current_password: 'Current password is incorrect'
          });
          setIsSubmitting(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      // Reset form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setPasswordChangeSuccess(true);
      setIsSubmitting(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setPasswordChangeSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      
      if (err.message.includes('Current password is incorrect')) {
        setPasswordFormErrors({
          current_password: 'Current password is incorrect'
        });
      } else {
        setError('Failed to change password. Please try again.');
      }
      
      setIsSubmitting(false);
    }
  };
  
  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    switch(field) {
      case 'current':
        setShowCurrentPassword(!showCurrentPassword);
        break;
      case 'new':
        setShowNewPassword(!showNewPassword);
        break;
      case 'confirm':
        setShowConfirmPassword(!showConfirmPassword);
        break;
      default:
        break;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
  
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="profile-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="btn-primary retry-btn"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="trainee-profile-container">
      <h1 className="page-title">Profile Settings</h1>
      
      {updateSuccess && (
        <div className="success-message">
          <CheckCircle size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}
      
      <div className="profile-grid">
        <div className="profile-card">
          <div className="card-header">
            <h2><User size={20} /> Personal Information</h2>
          </div>
          
          <form className="profile-form" onSubmit={updateProfile}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-icon-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    value={profile.username}
                    disabled
                    className="form-control disabled"
                  />
                </div>
                <div className="input-hint">Username cannot be changed</div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input 
                  type="text" 
                  id="full_name" 
                  name="full_name" 
                  value={profile.full_name}
                  onChange={handleProfileChange}
                  className="form-control"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-icon-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Account Status</label>
                <div className={`status-badge ${profile.status}`}>
                  {profile.status}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Member Since</label>
                <div className="static-value">
                  {formatDate(profile.created_at)}
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Last Login</label>
                <div className="static-value">
                  {formatDate(profile.last_login)}
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader size={16} className="spinner-icon" /> Updating...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* <div className="profile-card">
          <div className="card-header">
            <h2><Key size={20} /> Change Password</h2>
          </div>
          
          {passwordChangeSuccess && (
            <div className="success-message">
              <CheckCircle size={18} />
              <span>Password changed successfully!</span>
            </div>
          )}
          
          <form className="profile-form" onSubmit={changePassword}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="current_password">Current Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    id="current_password" 
                    name="current_password" 
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className={`form-control ${passwordFormErrors.current_password ? 'error' : ''}`}
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => togglePasswordVisibility('current')}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordFormErrors.current_password && (
                  <div className="error-message">{passwordFormErrors.current_password}</div>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    id="new_password" 
                    name="new_password" 
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className={`form-control ${passwordFormErrors.new_password ? 'error' : ''}`}
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordFormErrors.new_password && (
                  <div className="error-message">{passwordFormErrors.new_password}</div>
                )}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="confirm_password">Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    id="confirm_password" 
                    name="confirm_password" 
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className={`form-control ${passwordFormErrors.confirm_password ? 'error' : ''}`}
                  />
                  <button 
                    type="button" 
                    className="toggle-password" 
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordFormErrors.confirm_password && (
                  <div className="error-message">{passwordFormErrors.confirm_password}</div>
                )}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader size={16} className="spinner-icon" /> Updating...</>
                ) : (
                  <><Key size={16} /> Change Password</>
                )}
              </button>
            </div>
          </form>
        </div> */}
        
        <div className="profile-card recent-activity">
          <div className="card-header">
            <h2><Clock size={20} /> Recent Activity</h2>
          </div>
          
          {activity.length === 0 ? (
            <div className="no-activity">
              <p>No recent activity found.</p>
            </div>
          ) : (
            <div className="activity-list">
              {activity.slice(0, 10).map((item, index) => (
                <div key={item.id || index} className="activity-item">
                  <div className={`activity-icon ${item.activity_type}`}>
                    {item.activity_type === 'login' && <User size={16} />}
                    {item.activity_type === 'logout' && <User size={16} />}
                    {item.activity_type === 'attendance' && <CheckCircle size={16} />}
                  </div>
                  <div className="activity-details">
                    <div className="activity-message">
                      {item.details || `${item.activity_type.charAt(0).toUpperCase() + item.activity_type.slice(1)} activity recorded`}
                    </div>
                    <div className="activity-time">
                      {formatDate(item.activity_time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraineeProfile;