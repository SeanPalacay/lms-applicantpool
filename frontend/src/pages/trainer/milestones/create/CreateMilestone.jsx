import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Save, XCircle, Calendar, Info, Users, Clock } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const CreateMilestone = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    program_id: '',
    title: '',
    description: '',
    due_date: '',
  });
  const [programs, setPrograms] = useState([]);
  const [trainees, setTrainees] = useState([]);
  const [selectedTrainees, setSelectedTrainees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }

        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);

        const traineesData = await trainerService.getTrainees();
        setTrainees(traineesData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load required data. Please refresh the page and try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'program_id' && value) {
      fetchTraineesForProgram(value);
    }
  };

  const fetchTraineesForProgram = async (programId) => {
    try {
      const programTrainees = await trainerService.getTrainees(programId);
      setTrainees(programTrainees);
    } catch (err) {
      console.error('Error fetching program trainees:', err);
    }
  };

  const handleTraineeSelection = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setSelectedTrainees(selectedOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setError('');
    setSuccessMessage('');

    if (!formData.program_id) {
      setError('Please select a program');
      setFormSubmitting(false);
      return;
    }
    if (!formData.title.trim()) {
      setError('Title is required');
      setFormSubmitting(false);
      return;
    }
    if (!formData.due_date) {
      setError('Due date is required');
      setFormSubmitting(false);
      return;
    }

    try {
      await trainerService.createMilestone({ ...formData, trainees: selectedTrainees });
      setSuccessMessage('Milestone created successfully!');
      setFormData({ program_id: '', title: '', description: '', due_date: '' });
      setSelectedTrainees([]);
      setTimeout(() => navigate('/trainer/milestones'), 2000);
    } catch (err) {
      console.error('Error creating milestone:', err);
      setError(err.message || 'Failed to create milestone. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/trainer/milestones');

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '32px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #1E88E5, #1565C0)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center' }}>
            <Flag size={20} />
          </div>
          <div style={{ color: '#ffffff', fontFamily: 'Inter, sans-serif' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Create New Milestone</h3>
          </div>
        </div>

        <div style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                <Info size={18} />
                <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Milestone Information</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="program_id" style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                  <span style={{ color: '#e74c3c' }}>*</span> Program:
                </label>
                <select
                  id="program_id"
                  name="program_id"
                  value={formData.program_id}
                  onChange={handleChange}
                  required
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1E88E5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  <option value="" style={{ color: '#64748b' }}>Select a Program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id} style={{ color: '#1e293b' }}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="title" style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                  <span style={{ color: '#e74c3c' }}>*</span> Title:
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter milestone title"
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1E88E5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="description" style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                  Description:
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Enter milestone description"
                  rows={4}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    resize: 'vertical',
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1E88E5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="due_date" style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                  <span style={{ color: '#e74c3c' }}>*</span> Due Date:
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
                  <input
                    type="date"
                    id="due_date"
                    name="due_date"
                    value={formData.due_date}
                    onChange={handleChange}
                    required
                    style={{
                      padding: '12px 12px 12px 40px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      color: '#1e293b',
                      backgroundColor: '#ffffff',
                      width: '100%',
                      transition: 'border-color 0.3s ease',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#1E88E5'}
                    onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
                <Users size={18} />
                <h4 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Assign Trainees</h4>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label htmlFor="trainees" style={{ fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>
                  Select Trainees:
                </label>
                <select
                  id="trainees"
                  multiple
                  value={selectedTrainees}
                  onChange={handleTraineeSelection}
                  size={5}
                  style={{
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    color: '#1e293b',
                    backgroundColor: '#ffffff',
                    transition: 'border-color 0.3s ease',
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#1E88E5'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                >
                  {trainees.map((trainee) => (
                    <option key={trainee.id} value={trainee.id} style={{ padding: '4px' }}>
                      {trainee.full_name}
                    </option>
                  ))}
                </select>
                <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Hold Ctrl/Cmd to select multiple trainees
                </small>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease, color 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f8fafc';
                  e.target.style.color = '#1e293b';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                  e.target.style.color = '#64748b';
                }}
              >
                <XCircle size={18} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={formSubmitting}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  backgroundColor: formSubmitting ? '#64748b' : '#1E88E5',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: formSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.3s ease',
                }}
                onMouseOver={(e) => !formSubmitting && (e.target.style.backgroundColor = '#1565C0')}
                onMouseOut={(e) => !formSubmitting && (e.target.style.backgroundColor = '#1E88E5')}
              >
                {formSubmitting ? (
                  <>
                    <Clock size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Milestone
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

export default CreateMilestone;