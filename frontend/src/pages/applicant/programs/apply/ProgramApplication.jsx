import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, ArrowLeft, CheckCircle, AlertTriangle,
  RefreshCw, Upload, Send, Loader, Calendar, User, Briefcase, Building
} from 'lucide-react';
import applicantService from '../../../../services/applicantService';

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
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  
  // Fetch program, departments, and check for existing applications
  useEffect(() => {
    const fetchProgramAndData = async () => {
      try {
        setLoadingProgram(true);
        
        // Fetch the program list
        const programs = await applicantService.getPrograms();
        const program = programs.find(p => p.id === parseInt(programId));
        
        if (!program) {
          throw new Error('Program not found');
        }
        
        setProgram(program);
        
        // Fetch departments
        const depts = await applicantService.getDepartments();
        setDepartments(depts);
        
        try {
          // Check if user already applied to this program
          const applications = await fetch(
            `/lms-forbes/backend/api/applicant/applications.php`, 
            {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
              }
            }
          );
          
          if (applications.ok) {
            const applicationsData = await applications.json();
            
            // Check if user already applied to this program
            const existingApp = applicationsData.find(
              app => app.program_id === parseInt(programId)
            );
            
            if (existingApp) {
              setHasExistingApplication(true);
            }
          }
        } catch (appError) {
          console.error('Error checking existing applications:', appError);
          // Continue without setting hasExistingApplication
        }
        
        setLoadingProgram(false);
      } catch (err) {
        console.error('Error fetching program:', err);
        setError('Failed to load program details. Please try again later.');
        setLoadingProgram(false);
      }
    };

    fetchProgramAndData();
  }, [programId]);
  
  // Fetch user documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await applicantService.getUserDocuments();
        setDocuments(docs || []);
      } catch (err) {
        console.error('Error fetching documents:', err);
        // Continue without documents
      }
    };

    fetchDocuments();
  }, []);
  
  // Fetch positions when department changes
  useEffect(() => {
    const fetchPositions = async () => {
      if (!selectedDepartment) return;
      
      try {
        const positionData = await applicantService.getPositionsByDepartment(selectedDepartment);
        setPositions(positionData);
      } catch (err) {
        console.error('Error fetching positions:', err);
        // Set positions to empty array if there was an error
        setPositions([]);
      }
    };
    
    fetchPositions();
  }, [selectedDepartment]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'department') {
      setSelectedDepartment(value);
      // Reset job role when department changes
      setFormData({
        ...formData,
        department: value,
        job_role: ''
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
    
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document.');
      e.target.value = '';
      return;
    }
    
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
      
      // Use the service's upload method with progress tracking
      const response = await applicantService.uploadDocument(formData, (progress) => {
        console.log(`Upload progress: ${progress}%`);
      });
      
      setDocuments([...documents, response]);
      e.target.value = '';
      alert('Document uploaded successfully!');
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document. Please try again.');
    }
  };
  
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Submit application directly to the API endpoint
      const response = await fetch('/lms-forbes/backend/api/applicant/applications.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          program_id: parseInt(programId),
          job_role: formData.job_role,
          department: formData.department,
          cover_letter: formData.cover_letter,
          additional_info: formData.additional_info
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit application');
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/applicant/applications');
      }, 3000);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };
  
  if (loadingProgram) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Loading program details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger-color)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Error</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={() => navigate('/applicant/programs')} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <ArrowLeft size={16} />
          Back to Programs
        </button>
      </div>
    );
  }
  
  if (hasExistingApplication) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--warning-color)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Application Already Exists</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>You have already applied to this program.</p>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link 
            to="/applicant/applications" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: '500' 
            }}
          >
            View My Applications
          </Link>
          <Link 
            to="/applicant/programs" 
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--medium-gray)', 
              color: 'var(--text-primary)', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
      <CheckCircle size={48} style={{ color: 'var(--success-color)', marginBottom: '16px' }} />
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Application Submitted!</h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Your application has been successfully submitted for review.</p>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>You will be redirected to your applications page shortly...</p>
    </div>
  );
}

return (
  <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
    <div style={{ marginBottom: '24px' }}>
      <Link 
        to="/applicant/programs" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: 'var(--primary-color)', 
          textDecoration: 'none', 
          fontSize: '14px', 
          marginBottom: '16px' 
        }}
      >
        <ArrowLeft size={16} />
        Back to Programs
      </Link>
      <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Apply for Program</h1>
    </div>
    
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)', padding: '24px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: '8px', 
          backgroundColor: 'var(--primary-ultralight)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <BookOpen size={24} color="var(--primary-color)" />
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>{program.title}</h2>
          {program.description && (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{program.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span style={{ 
              padding: '4px 8px', 
              borderRadius: '4px', 
              backgroundColor: program.type === 'regular' ? 'var(--primary-ultralight)' : 'var(--info-color)', 
              color: program.type === 'regular' ? 'var(--primary-color)' : 'white', 
              fontSize: '12px', 
              fontWeight: '500' 
            }}>
              {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <Calendar size={12} />
              Created on {new Date(program.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
    
    <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
      <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>Application Form</h3>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Position Information</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="department" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
              Department *
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <select 
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                style={{ 
                  width: '100%', 
                  padding: '8px 16px 8px 36px', 
                  borderRadius: '4px', 
                  border: `1px solid ${formErrors.department ? 'var(--danger-color)' : 'var(--medium-gray)'}`, 
                  backgroundColor: 'white', 
                  fontSize: '14px', 
                  color: 'var(--text-primary)' 
                }}
                required
              >
                <option value="">Select a department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            {formErrors.department && (
              <div style={{ fontSize: '12px', color: 'var(--danger-color)', marginTop: '4px' }}>{formErrors.department}</div>
            )}
          </div>
          
          {formData.department && (
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="job_role" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Job Role *
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <select 
                  id="job_role"
                  name="job_role"
                  value={formData.job_role}
                  onChange={handleInputChange}
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px 8px 36px', 
                    borderRadius: '4px', 
                    border: `1px solid ${formErrors.job_role ? 'var(--danger-color)' : 'var(--medium-gray)'}`, 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                >
                  <option value="">Select a position</option>
                  {positions.map((position, index) => (
                    <option key={index} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              {formErrors.job_role && (
                <div style={{ fontSize: '12px', color: 'var(--danger-color)', marginTop: '4px' }}>{formErrors.job_role}</div>
              )}
            </div>
          )}
        </div>
        
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Cover Letter</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="cover_letter" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Cover Letter</label>
            <textarea 
              id="cover_letter"
              name="cover_letter"
              placeholder="Briefly explain why you're applying for this program and what makes you a good candidate."
              value={formData.cover_letter}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                border: '1px solid var(--medium-gray)', 
                backgroundColor: 'white', 
                fontSize: '14px', 
                color: 'var(--text-primary)', 
                minHeight: '150px' 
              }}
            />
          </div>
        </div>
        
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Additional Information</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="additional_info" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Additional Information (Optional)</label>
            <textarea 
              id="additional_info"
              name="additional_info"
              placeholder="Include any additional information that may support your application."
              value={formData.additional_info}
              onChange={handleInputChange}
              style={{ 
                width: '100%', 
                padding: '8px 16px', 
                borderRadius: '4px', 
                border: '1px solid var(--medium-gray)', 
                backgroundColor: 'white', 
                fontSize: '14px', 
                color: 'var(--text-primary)', 
                minHeight: '100px' 
              }}
            />
          </div>
        </div>
        
        <div>
          <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Supporting Documents</h4>
          
          <div style={{ marginBottom: '16px' }}>
            <label 
              htmlFor="document-upload" 
              style={{ 
                padding: '8px 16px', 
                borderRadius: '4px', 
                backgroundColor: 'var(--primary-color)', 
                color: 'white', 
                cursor: 'pointer', 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '14px', 
                fontWeight: '500' 
              }}
            >
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
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Upload a resume, CV, or other supporting document (PDF or Word, max 5MB)</p>
          </div>
          
          {documents.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Your Documents</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {documents.map(doc => (
                  <li key={doc.id} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{doc.description}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Uploaded on {new Date(doc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/applicant/programs')}
            disabled={submitting}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--medium-gray)', 
              color: 'var(--text-primary)', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: '500' 
            }}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={submitting}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              border: 'none', 
              cursor: 'pointer', 
              fontSize: '14px', 
              fontWeight: '500', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}
          >
            {submitting ? (
              <><Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
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