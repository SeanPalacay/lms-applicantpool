import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const TrainerCreatePracticalExam = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [formData, setFormData] = useState({
    program_id: '',
    title: '',
    description: '',
    max_score: 100
  });

  useEffect(() => {
    // Get program ID from URL if provided
    const params = new URLSearchParams(location.search);
    const programId = params.get('programId');
    
    if (programId) {
      setFormData(prev => ({ ...prev, program_id: programId }));
    }
    
    const fetchPrograms = async () => {
      setLoading(true);
      try {
        const data = await trainerService.getPrograms();
        setPrograms(data);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'max_score' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Exam title is required');
      }

      if (!formData.program_id) {
        throw new Error('Please select a program');
      }
      
      // Validate max score
      if (formData.max_score <= 0) {
        throw new Error('Maximum score must be a positive number');
      }

      await trainerService.createPracticalExam(formData);
      navigate('/trainer/practical-exams', { 
        state: { message: 'Practical exam created successfully' } 
      });
    } catch (err) {
      console.error('Error creating practical exam:', err);
      setError(err.message || 'Failed to create practical exam. Please try again.');
      setLoading(false);
    }
  };

  if (loading && programs.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate('/trainer/practical-exams')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>
            Create New Practical Exam
          </h1>
        </div>
        <div style={{ height: '2px', width: '60px', backgroundColor: '#007bff', marginTop: '5px', marginLeft: '52px' }}></div>
      </div>

      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="program_id" style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
              Program *
            </label>
            <select
              id="program_id"
              name="program_id"
              value={formData.program_id}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                outline: 'none'
              }}
            >
              <option value="">Select a Program</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="title" style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
              Exam Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter exam title"
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="description" style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter exam description"
              rows={4}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                outline: 'none',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="max_score" style={{ display: 'block', marginBottom: '5px', color: '#333', fontWeight: '500' }}>
              Maximum Score
            </label>
            <input
              id="max_score"
              name="max_score"
              type="number"
              min="1"
              value={formData.max_score}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/trainer/practical-exams')}
              style={{
                padding: '10px 20px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                backgroundColor: 'white',
                color: '#333',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Save size={18} />
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerCreatePracticalExam;