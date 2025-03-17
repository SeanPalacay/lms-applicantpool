// src/pages/admin/profile/AdminProfile.jsx
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Key, 
  Shield, 
  Calendar, 
  Clock, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService';
import './AdminProfile.css';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'administrator',
    status: 'active',
    created_at: '',
    last_login: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        console.log('authToken:', token);
        if (!token) {
          setError('You are not logged in. Please log in to access your profile.');
          setLoading(false);
          return;
        }
        
        let userId = localStorage.getItem('userId');
        if (!userId) {
          // Parse userId from token if not in localStorage
          const decodedToken = atob(token); // Base64 decode
          userId = decodedToken.split(':')[0]; // Extract userId (e.g., "1")
          console.log('Parsed userId from token:', userId);
          localStorage.setItem('userId', userId); // Store it for future use
        }
        console.log('userId:', userId);
        if (!userId) {
          setError('User ID not found. Please log in again.');
          setLoading(false);
          return;
        }
  
        const data = await adminService.getUserById(userId);
        setProfileData({
          ...profileData,
          username: data.username || '',
          full_name: data.full_name || '',
          email: data.email || '',
          created_at: data.created_at || '',
          last_login: data.last_login || '',
          status: data.status || 'active',
          role: data.role || 'administrator'
        });
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to load profile data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchProfileData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const validateForm = () => {
    setError(null);
    setSuccess(null);
    
    if (!profileData.full_name.trim()) {
      setError('Full name is required.');
      return false;
    }
    
    if (!profileData.email.trim()) {
      setError('Email is required.');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    
    if (profileData.new_password || profileData.confirm_password) {
      if (!profileData.current_password) {
        setError('Current password is required to change password.');
        return false;
      }
      
      if (profileData.new_password !== profileData.confirm_password) {
        setError('New password and confirmation do not match.');
        return false;
      }
      
      if (profileData.new_password.length < 8) {
        setError('New password must be at least 8 characters long.');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const userId = localStorage.getItem('userId') || '';
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const updateData = {
        full_name: profileData.full_name,
        email: profileData.email
      };
      
      // Include password data if changing password
      if (profileData.new_password && profileData.current_password) {
        updateData.current_password = profileData.current_password;
        updateData.password = profileData.new_password; // Backend expects 'password' for new password
      }
      
      // Use updateUser instead of updateAdminProfile
      await adminService.updateUser(userId, updateData);
      
      // Clear password fields
      setProfileData({
        ...profileData,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      // Update user's name in local storage
      localStorage.setItem('full_name', profileData.full_name);
      
      setSuccess('Profile updated successfully.');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-profile-container">
      <div className="section-header">
        <h1>Administrator Profile</h1>
        <div className="header-line"></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="card-header gradient-blue">
            <div className="header-icon">
              <User size={20} />
            </div>
            <div className="header-content">
              <h3>Account Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            <div className="profile-info">
              <div className="profile-avatar">
                {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              
              <div className="info-details">
                <h2>{profileData.full_name || 'Administrator'}</h2>
                <div className="user-meta">
                  <span className="role-badge">
                    <Shield size={14} className="icon-inline" />
                    {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                  </span>
                  <span className={`status-badge status-${profileData.status}`}>
                    {profileData.status === 'active' ? 
                      <CheckCircle size={14} className="icon-inline" /> : 
                      <XCircle size={14} className="icon-inline" />
                    }
                    {profileData.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="account-details">
              <div className="detail-item">
                <div className="detail-icon">
                  <Mail size={16} />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Email</div>
                  <div className="detail-value">{profileData.email}</div>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <User size={16} />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Username</div>
                  <div className="detail-value">{profileData.username}</div>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <Calendar size={16} />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Account Created</div>
                  <div className="detail-value">{formatDate(profileData.created_at)}</div>
                </div>
              </div>
              
              <div className="detail-item">
                <div className="detail-icon">
                  <Clock size={16} />
                </div>
                <div className="detail-content">
                  <div className="detail-label">Last Login</div>
                  <div className="detail-value">{formatDate(profileData.last_login)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="profile-card">
          <div className="card-header gradient-purple">
            <div className="header-icon">
              <Shield size={20} />
            </div>
            <div className="header-content">
              <h3>Edit Profile</h3>
            </div>
          </div>
          
          <div className="card-content">
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                  />
                </div>
              </div>
              
              <div className="password-section">
                <div className="section-divider">
                  <span>Change Password</span>
                </div>
                
                <div className="form-group">
                  <label htmlFor="current_password">Current Password</label>
                  <div className="input-with-icon">
                    <Key size={18} className="input-icon" />
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="current_password"
                      name="current_password"
                      value={profileData.current_password}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="new_password">New Password</label>
                  <div className="input-with-icon">
                    <Key size={18} className="input-icon" />
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="new_password"
                      name="new_password"
                      value={profileData.new_password}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirm_password">Confirm New Password</label>
                  <div className="input-with-icon">
                    <Key size={18} className="input-icon" />
                    <input
                      type={passwordVisible ? "text" : "password"}
                      id="confirm_password"
                      name="confirm_password"
                      value={profileData.confirm_password}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
                
                <div className="show-password">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={passwordVisible}
                      onChange={togglePasswordVisibility}
                    />
                    <span className="checkbox-text">Show passwords</span>
                  </label>
                </div>
                
                <div className="password-requirements">
                  <AlertTriangle size={14} className="icon-inline" />
                  <span>Password must be at least 8 characters long.</span>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="action-button primary" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="icon-inline spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="icon-inline" /> Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;