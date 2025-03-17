// src/pages/admin/programs/edit/EditProgram.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Calendar, 
  Type, 
  FileText, 
  User, 
  Clock,
  Save,
  ArrowLeft,
  RefreshCw,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';
import '../styles/EditProgram.css';

const EditProgram = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programData, setProgramData] = useState({
    title: '',
    description: '',
    type: 'regular', // regular or refresher
    created_by: '',
    created_at: '',
    createdByName: ''
  });

  useEffect(() => {
    const fetchProgramData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Use the getProgramById function we added to adminService
        const data = await adminService.getProgramById(programId);
        setProgramData({
          title: data.title || '',
          description: data.description || '',
          type: data.type || 'regular',
          created_by: data.created_by || '',
          created_at: data.created_at || '',
          createdByName: data.createdByName || 'Administrator'
        });
      } catch (err) {
        console.error('Error fetching program data:', err);
        setError('Failed to load program data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [programId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProgramData({
      ...programData,
      [name]: value
    });
  };

  const validateForm = () => {
    // Reset error and success messages
    setError(null);
    setSuccess(null);
    
    // Validate title
    if (!programData.title.trim()) {
      setError('Program title is required.');
      return false;
    }
    
    // Validate description
    if (!programData.description.trim()) {
      setError('Program description is required.');
      return false;
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
      const updateData = {
        title: programData.title,
        description: programData.description,
        type: programData.type
      };
      
      // Use the updateProgram function from adminService
      await adminService.updateProgram(programId, updateData);
      setSuccess('Program updated successfully.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/programs');
      }, 2000);
    } catch (err) {
      console.error('Error updating program:', err);
      setError(err.message || 'Failed to update program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleCancel = () => {
    navigate('/admin/programs');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="edit-program-container">
      <div className="section-header">
        <h1>Edit Program</h1>
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
      
      <div className="back-link" onClick={handleCancel}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Programs</span>
      </div>
      
      <div className="program-content">
        <div className="program-card">
          <div className="card-header gradient-purple">
            <div className="header-icon">
              <BookOpen size={20} />
            </div>
            <div className="header-content">
              <h3>Program Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            <form onSubmit={handleSubmit} className="program-form">
              <div className="form-group">
                <label htmlFor="title">Program Title</label>
                <div className="input-with-icon">
                  <Type size={18} className="input-icon" />
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={programData.title}
                    onChange={handleInputChange}
                    placeholder="Enter program title"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <div className="textarea-with-icon">
                  <FileText size={18} className="textarea-icon" />
                  <textarea
                    id="description"
                    name="description"
                    value={programData.description}
                    onChange={handleInputChange}
                    placeholder="Enter program description"
                    rows="5"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="type">Program Type</label>
                <div className="select-with-icon">
                  <Calendar size={18} className="select-icon" />
                  <select
                    id="type"
                    name="type"
                    value={programData.type}
                    onChange={handleInputChange}
                  >
                    <option value="regular">Regular</option>
                    <option value="refresher">Refresher</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label>Created By</label>
                  <div className="info-value">
                    <User size={16} className="icon-inline" />
                    {programData.createdByName}
                  </div>
                </div>
                
                <div className="form-group half">
                  <label>Created Date</label>
                  <div className="info-value">
                    <Clock size={16} className="icon-inline" />
                    {formatDate(programData.created_at)}
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button type="button" className="action-button secondary" onClick={handleCancel}>
                  <XCircle size={16} className="icon-inline" /> Cancel
                </button>
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

export default EditProgram;