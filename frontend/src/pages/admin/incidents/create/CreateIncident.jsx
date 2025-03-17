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
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Record Performance Incident</h1>
        <div style={{ height: '2px', backgroundColor: '#e2e8f0', width: '100%' }}></div>
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
      
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#1E88E5', 
          cursor: 'pointer', 
          marginBottom: '24px' 
        }}
        onClick={handleCancel}
      >
        <ArrowLeft size={16} />
        <span>Back to Incidents</span>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            backgroundColor: '#E3F2FD' 
          }}>
            <AlertTriangle size={20} color="#1E88E5" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>Incident Information</h3>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Trainee</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <select
                style={{ 
                  width: '100%', 
                  padding: '8px 16px 8px 40px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={incident.user_id}
                onChange={handleInputChange}
                name="user_id"
                required
              >
                <option value="">Select Trainee</option>
                {trainees.map((trainee) => (
                  <option key={trainee.id} value={trainee.id}>{trainee.full_name}</option>
                ))}
              </select>
            </div>
            
            {incident.user_id && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                <div style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  backgroundColor: '#E3F2FD', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: '600', 
                  color: '#1E88E5' 
                }}>
                  {getTraineeName(incident.user_id).charAt(0)}
                </div>
                <span style={{ fontSize: '14px', color: '#1e293b' }}>{getTraineeName(incident.user_id)}</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Incident Type</label>
            <div style={{ position: 'relative' }}>
              <AlertTriangle size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <select
                style={{ 
                  width: '100%', 
                  padding: '8px 16px 8px 40px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={incident.incident_type}
                onChange={handleInputChange}
                name="incident_type"
                required
              >
                {incidentTypes.map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Incident Date & Time</label>
            <div style={{ position: 'relative' }}>
              <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="datetime-local"
                style={{ 
                  width: '100%', 
                  padding: '8px 16px 8px 40px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={incident.incident_date}
                onChange={handleInputChange}
                name="incident_date"
                max={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>Description</label>
            <div style={{ position: 'relative' }}>
              <FileText size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: '#64748b' }} />
              <textarea
                style={{ 
                  width: '100%', 
                  padding: '12px 16px 12px 40px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white', 
                  minHeight: '120px' 
                }}
                value={incident.description}
                onChange={handleInputChange}
                name="description"
                placeholder="Describe the performance incident..."
                required
              ></textarea>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
            <Clock size={16} />
            <span>This incident will be recorded as reported by you (ID: {incident.reported_by}).</span>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: '#e2e8f0', 
                color: '#1e293b', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500' 
              }}
              onClick={handleCancel}
            >
              <XCircle size={16} />
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: '#1E88E5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500' 
              }}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Record Incident
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateIncident;