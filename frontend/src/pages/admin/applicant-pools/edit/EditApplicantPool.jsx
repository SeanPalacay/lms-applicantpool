import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  UserCheck, 
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
import applicantService from '../../../../services/applicantService';
import '../styles/EditApplicantPool.css';

const EditApplicantPool = () => {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [poolData, setPoolData] = useState({
    pool_name: '',
    description: '',
    created_by: '',
    created_at: '',
    createdByName: ''
  });

  useEffect(() => {
    const fetchPoolData = async () => {
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
        
        // Fetch pool data
        const data = await applicantService.getApplicantPoolById(poolId);
        setPoolData({
          pool_name: data.pool_name || '',
          description: data.description || '',
          created_by: data.created_by || '',
          created_at: data.created_at || '',
          createdByName: data.createdByName || 'Administrator'
        });
      } catch (err) {
        console.error('Error fetching applicant pool data:', err);
        setError('Failed to load applicant pool data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPoolData();
  }, [poolId, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPoolData({
      ...poolData,
      [name]: value
    });
  };

  const validateForm = () => {
    // Reset error and success messages
    setError(null);
    setSuccess(null);
    
    // Validate pool name
    if (!poolData.pool_name.trim()) {
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
    
    setSaving(true);
    
    try {
      const updateData = {
        pool_name: poolData.pool_name,
        description: poolData.description
      };
      
      await applicantService.updateApplicantPool(poolId, updateData);
      setSuccess('Applicant pool updated successfully.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/applicant-pools');
      }, 2000);
    } catch (err) {
      console.error('Error updating applicant pool:', err);
      setError(err.message || 'Failed to update applicant pool. Please try again.');
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
    navigate('/admin/applicant-pools');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="edit-applicant-pool-container">
      <div className="section-header">
        <h1>Edit Applicant Pool</h1>
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
                    value={poolData.pool_name}
                    onChange={handleInputChange}
                    placeholder="Enter pool name"
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
                    value={poolData.description}
                    onChange={handleInputChange}
                    placeholder="Enter pool description"
                    rows="5"
                  ></textarea>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group half">
                  <label>Created By</label>
                  <div className="info-value">
                    <User size={16} className="icon-inline" />
                    {poolData.createdByName}
                  </div>
                </div>
                
                <div className="form-group half">
                  <label>Created Date</label>
                  <div className="info-value">
                    <Clock size={16} className="icon-inline" />
                    {formatDate(poolData.created_at)}
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

export default EditApplicantPool;