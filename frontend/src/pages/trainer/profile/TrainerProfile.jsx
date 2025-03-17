import React, { useState, useEffect } from 'react';
import { 
  User,LogOut,LogIn,Activity, Mail, Phone, Calendar, Save, Edit,
  Lock, Eye, EyeOff, Clock, CheckCircle, ShieldAlert,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TrainerProfile.css';

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
            
            setActivity([]);
            setLoading(false);
            return;
          }
          
          const errorText = await profileResponse.text();
          throw new Error(`HTTP error: ${profileResponse.status} - ${errorText}`);
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);
        setFormData({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          bio: profileData.bio || ''
        });
        
        try {
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
            setActivity([]);
          }
        } catch (activityErr) {
          console.error('Error fetching activity data:', activityErr);
          setActivity([]);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile information. Please try again later.');
        
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
  }, [API_BASE_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const toggleEditMode = () => {
    if (editMode) {
      setFormData({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || ''
      });
    }
    setEditMode(!editMode);
  };

  const togglePasswordForm = () => {
    if (showPasswordForm) {
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

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
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/update_profile.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data);
      setSuccessMessage('Profile updated successfully!');
      setEditMode(false);
      
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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    
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
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      setPasswordSuccess('Password changed successfully');
      
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-xl)', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Card */}
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: 'var(--spacing-md)', 
              borderBottom: '1px solid var(--medium-gray)', 
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <User size={20} color="white" />
              <h3 style={{ color: 'white', margin: 0 }}>Profile Information</h3>
            </div>
            <button 
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)' 
              }}
              onClick={toggleEditMode}
            >
              <Edit size={16} />
              <span>{editMode ? 'Cancel' : 'Edit'}</span>
            </button>
          </div>
          
          <div style={{ padding: 'var(--spacing-md)' }}>
            {editMode ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '24px', 
                    fontWeight: '600', 
                    margin: '0 auto' 
                  }}
                >
                  {getInitials(formData.full_name)}
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="full_name" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger-color)' }}>*</span> Full Name:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', border: '1px solid var(--medium-gray)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs)' }}>
                    <User size={18} color="var(--text-secondary)" />
                    <input 
                      type="text" 
                      id="full_name" 
                      name="full_name" 
                      value={formData.full_name} 
                      onChange={handleChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none' }}
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="email" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger-color)' }}>*</span> Email:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', border: '1px solid var(--medium-gray)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs)' }}>
                    <Mail size={18} color="var(--text-secondary)" />
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none' }}
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="phone" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    Phone:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', border: '1px solid var(--medium-gray)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs)' }}>
                    <Phone size={18} color="var(--text-secondary)" />
                    <input 
                      type="tel" 
                      id="phone" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none' }}
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="bio" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    Bio / About Me:
                  </label>
                  <textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleChange}
                    style={{ 
                      border: '1px solid var(--medium-gray)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: 'var(--spacing-xs)', 
                      outline: 'none', 
                      background: 'none', 
                      resize: 'vertical', 
                      minHeight: '100px' 
                    }}
                    placeholder="Write something about yourself..."
                  ></textarea>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={toggleEditMode} 
                    style={{ 
                      background: 'none', 
                      border: '1px solid var(--medium-gray)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: 'var(--spacing-sm) var(--spacing-md)', 
                      cursor: 'pointer', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    style={{ 
                      background: 'var(--primary-color)', 
                      border: 'none', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: 'var(--spacing-sm) var(--spacing-md)', 
                      cursor: 'pointer', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)' 
                    }}
                  >
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', 
                    color: 'white', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '24px', 
                    fontWeight: '600', 
                    margin: '0 auto' 
                  }}
                >
                  {getInitials(profile.full_name)}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{profile.full_name}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Trainer</div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Mail size={18} color="var(--text-secondary)" />
                    <span>{profile.email || 'No email provided'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Phone size={18} color="var(--text-secondary)" />
                    <span>{profile.phone || 'No phone number'}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Calendar size={18} color="var(--text-secondary)" />
                    <span>Joined {formatDate(profile.created_at)}</span>
                  </div>
                </div>
                
                {profile.bio && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>About Me</h4>
                    <p style={{ color: 'var(--text-secondary)' }}>{profile.bio}</p>
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <button 
                    onClick={togglePasswordForm}
                    style={{ 
                      background: 'none', 
                      border: '1px solid var(--medium-gray)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: 'var(--spacing-sm) var(--spacing-md)', 
                      cursor: 'pointer', 
                      color: 'var(--text-primary)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)' 
                    }}
                  >
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
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                padding: 'var(--spacing-md)', 
                borderBottom: '1px solid var(--medium-gray)', 
                background: 'linear-gradient(135deg, var(--danger-color), var(--warning-color))' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <Lock size={20} color="white" />
                <h3 style={{ color: 'white', margin: 0 }}>Change Password</h3>
              </div>
              <button 
                onClick={togglePasswordForm}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'white', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <XCircle size={16} />
              </button>
            </div>
            
            <div style={{ padding: 'var(--spacing-md)' }}>
              {passwordError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--danger-color)', marginBottom: 'var(--spacing-md)' }}>
                  <ShieldAlert size={16} />
                  <span>{passwordError}</span>
                </div>
              )}
              
              {passwordSuccess && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--success-color)', marginBottom: 'var(--spacing-md)' }}>
                  <CheckCircle size={16} />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="current_password" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger-color)' }}>*</span> Current Password:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', border: '1px solid var(--medium-gray)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs)' }}>
                    <Lock size={18} color="var(--text-secondary)" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="current_password" 
                      name="current_password" 
                      value={passwordData.current_password} 
                      onChange={handlePasswordChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none' }}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={togglePasswordVisibility}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="new_password" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger-color)' }}>*</span> New Password:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', border: '1px solid var(--medium-gray)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs)' }}>
                    <Lock size={18} color="var(--text-secondary)" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="new_password" 
                      name="new_password" 
                      value={passwordData.new_password} 
                      onChange={handlePasswordChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none' }}
                      required
                      minLength={8}
                    />
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Must be at least 8 characters long</small>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  <label htmlFor="confirm_password" style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--danger-color)' }}>*</span> Confirm New Password:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', border: '1px solid var(--medium-gray)', borderRadius: 'var(--radius-sm)', padding: 'var(--spacing-xs)' }}>
                    <Lock size={18} color="var(--text-secondary)" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="confirm_password" 
                      name="confirm_password" 
                      value={passwordData.confirm_password} 
                      onChange={handlePasswordChange}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'none' }}
                      required
                    />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'flex-end' }}>
                  <button 
                    type="button" 
                    onClick={togglePasswordForm}
                    style={{ 
                      background: 'none', 
                      border: '1px solid var(--medium-gray)', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: 'var(--spacing-sm) var(--spacing-md)', 
                      cursor: 'pointer', 
                      color: 'var(--text-primary)' 
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={changingPassword}
                    style={{ 
                      background: 'var(--primary-color)', 
                      border: 'none', 
                      borderRadius: 'var(--radius-sm)', 
                      padding: 'var(--spacing-sm) var(--spacing-md)', 
                      cursor: 'pointer', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)' 
                    }}
                  >
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
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)' }}>
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: 'var(--spacing-md)', 
              borderBottom: '1px solid var(--medium-gray)', 
              background: 'linear-gradient(135deg, var(--secondary-color), var(--success-color))' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <Activity size={20} color="white" />
              <h3 style={{ color: 'white', margin: 0 }}>Recent Activity</h3>
            </div>
          </div>
          
          <div style={{ padding: 'var(--spacing-md)' }}>
            {activity && activity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {activity.map((item, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        background: 'var(--primary-ultralight)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}
                    >
                      {item.activity_type === 'login' && <LogIn size={16} color="var(--primary-color)" />}
                      {item.activity_type === 'logout' && <LogOut size={16} color="var(--primary-color)" />}
                      {item.activity_type === 'attendance' && <Clock size={16} color="var(--primary-color)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{item.details}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{formatDate(item.activity_time)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-md)', color: 'var(--text-muted)' }}>
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

export default TrainerProfile;