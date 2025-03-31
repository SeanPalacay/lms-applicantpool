import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const TrainerEditProgram = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'regular'
  });

  useEffect(() => {
    const fetchProgramDetails = async () => {
      try {
        console.log('Fetching program details for ID:', id);
        
        // Track what's happening with the API call
        let apiResponse;
        try {
          apiResponse = await trainerService.getProgramById(id);
          console.log('Raw API response:', apiResponse);
        } catch (apiError) {
          console.error('API call failed:', apiError);
          throw new Error(`API error: ${apiError.message}`);
        }
        
        // Check if the response is an array instead of an object
        if (Array.isArray(apiResponse)) {
          console.error('Received array instead of object:', apiResponse);
          
          // If it's an array with data, try to find the program by ID
          if (apiResponse.length > 0) {
            const foundProgram = apiResponse.find(p => String(p.id) === String(id));
            if (foundProgram) {
              console.log('Found program in array:', foundProgram);
              apiResponse = foundProgram;
            } else {
              throw new Error('Program not found in response array');
            }
          } else {
            throw new Error('Received empty array from API');
          }
        }
        
        // Validate the program data
        if (!apiResponse) {
          throw new Error('No data received from API');
        }
        
        console.log('Processing program data:', apiResponse);
        console.log('Program ID check:', apiResponse.id);
        
        if (!apiResponse.id) {
          console.error('Response missing ID field:', apiResponse);
          throw new Error('Invalid program data received (missing ID)');
        }
        
        // Set the form data
        setFormData({
          title: apiResponse.title || '',
          description: apiResponse.description || '',
          type: apiResponse.type || 'regular'
        });
        
        console.log('Form data set successfully');
      } catch (err) {
        console.error('Error in program fetch process:', err);
        setError(`Failed to load program details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
  
    fetchProgramDetails();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Program title is required');
      }

      // Debug logging
      console.log('Updating program data:', formData);
      
      await trainerService.updateProgram(id, formData);
      navigate('/trainer/programs', { 
        state: { message: 'Program updated successfully' } 
      });
    } catch (err) {
      console.error('Error updating program:', err);
      setError(err.message || 'Failed to update program. Please try again.');
      setSubmitting(false);
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
            Edit Program
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
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor: 'var(--primary-color)',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Save size={18} />
              {submitting ? 'Saving...' : 'Update Program'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerEditProgram;