import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Calendar, Save, Edit,
  Lock, Eye, EyeOff, Clock, CheckCircle, ShieldAlert,
  XCircle // Added missing import
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TrainerProfile.css';

/**
 * TrainerProfile Component
 * Displays and allows editing of trainer profile information
 */
const TrainerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activity, setActivity] = useState([]);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  // Fetch trainer profile information on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          return;
        }
        
        // Fetch profile data
        const profileResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/profile.php`, {
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
          
          if (profileResponse.status === 404) {
            // If the profile endpoint is not found, create a fallback profile from localStorage
            const fallbackProfile = {
              full_name: localStorage.getItem('userName') || 'Trainer',
              email: '',
              phone: '',
              bio: '',
              created_at: new Date().toISOString()
            };
            
            setProfile(fallbackProfile);
            setFormData({
              full_name: fallbackProfile.full_name,
              email: fallbackProfile.email,
              phone: fallbackProfile.phone,
              bio: fallbackProfile.bio
            });
            
            // Set empty activity for fallback
            setActivity([]);
            setLoading(false);
            return;
          }
          
          const errorText = await profileResponse.text();
          throw new Error(`HTTP error: ${profileResponse.status} - ${errorText}`);
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);
        
        // Initialize form data with profile information
        setFormData({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          bio: profileData.bio || ''
        });
        
        try {
          // Fetch recent activity
          const activityResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/activity.php`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (activityResponse.ok) {
            const activityData = await activityResponse.json();
            setActivity(activityData);
          } else {
            // Set empty activity if fetch fails
            setActivity([]);
          }
        } catch (activityErr) {
          console.error('Error fetching activity data:', activityErr);
          // Set empty activity if fetch fails
          setActivity([]);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile information. Please try again later.');
        
        // Create fallback profile if needed
        if (!profile) {
          const fallbackProfile = {
            full_name: localStorage.getItem('userName') || 'Trainer',
            email: '',
            phone: '',
            bio: '',
            created_at: new Date().toISOString()
          };
          
          setProfile(fallbackProfile);
          setFormData({
            full_name: fallbackProfile.full_name,
            email: fallbackProfile.email,
            phone: fallbackProfile.phone,
            bio: fallbackProfile.bio
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // Remove 'profile' from the dependency array to prevent infinite loop
  }, [API_BASE_URL]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle password form input changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    console.log('Edit button clicked, current state:', editMode);
    if (editMode) {
      // Reset form data to current profile values
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || ''
      });
    }
    setEditMode(!editMode);
  };

  // Toggle password form visibility
  const togglePasswordForm = () => {
    if (showPasswordForm) {
      // Reset password form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordError('');
      setPasswordSuccess('');
    }
    setShowPasswordForm(!showPasswordForm);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Save profile changes
  // 1. Check the handleSaveProfile function:
const handleSaveProfile = async (e) => {
  e.preventDefault();
  setSaving(true);
  setError('');
  setSuccessMessage('');
  
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setError('You are not logged in. Please log in to access this page.');
      setSaving(false);
      return;
    }
    
    console.log('Updating profile with data:', formData); // Add debug log
    
    // Update profile
    const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/update_profile.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    console.log('Response status:', response.status); // Add debug log
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('authToken');
        throw new Error('Authentication failed. Please login again.');
      }
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const data = await response.json();
    console.log('Updated profile data:', data); // Add debug log
    
    // Update profile state with new data
    setProfile(data);
    setSuccessMessage('Profile updated successfully!');
    setEditMode(false);
    
    // Update localStorage if name changed
    if (formData.full_name !== profile.full_name) {
      localStorage.setItem('userName', formData.full_name);
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    setError(err.message || 'Failed to update profile. Please try again.');
  } finally {
    setSaving(false);
  }
};

  // Change password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    
    // Validate password input
    if (!passwordData.current_password) {
      setPasswordError('Current password is required');
      setChangingPassword(false);
      return;
    }
    
    if (!passwordData.new_password) {
      setPasswordError('New password is required');
      setChangingPassword(false);
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      setChangingPassword(false);
      return;
    }
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError('New passwords do not match');
      setChangingPassword(false);
      return;
    }
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setPasswordError('You are not logged in. Please log in to access this page.');
        setChangingPassword(false);
        return;
      }
      
      // Change password
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/change_password.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      // Reset password form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setPasswordSuccess('Password changed successfully');
      
      // Hide password form after delay
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess('');
      }, 3000);
    } catch (err) {
      console.error('Error changing password:', err);
      setPasswordError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!profile) {
    return <AlertBanner message="Failed to load profile information" type="error" />;
  }

  return (
    <div className="trainer-profile-container">
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div className="profile-grid">
        {/* Profile Card */}
        <div className="card profile-card">
        <div 
  className="card-header gradient-indigo" 
  onClick={(e) => {
    // Check if the click was on or inside the edit button
    const editButton = e.currentTarget.querySelector('.btn-edit-profile');
    if (editButton && (editButton === e.target || editButton.contains(e.target))) {
      toggleEditMode();
    }
  }}
>
  <div className="header-icon">
    <User size={20} />
  </div>
  <div className="header-content">
    <h3>Profile Information</h3>
  </div>
  <div className="header-actions">
    <button 
      className={`btn-edit-profile ${editMode ? 'active' : ''}`}
      type="button"
    >
      <Edit size={16} />
      <span>{editMode ? 'Cancel' : 'Edit'}</span>
    </button>
  </div>
</div>

          
          <div className="card-content">
            {editMode ? (
              <form onSubmit={handleSaveProfile} className="profile-form">
                <div className="profile-avatar large">
                  {getInitials(formData.full_name)}
                </div>
                
                <div className="form-group">
                  <label htmlFor="full_name">
                    <span className="required">*</span> Full Name:
                  </label>
                  <div className="input-with-icon">
                    <User size={18} className="input-icon" />
                    <input 
                      type="text" 
                      id="full_name" 
                      name="full_name" 
                      value={formData.full_name} 
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">
                    <span className="required">*</span> Email:
                  </label>
                  <div className="input-with-icon">
                    <Mail size={18} className="input-icon" />
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone:</label>
                  <div className="input-with-icon">
                    <Phone size={18} className="input-icon" />
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="bio">Bio / About Me:</label>
                  <textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange}
                    className="form-textarea"
                    rows={4}
                    placeholder="Write something about yourself..."
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={toggleEditMode} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? (
                      <>
                        <Clock size={16} className="icon-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="profile-avatar large">
                  {getInitials(profile.full_name)}
                </div>
                
                <div className="profile-name">{profile.full_name}</div>
                <div className="profile-role">Trainer</div>
                
                <div className="profile-info-list">
                  <div className="profile-info-item">
                    <Mail size={18} className="info-icon" />
                    <span>{profile.email || 'No email provided'}</span>
                  </div>
                  
                  <div className="profile-info-item">
                    <Phone size={18} className="info-icon" />
                    <span>{profile.phone || 'No phone number'}</span>
                  </div>
                  
                  <div className="profile-info-item">
                    <Calendar size={18} className="info-icon" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>
                
                {profile.bio && (
                  <div className="profile-bio">
                    <h4>About Me</h4>
                    <p>{profile.bio}</p>
                  </div>
                )}
                
                <div className="profile-actions">
                  <button className="btn-change-password" onClick={togglePasswordForm}>
                    <Lock size={16} />
                    <span>Change Password</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Password Change Form */}
        {showPasswordForm && (
          <div className="card password-card">
            <div className="card-header gradient-rose">
              <div className="header-icon">
                <Lock size={20} />
              </div>
              <div className="header-content">
                <h3>Change Password</h3>
              </div>
              <div className="header-actions">
                <button 
                  className="btn-close-password"
                  onClick={togglePasswordForm}
                >
                  <XCircle size={16} />
                </button>
              </div>
            </div>
            
            <div className="card-content">
              {passwordError && (
                <div className="password-error">
                  <ShieldAlert size={16} />
                  <span>{passwordError}</span>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="password-success">
                  <CheckCircle size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              
              <form onSubmit={handleChangePassword} className="password-form">
                <div className="form-group">
                  <label htmlFor="current_password">
                    <span className="required">*</span> Current Password:
                  </label>
                  <div className="password-input-wrapper">
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="current_password" 
                        name="current_password" 
                        value={passwordData.current_password} 
                        onChange={handlePasswordChange}
                        className="form-input"
                        required
                      />
                    </div>
                    <button 
                      type="button" 
                      className="toggle-password-btn"
                      onClick={togglePasswordVisibility}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="new_password">
                    <span className="required">*</span> New Password:
                  </label>
                  <div className="password-input-wrapper">
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="new_password" 
                        name="new_password" 
                        value={passwordData.new_password} 
                        onChange={handlePasswordChange}
                        className="form-input"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  <small className="password-hint">Must be at least 8 characters long</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirm_password">
                    <span className="required">*</span> Confirm New Password:
                  </label>
                  <div className="password-input-wrapper">
                    <div className="input-with-icon">
                      <Lock size={18} className="input-icon" />
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        id="confirm_password" 
                        name="confirm_password" 
                        value={passwordData.confirm_password} 
                        onChange={handlePasswordChange}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={togglePasswordForm} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-save" disabled={changingPassword}>
                    {changingPassword ? (
                      <>
                        <Clock size={16} className="icon-spin" />
                        Changing...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Change Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Recent Activity Card */}
        <div className="card activity-card">
          <div className="card-header gradient-teal">
            <div className="header-icon">
              <Activity size={20} />
            </div>
            <div className="header-content">
              <h3>Recent Activity</h3>
            </div>
          </div>
          
          <div className="card-content">
            {activity && activity.length > 0 ? (
              <div className="activity-list">
                {activity.map((item, index) => (
                  <div key={index} className="activity-item">
                    <div className={`activity-icon activity-${item.activity_type}`}>
                      {item.activity_type === 'login' && <LogIn size={16} />}
                      {item.activity_type === 'logout' && <LogOut size={16} />}
                      {item.activity_type === 'attendance' && <Clock size={16} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-details">{item.details}</div>
                      <div className="activity-time">{formatDate(item.activity_time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-activity">
                <Clock size={48} />
                <p>No activity recorded yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Add these missing components
const Activity = ({ size, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const LogIn = ({ size, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const LogOut = ({ size, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

export default TrainerProfile;