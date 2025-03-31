import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const TrainerCreateProgram = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'regular',
    status: 'active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
  
    try {
      if (!formData.title.trim()) {
        throw new Error('Program title is required');
      }
  
      // Add some debug logging
      console.log('Submitting program data:', formData);
      
      const result = await trainerService.createProgram(formData);
      console.log('Program created successfully:', result);
      
      navigate('/trainer/programs', { 
        state: { message: 'Program created successfully' } 
      });
    } catch (err) {
      console.error('Error creating program:', err);
      setError(err.message || 'Failed to create program. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <button
            onClick={() => navigate('/trainer/programs')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '1px solid var(--medium-gray)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Create New Program
          </h1>
        </div>
        <div style={{ height: '2px', width: '60px', backgroundColor: 'var(--primary-color)', marginTop: 'var(--spacing-sm)', marginLeft: '52px' }}></div>
      </div>

      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}

      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-sm)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)', fontWeight: '500' }}>
              Program Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter program title"
              required
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--medium-gray)',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter program description"
              rows={4}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--medium-gray)',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label htmlFor="type" style={{ display: 'block', marginBottom: 'var(--spacing-xs)', color: 'var(--text-primary)', fontWeight: '500' }}>
              Program Type
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--medium-gray)',
                outline: 'none'
              }}
            >
              <option value="regular">Regular</option>
              <option value="refresher">Refresher</option>
            </select>
          </div>

          <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
            <button
              type="button"
              onClick={() => navigate('/trainer/programs')}
              style={{
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--medium-gray)',
                backgroundColor: 'white',
                color: 'var(--text-primary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Save size={18} />
              Create Program
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerCreateProgram;