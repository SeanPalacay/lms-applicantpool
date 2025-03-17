import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Key, Eye, EyeOff, Save, AlertTriangle, 
  Clock, RefreshCw, CheckCircle, Loader, FileText
} from 'lucide-react';
import applicantService from '../../../services/applicantService';

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
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        
        let dashboardData = { myApplications: [] };
        try {
          dashboardData = await applicantService.getDashboardData();
        } catch (dashboardError) {
          console.warn('Could not fetch dashboard data:', dashboardError);
        }
        
        let profileData = {};
        try {
          profileData = await applicantService.getUserProfile();
        } catch (profileError) {
          if (dashboardData && dashboardData.user) {
            profileData = dashboardData.user;
          } else {
            throw profileError;
          }
        }
        
        let activityData = [];
        try {
          activityData = await applicantService.getUserActivity();
        } catch (activityError) {
          console.warn('Could not fetch activity data:', activityError);
        }
        
        setProfile(profileData);
        setApplications(dashboardData.myApplications || []);
        setActivity(activityData);
        
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
          }
        }
        
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
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (updateSuccess) {
      setUpdateSuccess(false);
    }
  };
  
  const handleAdditionalInfoChange = (e) => {
    const { name, value } = e.target;
    setAdditionalInfo(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (updateSuccess) {
      setUpdateSuccess(false);
    }
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    setPasswordFormErrors(prev => ({
      ...prev,
      [name]: null
    }));
    
    if (passwordChangeSuccess) {
      setPasswordChangeSuccess(false);
    }
  };
  
  const updateProfile = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const updateData = {
        full_name: profile.full_name,
        email: profile.email
      };
      
      const response = await applicantService.updateUserProfile(updateData);
      
      localStorage.setItem('full_name', response.full_name);
      
      setUpdateSuccess(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };
  
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
  
  const changePassword = async (e) => {
    e.preventDefault();
    
    const formErrors = validatePasswordForm();
    if (Object.keys(formErrors).length > 0) {
      setPasswordFormErrors(formErrors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      await applicantService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setPasswordChangeSuccess(true);
      setIsSubmitting(false);
      
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
  
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };
  
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Loading profile...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger-color)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Error</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={handleRetry} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>Profile Settings</h1>
      
      {updateSuccess && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px', 
          backgroundColor: 'var(--success-color)', 
          color: 'white', 
          borderRadius: '4px', 
          marginBottom: '24px' 
        }}>
          <CheckCircle size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Personal Information Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} /> Personal Information
            </h2>
          </div>
          
          <form onSubmit={updateProfile} style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="username" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="text" 
                  id="username" 
                  name="username" 
                  value={profile.username}
                  disabled
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px 8px 40px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--medium-gray)', 
                    backgroundColor: 'var(--light-gray)', 
                    fontSize: '14px', 
                    color: 'var(--text-secondary)' 
                  }}
                />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Username cannot be changed</div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="full_name" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Full Name</label>
              <input 
                type="text" 
                id="full_name" 
                name="full_name" 
                value={profile.full_name}
                onChange={handleProfileChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)' 
                }}
                required
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  value={profile.email}
                  onChange={handleProfileChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px 8px 40px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--medium-gray)', 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="phone" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Phone Number</label>
              <input 
                type="tel" 
                id="phone" 
                name="phone" 
                value={additionalInfo.phone || ''}
                onChange={handleAdditionalInfoChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)' 
                }}
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="address" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Address</label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                value={additionalInfo.address || ''}
                onChange={handleAdditionalInfoChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)' 
                }}
              />
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Educational & Professional Information Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Educational & Professional Information
            </h2>
          </div>
          
          <form onSubmit={updateProfile} style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="education" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Education</label>
              <textarea 
                id="education" 
                name="education" 
                value={additionalInfo.education || ''}
                onChange={handleAdditionalInfoChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)', 
                  minHeight: '100px' 
                }}
                placeholder="Enter your educational background (degrees, institutions, graduation years)"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="experience" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Work Experience</label>
              <textarea 
                id="experience" 
                name="experience" 
                value={additionalInfo.experience || ''}
                onChange={handleAdditionalInfoChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)', 
                  minHeight: '100px' 
                }}
                placeholder="Enter your work experience (positions, companies, dates)"
              />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="skills" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Skills</label>
              <textarea 
                id="skills" 
                name="skills" 
                value={additionalInfo.skills || ''}
                onChange={handleAdditionalInfoChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)', 
                  minHeight: '100px' 
                }}
                placeholder="Enter your skills and competencies"
              />
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                ) : (
                  <><Save size={16} /> Save Changes</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Key size={20} /> Change Password
            </h2>
          </div>
          
          {passwordChangeSuccess && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '12px', 
              backgroundColor: 'var(--success-color)', 
              color: 'white', 
              borderRadius: '4px', 
              margin: '16px' 
            }}>
              <CheckCircle size={18} />
              <span>Password changed successfully!</span>
            </div>
          )}
          
          <form onSubmit={changePassword} style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="current_password" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Current Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  id="current_password" 
                  name="current_password" 
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    border: `1px solid ${passwordFormErrors.current_password ? 'var(--danger-color)' : 'var(--medium-gray)'}`, 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-secondary)' 
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordFormErrors.current_password && (
                <div style={{ fontSize: '12px', color: 'var(--danger-color)', marginTop: '4px' }}>{passwordFormErrors.current_password}</div>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="new_password" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  id="new_password" 
                  name="new_password" 
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    border: `1px solid ${passwordFormErrors.new_password ? 'var(--danger-color)' : 'var(--medium-gray)'}`, 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-secondary)' 
                  }}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordFormErrors.new_password ? (
                <div style={{ fontSize: '12px', color: 'var(--danger-color)', marginTop: '4px' }}>{passwordFormErrors.new_password}</div>
              ) : (
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Must be at least 8 characters long</div>
              )}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="confirm_password" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Confirm New Password</label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirm_password" 
                  name="confirm_password" 
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    border: `1px solid ${passwordFormErrors.confirm_password ? 'var(--danger-color)' : 'var(--medium-gray)'}`, 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-secondary)' 
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordFormErrors.confirm_password && (
                <div style={{ fontSize: '12px', color: 'var(--danger-color)', marginTop: '4px' }}>{passwordFormErrors.confirm_password}</div>
              )}
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <button 
                type="submit" 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px' 
                }}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Updating...</>
                ) : (
                  <><Key size={16} /> Change Password</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Account Information Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} /> Account Information
            </h2>
          </div>
          
          <div style={{ padding: '16px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>Account Status</div>
              <div style={{ 
                display: 'inline-block', 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: profile.status === 'active' ? 'var(--success-color)' : 'var(--danger-color)', 
                color: 'white', 
                fontSize: '12px', 
                fontWeight: '500' 
              }}>
                {profile.status}
              </div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>Account Type</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>Applicant</div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>Member Since</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formatDate(profile.created_at)}</div>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px' }}>Last Login</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formatDate(profile.last_login)}</div>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} /> Recent Activity
            </h2>
          </div>
          
          {activity.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No recent activity found.</p>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {activity.map((item) => (
                <div key={item.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: 'var(--light-gray)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                      {item.activity_type === 'login' && <User size={16} color="var(--text-secondary)" />}
                      {item.activity_type === 'logout' && <User size={16} color="var(--text-secondary)" />}
                      {item.activity_type === 'attendance' && <CheckCircle size={16} color="var(--text-secondary)" />}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {item.details || `${item.activity_type.charAt(0).toUpperCase() + item.activity_type.slice(1)} activity recorded`}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {formatDate(item.activity_time)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications Card */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={20} /> Recent Applications
            </h2>
          </div>
          
          {applications.length === 0 ? (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No applications found.</p>
            </div>
          ) : (
            <div style={{ padding: '16px' }}>
              {applications.map((app) => (
                <div key={app.application_id || app.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--medium-gray)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{app.program_title}</div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{app.job_role} - {app.department}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Applied: {formatDate(app.applied_at)}</div>
                    </div>
                    <div style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: app.status === 'pending' ? 'var(--warning-color)' : 
                                    app.status === 'shortlisted' ? 'var(--info-color)' : 
                                    app.status === 'hired' ? 'var(--success-color)' : 
                                    app.status === 'rejected' ? 'var(--danger-color)' : 'var(--medium-gray)', 
                      color: 'white', 
                      fontSize: '12px', 
                      fontWeight: '500' 
                    }}>
                      {app.status}
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

export default ApplicantProfile;