import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Building, 
    Briefcase, 
    FileText, 
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader,
    Info,
    Users,
    BookOpen
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const ApplicationForm = () => {
    const { roleId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [jobRole, setJobRole] = useState(null);
    const [formData, setFormData] = useState({
        reasons: '',
        experience: '',
        skills: '',
        education: '',
        availability: '',
        references: ''
    });
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        const fetchJobRole = async () => {
            try {
                setLoading(true);
                const roleData = await applicantService.getJobRoleById(roleId);
                setJobRole(roleData);
            } catch (err) {
                console.error('Error fetching job role:', err);
                setError('Failed to load job role information. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchJobRole();
    }, [roleId]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        
        // Clear error for this field when user types
        if (formErrors[name]) {
            setFormErrors({
                ...formErrors,
                [name]: null
            });
        }
    };

    const validateForm = () => {
        const errors = {};
        
        // Validate required fields
        if (!formData.reasons || formData.reasons.trim() === '') {
            errors.reasons = 'Please explain why you are interested in this position';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validate form before submitting
        if (!validateForm()) {
            return;
        }
        
        setSubmitting(true);
        setError(null);
        
        try {
            // Submit the application
            const userId = localStorage.getItem('userId');
            const applicationData = {
                position_id: roleId,
                user_id: userId,
                reasons: formData.reasons,
                experience: formData.experience,
                skills: formData.skills,
                education: formData.education,
                availability: formData.availability,
                references: formData.references
            };
            
            console.log('Submitting application data:', applicationData);
            const response = await applicantService.submitApplication(applicationData);
            
            console.log('Application submitted successfully:', response);
            setSuccess(true);
            
            // Clear form data
            setFormData({
                reasons: '',
                experience: '',
                skills: '',
                education: '',
                availability: '',
                references: ''
            });
            
        } catch (err) {
            console.error('Error submitting application:', err);
            setError('Failed to submit application: ' + (err.message || 'Please try again later.'));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    
    if (error && !jobRole) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px' }}>
                <AlertBanner type="error" message={error} />
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    marginTop: '32px' 
                }}>
                    <AlertTriangle size={48} style={{ color: '#e74c3c', marginBottom: '16px' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>Job Not Found</h2>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>The job role you're looking for doesn't exist or was removed.</p>
                    <Link
                        to="/applicant/job-roles"
                        style={{
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
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Job Roles
                    </Link>
                </div>
            </div>
        );
    }
    
    if (success) {
        return (
            <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px' }}>
                <div style={{ 
                    maxWidth: '800px', 
                    margin: '0 auto', 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    padding: '32px',
                    textAlign: 'center'
                }}>
                    <div style={{ 
                        width: '72px', 
                        height: '72px', 
                        borderRadius: '50%', 
                        backgroundColor: '#e6ffe6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px auto'
                    }}>
                        <CheckCircle size={36} style={{ color: '#2ecc71' }} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 16px 0' }}>Application Submitted Successfully!</h2>
                    <p style={{ fontSize: '1rem', color: '#64748b', margin: '0 0 32px 0', maxWidth: '500px', margin: '0 auto 32px auto' }}>
                        Your application for <strong>{jobRole.title}</strong> has been submitted successfully. 
                        You can track the status of your application in your dashboard.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                        <Link
                            to="/applicant/applications"
                            style={{
                                backgroundColor: '#1E88E5',
                                color: '#ffffff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.875rem'
                            }}
                        >
                            <FileText size={16} /> View My Applications
                        </Link>
                        <Link
                            to="/applicant/dashboard"
                            style={{
                                backgroundColor: '#ffffff',
                                color: '#1E88E5',
                                padding: '10px 20px',
                                border: '1px solid #1E88E5',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '0.875rem'
                            }}
                        >
                            Go to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px' }}>
            {error && <AlertBanner type="error" message={error} />}
            
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ marginBottom: '24px' }}>
                    <button
                        onClick={() => navigate('/applicant/job-roles')}
                        style={{
                            background: 'none',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: '#64748b',
                            cursor: 'pointer',
                            marginBottom: '16px',
                            fontSize: '14px'
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Job Roles
                    </button>
                    
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>
                        Apply for {jobRole.title}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#64748b' }}>
                        <Building size={16} />
                        <span>Department: {jobRole.department}</span>
                    </div>
                </div>

                <div style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Info size={20} style={{ color: '#1E88E5' }} />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                            Job Information
                        </h2>
                    </div>
                    
                    <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                        {jobRole.description}
                    </p>
                    
                    <div style={{ display: 'grid', gap: '24px' }}>
                        {jobRole.requirements && jobRole.requirements.length > 0 && (
                            <div>
                                <h3 style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 600, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    margin: '0 0 8px 0' 
                                }}>
                                    <Users size={18} /> Requirements:
                                </h3>
                                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                                    {jobRole.requirements.map((req, index) => (
                                        <li key={index} style={{ marginBottom: '4px' }}>{req}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        
                        {jobRole.responsibilities && jobRole.responsibilities.length > 0 && (
                            <div>
                                <h3 style={{ 
                                    fontSize: '1rem', 
                                    fontWeight: 600, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px', 
                                    margin: '0 0 8px 0' 
                                }}>
                                    <BookOpen size={18} /> Responsibilities:
                                </h3>
                                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                                    {jobRole.responsibilities.map((resp, index) => (
                                        <li key={index} style={{ marginBottom: '4px' }}>{resp}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                    padding: '24px',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <FileText size={20} style={{ color: '#1E88E5' }} />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
                            Application Form
                        </h2>
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label 
                            htmlFor="reasons" 
                            style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}
                        >
                            Why are you interested in this position? *
                        </label>
                        <textarea
                            id="reasons"
                            name="reasons"
                            value={formData.reasons}
                            onChange={handleInputChange}
                            required
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: formErrors.reasons ? '1px solid #e74c3c' : '1px solid #e2e8f0',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                            placeholder="Describe why you're interested in this position and why you would be a good fit..."
                        />
                        {formErrors.reasons && (
                            <p style={{ color: '#e74c3c', fontSize: '0.75rem', marginTop: '4px' }}>
                                {formErrors.reasons}
                            </p>
                        )}
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label 
                            htmlFor="experience" 
                            style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}
                        >
                            Relevant Experience
                        </label>
                        <textarea
                            id="experience"
                            name="experience"
                            value={formData.experience}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                            placeholder="Describe your relevant work experience..."
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label 
                            htmlFor="skills" 
                            style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}
                        >
                            Skills & Qualifications
                        </label>
                        <textarea
                            id="skills"
                            name="skills"
                            value={formData.skills}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                            placeholder="List your relevant skills and qualifications..."
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label 
                            htmlFor="education" 
                            style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}
                        >
                            Education Background
                        </label>
                        <textarea
                            id="education"
                            name="education"
                            value={formData.education}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                            placeholder="Describe your educational background..."
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label 
                            htmlFor="availability" 
                            style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}
                        >
                            Availability & Start Date
                        </label>
                        <textarea
                            id="availability"
                            name="availability"
                            value={formData.availability}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                            placeholder="Indicate your availability and earliest start date..."
                        />
                    </div>
                    
                    <div style={{ marginBottom: '20px' }}>
                        <label 
                            htmlFor="references" 
                            style={{ 
                                display: 'block',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                marginBottom: '8px'
                            }}
                        >
                            References (Optional)
                        </label>
                        <textarea
                            id="references"
                            name="references"
                            value={formData.references}
                            onChange={handleInputChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                minHeight: '100px',
                                fontSize: '0.875rem',
                                resize: 'vertical'
                            }}
                            placeholder="Provide references if available..."
                        />
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '24px'
                    }}>
                        <button
                            type="button"
                            onClick={() => navigate('/applicant/job-roles')}
                            style={{
                                backgroundColor: '#ffffff',
                                color: '#64748b',
                                padding: '10px 20px',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <XCircle size={16} /> Cancel
                        </button>
                        
                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                backgroundColor: '#1E88E5',
                                color: '#ffffff',
                                padding: '10px 20px',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                fontSize: '0.875rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? (
                                <>
                                    <Loader size={16} className="animate-spin" /> Submitting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={16} /> Submit Application
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ApplicationForm;