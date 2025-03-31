import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const TrainerEditPracticalExam = () => {
  const navigate = useNavigate();
  const { examId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    max_score: 100
  });
  const [programName, setProgramName] = useState('');

  useEffect(() => {
    const fetchExamDetails = async () => {
      try {
        console.log('Fetching practical exam details for ID:', examId);
        setLoading(true);
        
        const examData = await trainerService.getPracticalExamById(examId);
        console.log('Exam data received:', examData);
        
        if (!examData || !examData.id) {
          throw new Error('Failed to load exam details');
        }
        
        setFormData({
          title: examData.title || '',
          description: examData.description || '',
          max_score: examData.max_score || 100
        });
        
        setProgramName(examData.program_title || 'Program');
      } catch (err) {
        console.error('Error fetching exam details:', err);
        setError('Failed to load exam details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchExamDetails();
  }, [examId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'max_score' ? Number(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Exam title is required');
      }

      // Validate max score
      if (formData.max_score <= 0) {
        throw new Error('Maximum score must be a positive number');
      }

      console.log('Updating practical exam data:', formData);
      await trainerService.updatePracticalExam(examId, formData);
      navigate(`/trainer/practical-exams/${examId}`, { 
        state: { message: 'Practical exam updated successfully' } 
      });
    } catch (err) {
      console.error('Error updating practical exam:', err);
      setError(err.message || 'Failed to update practical exam. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button
            onClick={() => navigate(`/trainer/practical-exams/${examId}`)}
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
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333', margin: '0' }}>
              Edit Practical Exam
            </h1>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Program: {programName}
            </div>
          </div>
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
              onClick={() => navigate(`/trainer/practical-exams/${examId}`)}
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
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '10px 20px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: '#007bff',
                color: 'white',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              <Save size={18} />
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrainerEditPracticalExam;