import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Key, Eye, EyeOff, Save, AlertTriangle, 
  Clock, RefreshCw, CheckCircle, Loader
} from 'lucide-react';
import traineeService from '../../../services/traineeService';

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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: 'var(--spacing-md)', 
        color: 'var(--text-secondary)',
      }}>
        <Loader size={32} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
        <p>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh', 
        gap: 'var(--spacing-md)', 
        color: 'var(--text-secondary)',
      }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger-color)' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm) var(--spacing-md)', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
        >
          <RefreshCw size={16} /> Retry
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ 
      padding: 'var(--spacing-xl)', 
      backgroundColor: 'var(--light-gray)', 
      minHeight: '100vh',
    }}>
      <h1 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        color: 'var(--text-primary)', 
        marginBottom: 'var(--spacing-md)',
      }}>
        Profile Settings
      </h1>
      
      {updateSuccess && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          padding: 'var(--spacing-sm)', 
          backgroundColor: 'var(--primary-ultralight)', 
          color: 'var(--primary-color)', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: 'var(--spacing-md)',
        }}>
          <CheckCircle size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 'var(--spacing-xl)',
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: 'var(--spacing-md)', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-md)',
          }}>
            <User size={20} style={{ color: 'var(--primary-color)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Personal Information</h2>
          </div>
          
          <form onSubmit={updateProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label htmlFor="username" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Username</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)', 
                padding: 'var(--spacing-xs)', 
                border: '1px solid var(--medium-gray)', 
                borderRadius: 'var(--radius-sm)',
              }}>
                <User size={18} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  value={profile.username}
                  disabled
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    outline: 'none', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)',
                    backgroundColor: 'transparent',
                  }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Username cannot be changed</div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label htmlFor="full_name" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input 
                type="text" 
                id="full_name" 
                name="full_name" 
                value={profile.full_name}
                onChange={handleProfileChange}
                style={{ 
                  padding: 'var(--spacing-xs)', 
                  border: '1px solid var(--medium-gray)', 
                  borderRadius: 'var(--radius-sm)', 
                  outline: 'none', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)',
                }}
                required
              />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label htmlFor="email" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Email Address</label>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)', 
                padding: 'var(--spacing-xs)', 
                border: '1px solid var(--medium-gray)', 
                borderRadius: 'var(--radius-sm)',
              }}>
                <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={profile.email}
                  onChange={handleProfileChange}
                  style={{ 
                    flex: 1, 
                    border: 'none', 
                    outline: 'none', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)',
                    backgroundColor: 'transparent',
                  }}
                  required
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Account Status</label>
              <div style={{ 
                padding: 'var(--spacing-xs) var(--spacing-sm)', 
                backgroundColor: profile.status === 'active' ? 'var(--primary-ultralight)' : 'var(--light-gray)', 
                color: profile.status === 'active' ? 'var(--primary-color)' : 'var(--text-secondary)', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '14px', 
                fontWeight: '500',
              }}>
                {profile.status}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Member Since</label>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {formatDate(profile.created_at)}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
              <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Last Login</label>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                {formatDate(profile.last_login)}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  transition: 'background-color var(--transition-fast)',
                }}
                disabled={isSubmitting}
                onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--primary-dark)')}
                onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = 'var(--primary-color)')}
              >
                {isSubmitting ? (
                  <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: 'var(--spacing-md)', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-md)',
          }}>
            <Clock size={20} style={{ color: 'var(--primary-color)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>Recent Activity</h2>
          </div>
          
          {activity.length === 0 ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: 'var(--spacing-md)', 
              color: 'var(--text-secondary)',
            }}>
              <p>No recent activity found.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              {activity.slice(0, 10).map((item, index) => (
                <div key={item.id || index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-sm)', 
                  padding: 'var(--spacing-sm)', 
                  borderBottom: '1px solid var(--medium-gray)',
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: 'var(--radius-full)', 
                    backgroundColor: 'var(--light-gray)', 
                    color: 'var(--text-secondary)',
                  }}>
                    {item.activity_type === 'login' && <User size={16} />}
                    {item.activity_type === 'logout' && <User size={16} />}
                    {item.activity_type === 'attendance' && <CheckCircle size={16} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {item.details || `${item.activity_type.charAt(0).toUpperCase() + item.activity_type.slice(1)} activity recorded`}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
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