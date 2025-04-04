import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';

const EditTraineePool = ({ onBack }) => {
  const navigate = useNavigate();
  const { poolId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    pool_name: '',
    description: '',
    program_id: ''
  });
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetchPool();
    fetchPrograms(); // Fetch programs when the component mounts
  }, [poolId]);

  const fetchPool = async () => {
    try {
      setLoading(true);
      const pool = await adminService.getTraineePoolById(poolId);
      setFormData({
        pool_name: pool.pool_name,
        description: pool.description || '',
        program_id: pool.program_id
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching trainee pool:', err);
      setError('Failed to load trainee pool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const data = await adminService.getPrograms(); // Fetch programs
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await adminService.updateTraineePool(poolId, formData); // Call the update API
      navigate('/admin/applicant-pools');
    } catch (err) {
      console.error('Error updating trainee pool:', err);
      setError('Failed to update trainee pool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px' }}>
      {error && (
        <div style={{ backgroundColor: '#ffe6e6', color: '#e74c3c', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button 
          onClick={onBack} 
          style={{
            background: 'none',
            border: 'none',
            color: '#1E88E5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            padding: '8px 16px',
          }}
        >
          <ArrowLeft size={16} /> Back to Trainee Pools
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Edit Trainee Pool</h1>
      </div>

      <div style={{ 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', 
        padding: '24px', 
        maxWidth: '600px', 
        margin: '0 auto' 
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Pool Name *</label>
            <input
              type="text"
              name="pool_name"
              value={formData.pool_name}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                minHeight: '100px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>Program *</label>
            <select
              name="program_id"
              value={formData.program_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                backgroundColor: '#ffffff',
                outline: 'none'
              }}
            >
              <option value="">Select a program</option>
              {programs.length > 0 ? (
                programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.title}
                  </option>
                ))
              ) : (
                <option>No programs available</option>
              )}
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            style={{
              backgroundColor: '#1E88E5',
              color: '#ffffff',
              padding: '12px 20px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.875rem',
              gap: '8px'
            }}
          >
            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditTraineePool;
    