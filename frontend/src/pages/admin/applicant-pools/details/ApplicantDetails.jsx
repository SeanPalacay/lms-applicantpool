import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck, 
  Briefcase, 
  FileText, 
  Mail, 
  Phone,
  Clock,
  Calendar,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Award,
  BarChart2,
  Clipboard,
  User
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import applicantService from '../../../../services/applicantService';
import '../styles/ApplicantDetails.css';

const ApplicantDetails = () => {
  const { poolId, applicantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [applicant, setApplicant] = useState({
    id: '',
    user_id: '',
    program_id: '',
    application_id: '',
    full_name: '',
    email: '',
    job_role: '',
    department: '',
    status: 'pending', // pending, shortlisted, hired, rejected
    evaluation_score: null,
    fst_score: null,
    applied_at: '',
    updated_at: '',
    documents: [],
    program: {
      title: '',
      type: ''
    },
    notes: []
  });

  useEffect(() => {
    const fetchApplicantDetails = async () => {
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
          
          // Fetch applicant data
          const response = await applicantService.getApplicantDetails(poolId, applicantId);
          console.log('Received applicant details:', response);
          
          // Handle the response which might be an array or object
          const data = Array.isArray(response) ? response[0] : response;
          
          if (!data) {
            throw new Error('No data returned from API');
          }
          
          // Map the API response to our component's data structure
          const mappedData = {
            id: data.id || '',
            user_id: data.user_id || '',
            program_id: data.program_id || '',
            application_id: data.application_id || '',
            full_name: data.full_name || '',
            email: data.email || '',
            job_role: data.job_role || '',
            department: data.department || '',
            status: data.status || 'pending',
            evaluation_score: data.evaluation_score || null,
            fst_score: data.fst_score || null,
            applied_at: data.applied_at || '',
            updated_at: data.updated_at || '',
            program: {
              title: data.program_title || '',
              type: 'regular' // Default to regular since we don't have this info
            },
            documents: data.documents || [],
            notes: data.notes || []
          };
          
          console.log('Mapped applicant data:', mappedData);
          setApplicant(mappedData);
        } catch (err) {
          console.error('Error fetching applicant details:', err);
          setError('Failed to load applicant details. Please try again.');
        } finally {
          setLoading(false);
        }
      };

    fetchApplicantDetails();
  }, [poolId, applicantId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleStatusChange = async (newStatus) => {
    setConfirmAction({ type: 'status', value: newStatus });
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmAction) return;
    
    setLoading(true);
    
    try {
      await applicantService.updateApplicationStatus(
        applicant.application_id, 
        confirmAction.value
      );
      
      // Update local state
      setApplicant({
        ...applicant,
        status: confirmAction.value,
        updated_at: new Date().toISOString()
      });
      
      setSuccess(`Applicant status updated to ${confirmAction.value}.`);
    } catch (err) {
      console.error('Error updating applicant status:', err);
      setError('Failed to update applicant status. Please try again.');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      await applicantService.downloadDocument(documentId);
      // Browser will handle the download
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again.');
    }
  };

  const cancelAction = () => {
    setConfirmAction(null);
  };

  const goBack = () => {
    navigate(`/admin/applicant-pools/`);
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'shortlisted': return 'status-info';
      case 'hired': return 'status-success';
      case 'rejected': return 'status-danger';
      default: return 'status-warning'; // pending
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'shortlisted': return <UserCheck size={16} />;
      case 'hired': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return <Clock size={16} />; // pending
    }
  };
  
  // This function safely formats the status string with a capitalized first letter
  const formatStatus = (status) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const noteContent = e.target.elements.note.value.trim();
    
    if (!noteContent) return;
    
    try {
      setLoading(true);
      
      // Assuming you have an API endpoint to add notes
      await applicantService.addApplicantNote(applicant.id, noteContent);
      
      // Update local state with the new note
      // This is a simplified approach; in reality, you'd get the full note data from the API
      const newNote = {
        id: Date.now(), // Temporary ID
        content: noteContent,
        author_name: localStorage.getItem('userName') || 'User',
        created_at: new Date().toISOString()
      };
      
      setApplicant({
        ...applicant,
        notes: [newNote, ...(applicant.notes || [])]
      });
      
      // Clear the form
      e.target.elements.note.value = '';
      
      setSuccess('Note added successfully.');
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="applicant-details-container">
      <div className="section-header">
        <h1>Applicant Details</h1>
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
        <span>Back to Applicant Pool</span>
      </div>
      
      <div className="applicant-header">
        <div className="applicant-title-section">
          <h2>{applicant.full_name || 'Applicant'}</h2>
          <div className={`applicant-status ${getStatusClass(applicant.status)}`}>
            {getStatusIcon(applicant.status)}
            <span>{formatStatus(applicant.status)}</span>
          </div>
        </div>
        
        <div className="applicant-actions">
          {confirmAction ? (
            <div className="confirm-action">
              <span>Confirm status change to <strong>{confirmAction.value}</strong>?</span>
              <button className="confirm-yes" onClick={handleConfirmStatusChange}>Yes</button>
              <button className="confirm-no" onClick={cancelAction}>No</button>
            </div>
          ) : (
            <div className="status-actions">
              <button 
                className={`action-button ${applicant.status === 'shortlisted' ? 'active' : ''}`}
                onClick={() => handleStatusChange('shortlisted')}
                disabled={applicant.status === 'shortlisted'}
              >
                <UserCheck size={16} className="icon-inline" /> Shortlist
              </button>
              <button 
                className={`action-button ${applicant.status === 'hired' ? 'active success' : ''}`}
                onClick={() => handleStatusChange('hired')}
                disabled={applicant.status === 'hired'}
              >
                <CheckCircle size={16} className="icon-inline" /> Hire
              </button>
              <button 
                className={`action-button ${applicant.status === 'rejected' ? 'active danger' : ''}`}
                onClick={() => handleStatusChange('rejected')}
                disabled={applicant.status === 'rejected'}
              >
                <XCircle size={16} className="icon-inline" /> Reject
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="applicant-content">
        <div className="applicant-card">
          <div className="card-header">
            <div className="header-icon">
              <User size={20} />
            </div>
            <div className="header-content">
              <h3>Personal Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            <div className="applicant-info">
              <div className="info-item">
                <div className="info-icon">
                  <Mail size={16} />
                </div>
                <div className="info-content">
                  <div className="info-label">Email</div>
                  <div className="info-value">{applicant.email || 'N/A'}</div>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Briefcase size={16} />
                </div>
                <div className="info-content">
                  <div className="info-label">Applied Position</div>
                  <div className="info-value">{applicant.job_role || 'N/A'}</div>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <FileText size={16} />
                </div>
                <div className="info-content">
                  <div className="info-label">Department</div>
                  <div className="info-value">{applicant.department || 'N/A'}</div>
                </div>
              </div>
              
              <div className="info-item">
                <div className="info-icon">
                  <Calendar size={16} />
                </div>
                <div className="info-content">
                  <div className="info-label">Applied Date</div>
                  <div className="info-value">{formatDate(applicant.applied_at)}</div>
                </div>
              </div>
            </div>
            
            <div className="program-info">
              <h4>Program Information</h4>
              <div className="program-box">
                <div className="program-title">{(applicant.program && applicant.program.title) || 'N/A'}</div>
                <div className="program-type">
                  {(applicant.program && applicant.program.type === 'regular') ? 'Regular Program' : 'Refresher Program'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="applicant-card">
          <div className="card-header">
            <div className="header-icon">
              <BarChart2 size={20} />
            </div>
            <div className="header-content">
              <h3>Evaluation Scores</h3>
            </div>
          </div>
          
          <div className="card-content">
            <div className="scores-container">
              <div className="score-card">
                <div className="score-header">
                  <Clipboard size={20} />
                  <h4>Evaluation Score</h4>
                </div>
                <div className="score-value">
                  {applicant.evaluation_score !== null ? (
                    <div className="score-circle">
                      <span>{applicant.evaluation_score}</span>
                    </div>
                  ) : (
                    <div className="no-score">
                      <AlertTriangle size={16} className="icon-inline" />
                      <span>Not evaluated</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="score-card">
                <div className="score-header">
                  <Award size={20} />
                  <h4>Field Stress Test (FST)</h4>
                </div>
                <div className="score-value">
                  {applicant.fst_score !== null ? (
                    <div className="score-circle">
                      <span>{applicant.fst_score}</span>
                    </div>
                  ) : (
                    <div className="no-score">
                      <AlertTriangle size={16} className="icon-inline" />
                      <span>Not taken</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="score-actions">
              <Link to={`/admin/applicants/${applicant.application_id}/evaluate`} className="action-button primary">
                <Clipboard size={16} className="icon-inline" /> Update Evaluation
              </Link>
              
              <Link to={`/admin/applicants/${applicant.application_id}/fst`} className="action-button secondary">
                <Award size={16} className="icon-inline" /> Record FST Score
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="applicant-documents-section">
        <div className="applicant-card">
          <div className="card-header">
            <div className="header-icon">
              <FileText size={20} />
            </div>
            <div className="header-content">
              <h3>Documents</h3>
            </div>
          </div>
          
          <div className="card-content">
            {applicant.documents && applicant.documents.length > 0 ? (
              <div className="document-list">
                {applicant.documents.map((doc, index) => (
                  <div key={index} className="document-item">
                    <div className="document-icon">
                      <FileText size={20} />
                    </div>
                    <div className="document-details">
                      <div className="document-name">{doc.description || 'Document'}</div>
                      <div className="document-date">Uploaded: {formatDate(doc.created_at)}</div>
                    </div>
                    <button 
                      className="document-download" 
                      onClick={() => handleDownloadDocument(doc.id, doc.description)}
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No documents have been uploaded by this applicant.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="applicant-card">
          <div className="card-header">
            <div className="header-icon">
              <Clipboard size={20} />
            </div>
            <div className="header-content">
              <h3>Notes</h3>
            </div>
          </div>
          
          <div className="card-content">
            {applicant.notes && applicant.notes.length > 0 ? (
              <div className="notes-list">
                {applicant.notes.map((note, index) => (
                  <div key={index} className="note-item">
                    <div className="note-header">
                      <div className="note-author">{note.author_name || 'User'}</div>
                      <div className="note-date">{formatDate(note.created_at)}</div>
                    </div>
                    <div className="note-content">{note.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>No notes have been added for this applicant.</p>
              </div>
            )}
            
            <form className="add-note-form" onSubmit={handleAddNote}>
              <textarea 
                name="note"
                placeholder="Add a note about this applicant..."
                rows="3"
                required
              ></textarea>
              <button type="submit" className="action-button primary">
                <Clipboard size={16} className="icon-inline" /> Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetails;