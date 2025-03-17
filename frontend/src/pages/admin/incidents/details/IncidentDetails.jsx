// src/pages/admin/incidents/details/IncidentDetails.jsx
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
import '../styles/IncidentDetails.css';

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
  <div className="incident-details-container">
    <div className="section-header">
      <h1>Incident Details</h1>
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
    
    <div className="back-link" onClick={goBack}>
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
          <div className="incident-header">
            <div className="incident-title-section">
              <div className="incident-type">
                <span className={`incident-type-badge ${getIncidentTypeClass(incident.incident_type)}`}>
                  {getIncidentTypeLabel(incident.incident_type)}
                </span>
              </div>
              <div className="incident-date-time">
                <Calendar size={16} className="icon-inline" />
                <span>{formatDate(incident.incident_date)} at {formatTime(incident.incident_date)}</span>
              </div>
            </div>
            
            <div className="incident-actions">
              {deleteConfirm ? (
                <div className="delete-confirmation">
                  <span>Confirm deletion?</span>
                  <button className="confirm-yes" onClick={handleDelete}>Yes</button>
                  <button className="confirm-no" onClick={cancelDelete}>No</button>
                </div>
              ) : (
                <>
                  <Link to={`/admin/incidents/edit/${incidentId}`} className="action-button secondary">
                    <Edit size={16} className="icon-inline" /> Edit
                  </Link>
                  <button className="action-button danger" onClick={handleDelete}>
                    <Trash2 size={16} className="icon-inline" /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="incident-details">
            <h4>Description</h4>
            <div className="incident-description">
              <p>{incident.description}</p>
            </div>
            
            <div className="incident-info-grid">
              <div className="info-card trainee-info">
                <div className="info-card-header">
                  <h4>Trainee Information</h4>
                </div>
                <div className="info-card-content">
                  <div className="trainee-details">
                    <div className="trainee-avatar">
                      {incident.userName ? incident.userName.charAt(0) : '?'}
                    </div>
                    <div className="trainee-meta">
                      <div className="trainee-name">{incident.userName || 'Unknown'}</div>
                      <Link to={`/admin/user-management/edit/${incident.user_id}`} className="view-trainee-link">
                        View Trainee Profile
                      </Link>
                    </div>
                  </div>
                  
                  <div className="other-incidents">
                    <div className="other-incidents-header">
                      <h5>Related Incidents</h5>
                      <Link to={`/admin/incidents?user_id=${incident.user_id}`} className="view-all-link">
                        View All
                      </Link>
                    </div>
                    
                    {incident.relatedIncidents && incident.relatedIncidents.length > 0 ? (
                      <div className="related-incidents-list">
                        {incident.relatedIncidents.map((related, index) => (
                          <div key={index} className="related-incident">
                            <div className={`incident-badge ${getIncidentTypeClass(related.incident_type)}`}>
                              {getIncidentTypeLabel(related.incident_type)}
                            </div>
                            <div className="related-incident-date">
                              {formatDate(related.incident_date)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-related-incidents">
                        No other incidents reported for this trainee.
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="info-card reporter-info">
                <div className="info-card-header">
                  <h4>Incident Reporter</h4>
                </div>
                <div className="info-card-content">
                  <div className="reporter-details">
                    <div className="reporter-avatar">
                      {incident.reporterName ? incident.reporterName.charAt(0) : 'S'}
                    </div>
                    <div className="reporter-meta">
                      <div className="reporter-name">{incident.reporterName || 'System'}</div>
                      <div className="reporter-role">
                        {incident.reporterRole || (incident.reporterName ? 'Staff' : 'Automated')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="report-timestamp">
                    <Clock size={16} className="icon-inline" />
                    <span>Reported: {formatDate(incident.created_at)} {formatTime(incident.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="incident-notes">
            <div className="notes-header">
              <h4>
                <MessageSquare size={18} className="icon-inline" />
                Notes & Follow-up
              </h4>
            </div>
            
            {incident.notes && incident.notes.length > 0 ? (
              <div className="notes-list">
                {incident.notes.map((note, index) => (
                  <div key={index} className="note-item">
                    <div className="note-author">
                      <div className="author-avatar">
                        {note.author_name ? note.author_name.charAt(0) : '?'}
                      </div>
                      <div className="author-info">
                        <div className="author-name">{note.author_name || 'Unknown'}</div>
                        <div className="note-date">{formatDate(note.created_at)} {formatTime(note.created_at)}</div>
                      </div>
                    </div>
                    <div className="note-content">
                      <p>{note.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-notes">
                <p>No notes have been added for this incident.</p>
              </div>
            )}
            
            <div className="add-note">
              <div className="add-note-input">
                <textarea 
                  placeholder="Add a note about this incident..."
                  value={newNote}
                  onChange={handleNoteChange}
                  rows="3"
                ></textarea>
              </div>
              <button 
                className="add-note-button" 
                onClick={handleAddNote}
                disabled={addingNote || !newNote.trim()}
              >
                {addingNote ? 'Adding...' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default IncidentDetails;