import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, Type, FileText, User, Clock, Save, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import applicantService from '../../../../services/applicantService';

const EditApplicantPool = () => {
  const { poolId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [poolData, setPoolData] = useState({
    pool_name: '', description: '', created_by: '', created_at: '', createdByName: ''
  });

  useEffect(() => {
    const fetchPoolData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const data = await applicantService.getApplicantPoolById(poolId);
        setPoolData({
          pool_name: data.pool_name || '', description: data.description || '',
          created_by: data.created_by || '', created_at: data.created_at || '',
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
    setPoolData({ ...poolData, [name]: value });
  };

  const validateForm = () => {
    setError(null);
    setSuccess(null);
    if (!poolData.pool_name.trim()) {
      setError('Pool name is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const updateData = { pool_name: poolData.pool_name, description: poolData.description };
      await applicantService.updateApplicantPool(poolId, updateData);
      setSuccess('Applicant pool updated successfully.');
      setTimeout(() => navigate('/admin/applicant-pools'), 2000);
    } catch (err) {
      console.error('Error updating applicant pool:', err);
      setError(err.message || 'Failed to update applicant pool. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleCancel = () => navigate('/admin/applicant-pools');

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
          Edit Applicant Pool
        </h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#1E88E5',
        cursor: 'pointer',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }} onClick={handleCancel}>
        <ArrowLeft size={16} /> Back to Applicant Pools
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#E3F2FD',
          padding: '16px',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <UserCheck size={20} style={{ color: '#1E88E5' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Pool Information</h3>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="pool_name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              Pool Name
            </label>
            <div style={{ position: 'relative' }}>
              <Type size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                id="pool_name"
                name="pool_name"
                value={poolData.pool_name}
                onChange={handleInputChange}
                placeholder="Enter pool name"
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
            <label htmlFor="description" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              Description
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <textarea
                id="description"
                name="description"
                value={poolData.description}
                onChange={handleInputChange}
                placeholder="Enter pool description"
                rows="5"
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 36px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  outline: 'none',
                  resize: 'vertical',
                  ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                Created By
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                <User size={16} /> {poolData.createdByName}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
                Created Date
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                <Clock size={16} /> {formatDate(poolData.created_at)}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                backgroundColor: '#ffffff',
                color: '#1E88E5',
                padding: '8px 16px',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}
            >
              <XCircle size={16} /> Cancel
            </button>
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
  );
};

export default EditApplicantPool;