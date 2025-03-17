import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BookOpen, Calendar, Type, FileText, User, Clock, Save, ArrowLeft, RefreshCw, XCircle } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';

const EditProgram = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [programData, setProgramData] = useState({
    title: '', description: '', type: 'regular', created_by: '', created_at: '', createdByName: ''
  });

  useEffect(() => {
    const fetchProgramData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
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

  const handleInputChange = (e) => setProgramData({ ...programData, [e.target.name]: e.target.value });

  const validateForm = () => {
    setError(null);
    setSuccess(null);
    if (!programData.title.trim()) {
      setError('Program title is required.');
      return false;
    }
    if (!programData.description.trim()) {
      setError('Program description is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    try {
      const updateData = { title: programData.title, description: programData.description, type: programData.type };
      await adminService.updateProgram(programId, updateData);
      setSuccess('Program updated successfully.');
      setTimeout(() => navigate('/admin/programs'), 2000);
    } catch (err) {
      console.error('Error updating program:', err);
      setError(err.message || 'Failed to update program. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const handleCancel = () => navigate('/admin/programs');

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Edit Program</h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', cursor: 'pointer', marginBottom: '24px', fontSize: '0.875rem' }} onClick={handleCancel}>
        <ArrowLeft size={16} /> Back to Programs
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BookOpen size={20} style={{ color: '#1E88E5' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Program Information</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="title" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Program Title</label>
              <div style={{ position: 'relative' }}>
                <Type size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={programData.title}
                  onChange={handleInputChange}
                  placeholder="Enter program title"
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
              <label htmlFor="description" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Description</label>
              <div style={{ position: 'relative' }}>
                <FileText size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
                <textarea
                  id="description"
                  name="description"
                  value={programData.description}
                  onChange={handleInputChange}
                  placeholder="Enter program description"
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
              <label htmlFor="type" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Program Type</label>
              <div style={{ position: 'relative' }}>
                <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <select
                  id="type"
                  name="type"
                  value={programData.type}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 36px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: '#1e293b',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                  }}
                >
                  <option value="regular">Regular</option>
                  <option value="refresher">Refresher</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Created By</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                  <User size={16} /> {programData.createdByName}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Created Date</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                  <Clock size={16} /> {formatDate(programData.created_at)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
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
    </div>
  );
};

export default EditProgram;