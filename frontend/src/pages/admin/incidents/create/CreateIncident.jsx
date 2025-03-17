import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  User, 
  FileText, 
  Calendar,
  Save,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Clock
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';
import '../styles/CreateIncident.css';

const CreateIncident = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [trainees, setTrainees] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null); // Store current user ID
  const [incident, setIncident] = useState({
    user_id: '',
    incident_type: 'low_quiz_score',
    description: '',
    incident_date: new Date().toISOString().slice(0, 16),
    reported_by: null // Will be set dynamically
  });

  const incidentTypes = [
    { value: 'low_quiz_score', label: 'Low Quiz Score' },
    { value: 'policy_violation', label: 'Policy Violation' },
    { value: 'other', label: 'Other Issue' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
  
        // Fetch current user ID from backend
        const response = await fetch('http://localhost:8080/lms-forbes/backend/api/admin/incidents.php?action=current-user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch current user');
        }
        const data = await response.json();
        if (!data.userId) {
          throw new Error('No user ID returned');
        }
        setCurrentUserId(data.userId);
        setIncident(prev => ({
          ...prev,
          reported_by: data.userId
        }));
  
        // Fetch trainees
        const usersResponse = await adminService.getUserList();
        console.log('Users response in CreateIncident:', usersResponse);
        const traineeUsers = Array.isArray(usersResponse) 
          ? usersResponse.filter(user => user.role === 'trainee') 
          : [];
        console.log('Filtered trainees:', traineeUsers);
        setTrainees(traineeUsers);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load required data. Please try again.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setIncident({
      ...incident,
      [name]: value
    });
  };

  const validateForm = () => {
    setError(null);
    setSuccess(null);
    
    if (!incident.user_id) {
      setError('Please select a trainee.');
      return false;
    }
    
    if (!incident.description.trim()) {
      setError('Please provide a description of the incident.');
      return false;
    }
    
    if (!incident.incident_date) {
      setError('Please specify the incident date and time.');
      return false;
    }
    
    if (!incident.reported_by) {
      setError('Unable to determine reporter. Please log in again.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    console.log('Incident data being sent:', incident);
    
    setSaving(true);
    
    try {
      await adminService.createPerformanceIncident(incident);
      setSuccess('Performance incident recorded successfully.');
      setTimeout(() => {
        navigate('/admin/incidents', { state: { message: 'Performance incident recorded successfully.' } });
      }, 2000);
    } catch (err) {
      console.error('Error creating incident:', err);
      setError(err.message || 'Failed to record incident. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/incidents');
  };

  const getTraineeName = (id) => {
    const trainee = trainees.find(t => t.id === parseInt(id));
    return trainee ? trainee.full_name : 'Unknown';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="create-incident-container">
      <div className="section-header">
        <h1>Record Performance Incident</h1>
        <div className="header-line"></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div className="back-link" onClick={handleCancel}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Incidents</span>
      </div>
      
      <div className="incident-content">
        <div className="incident-card">
          <div className="card-header">
            <div className="header-icon">
              <AlertTriangle size={20} />
            </div>
            <div className="header-content">
              <h3>Incident Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            <form onSubmit={handleSubmit} className="incident-form">
              <div className="form-group">
                <label htmlFor="user_id">Trainee</label>
                <div className="select-with-icon">
                  <User size={18} className="select-icon" />
                  <select
                    id="user_id"
                    name="user_id"
                    value={incident.user_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Trainee</option>
                    {trainees.map((trainee) => (
                      <option key={trainee.id} value={trainee.id}>{trainee.full_name}</option>
                    ))}
                  </select>
                </div>
                
                {incident.user_id && (
                  <div className="selected-trainee">
                    <div className="trainee-avatar">
                      {getTraineeName(incident.user_id).charAt(0)}
                    </div>
                    <span>{getTraineeName(incident.user_id)}</span>
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label htmlFor="incident_type">Incident Type</label>
                <div className="select-with-icon">
                  <AlertTriangle size={18} className="select-icon" />
                  <select
                    id="incident_type"
                    name="incident_type"
                    value={incident.incident_type}
                    onChange={handleInputChange}
                    required
                  >
                    {incidentTypes.map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="incident_date">Incident Date & Time</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="datetime-local"
                    id="incident_date"
                    name="incident_date"
                    value={incident.incident_date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().slice(0, 16)}
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <div className="textarea-with-icon">
                  <FileText size={18} className="textarea-icon" />
                  <textarea
                    id="description"
                    name="description"
                    value={incident.description}
                    onChange={handleInputChange}
                    placeholder="Describe the performance incident..."
                    rows="5"
                    required
                  ></textarea>
                </div>
              </div>
              
              <div className="reported-by-info">
                <Clock size={16} className="icon-inline" />
                <span>This incident will be recorded as reported by you (ID: {incident.reported_by}).</span>
              </div>
              
              <div className="form-actions">
                <button type="button" className="action-button secondary" onClick={handleCancel}>
                  <XCircle size={16} className="icon-inline" /> Cancel
                </button>
                <button type="submit" className="action-button primary" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="icon-inline spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} className="icon-inline" /> Record Incident
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateIncident;