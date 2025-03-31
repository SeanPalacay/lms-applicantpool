import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Key, Eye, EyeOff, Save, AlertTriangle, 
  Clock, RefreshCw, CheckCircle, Loader, File, 
  Calendar, Activity, Shield, LogOut, Edit, Download
} from 'lucide-react';
import traineeService from '../../../services/traineeService';

// Recreate the isTokenExpired function since it's not exported
const isTokenExpired = () => {
  const loginTime = localStorage.getItem('loginTime');
  if (!loginTime) return true;
  const expirationTime = new Date(loginTime).getTime() + 24 * 60 * 60 * 1000; // 24 hours
  return new Date().getTime() > expirationTime;
};

// Base URL for your backend
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
    last_login: '',
    final_grade: '',
    resumes: []
  });

  // State for uploading a file
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState('');

  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'password'

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  // ------------------------------------------------------
  // 1) Fetch Profile & Activity on Component Mount
  // ------------------------------------------------------
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem('authToken');
        if (!token) {
          throw new Error('No token found. Please log in again.');
        }
        if (isTokenExpired()) {
          localStorage.removeItem('authToken');
          throw new Error('Session expired. Please log in again.');
        }

        // 1. GET: /trainee/profile.php
        const profileEndpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/profile.php`;
        const profileResponse = await fetch(profileEndpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
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
        localStorage.setItem('userName', profileData.full_name);

        // 2. GET: /trainee/activity.php
        const activityEndpoint = `${API_BASE_URL}/lms-forbes/backend/api/trainee/activity.php`;
        const activityResponse = await fetch(activityEndpoint, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
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
        console.error('Error fetching profile data:', err);
        setError(err.message || 'Failed to load profile data. Please try again later.');
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // --------------------------------------------
  // Handle Changes for Full Name / Email Fields
  // --------------------------------------------
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    if (updateSuccess) {
      setUpdateSuccess(false);
    }
  };

  // ----------------------------
  // Handle File Input (Resume)
  // ----------------------------
  const handleResumeFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setResumeFile(e.target.files[0]);
      setResumeFileName(e.target.files[0].name);
    }
  };

  const viewResume = async (resumePath) => {
    try {
      setLoading(true);
      const resumeBlob = await traineeService.getResume(resumePath);
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(resumeBlob);
      
      // Open in a new tab
      window.open(url, '_blank');
      
      // Release the blob URL after a delay
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
      
      setLoading(false);
    } catch (error) {
      console.error('Error viewing resume:', error);
      setError(error.message || 'Failed to view resume.');
      setLoading(false);
    }
  };
  
  // ---------------------------------------------
  // 2) Submit Profile / Possibly Upload Resume
  // ---------------------------------------------
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
      let response;
  
      if (resumeFile) {
        // Use FormData for file upload
        const formData = new FormData();
        formData.append('full_name', profile.full_name);
        formData.append('email', profile.email);
        formData.append('resume', resumeFile); // must match your PHP $_FILES['resume']
  
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
            // DO NOT set "Content-Type": "multipart/form-data"
          },
          body: formData
        });
      } else {
        // Otherwise, send JSON
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            full_name: profile.full_name,
            email: profile.email
          })
        });
      }
  
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json();
      
      // Update the profile state with returned data
      setProfile((prev) => ({
        ...prev,
        full_name: data.full_name || prev.full_name,
        email: data.email || prev.email,
        resume_path: data.resume_path || prev.resume_path,
        resumes: data.resumes || prev.resumes
      }));
      
      // Update username in localStorage
      localStorage.setItem('userName', data.full_name || profile.full_name);
      
      // Clear the file input state after successful upload
      setResumeFile(null);
      setResumeFileName('');
      
      // Show success message
      setUpdateSuccess(true);
      setIsSubmitting(false);
  
      // Reset the success message after 5 seconds
      setTimeout(() => {
        setUpdateSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ------------------------------------------------
  // Password Change Logic (current/new/confirm)
  // ------------------------------------------------
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordFormErrors((prev) => ({ ...prev, [name]: null }));
    if (passwordChangeSuccess) {
      setPasswordChangeSuccess(false);
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
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          setPasswordFormErrors({ current_password: 'Current password is incorrect' });
          setIsSubmitting(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }

      // Reset the form
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setPasswordChangeSuccess(true);
      setIsSubmitting(false);

      // Remove success after 5 seconds
      setTimeout(() => {
        setPasswordChangeSuccess(false);
      }, 5000);
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.message.includes('Current password is incorrect')) {
        setPasswordFormErrors({ current_password: 'Current password is incorrect' });
      } else {
        setError('Failed to change password. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    switch (field) {
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

  // ----------------------------------
  // Utility: Format Date from Backend
  // ----------------------------------
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  // -----------------------
  // Get Activity Icon
  // -----------------------
  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'login':
        return <LogOut size={16} />;
      case 'logout':
        return <LogOut size={16} />;
      case 'attendance':
        return <CheckCircle size={16} />;
      case 'profile_update':
        return <Edit size={16} />;
      case 'profile_view':
        return <User size={16} />;
      case 'document_view':
        return <File size={16} />;
      default:
        return <Activity size={16} />;
    }
  };

  // -----------------------
  // Rendering the UI
  // -----------------------
  if (loading) {
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh', 
        gap: '1rem',
        color: '#666'
      }}>
        <Loader size={32} className="spinner" style={{ 
          animation: 'spin 1s linear infinite',
          color: '#3B82F6' 
        }} />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh', 
        gap: '1rem',
        color: '#666'
      }}>
        <AlertTriangle size={48} style={{ color: '#EF4444' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#333' }}>
          Something went wrong
        </h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#3B82F6', 
            color: 'white',
            border: 'none', 
            borderRadius: '0.375rem', 
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
        >
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div
      className="profile-container"
      style={{
        padding: '2rem',
        backgroundColor: '#F3F4F6',
        minHeight: '100vh'
      }}
    >
      <div className="profile-header" style={{ marginBottom: '2rem' }}>
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#111827',
            marginBottom: '0.5rem'
          }}
        >
          Profile Settings
        </h1>
        <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
          Manage your personal information and account settings
        </p>
      </div>

      {/* Success Alert */}
      {updateSuccess && (
        <div
          className="alert alert-success"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#DCFCE7',
            color: '#16A34A',
            borderRadius: '0.375rem',
            marginBottom: '1.5rem',
            border: '1px solid #86EFAC'
          }}
        >
          <CheckCircle size={18} />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Tabs */}
      <div className="profile-tabs" style={{ 
        display: 'flex', 
        marginBottom: '1.5rem',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'profile' ? '600' : '500',
            color: activeTab === 'profile' ? '#3B82F6' : '#6B7280',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'profile' ? '2px solid #3B82F6' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={16} />
            <span>Personal Information</span>
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('password')}
          style={{
            padding: '0.75rem 1.25rem',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'password' ? '600' : '500',
            color: activeTab === 'password' ? '#3B82F6' : '#6B7280',
            backgroundColor: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'password' ? '2px solid #3B82F6' : '2px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={16} />
            <span>Change Password</span>
          </div>
        </button>
      </div>

      <div
        className="profile-content"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}
      >
        {/* LEFT: Profile Info / Password */}
        <div
          className="profile-form-container"
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            order: 1
          }}
        >
          {/* PROFILE INFO TAB */}
          {activeTab === 'profile' && (
            <>
              <form
                onSubmit={updateProfile}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Username */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="username"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    Username
                  </label>
                  <div
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem', 
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      backgroundColor: '#F9FAFB'
                    }}
                  >
                    <User size={18} style={{ color: '#6B7280' }} />
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
                        fontSize: '0.875rem', 
                        color: '#6B7280',
                        backgroundColor: 'transparent'
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                    Username cannot be changed
                  </p>
                </div>

                {/* Full Name */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="full_name"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    Full Name
                  </label>
                  <div
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem', 
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <User size={18} style={{ color: '#6B7280' }} />
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={profile.full_name}
                      onChange={handleProfileChange}
                      style={{
                        flex: 1, 
                        border: 'none', 
                        outline: 'none',
                        fontSize: '0.875rem', 
                        color: '#111827'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="email"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    Email Address
                  </label>
                  <div
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem', 
                      border: '1px solid #D1D5DB',
                      borderRadius: '0.375rem'
                    }}
                  >
                    <Mail size={18} style={{ color: '#6B7280' }} />
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
                        fontSize: '0.875rem', 
                        color: '#111827'
                      }}
                      required
                    />
                  </div>
                </div>

                {/* Resume Upload */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="resume"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    Upload Résumé
                  </label>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        border: '1px dashed #D1D5DB',
                        borderRadius: '0.375rem',
                        backgroundColor: '#F9FAFB',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('resume').click()}
                    >
                      <input
                        type="file"
                        id="resume"
                        name="resume"
                        accept=".pdf,.doc,.docx"
                        onChange={handleResumeFileChange}
                        style={{ display: 'none' }}
                      />
                      <File size={18} style={{ color: '#6B7280' }} />
                      <div style={{ flex: 1 }}>
                        {resumeFileName ? (
                          <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                            {resumeFileName}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                            Click to upload PDF or DOCX file
                          </span>
                        )}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      Supported formats: PDF, DOC, DOCX. Maximum file size: 5MB
                    </p>
                  </div>
                </div>

                {/* Current Resume */}
                {profile.resumes && profile.resumes.length > 0 && (
                  <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <label style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}>
                      Current Résumé
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem',
                        backgroundColor: '#F9FAFB',
                        borderRadius: '0.375rem',
                        border: '1px solid #E5E7EB'
                      }}
                    >
                      <File size={18} style={{ color: '#3B82F6' }} />
                      <span style={{ 
                        flex: 1,
                        fontSize: '0.875rem', 
                        color: '#111827',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {profile.resumes[0].original_name}
                      </span>
                      <button
                        type="button"
                        onClick={() => viewResume(profile.resumes[0].file_path)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#EFF6FF',
                          color: '#3B82F6',
                          border: 'none',
                          borderRadius: '0.25rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#DBEAFE'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                      Uploaded on {formatDate(profile.resumes[0].uploaded_at)}
                    </p>
                  </div>
                )}

                {/* Account Info Section */}
                <div className="account-info" style={{ 
                  marginTop: '0.5rem',
                  padding: '1rem',
                  backgroundColor: '#F9FAFB',
                  borderRadius: '0.375rem',
                  border: '1px solid #E5E7EB'
                }}>
                  <h3 style={{ 
                    fontSize: '0.875rem', 
                    color: '#4B5563', 
                    fontWeight: '600',
                    marginBottom: '0.75rem'
                  }}>
                    Account Information
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {/* Account Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Account Status</span>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: profile.status === 'active' ? '#DCFCE7' : '#FEF2F2',
                        color: profile.status === 'active' ? '#16A34A' : '#EF4444',
                        borderRadius: '2rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        <span style={{ 
                          display: 'inline-block',
                          width: '0.5rem',
                          height: '0.5rem',
                          borderRadius: '50%',
                          backgroundColor: profile.status === 'active' ? '#16A34A' : '#EF4444',
                          marginRight: '0.375rem'
                        }}></span>
                        {profile.status.charAt(0).toUpperCase() + profile.status.slice(1)}
                      </span>
                    </div>

                    {/* Member Since */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Member Since</span>
                      <span style={{ fontSize: '0.8125rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Calendar size={14} style={{ color: '#6B7280' }} />
                        {formatDate(profile.created_at)}
                      </span>
                    </div>

                    {/* Last Login */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Last Login</span>
                      <span style={{ fontSize: '0.8125rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <Clock size={14} style={{ color: '#6B7280' }} />
                        {formatDate(profile.last_login)}
                      </span>
                    </div>

                    {/* Role */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Account Type</span>
                      <span style={{ 
                        fontSize: '0.8125rem', 
                        color: '#111827', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.375rem' 
                      }}>
                        <Shield size={14} style={{ color: '#6B7280' }} />
                        {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                      </span>
                    </div>

                    {/* Final Grade (if available) */}
                    {profile.final_grade && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Final Grade</span>
                        <span style={{ 
                          fontSize: '0.8125rem', 
                          fontWeight: '600',
                          color: '#111827' 
                        }}>
                          {profile.final_grade}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Changes */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    disabled={isSubmitting}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2563EB')}
                    onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#3B82F6')}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* PASSWORD CHANGE TAB */}
          {activeTab === 'password' && (
            <>
              {/* Password Change Success Alert */}
              {passwordChangeSuccess && (
                <div
                  className="alert alert-success"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#DCFCE7',
                    color: '#16A34A',
                    borderRadius: '0.375rem',
                    marginBottom: '1.5rem',
                    border: '1px solid #86EFAC'
                  }}
                >
                  <CheckCircle size={18} />
                  <span>Password updated successfully!</span>
                </div>
              )}
              
              <form 
                onSubmit={changePassword}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Current Password */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="current_password"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    Current Password
                  </label>
                  <div
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem', 
                      border: passwordFormErrors.current_password 
                        ? '1px solid #EF4444' 
                        : '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      backgroundColor: passwordFormErrors.current_password 
                        ? '#FEF2F2' 
                        : 'white'
                    }}
                  >
                    <Key size={18} style={{ color: '#6B7280' }} />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="current_password"
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      style={{
                        flex: 1, 
                        border: 'none', 
                        outline: 'none',
                        fontSize: '0.875rem', 
                        color: '#111827',
                        backgroundColor: 'transparent'
                      }}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        cursor: 'pointer',
                        color: '#6B7280'
                      }}
                    >
                      {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordFormErrors.current_password && (
                    <p style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>
                      {passwordFormErrors.current_password}
                    </p>
                  )}
                </div>
                
                {/* New Password */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="new_password"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    New Password
                  </label>
                  <div
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem', 
                      border: passwordFormErrors.new_password 
                        ? '1px solid #EF4444' 
                        : '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      backgroundColor: passwordFormErrors.new_password 
                        ? '#FEF2F2' 
                        : 'white'
                    }}
                  >
                    <Key size={18} style={{ color: '#6B7280' }} />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="new_password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      style={{
                        flex: 1, 
                        border: 'none', 
                        outline: 'none',
                        fontSize: '0.875rem', 
                        color: '#111827',
                        backgroundColor: 'transparent'
                      }}
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        cursor: 'pointer',
                        color: '#6B7280'
                      }}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordFormErrors.new_password ? (
                    <p style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>
                      {passwordFormErrors.new_password}
                    </p>
                  ) : (
                    <p style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '0.25rem' }}>
                      Password must be at least 8 characters long
                    </p>
                  )}
                </div>
                
                {/* Confirm Password */}
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <label
                    htmlFor="confirm_password"
                    style={{ fontSize: '0.875rem', color: '#4B5563', fontWeight: '500' }}
                  >
                    Confirm New Password
                  </label>
                  <div
                    style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem', 
                      border: passwordFormErrors.confirm_password 
                        ? '1px solid #EF4444' 
                        : '1px solid #D1D5DB',
                      borderRadius: '0.375rem',
                      backgroundColor: passwordFormErrors.confirm_password 
                        ? '#FEF2F2' 
                        : 'white'
                    }}
                  >
                    <Key size={18} style={{ color: '#6B7280' }} />
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirm_password"
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      style={{
                        flex: 1, 
                        border: 'none', 
                        outline: 'none',
                        fontSize: '0.875rem', 
                        color: '#111827',
                        backgroundColor: 'transparent'
                      }}
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '0',
                        cursor: 'pointer',
                        color: '#6B7280'
                      }}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passwordFormErrors.confirm_password && (
                    <p style={{ fontSize: '0.75rem', color: '#EF4444', marginTop: '0.25rem' }}>
                      {passwordFormErrors.confirm_password}
                    </p>
                  )}
                </div>
                
                {/* Password Security Note */}
                <div 
                  style={{ 
                    padding: '0.75rem 1rem',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '0.375rem',
                    marginTop: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Shield size={16} style={{ color: '#4B5563' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#4B5563' }}>
                      Password Security
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.5rem' }}>
                    For a strong password, consider:
                  </p>
                  <ul style={{ fontSize: '0.75rem', color: '#6B7280', paddingLeft: '1.25rem', margin: 0 }}>
                    <li>Using at least 8 characters</li>
                    <li>Including uppercase and lowercase letters</li>
                    <li>Adding numbers and special characters</li>
                    <li>Avoiding common words or personal information</li>
                  </ul>
                </div>
                
                {/* Submit Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button
                    type="submit"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                    }}
                    disabled={isSubmitting}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#2563EB')}
                    onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#3B82F6')}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Key size={16} />
                        <span>Update Password</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* RIGHT: Recent Activity */}
        <div
          style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            order: 2
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.25rem'
            }}
          >
            <Clock size={20} style={{ color: '#3B82F6' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827' }}>
              Recent Activity
            </h2>
          </div>

          {activity.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem 1rem',
                color: '#6B7280',
                backgroundColor: '#F9FAFB',
                borderRadius: '0.375rem',
                border: '1px dashed #D1D5DB'
              }}
            >
              <Activity size={32} style={{ color: '#9CA3AF', marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>No recent activity found</p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#9CA3AF', textAlign: 'center' }}>
                Your recent actions will appear here
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activity.slice(0, 10).map((item, index) => (
                <div
                  key={item.id || index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 0',
                    borderBottom: index < activity.slice(0, 10).length - 1 ? '1px solid #E5E7EB' : 'none'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '50%',
                      backgroundColor: '#EFF6FF',
                      color: '#3B82F6',
                      flexShrink: 0
                    }}
                  >
                    {getActivityIcon(item.activity_type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500', marginBottom: '0.25rem' }}>
                      {item.details ||
                        `${item.activity_type.charAt(0).toUpperCase() + item.activity_type.slice(1)} activity recorded`}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {formatDate(item.activity_time)}
                    </div>
                  </div>
                </div>
              ))}
              
              {activity.length > 10 && (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  marginTop: '1rem' 
                }}>
                  <button
                    style={{
                      padding: '0.375rem 0.75rem',
                      backgroundColor: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem',
                      color: '#374151',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E5E7EB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                  >
                    View all activity
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Support Section */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}
      >
        <p style={{ fontSize: '0.75rem', color: '#6B7280', margin: 0 }}>
          Need help? Contact support at <a href="mailto:support@forbes.com" style={{ color: '#3B82F6', textDecoration: 'none' }}>support@forbes.com</a>
        </p>
      </div>
    </div>
  );
};

export default TraineeProfile;