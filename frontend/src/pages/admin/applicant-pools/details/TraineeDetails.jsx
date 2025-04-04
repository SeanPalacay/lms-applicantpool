import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  UserCheck, Clock, Briefcase, FileText, Mail, Calendar, ArrowLeft, CheckCircle, XCircle, 
  AlertTriangle, Download, Award, BarChart2, Clipboard, User
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';

const TraineeDetails = () => {
  const { poolId, traineeId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [trainee, setTrainee] = useState({
    trainee_id: '',
    full_name: '',
    email: '',
    program_id: '',
    program_name: '',
    role: '',
    status: 'active',
    added_at: '',
    updated_at: '',
    documents: [],
    notes: []
  });

  useEffect(() => {
    const fetchTraineeDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        // Fetch trainee details from the pool
        const trainees = await adminService.getTraineesByPool(poolId);
        const traineeData = trainees.find(t => t.trainee_id === parseInt(traineeId));
        if (!traineeData) throw new Error('Trainee not found in this pool');
        
        setTrainee({
          trainee_id: traineeData.trainee_id || '',
          full_name: traineeData.full_name || '',
          email: traineeData.email || '', // Assuming email might be added to backend later
          program_id: traineeData.program_id || '',
          program_name: traineeData.program_name || '',
          role: traineeData.role || '',
          status: traineeData.status || 'active',
          added_at: traineeData.added_at || '',
          updated_at: traineeData.updated_at || '', // Assuming updated_at might be added
          documents: traineeData.documents || [], // Placeholder if documents are added later
          notes: traineeData.notes || [] // Placeholder if notes are added later
        });
      } catch (err) {
        console.error('Error fetching trainee details:', err);
        setError('Failed to load trainee details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTraineeDetails();
  }, [poolId, traineeId, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleStatusChange = async (newStatus) => setConfirmAction({ type: 'status', value: newStatus });

  const handleConfirmStatusChange = async () => {
    if (!confirmAction) return;
    setLoading(true);
    try {
      await adminService.updateTraineeStatus(trainee.trainee_id, confirmAction.value);
      setTrainee({ ...trainee, status: confirmAction.value, updated_at: new Date().toISOString() });
      setSuccess(`Trainee status updated to ${confirmAction.value}.`);
    } catch (err) {
      console.error('Error updating trainee status:', err);
      setError('Failed to update trainee status. Please try again.');
    } finally {
      setLoading(false);
      setConfirmAction(null);
    }
  };

  const handleRemoveFromPool = async () => {
    if (window.confirm('Are you sure you want to remove this trainee from the pool?')) {
      try {
        setLoading(true);
        await adminService.removeTraineeFromPool(trainee.trainee_id);
        setSuccess('Trainee removed from pool successfully.');
        setTimeout(() => navigate(`/admin/applicant-pools/${poolId}`), 2000);
      } catch (err) {
        console.error('Error removing trainee from pool:', err);
        setError('Failed to remove trainee from pool. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Placeholder for document download - implement if documents are added to backend
  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      // await adminService.downloadDocument(documentId); // Add this method if needed
      setSuccess(`Downloading ${documentName}...`);
    } catch (err) {
      console.error('Error downloading document:', err);
      setError('Failed to download document. Please try again.');
    }
  };

  // Placeholder for adding notes - implement if notes are added to backend
  const handleAddNote = async (e) => {
    e.preventDefault();
    const noteContent = e.target.elements.note.value.trim();
    if (!noteContent) return;
    try {
      setLoading(true);
      // await adminService.addTraineeNote(trainee.trainee_id, noteContent); // Add this method if needed
      const newNote = {
        id: Date.now(),
        content: noteContent,
        author_name: localStorage.getItem('userName') || 'User',
        created_at: new Date().toISOString()
      };
      setTrainee({ ...trainee, notes: [newNote, ...(trainee.notes || [])] });
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
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Trainee Details</h1>
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
      }} onClick={() => navigate(`/admin/applicant-pools/${poolId}`)}>
        <ArrowLeft size={16} /> Back to Trainee Pool
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
            {trainee.full_name || 'Trainee'}
          </h2>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: trainee.status === 'active' ? '#1E88E5' :
                    trainee.status === 'completed' ? '#2ecc71' : '#e74c3c',
            backgroundColor: trainee.status === 'active' ? '#E3F2FD' :
                           trainee.status === 'completed' ? '#e6ffe6' : '#ffe6e6'
          }}>
            {trainee.status === 'active' && <Clock size={16} />}
            {trainee.status === 'completed' && <CheckCircle size={16} />}
            {trainee.status === 'dropped' && <XCircle size={16} />}
            <span>{trainee.status.charAt(0).toUpperCase() + trainee.status.slice(1)}</span>
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
              <button onClick={() => handleStatusChange('active')} disabled={trainee.status === 'active'} style={{
                backgroundColor: trainee.status === 'active' ? '#E3F2FD' : '#1E88E5',
                color: trainee.status === 'active' ? '#1E88E5' : '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: trainee.status === 'active' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <UserCheck size={16} /> Active
              </button>
              <button onClick={() => handleStatusChange('completed')} disabled={trainee.status === 'completed'} style={{
                backgroundColor: trainee.status === 'completed' ? '#e6ffe6' : '#2ecc71',
                color: trainee.status === 'completed' ? '#2ecc71' : '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: trainee.status === 'completed' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <CheckCircle size={16} /> Completed
              </button>
              <button onClick={() => handleStatusChange('dropped')} disabled={trainee.status === 'dropped'} style={{
                backgroundColor: trainee.status === 'dropped' ? '#ffe6e6' : '#e74c3c',
                color: trainee.status === 'dropped' ? '#e74c3c' : '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: trainee.status === 'dropped' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <XCircle size={16} /> Dropped
              </button>
              <button onClick={handleRemoveFromPool} style={{
                backgroundColor: '#e74c3c',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem'
              }}>
                <XCircle size={16} /> Remove from Pool
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
              { icon: Mail, label: 'Email', value: trainee.email || 'N/A' },
              { icon: Briefcase, label: 'Role', value: trainee.role || 'N/A' },
              { icon: FileText, label: 'Program', value: trainee.program_name || 'N/A' },
              { icon: Calendar, label: 'Added Date', value: formatDate(trainee.added_at) }
            ].map((item, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <item.icon size={16} style={{ color: '#64748b' }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{item.label}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{item.value}</div>
                </div>
              </div>
            ))}
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
            {trainee.documents && trainee.documents.length > 0 ? (
              trainee.documents.map((doc, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: index < trainee.documents.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
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
                No documents have been uploaded by this trainee.
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
            {trainee.notes && trainee.notes.length > 0 ? (
              trainee.notes.map((note, index) => (
                <div key={index} style={{ padding: '8px 0', borderBottom: index < trainee.notes.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{note.author_name || 'User'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{formatDate(note.created_at)}</div>
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{note.content}</div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: '0.875rem' }}>
                No notes have been added for this trainee.
              </div>
            )}
            <form onSubmit={handleAddNote} style={{ marginTop: '24px' }}>
              <textarea
                name="note"
                placeholder="Add a note about this trainee..."
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
                  resize: 'vertical'
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
                marginTop: '16px'
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

export default TraineeDetails;