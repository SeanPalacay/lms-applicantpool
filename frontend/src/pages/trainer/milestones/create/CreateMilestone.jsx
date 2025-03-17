import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flag, Save, XCircle, Calendar, Info, Users, Clock } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import '../styles/MilestoneForm.css';

/**
 * CreateMilestone Component
 * Allows trainers to create new milestones for programs
 */
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

  // Fetch available programs and trainees on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Check if user is logged in and has correct role
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
        
        // Fetch programs
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
        
        // Fetch trainees
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
    setFormData({
      ...formData,
      [name]: value
    });

    // If program changes, optionally fetch trainees for that program
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
      // Don't set error here to avoid overriding the form
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
    
    // Validate form data
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
      // Create milestone using trainerService
      await trainerService.createMilestone({
        ...formData,
        trainees: selectedTrainees
      });
      
      setSuccessMessage('Milestone created successfully!');
      
      // Reset form
      setFormData({
        program_id: '',
        title: '',
        description: '',
        due_date: ''
      });
      setSelectedTrainees([]);
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/trainer/milestones');
      }, 2000);
    } catch (err) {
      console.error('Error creating milestone:', err);
      setError(err.message || 'Failed to create milestone. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/trainer/milestones');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="create-milestone-container">
      {error && <AlertBanner message={error} type="error" />}
      {successMessage && <AlertBanner message={successMessage} type="success" />}
      
      <div className="card">
        <div className="card-header gradient-purple">
          <div className="header-icon">
            <Flag size={20} />
          </div>
          <div className="header-content">
            <h3>Create New Milestone</h3>
          </div>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="milestone-form">
            <div className="form-section">
              <div className="section-header">
                <Info size={18} />
                <h4>Milestone Information</h4>
              </div>
              
              <div className="form-group">
                <label htmlFor="program_id">
                  <span className="required">*</span> Program:
                </label>
                <select 
                  id="program_id" 
                  name="program_id" 
                  value={formData.program_id} 
                  onChange={handleChange}
                  required
                  className="form-select"
                >
                  <option value="">Select a Program</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>
                      {program.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="title">
                  <span className="required">*</span> Title:
                </label>
                <input 
                  type="text" 
                  id="title" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange}
                  required
                  className="form-input"
                  placeholder="Enter milestone title"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea 
                  id="description" 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange}
                  className="form-textarea"
                  placeholder="Enter milestone description"
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="due_date">
                  <span className="required">*</span> Due Date:
                </label>
                <div className="date-input-container">
                  <Calendar size={18} className="date-icon" />
                  <input 
                    type="date" 
                    id="due_date" 
                    name="due_date" 
                    value={formData.due_date} 
                    onChange={handleChange}
                    required
                    className="form-input date-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <div className="section-header">
                <Users size={18} />
                <h4>Assign Trainees</h4>
              </div>
              
              <div className="form-group">
                <label htmlFor="trainees">Select Trainees:</label>
                <select 
                  id="trainees" 
                  multiple
                  value={selectedTrainees}
                  onChange={handleTraineeSelection}
                  className="form-select multiple-select"
                  size={5}
                >
                  {trainees.map((trainee) => (
                    <option key={trainee.id} value={trainee.id}>
                      {trainee.full_name}
                    </option>
                  ))}
                </select>
                <small className="select-help">Hold Ctrl/Cmd to select multiple trainees</small>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={handleCancel} className="btn-cancel">
                <XCircle size={18} />
                Cancel
              </button>
              <button type="submit" className="btn-save" disabled={formSubmitting}>
                {formSubmitting ? (
                  <>
                    <Clock size={18} className="icon-spin" />
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