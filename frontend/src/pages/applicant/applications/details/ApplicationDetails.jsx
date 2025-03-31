import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Clock, CheckCircle, XCircle, 
  Calendar, BookOpen, AlertTriangle, RefreshCw, User,
  FileUp, Download
} from 'lucide-react';
import applicantService from '../../../../services/applicantService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner'; // Assuming this exists
import AlertBanner from '../../../../components/shared/AlertBanner'; // Assuming this exists

const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        const dashboardData = await applicantService.getDashboardData();
        const applicationData = dashboardData.myApplications.find(
          app => app.application_id === parseInt(applicationId) || app.id === parseInt(applicationId)
        );
        if (!applicationData) throw new Error('Application not found');
        let documentsData = [];
        try {
          documentsData = await applicantService.getApplicationDocuments(applicationId);
        } catch (docError) {
          console.warn('Could not fetch documents:', docError);
        }
        setApplication(applicationData);
        setDocuments(documentsData || []);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Failed to load application details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplicationDetails();
  }, [applicationId]);

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString() : 'N/A';

  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending': return { icon: <Clock size={18} />, color: '#f39c12', bg: '#fef5e7', message: 'Your application is currently under review by our team.' };
      case 'shortlisted': return { icon: <CheckCircle size={18} />, color: '#2ecc71', bg: '#e6ffe6', message: 'Congratulations! You’ve been shortlisted for this program. Our team may contact you soon for further assessment.' };
      case 'hired': return { icon: <CheckCircle size={18} />, color: '#2ecc71', bg: '#e6ffe6', message: 'Congratulations! You’ve been selected for this program. Please check your email for enrollment details.' };
      case 'rejected': return { icon: <XCircle size={18} />, color: '#e74c3c', bg: '#ffe6e6', message: 'We’re sorry, your application was not successful at this time. We encourage you to apply for other programs.' };
      default: return { icon: null, color: '#64748b', bg: '#f1f5f9', message: '' };
    }
  };

  const downloadDocument = async (documentId, filename) => {
    try {
      await applicantService.downloadDocument(documentId);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    window.location.reload();
  };

  if (loading) return <LoadingSpinner />;
  if (error || !application) return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <AlertTriangle size={48} style={{ color: '#e74c3c', marginBottom: '16px' }} />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>{error ? 'Error' : 'Application Not Found'}</h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>{error || 'The application you’re looking for could not be found.'}</p>
      <div style={{ display: 'flex', gap: '16px' }}>
        {error && (
          <button
            onClick={handleRetry}
            style={{
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
              transition: 'background-color 0.3s ease',
              ':hover': { backgroundColor: '#1565C0' }
            }}
          >
            <RefreshCw size={16} /> Retry
          </button>
        )}
        <button
          onClick={() => navigate('/applicant/applications')}
          style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px 16px',
            border: '1px solid #1E88E5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#E3F2FD' }
          }}
        >
          <ArrowLeft size={16} /> Back to Applications
        </button>
      </div>
    </div>
  );

  const statusInfo = getStatusInfo(application.status);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link
          to="/applicant/applications"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#1E88E5',
            fontSize: '0.875rem',
            textDecoration: 'none',
            ':hover': { textDecoration: 'underline' }
          }}
        >
          <ArrowLeft size={16} /> Back to Applications
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Application Details</h1>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        padding: '24px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '12px', borderRadius: '9999px', color: '#1E88E5' }}>
            <BookOpen size={32} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>{application.program_title}</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.875rem', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Applied: {formatDate(application.applied_at)}
              </div>
              {application.updated_at && application.updated_at !== application.applied_at && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> Last Updated: {formatDate(application.updated_at)}
                </div>
              )}
            </div>
          </div>
        </div>
        <div style={{
          backgroundColor: statusInfo.bg,
          color: statusInfo.color,
          padding: '8px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.875rem',
          fontWeight: 500
        }}>
          {statusInfo.icon} <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
        </div>
      </div>

      <div style={{ backgroundColor: statusInfo.bg, padding: '16px', borderRadius: '8px', marginBottom: '24px', color: statusInfo.color, fontSize: '0.875rem' }}>
        {statusInfo.message}
      </div>

      <div style={{ display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <User size={18} /> Position Details
          </h3>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontWeight: 600 }}>Job Role</span>
              <span>{application.job_role || 'Not specified'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <span style={{ fontWeight: 600 }}>Department</span>
              <span>{application.department || 'Not specified'}</span>
            </div>
          </div>
        </div>

        {application.cover_letter && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <FileText size={18} /> Cover Letter
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.5', margin: 0 }}>{application.cover_letter}</p>
          </div>
        )}

        {application.additional_info && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <FileText size={18} /> Additional Information
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#1e293b', lineHeight: '1.5', margin: 0 }}>{application.additional_info}</p>
          </div>
        )}

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
            <FileUp size={18} /> Supporting Documents
          </h3>
          {documents.length > 0 ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              {documents.map(doc => (
                <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <div>
                    <span style={{ fontSize: '0.875rem', color: '#1e293b', fontWeight: 500 }}>{doc.description}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Uploaded: {formatDate(doc.created_at)}</span>
                  </div>
                  <button
                    onClick={() => downloadDocument(doc.id, doc.description)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1E88E5',
                      cursor: 'pointer',
                      padding: '4px',
                      ':hover': { color: '#1565C0' }
                    }}
                  >
                    <Download size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 16px 0' }}>No supporting documents found for this application.</p>
          )}
          <div style={{ textAlign: 'right' }}>
            <Link
              to="/applicant/upload"
              style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}
            >
              Upload More Documents
            </Link>
          </div>
        </div>

        {(application.evaluation_score || application.fst_score) && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 16px 0' }}>
              <CheckCircle size={18} /> Evaluation Results
            </h3>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {application.evaluation_score && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 600 }}>Evaluation Score</span>
                  <span style={{ backgroundColor: '#E3F2FD', color: '#1E88E5', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>{application.evaluation_score}</span>
                </div>
              )}
              {application.fst_score && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontWeight: 600 }}>Field Stress Test (FST) Score</span>
                  <span style={{ backgroundColor: '#E3F2FD', color: '#1E88E5', padding: '4px 8px', borderRadius: '4px', fontWeight: 500 }}>{application.fst_score}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', fontSize: '0.75rem', color: '#f39c12' }}>
                <AlertTriangle size={16} /> Note: Evaluation scores are based on multiple factors including your application materials, assessments, and interviews if conducted.
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
        <Link
          to="/applicant/applications"
          style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px 16px',
            border: '1px solid #1E88E5',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#E3F2FD' }
          }}
        >
          <ArrowLeft size={16} /> Back to Applications
        </Link>
      </div>

      <div style={{ marginTop: '48px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto', padding: '24px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>Need Help?</h3>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
          If you have any questions about your application status or the recruitment process, please contact our HR department at <a href="mailto:hr@example.com" style={{ color: '#1E88E5', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>hr@example.com</a>.
        </p>
      </div>
    </div>
  );
};

export default ApplicationDetails;