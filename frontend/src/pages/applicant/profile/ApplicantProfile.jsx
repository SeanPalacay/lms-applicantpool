import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Key, Eye, EyeOff, Save, AlertTriangle, 
  Clock, RefreshCw, CheckCircle, Loader, FileText
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import './styles/ApplicantProfile.css';

const ApplicantProfile = () => {
  const [profile, setProfile] = useState({
    id: '',
    username: '',
    full_name: '',
    email: '',
    role: 'applicant',
    status: 'active',
    created_at: '',
    last_login: ''
  });
  
  const [applications, setApplications] = useState([]);
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
  const [additionalInfo, setAdditionalInfo] = useState({
    phone: '',
    address: '',
    education: '',
    experience: '',
    skills: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        // Get dashboard data which contains applications
        let dashboardData = { myApplications: [] };
        try {
          dashboardData = await applicantService.getDashboardData();
        } catch (dashboardError) {
          console.warn('Could not fetch dashboard data:', dashboardError);
          // Continue with empty applications array
        }
        
        // Get profile data
        let profileData = {};
        try {
          profileData = await applicantService.getUserProfile();
        } catch (profileError) {
          // If we can't get profile data, use dashboard user data if available
          if (dashboardData && dashboardData.user) {
            profileData = dashboardData.user;
          } else {
            throw profileError;
          }
        }
        
        // Get user activity if available
        let activityData = [];
        try {
          activityData = await applicantService.getUserActivity();
        } catch (activityError) {
          console.warn('Could not fetch activity data:', activityError);
          // Continue with empty activity array
        }
        
        // Store profile data
        setProfile(profileData);
        
        // Set applications from dashboard data
        setApplications(dashboardData.myApplications || []);
        
        // Set activity data
        setActivity(activityData);
        
        // Get additional info if available
        if (profileData.additional_info) {
          try {
            const parsedInfo = typeof profileData.additional_info === 'string' 
              ? JSON.parse(profileData.additional_info) 
              : profileData.additional_info;
            
            setAdditionalInfo(prev => ({
              ...prev,
              ...parsedInfo
            }));
          } catch (parseError) {
            console.warn('Error parsing additional info:', parseError);
            // Continue with default empty additional info
          }
        }
        
        // Update localStorage with full_name
        if (profileData.full_name) {
          localStorage.setItem('full_name', profileData.full_name);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };

    fetchProfile();
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
  
  // Handle additional info changes
  const handleAdditionalInfoChange = (e) => {
    const { name, value } = e.target;
    setAdditionalInfo(prev => ({
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
      
      // Prepare update data - don't include additional_info if it's not needed
      // This would avoid the issue if the database schema doesn't have this column
      const updateData = {
        full_name: profile.full_name,
        email: profile.email
      };
      
      // Update profile data
      const response = await applicantService.updateUserProfile(updateData);
      
      // Update localStorage with new full_name
      localStorage.setItem('full_name', response.full_name);
      
      setUpdateSuccess(true);
      setIsSubmitting(false);
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
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
      
      // Use service to change password
      await applicantService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
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
      
      if (err.message && err.message.includes('incorrect')) {
        setPasswordFormErrors({
          current_password: 'Current password is incorrect'
        });
      } else {
        setError('Failed to change password. Please try again.');
      }
      
      setIsSubmitting(false);
    }
  };
  
  // Handle retry button click
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Re-fetch data on next render cycle
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
  // Get application status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'shortlisted':
        return 'status-shortlisted';
      case 'hired':
        return 'status-hired';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
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
          onClick={handleRetry} 
          className="btn-primary retry-btn"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="applicant-profile-container">
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
                <label htmlFor="phone">Phone Number</label>
                <input 
                  type="tel" 
                  id="phone" 
                  name="phone" 
                  value={additionalInfo.phone || ''}
                  onChange={handleAdditionalInfoChange}
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  value={additionalInfo.address || ''}
                  onChange={handleAdditionalInfoChange}
                  className="form-control"
                />
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
        
        {/* Rest of the component remains the same */}
        
        <div className="profile-card">
          <div className="card-header">
            <h2><FileText size={20} /> Educational & Professional Information</h2>
          </div>
          
          <form className="background-form" onSubmit={updateProfile}>
            <div className="form-group">
              <label htmlFor="education">Education</label>
              <textarea 
                id="education" 
                name="education" 
                value={additionalInfo.education || ''}
                onChange={handleAdditionalInfoChange}
                className="form-control"
                placeholder="Enter your educational background (degrees, institutions, graduation years)"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="experience">Work Experience</label>
              <textarea 
                id="experience" 
                name="experience" 
                value={additionalInfo.experience || ''}
                onChange={handleAdditionalInfoChange}
                className="form-control"
                placeholder="Enter your work experience (positions, companies, dates)"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="skills">Skills</label>
              <textarea 
                id="skills" 
                name="skills" 
                value={additionalInfo.skills || ''}
                onChange={handleAdditionalInfoChange}
                className="form-control"
                placeholder="Enter your skills and competencies"
                rows="3"
              />
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
        
        <div className="profile-card">
          <div className="card-header">
            <h2><Key size={20} /> Change Password</h2>
          </div>
          
          {passwordChangeSuccess && (
            <div className="success-message">
              <CheckCircle size={18} />
              <span>Password changed successfully!</span>
            </div>
          )}
          
          <form className="password-form" onSubmit={changePassword}>
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
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordFormErrors.current_password && (
                <div className="input-error">{passwordFormErrors.current_password}</div>
              )}
            </div>
            
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
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordFormErrors.new_password ? (
                <div className="input-error">{passwordFormErrors.new_password}</div>
              ) : (
                <div className="input-hint">Must be at least 8 characters long</div>
              )}
            </div>
            
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
                  required
                />
                <button 
                  type="button" 
                  className="toggle-password" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordFormErrors.confirm_password && (
                <div className="input-error">{passwordFormErrors.confirm_password}</div>
              )}
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
        </div>
        
        <div className="profile-card account-info">
          <div className="card-header">
            <h2><User size={20} /> Account Information</h2>
          </div>
          
          <div className="account-details">
            <div className="detail-row">
              <div className="detail-label">Account Status</div>
              <div className={`status-badge ${profile.status}`}>
                {profile.status}
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Account Type</div>
              <div className="detail-value">Applicant</div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Member Since</div>
              <div className="detail-value">
                {formatDate(profile.created_at)}
              </div>
            </div>
            
            <div className="detail-row">
              <div className="detail-label">Last Login</div>
              <div className="detail-value">
                {formatDate(profile.last_login)}
              </div>
            </div>
          </div>
        </div>
        
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
              {activity.map((item) => (
                <div key={item.id} className="activity-item">
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
        
        <div className="profile-card recent-applications">
          <div className="card-header">
            <h2><FileText size={20} /> Recent Applications</h2>
          </div>
          
          {applications.length === 0 ? (
            <div className="no-applications">
              <p>No applications found.</p>
            </div>
          ) : (
            <div className="applications-list">
              {applications.map((app) => (
                <div key={app.application_id || app.id} className="application-item">
                  <div className="application-content">
                    <div className="application-title">{app.program_title}</div>
                    <div className="application-role">{app.job_role} - {app.department}</div>
                    <div className="application-date">Applied: {formatDate(app.applied_at)}</div>
                  </div>
                  <div className={`application-status ${getStatusClass(app.status)}`}>
                    {app.status}
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

export default ApplicantProfile;