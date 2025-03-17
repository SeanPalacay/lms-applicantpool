import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  AlertTriangle, 
  User, 
  FileText, 
  Calendar,
  ArrowLeft,
  Trash2,
  Edit,
  Clock,
  MessageSquare
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';

const IncidentDetails = () => {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [incident, setIncident] = useState({
    id: '',
    user_id: '',
    incident_type: '',
    description: '',
    incident_date: '',
    reported_by: '',
    userName: '',
    reporterName: '',
    notes: []
  });
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const fetchIncidentDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Fetch incident data
        const data = await adminService.getIncidentById(incidentId);
        setIncident(data);
      } catch (err) {
        console.error('Error fetching incident details:', err);
        setError('Failed to load incident details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentDetails();
  }, [incidentId, navigate]);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    
    try {
      await adminService.deleteIncident(incidentId);
      setSuccess('Incident deleted successfully.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/incidents', { state: { message: 'Incident deleted successfully.' } });
      }, 2000);
    } catch (err) {
      console.error('Error deleting incident:', err);
      setError('Failed to delete incident. Please try again.');
      setDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      return;
    }
    
    setAddingNote(true);
    
    try {
      const noteData = {
        incident_id: incidentId,
        content: newNote,
        created_by: localStorage.getItem('userId')
      };
      
      const response = await adminService.addIncidentNote(noteData);
      
      // Update local state with new note
      setIncident({
        ...incident,
        notes: [...incident.notes, response.note]
      });
      
      // Clear input
      setNewNote('');
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setAddingNote(false);
    }
  };

  const handleNoteChange = (e) => {
    setNewNote(e.target.value);
  };

  const goBack = () => {
    navigate('/admin/incidents');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getIncidentTypeLabel = (type) => {
    switch(type) {
      case 'low_quiz_score': return 'Low Quiz Score';
      case 'policy_violation': return 'Policy Violation';
      default: return 'Other Issue';
    }
  };

  const getIncidentTypeClass = (type) => {
    switch(type) {
      case 'low_quiz_score': return 'type-quiz';
      case 'policy_violation': return 'type-policy';
      default: return 'type-other';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Incident Details</h1>
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
        onClick={goBack}
      >
        <ArrowLeft size={16} />
        <span>Back to Incidents</span>
      </div>
      
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              backgroundColor: getIncidentTypeClass(incident.incident_type) === 'type-quiz' ? '#E3F2FD' : 
                              getIncidentTypeClass(incident.incident_type) === 'type-policy' ? '#FFEBEE' : '#F3E5F5'
            }}>
              <AlertTriangle size={20} color={getIncidentTypeClass(incident.incident_type) === 'type-quiz' ? '#1E88E5' : 
                                              getIncidentTypeClass(incident.incident_type) === 'type-policy' ? '#E53935' : '#8E24AA'} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b' }}>{getIncidentTypeLabel(incident.incident_type)}</h3>
              <span style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} />
                {formatDate(incident.incident_date)} at {formatTime(incident.incident_date)}
              </span>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            {deleteConfirm ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>Confirm deletion?</span>
                <button 
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#E53935', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                  onClick={handleDelete}
                >
                  Yes
                </button>
                <button 
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#e2e8f0', 
                    color: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                  onClick={cancelDelete}
                >
                  No
                </button>
              </div>
            ) : (
              <>
                <Link 
                  to={`/admin/incidents/edit/${incidentId}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px', 
                    backgroundColor: '#e2e8f0', 
                    color: '#1e293b', 
                    borderRadius: '8px', 
                    textDecoration: 'none', 
                    fontSize: '14px', 
                    fontWeight: '500' 
                  }}
                >
                  <Edit size={16} />
                  Edit
                </Link>
                <button 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px', 
                    backgroundColor: '#E53935', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                  onClick={handleDelete}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Description</h4>
          <p style={{ fontSize: '14px', color: '#64748b' }}>{incident.description}</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Trainee Information</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#E3F2FD', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '600', 
                color: '#1E88E5' 
              }}>
                {incident.userName ? incident.userName.charAt(0) : '?'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{incident.userName || 'Unknown'}</div>
                <Link 
                  to={`/admin/user-management/edit/${incident.user_id}`} 
                  style={{ 
                    fontSize: '14px', 
                    color: '#1E88E5', 
                    textDecoration: 'none' 
                  }}
                >
                  View Trainee Profile
                </Link>
              </div>
            </div>
            
            <div>
              <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Related Incidents</h5>
              {incident.relatedIncidents && incident.relatedIncidents.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {incident.relatedIncidents.map((related, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        padding: '4px 8px', 
                        backgroundColor: getIncidentTypeClass(related.incident_type) === 'type-quiz' ? '#E3F2FD' : 
                                        getIncidentTypeClass(related.incident_type) === 'type-policy' ? '#FFEBEE' : '#F3E5F5', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: getIncidentTypeClass(related.incident_type) === 'type-quiz' ? '#1E88E5' : 
                                getIncidentTypeClass(related.incident_type) === 'type-policy' ? '#E53935' : '#8E24AA'
                      }}>
                        {getIncidentTypeLabel(related.incident_type)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatDate(related.incident_date)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '14px', color: '#64748b' }}>No other incidents reported for this trainee.</div>
              )}
            </div>
          </div>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>Incident Reporter</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                backgroundColor: '#E3F2FD', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: '600', 
                color: '#1E88E5' 
              }}>
                {incident.reporterName ? incident.reporterName.charAt(0) : 'S'}
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{incident.reporterName || 'System'}</div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>{incident.reporterRole || (incident.reporterName ? 'Staff' : 'Automated')}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
              <Clock size={16} />
              <span>Reported: {formatDate(incident.created_at)} {formatTime(incident.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={18} />
            Notes & Follow-up
          </h4>
          
          {incident.notes && incident.notes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {incident.notes.map((note, index) => (
                <div key={index} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      backgroundColor: '#E3F2FD', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontWeight: '600', 
                      color: '#1E88E5' 
                    }}>
                      {note.author_name ? note.author_name.charAt(0) : '?'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b' }}>{note.author_name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{formatDate(note.created_at)} {formatTime(note.created_at)}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', color: '#64748b' }}>{note.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>No notes have been added for this incident.</div>
          )}
          
          <div>
            <textarea 
              placeholder="Add a note about this incident..."
              value={newNote}
              onChange={handleNoteChange}
              rows="3"
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                fontSize: '14px', 
                color: '#1e293b', 
                marginBottom: '12px' 
              }}
            ></textarea>
            <button 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#1E88E5', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontSize: '14px', 
                fontWeight: '500' 
              }}
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
            >
              {addingNote ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetails;