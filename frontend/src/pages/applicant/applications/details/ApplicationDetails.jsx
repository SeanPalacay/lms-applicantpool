import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FileText, ArrowLeft, Clock, CheckCircle, XCircle, 
  Calendar, BookOpen, AlertTriangle, RefreshCw, User,
  FileUp, Download
} from 'lucide-react';
import applicantService from '../../../../services/applicantService';
import '../styles/ApplicationDetails.css';

const ApplicationDetails = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch application details
  useEffect(() => {
    const fetchApplicationDetails = async () => {
      try {
        setLoading(true);
        
        // Get dashboard data which contains all applications
        const dashboardData = await applicantService.getDashboardData();
        
        // Find the specific application from the applications list
        const applicationData = dashboardData.myApplications.find(
          app => app.application_id === parseInt(applicationId) || app.id === parseInt(applicationId)
        );
        
        if (!applicationData) {
          throw new Error('Application not found');
        }
        
        // Get documents associated with this application (if implemented)
        let documentsData = [];
        try {
          documentsData = await applicantService.getApplicationDocuments(applicationId);
        } catch (docError) {
          console.warn('Could not fetch documents:', docError);
          // Continue with empty documents array
        }
        
        setApplication(applicationData);
        setDocuments(documentsData || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching application details:', err);
        setError('Failed to load application details. Please try again later.');
        setLoading(false);
      }
    };

    fetchApplicationDetails();
  }, [applicationId]);
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Get status icon and class
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
        return { 
          icon: <Clock size={18} />,
          class: 'status-pending',
          message: 'Your application is currently under review by our team.'
        };
      case 'shortlisted':
        return { 
          icon: <CheckCircle size={18} />,
          class: 'status-shortlisted',
          message: 'Congratulations! You\'ve been shortlisted for this program. Our team may contact you soon for further assessment.'
        };
      case 'hired':
        return { 
          icon: <CheckCircle size={18} />,
          class: 'status-hired',
          message: 'Congratulations! You\'ve been selected for this program. Please check your email for enrollment details.'
        };
      case 'rejected':
        return { 
          icon: <XCircle size={18} />,
          class: 'status-rejected',
          message: 'We\'re sorry, your application was not successful at this time. We encourage you to apply for other programs.'
        };
      default:
        return { 
          icon: null,
          class: '',
          message: ''
        };
    }
  };
  
  // Download document using the service
  const downloadDocument = async (documentId, filename) => {
    try {
      await applicantService.downloadDocument(documentId);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    }
  };
  
  // Retry loading functionality
  const handleRetry = () => {
    setLoading(true);
    setError(null);
  };
  
  if (loading) {
    return (
      <div className="application-details-loading">
        <div className="spinner"></div>
        <p>Loading application details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="application-details-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <div className="error-actions">
          <button 
            onClick={handleRetry} 
            className="btn-primary retry-btn"
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <button 
            onClick={() => navigate('/applicant/applications')} 
            className="btn-secondary back-btn"
          >
            <ArrowLeft size={16} />
            Back to Applications
          </button>
        </div>
      </div>
    );
  }
  
  if (!application) {
    return (
      <div className="application-details-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Application Not Found</h2>
        <p>The application you're looking for could not be found.</p>
        <button 
          onClick={() => navigate('/applicant/applications')} 
          className="btn-primary back-btn"
        >
          <ArrowLeft size={16} />
          Back to Applications
        </button>
      </div>
    );
  }
  
  const statusInfo = getStatusInfo(application.status);
  
  return (
    <div className="application-details-container">
      <div className="application-details-header">
        <Link to="/applicant/applications" className="back-link">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
        <h1>Application Details</h1>
      </div>
      
      <div className="application-overview">
        <div className="program-info">
          <div className="program-icon">
            <BookOpen size={32} />
          </div>
          <div className="program-details">
            <h2 className="program-title">{application.program_title}</h2>
            <div className="application-meta">
              <div className="meta-item">
                <Calendar size={14} />
                <span>Applied: {formatDate(application.applied_at)}</span>
              </div>
              {application.updated_at && application.updated_at !== application.applied_at && (
                <div className="meta-item">
                  <Clock size={14} />
                  <span>Last Updated: {formatDate(application.updated_at)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={`application-status ${statusInfo.class}`}>
          {statusInfo.icon}
          <span>{application.status}</span>
        </div>
      </div>
      
      <div className="status-message">
        {statusInfo.message}
      </div>
      
      <div className="application-details-grid">
        <div className="details-card">
          <div className="card-header">
            <h3><User size={18} /> Position Details</h3>
          </div>
          <div className="card-content">
            <div className="detail-row">
              <div className="detail-label">Job Role</div>
              <div className="detail-value">{application.job_role || 'Not specified'}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Department</div>
              <div className="detail-value">{application.department || 'Not specified'}</div>
            </div>
          </div>
        </div>
        
        {application.cover_letter && (
          <div className="details-card">
            <div className="card-header">
              <h3><FileText size={18} /> Cover Letter</h3>
            </div>
            <div className="card-content">
              <div className="cover-letter">
                {application.cover_letter}
              </div>
            </div>
          </div>
        )}
        
        {application.additional_info && (
          <div className="details-card">
            <div className="card-header">
              <h3><FileText size={18} /> Additional Information</h3>
            </div>
            <div className="card-content">
              <div className="additional-info">
                {application.additional_info}
              </div>
            </div>
          </div>
        )}
        
        <div className="details-card">
          <div className="card-header">
            <h3><FileUp size={18} /> Supporting Documents</h3>
          </div>
          <div className="card-content">
            {documents.length > 0 ? (
              <div className="documents-list">
                {documents.map(doc => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <span className="document-name">{doc.description}</span>
                      <span className="document-date">Uploaded: {formatDate(doc.created_at)}</span>
                    </div>
                    <button 
                      className="btn-icon download-btn"
                      onClick={() => downloadDocument(doc.id, doc.description)}
                      title="Download Document"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-documents">
                <p>No supporting documents found for this application.</p>
              </div>
            )}
            
            <div className="upload-more">
              <Link to="/applicant/upload" className="btn-primary">
                Upload More Documents
              </Link>
            </div>
          </div>
        </div>
        
        {(application.evaluation_score || application.fst_score) && (
          <div className="details-card">
            <div className="card-header">
              <h3><CheckCircle size={18} /> Evaluation Results</h3>
            </div>
            <div className="card-content">
              {application.evaluation_score && (
                <div className="detail-row">
                  <div className="detail-label">Evaluation Score</div>
                  <div className="detail-value score">
                    <div className="score-badge">{application.evaluation_score}</div>
                  </div>
                </div>
              )}
              
              {application.fst_score && (
                <div className="detail-row">
                  <div className="detail-label">Field Stress Test (FST) Score</div>
                  <div className="detail-value score">
                    <div className="score-badge">{application.fst_score}</div>
                  </div>
                </div>
              )}
              
              <div className="evaluation-note">
                <AlertTriangle size={16} />
                <p>Note: Evaluation scores are based on multiple factors including your application materials, assessments, and interviews if conducted.</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="application-actions">
        <Link to="/applicant/applications" className="btn-secondary">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
        
        <Link to="/applicant/programs" className="btn-primary">
          <BookOpen size={16} />
          View Programs
        </Link>
      </div>
      
      <div className="application-help">
        <h3>Need Help?</h3>
        <p>If you have any questions about your application status or the recruitment process, please contact our HR department at <a href="mailto:hr@example.com">hr@example.com</a>.</p>
      </div>
    </div>
  );
};

export default ApplicationDetails;