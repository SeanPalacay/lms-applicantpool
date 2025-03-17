import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, Type, FileText, ArrowLeft, Save, RefreshCw, XCircle
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import applicantService from '../../../../services/applicantService';

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
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    setError(null);
    setSuccess(null);
    if (!formData.pool_name.trim()) {
      setError('Pool name is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await applicantService.createApplicantPool(formData);
      setSuccess('Applicant pool created successfully.');
      setTimeout(() => navigate('/admin/applicant-pools'), 2000);
    } catch (err) {
      console.error('Error creating applicant pool:', err);
      setError(err.message || 'Failed to create applicant pool. Please try again.');
    } finally {
      setLoading(false);
    }
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
          Create Applicant Pool
        </h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div> {/* --primary-color */}
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
        fontSize: '0.875rem',
        transition: 'color 0.3s ease'
      }} onClick={handleCancel}>
        <ArrowLeft size={16} /> Back to Applicant Pools
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#E3F2FD', // --primary-ultralight
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
                value={formData.pool_name}
                onChange={handleInputChange}
                placeholder="Enter pool name"
                required
                style={{
                  width: '100%',
                  padding: '8px 8px 8px 36px',
                  border: '1px solid #e2e8f0', // --medium-gray
                  borderRadius: '8px', // --radius-md
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
                value={formData.description}
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
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="status" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5' }
              }}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
              disabled={loading}
              style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': loading ? {} : { backgroundColor: '#1565C0' }
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...
                </>
              ) : (
                <>
                  <Save size={16} /> Create Pool
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateApplicantPool;