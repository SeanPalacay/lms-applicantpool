import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck,Clock,Briefcase, FileText, Mail, Calendar, ArrowLeft, CheckCircle, XCircle, 
  AlertTriangle, Download, Award, BarChart2, Clipboard, User
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import applicantService from '../../../../services/applicantService';

const ApplicantDetails = () => {
  const { poolId, applicantId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [applicant, setApplicant] = useState({
    id: '', user_id: '', program_id: '', application_id: '', full_name: '', email: '',
    job_role: '', department: '', status: 'pending', evaluation_score: null, fst_score: null,
    applied_at: '', updated_at: '', documents: [], program: { title: '', type: '' }, notes: []
  });

  useEffect(() => {
    const fetchApplicantDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const response = await applicantService.getApplicantDetails(poolId, applicantId);
        const data = Array.isArray(response) ? response[0] : response;
        if (!data) throw new Error('No data returned from API');
        setApplicant({
          id: data.id || '', user_id: data.user_id || '', program_id: data.program_id || '',
          application_id: data.application_id || '', full_name: data.full_name || '',
          email: data.email || '', job_role: data.job_role || '', department: data.department || '',
          status: data.status || 'pending', evaluation_score: data.evaluation_score || null,
          fst_score: data.fst_score || null, applied_at: data.applied_at || '', updated_at: data.updated_at || '',
          program: { title: data.program_title || '', type: 'regular' }, documents: data.documents || [], notes: data.notes || []
        });
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
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleStatusChange = async (newStatus) => setConfirmAction({ type: 'status', value: newStatus });

  const handleConfirmStatusChange = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      await applicantService.updateApplicationStatus(applicant.application_id, confirmAction.value);
      setApplicant({ ...applicant, status: confirmAction.value, updated_at: new Date().toISOString() });
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
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again.');
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const noteContent = e.target.elements.note.value.trim();
    if (!noteContent) return;
    try {
      setLoading(true);
      await applicantService.addApplicantNote(applicant.id, noteContent);
      const newNote = {
        id: Date.now(), content: noteContent, author_name: localStorage.getItem('userName') || 'User',
        created_at: new Date().toISOString()
      };
      setApplicant({ ...applicant, notes: [newNote, ...(applicant.notes || [])] });
      e.target.elements.note.value = '';
      setSuccess('Note added successfully.');
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Applicant Details</h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#1E88E5',
        cursor: 'pointer',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }} onClick={() => navigate(`/admin/applicant-pools/`)}>
        <ArrowLeft size={16} /> Back to Applicant Pool
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
            {applicant.full_name || 'Applicant'}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: applicant.status === 'pending' ? '#f39c12' :
                    applicant.status === 'shortlisted' ? '#1E88E5' :
                    applicant.status === 'hired' ? '#2ecc71' : '#e74c3c',
            backgroundColor: applicant.status === 'pending' ? '#fff8e6' :
                           applicant.status === 'shortlisted' ? '#E3F2FD' :
                           applicant.status === 'hired' ? '#e6ffe6' : '#ffe6e6'
          }}>
            {applicant.status === 'pending' && <Clock size={16} />}
            {applicant.status === 'shortlisted' && <UserCheck size={16} />}
            {applicant.status === 'hired' && <CheckCircle size={16} />}
            {applicant.status === 'rejected' && <XCircle size={16} />}
            <span>{applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {confirmAction ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
              <span>Confirm status change to <strong>{confirmAction.value}</strong>?</span>
              <button onClick={handleConfirmStatusChange} style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '4px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>Yes</button>
              <button onClick={() => setConfirmAction(null)} style={{
                backgroundColor: '#e74c3c',
                color: '#ffffff',
                padding: '4px 12px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}>No</button>
            </div>
          ) : (
            <>
              <button onClick={() => handleStatusChange('shortlisted')} disabled={applicant.status === 'shortlisted'} style={{
                backgroundColor: applicant.status === 'shortlisted' ? '#E3F2FD' : '#1E88E5',
                color: applicant.status === 'shortlisted' ? '#1E88E5' : '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: applicant.status === 'shortlisted' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <UserCheck size={16} /> Shortlist
              </button>
              <button onClick={() => handleStatusChange('hired')} disabled={applicant.status === 'hired'} style={{
                backgroundColor: applicant.status === 'hired' ? '#e6ffe6' : '#2ecc71',
                color: applicant.status === 'hired' ? '#2ecc71' : '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: applicant.status === 'hired' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <CheckCircle size={16} /> Hire
              </button>
              <button onClick={() => handleStatusChange('rejected')} disabled={applicant.status === 'rejected'} style={{
                backgroundColor: applicant.status === 'rejected' ? '#ffe6e6' : '#e74c3c',
                color: applicant.status === 'rejected' ? '#e74c3c' : '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: applicant.status === 'rejected' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <XCircle size={16} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <User size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Personal Information</h3>
          </div>
          <div style={{ padding: '24px' }}>
            {[
              { icon: Mail, label: 'Email', value: applicant.email || 'N/A' },
              { icon: Briefcase, label: 'Applied Position', value: applicant.job_role || 'N/A' },
              { icon: FileText, label: 'Department', value: applicant.department || 'N/A' },
              { icon: Calendar, label: 'Applied Date', value: formatDate(applicant.applied_at) }
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <item.icon size={16} style={{ color: '#64748b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.value}</div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '24px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Program Information</h4>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
                  {applicant.program?.title || 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {applicant.program?.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BarChart2 size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Evaluation Scores</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              {[
                { icon: Clipboard, label: 'Evaluation Score', value: applicant.evaluation_score },
                { icon: Award, label: 'Field Stress Test (FST)', value: applicant.fst_score }
              ].map((score, index) => (
                <div key={index} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
                    <score.icon size={20} style={{ color: '#1E88E5' }} />
                    <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{score.label}</h4>
                  </div>
                  {score.value !== null ? (
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '9999px',
                      backgroundColor: '#E3F2FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      {score.value}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', color: '#f39c12' }}>
                      <AlertTriangle size={16} /> <span style={{ fontSize: '0.875rem' }}>{score.label.includes('FST') ? 'Not taken' : 'Not evaluated'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link to={`/admin/applicants/${applicant.application_id}/evaluate`} style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <Clipboard size={16} /> Update Evaluation
              </Link>
              <Link to={`/admin/applicants/${applicant.application_id}/fst`} style={{
                backgroundColor: '#ffffff',
                color: '#1E88E5',
                padding: '8px 16px',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <Award size={16} /> Record FST Score
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <FileText size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Documents</h3>
          </div>
          <div style={{ padding: '24px' }}>
            {applicant.documents && applicant.documents.length > 0 ? (
              applicant.documents.map((doc, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: index < applicant.documents.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <FileText size={20} style={{ color: '#64748b' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{doc.description || 'Document'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Uploaded: {formatDate(doc.created_at)}</div>
                  </div>
                  <button onClick={() => handleDownloadDocument(doc.id, doc.description)} style={{
                    backgroundColor: '#1E88E5',
                    color: '#ffffff',
                    padding: '4px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}>
                    <Download size={16} />
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
                No documents have been uploaded by this applicant.
              </div>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Clipboard size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Notes</h3>
          </div>
          <div style={{ padding: '24px' }}>
            {applicant.notes && applicant.notes.length > 0 ? (
              applicant.notes.map((note, index) => (
                <div key={index} style={{ padding: '8px 0', borderBottom: index < applicant.notes.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{note.author_name || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(note.created_at)}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{note.content}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '0.875rem' }}>
                No notes have been added for this applicant.
              </div>
            )}
            <form onSubmit={handleAddNote} style={{ marginTop: '24px' }}>
              <textarea
                name="note"
                placeholder="Add a note about this applicant..."
                rows="3"
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#1e293b',
                  outline: 'none',
                  resize: 'vertical',
                  ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
                }}
              />
              <button type="submit" style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                marginTop: '16px',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}>
                <Clipboard size={16} /> Add Note
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantDetails;