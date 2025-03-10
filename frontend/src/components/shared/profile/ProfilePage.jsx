import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    bio: '',
    profilePic: '',
    address: '',
    city: '',
    country: '',
    postalCode: '',
    skills: [],
    newSkill: ''
  });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userRole, setUserRole] = useState('');

  // Fetch user profile data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8080/lms/backend/api/profile_api.php?action=get_profile', {
          credentials: 'include'
        });
        
        // Check for authentication issues
        if (response.status === 401) {
          setError('Unauthorized access. Please log in again.');
          navigate('/login');
          return;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        
        const data = await response.json();
        console.log('Profile data:', data);
        
        if (data.status === 'success') {
          const userData = data.user;
          setUser(userData);
          setUserRole(userData.role);
          
          // Initialize form data with user data
          setFormData({
            fullName: `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            email: userData.email || '',
            phone: userData.phone || '',
            position: userData.position || '',
            department: userData.department || '',
            bio: userData.bio || '',
            profilePic: userData.profile_pic || '',
            address: userData.address || '',
            city: userData.city || '',
            country: userData.country || '',
            postalCode: userData.postal_code || '',
            skills: userData.skills || [],
            newSkill: ''
          });
        } else {
          setError(data.message || 'Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError(error.message || 'Failed to load profile information. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchUserData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSkill = () => {
    if (formData.newSkill.trim() && !formData.skills.includes(formData.newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, formData.newSkill.trim()],
        newSkill: ''
      });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(skill => skill !== skillToRemove)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    
    try {
      const response = await fetch('http://localhost:8080/lms/backend/api/profile_api.php?action=update_profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure session is sent
        body: JSON.stringify(formData),
      });
  
      const data = await response.json();
      console.log('Update profile response:', data);
  
      if (data.status === 'success') {
        // Update local user state with new data
        setUser({
          ...user,
          first_name: formData.fullName.split(' ')[0],
          last_name: formData.fullName.split(' ').slice(1).join(' '),
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          department: formData.department,
          bio: formData.bio,
          profile_pic: formData.profilePic,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          postal_code: formData.postalCode,
          skills: formData.skills
        });
        
        setSuccessMessage('Profile updated successfully');
        setIsEditing(false);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('An error occurred while updating the profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to user data
    setFormData({
      fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      email: user.email || '',
      phone: user.phone || '',
      position: user.position || '',
      department: user.department || '',
      bio: user.bio || '',
      profilePic: user.profile_pic || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      postalCode: user.postal_code || '',
      skills: user.skills || [],
      newSkill: ''
    });
    setIsEditing(false);
    setError(null);
    setSuccessMessage('');
  };

  // Role-specific UI elements
  const getRoleSpecificTitle = () => {
    switch (userRole) {
      case 'admin':
        return 'Administrator Profile';
      case 'trainer':
        return 'Trainer Profile';
      case 'trainee':
        return 'Trainee Profile';
      case 'applicant':
        return 'Applicant Profile';
      default:
        return 'User Profile';
    }
  };

  // Role-specific tab options
  const getTabOptions = () => {
    const tabs = [
      { id: 'personal', label: 'Personal' },
      { id: 'professional', label: 'Professional' }
    ];
    
    // Add role-specific tabs
    if (userRole === 'trainer' || userRole === 'admin') {
      tabs.push({ id: 'qualifications', label: 'Qualifications' });
    }
    
    if (userRole !== 'applicant') {
      tabs.push({ id: 'address', label: 'Address' });
    }
    
    return tabs;
  };

  // Clear any error message when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSuccessMessage('');
  };

  if (loading && !user) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const renderPersonalInfo = () => (
    <div className="profile-section">
      <h3>Personal Information</h3>
      {isEditing ? (
        <>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </div>
          <div className="form-group">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself"
              rows="4"
            ></textarea>
          </div>
        </>
      ) : (
        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Full Name:</span>
            <span className="info-value">
              {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Not provided'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Email:</span>
            <span className="info-value">{user?.email || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Phone:</span>
            <span className="info-value">{user?.phone || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Bio:</span>
            <span className="info-value bio-text">{user?.bio || 'No bio provided'}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderProfessionalInfo = () => (
    <div className="profile-section">
      <h3>Professional Information</h3>
      {isEditing ? (
        <>
          <div className="form-group">
            <label>Position</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Enter your job title"
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              placeholder="Enter your department"
            />
          </div>
          <div className="form-group">
            <label>Skills</label>
            <div className="skills-input-container">
              <input
                type="text"
                name="newSkill"
                value={formData.newSkill}
                onChange={handleInputChange}
                placeholder="Add a skill"
              />
              <button type="button" onClick={handleAddSkill} className="add-skill-btn">
                Add
              </button>
            </div>
            <div className="skills-list">
              {formData.skills.map((skill, index) => (
                <div key={index} className="skill-tag">
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSkill(skill)}
                    className="remove-skill-btn"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Position:</span>
            <span className="info-value">{user?.position || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Department:</span>
            <span className="info-value">{user?.department || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Skills:</span>
            <div className="skills-display">
              {user?.skills && user.skills.length > 0 ? (
                user.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))
              ) : (
                <span className="info-value">No skills listed</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderQualificationsInfo = () => (
    <div className="profile-section">
      <h3>Qualifications & Certifications</h3>
      {isEditing ? (
        <>
          <div className="form-group">
            <label>Educational Background</label>
            <textarea
              name="education"
              value={formData.education || ''}
              onChange={handleInputChange}
              placeholder="Enter your educational background"
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label>Certifications</label>
            <textarea
              name="certifications"
              value={formData.certifications || ''}
              onChange={handleInputChange}
              placeholder="List your certifications"
              rows="3"
            ></textarea>
          </div>
          <div className="form-group">
            <label>Experience</label>
            <textarea
              name="experience"
              value={formData.experience || ''}
              onChange={handleInputChange}
              placeholder="Describe your work experience"
              rows="3"
            ></textarea>
          </div>
        </>
      ) : (
        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Education:</span>
            <span className="info-value">{user?.education || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Certifications:</span>
            <span className="info-value">{user?.certifications || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Experience:</span>
            <span className="info-value">{user?.experience || 'Not provided'}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderAddressInfo = () => (
    <div className="profile-section">
      <h3>Address Information</h3>
      {isEditing ? (
        <>
          <div className="form-group">
            <label>Street Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Enter your street address"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder="Enter your city"
              />
            </div>
            <div className="form-group">
              <label>Postal Code</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                placeholder="Enter your postal code"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Country</label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Enter your country"
            />
          </div>
        </>
      ) : (
        <div className="profile-info">
          <div className="info-row">
            <span className="info-label">Address:</span>
            <span className="info-value">{user?.address || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">City:</span>
            <span className="info-value">{user?.city || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Country:</span>
            <span className="info-value">{user?.country || 'Not provided'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Postal Code:</span>
            <span className="info-value">{user?.postal_code || 'Not provided'}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          {getTabOptions().map(tab => (
            <button 
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''}`} 
              onClick={() => handleTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="success-message">
          <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
          <button className="close-button" onClick={() => setError(null)}>×</button>
        </div>
      )}

      {loading && !user ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-avatar">
              {user?.profile_pic ? (
                <img src={user.profile_pic} alt={`${user.first_name} ${user.last_name}`} />
              ) : (
                <div className="avatar-placeholder">
                  {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div className="profile-title">
              <h2>
                {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || getRoleSpecificTitle()}
              </h2>
              <p>{user?.position} {user?.department ? `• ${user.department}` : ''}</p>
            </div>
            <div className="profile-actions">
              {isEditing ? (
                <>
                  <button className="btn btn-save" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button className="btn btn-cancel" onClick={handleCancel} disabled={loading}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          
          <div className="profile-content">
            <form onSubmit={handleSubmit}>
              {activeTab === 'personal' && renderPersonalInfo()}
              {activeTab === 'professional' && renderProfessionalInfo()}
              {activeTab === 'qualifications' && renderQualificationsInfo()}
              {activeTab === 'address' && renderAddressInfo()}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;