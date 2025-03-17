import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, ArrowLeft, CheckCircle, AlertTriangle,
  RefreshCw, Upload, Send, Loader, Calendar, User
} from 'lucide-react';
import axios from 'axios';
import '../styles/ProgramApplication.css';

const ProgramApplication = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [formData, setFormData] = useState({
    job_role: '',
    department: '',
    cover_letter: '',
    additional_info: ''
  });
  const [documents, setDocuments] = useState([]);
  const [loadingProgram, setLoadingProgram] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  
  // Fetch program details and check for existing application
  useEffect(() => {
    const fetchProgramAndApplication = async () => {
      try {
        setLoadingProgram(true);
        
        // Get program details
        const programResponse = await axios.get(`/api/programs/${programId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        // Check if user already has an application for this program
        const applicationsResponse = await axios.get('/api/applications/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        const existingApplication = applicationsResponse.data.find(
          app => app.program_id === parseInt(programId)
        );
        
        if (existingApplication) {
          setHasExistingApplication(true);
        }
        
        setProgram(programResponse.data);
        setLoadingProgram(false);
      } catch (err) {
        console.error('Error fetching program:', err);
        setError('Failed to load program details. Please try again later.');
        setLoadingProgram(false);
      }
    };

    fetchProgramAndApplication();
  }, [programId]);
  
  // Get existing documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('/api/records/user', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          params: {
            record_type: 'applicant',
            category: 'evaluations'
          }
        });
        
        setDocuments(response.data);
      } catch (err) {
        console.error('Error fetching documents:', err);
      }
    };

    fetchDocuments();
  }, []);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear validation error when field is changed
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type (PDF, DOC, DOCX)
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document.');
      e.target.value = '';
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.');
      e.target.value = '';
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('record_type', 'applicant');
      formData.append('category', 'evaluations');
      formData.append('description', `Document for application - ${file.name}`);
      
      const response = await axios.post('/api/records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Add the new document to the list
      setDocuments([...documents, response.data]);
      
      // Clear the file input
      e.target.value = '';
      
      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document. Please try again.');
    }
  };
  
  // Validate form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.job_role.trim()) {
      errors.job_role = 'Job role is required';
    }
    
    if (!formData.department.trim()) {
      errors.department = 'Department is required';
    }
    
    return errors;
  };
  
  // Submit application
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit application
      await axios.post('/api/applications', {
        program_id: parseInt(programId),
        job_role: formData.job_role,
        department: formData.department,
        cover_letter: formData.cover_letter,
        additional_info: formData.additional_info
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        navigate('/applicant/applications');
      }, 3000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };
  
  if (loadingProgram) {
    return (
      <div className="program-application-loading">
        <div className="spinner"></div>
        <p>Loading program details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="program-application-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={() => navigate('/applicant/programs')} 
          className="btn-primary back-btn"
        >
          <ArrowLeft size={16} />
          Back to Programs
        </button>
      </div>
    );
  }
  
  if (hasExistingApplication) {
    return (
      <div className="existing-application">
        <AlertTriangle size={48} className="warning-icon" />
        <h2>Application Already Exists</h2>
        <p>You have already applied to this program.</p>
        <div className="action-buttons">
          <Link 
            to="/applicant/applications" 
            className="btn-primary"
          >
            View My Applications
          </Link>
          <Link 
            to="/applicant/programs" 
            className="btn-secondary"
          >
            <ArrowLeft size={16} />
            Back to Programs
          </Link>
        </div>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="application-success">
        <CheckCircle size={48} className="success-icon" />
        <h2>Application Submitted!</h2>
        <p>Your application has been successfully submitted for review.</p>
        <p className="redirect-message">You will be redirected to your applications page shortly...</p>
      </div>
    );
  }
  
  return (
    <div className="program-application-container">
      <div className="application-header">
        <Link to="/applicant/programs" className="back-link">
          <ArrowLeft size={16} />
          Back to Programs
        </Link>
        <h1>Apply for Program</h1>
      </div>
      
      <div className="program-overview">
        <div className="program-icon">
          <BookOpen size={32} />
        </div>
        <div className="program-details">
          <h2 className="program-title">{program.title}</h2>
          {program.description && (
            <p className="program-description">{program.description}</p>
          )}
          <div className="program-meta">
            <span className="program-type">
              {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
            </span>
            <span className="program-date">
              <Calendar size={14} />
              Created on {new Date(program.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      
      <div className="application-form-container">
        <h3>Application Form</h3>
        
        <form className="application-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Position Information</h4>
            
            <div className="form-group">
              <label htmlFor="job_role">Job Role *</label>
              <input 
                type="text"
                id="job_role"
                name="job_role"
                placeholder="e.g. Loan Officer, Financial Educator"
                value={formData.job_role}
                onChange={handleInputChange}
                className={formErrors.job_role ? 'error' : ''}
                required
              />
              {formErrors.job_role && (
                <div className="error-message">{formErrors.job_role}</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="department">Department *</label>
              <input 
                type="text"
                id="department"
                name="department"
                placeholder="e.g. Operations, Training"
                value={formData.department}
                onChange={handleInputChange}
                className={formErrors.department ? 'error' : ''}
                required
              />
              {formErrors.department && (
                <div className="error-message">{formErrors.department}</div>
              )}
            </div>
          </div>
          
          <div className="form-section">
            <h4>Cover Letter</h4>
            
            <div className="form-group">
              <label htmlFor="cover_letter">Cover Letter</label>
              <textarea 
                id="cover_letter"
                name="cover_letter"
                placeholder="Briefly explain why you're applying for this program and what makes you a good candidate."
                value={formData.cover_letter}
                onChange={handleInputChange}
                rows="6"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h4>Additional Information</h4>
            
            <div className="form-group">
              <label htmlFor="additional_info">Additional Information (Optional)</label>
              <textarea 
                id="additional_info"
                name="additional_info"
                placeholder="Include any additional information that may support your application."
                value={formData.additional_info}
                onChange={handleInputChange}
                rows="4"
              />
            </div>
          </div>
          
          <div className="form-section">
            <h4>Supporting Documents</h4>
            
            <div className="document-upload">
              <div className="upload-button">
                <label htmlFor="document-upload" className="btn-upload">
                  <Upload size={16} />
                  Upload Document
                </label>
                <input 
                  type="file" 
                  id="document-upload" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="upload-help">
                <p>Upload a resume, CV, or other supporting document (PDF or Word, max 5MB)</p>
              </div>
            </div>
            
            {documents.length > 0 && (
              <div className="uploaded-documents">
                <h5>Your Documents</h5>
                <ul className="document-list">
                  {documents.map(doc => (
                    <li key={doc.id} className="document-item">
                      <span className="document-name">{doc.description}</span>
                      <span className="document-date">
                        Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/applicant/programs')}
              disabled={submitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              className="btn-primary submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <><Loader size={16} className="spinner-icon" /> Submitting...</>
              ) : (
                <><Send size={16} /> Submit Application</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProgramApplication;