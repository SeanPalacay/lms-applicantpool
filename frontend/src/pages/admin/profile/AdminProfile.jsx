import React, { useState, useEffect } from 'react';
import { User, Mail, Key, Shield, Calendar, Clock, Save, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService';

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
        if (!token) {
          setError('You are not logged in. Please log in to access your profile.');
          setLoading(false);
          return;
        }
        
        let userId = localStorage.getItem('userId');
        if (!userId) {
          const decodedToken = atob(token);
          userId = decodedToken.split(':')[0];
          localStorage.setItem('userId', userId);
        }
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
    setProfileData({ ...profileData, [name]: value });
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
    if (!validateForm()) return;
    setSaving(true);
    try {
      const userId = localStorage.getItem('userId') || '';
      if (!userId) throw new Error('User ID not found. Please log in again.');
      const updateData = {
        full_name: profileData.full_name,
        email: profileData.email
      };
      if (profileData.new_password && profileData.current_password) {
        updateData.current_password = profileData.current_password;
        updateData.password = profileData.new_password;
      }
      await adminService.updateUser(userId, updateData);
      setProfileData({
        ...profileData,
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
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
    return new Date(dateString).toLocaleString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
          Administrator Profile
        </h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div> {/* --primary-color */}
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        {/* Account Information Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px', // --radius-lg
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        }}>
          <div style={{
            backgroundColor: '#E3F2FD', // --primary-ultralight
            padding: '16px',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <User size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Account Information</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '9999px',
                backgroundColor: '#1E88E5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#ffffff'
              }}>
                {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div>
                <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                  {profileData.full_name || 'Administrator'}
                </h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: '#1E88E5',
                    backgroundColor: '#E3F2FD',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <Shield size={14} /> {profileData.role.charAt(0).toUpperCase() + profileData.role.slice(1)}
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    color: profileData.status === 'active' ? '#2ecc71' : '#e74c3c',
                    backgroundColor: profileData.status === 'active' ? '#e6ffe6' : '#ffe6e6',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    {profileData.status === 'active' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {profileData.status.charAt(0).toUpperCase() + profileData.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { icon: Mail, label: 'Email', value: profileData.email },
                { icon: User, label: 'Username', value: profileData.username },
                { icon: Calendar, label: 'Account Created', value: formatDate(profileData.created_at) },
                { icon: Clock, label: 'Last Login', value: formatDate(profileData.last_login) }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <item.icon size={16} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Profile Card */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          <div style={{
            backgroundColor: '#E3F2FD',
            padding: '16px',
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <Shield size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Edit Profile</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="full_name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={profileData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    style={{
                      width: '100%',
                      padding: '8px 8px 8px 36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      outline: 'none',
                      ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    style={{
                      width: '100%',
                      padding: '8px 8px 8px 36px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      outline: 'none',
                      ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                    }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <div style={{
                  position: 'relative',
                  marginBottom: '16px',
                  textAlign: 'center'
                }}>
                  <span style={{
                    position: 'relative',
                    padding: '0 8px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    backgroundColor: '#f8fafc',
                    zIndex: 1
                  }}>
                    Change Password
                  </span>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    backgroundColor: '#e2e8f0',
                    zIndex: 0
                  }}></div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="current_password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                    Current Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      id="current_password"
                      name="current_password"
                      value={profileData.current_password}
                      onChange={handleInputChange}
                      placeholder="Enter current password"
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 36px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        outline: 'none',
                        ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="new_password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      id="new_password"
                      name="new_password"
                      value={profileData.new_password}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 36px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        outline: 'none',
                        ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                      }}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label htmlFor="confirm_password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                      type={passwordVisible ? 'text' : 'password'}
                      id="confirm_password"
                      name="confirm_password"
                      value={profileData.confirm_password}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      style={{
                        width: '100%',
                        padding: '8px 8px 8px 36px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        outline: 'none',
                        ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={passwordVisible}
                    onChange={togglePasswordVisibility}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Show passwords</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#f39c12' }}>
                  <AlertTriangle size={14} />
                  <span>Password must be at least 8 characters long.</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    backgroundColor: '#1E88E5',
                    color: '#ffffff',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.3s ease',
                    ':hover': saving ? {} : { backgroundColor: '#1565C0' }
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Changes
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