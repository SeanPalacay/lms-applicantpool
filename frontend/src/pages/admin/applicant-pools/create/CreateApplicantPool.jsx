import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, 
  Type, 
  FileText, 
  ArrowLeft,
  Save,
  RefreshCw,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import applicantService from '../../../../services/applicantService';
import '../styles/CreateApplicantPool.css';

const CreateApplicantPool = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    pool_name: '',
    description: '',
    status: 'active'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validateForm = () => {
    // Reset error and success messages
    setError(null);
    setSuccess(null);
    
    // Validate pool name
    if (!formData.pool_name.trim()) {
      setError('Pool name is required.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      await applicantService.createApplicantPool(formData);
      setSuccess('Applicant pool created successfully.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/applicant-pools');
      }, 2000);
    } catch (err) {
      console.error('Error creating applicant pool:', err);
      setError(err.message || 'Failed to create applicant pool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/applicant-pools');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="create-applicant-pool-container">
      <div className="section-header">
        <h1>Create Applicant Pool</h1>
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
        <span>Back to Applicant Pools</span>
      </div>
      
      <div className="pool-content">
        <div className="pool-card">
          <div className="card-header gradient-amber">
            <div className="header-icon">
              <UserCheck size={20} />
            </div>
            <div className="header-content">
              <h3>Pool Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            <form onSubmit={handleSubmit} className="pool-form">
              <div className="form-group">
                <label htmlFor="pool_name">Pool Name</label>
                <div className="input-with-icon">
                  <Type size={18} className="input-icon" />
                  <input
                    type="text"
                    id="pool_name"
                    name="pool_name"
                    value={formData.pool_name}
                    onChange={handleInputChange}
                    placeholder="Enter pool name"
                    required
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
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter pool description"
                    rows="5"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button type="button" className="action-button secondary" onClick={handleCancel}>
                  <XCircle size={16} className="icon-inline" /> Cancel
                </button>
                <button type="submit" className="action-button primary" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="icon-inline spin" /> Creating...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="icon-inline" /> Create Pool
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

export default CreateApplicantPool;