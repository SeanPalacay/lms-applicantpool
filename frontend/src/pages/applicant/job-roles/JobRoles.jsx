import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Search, AlertTriangle, RefreshCw,
  BookOpen, Users, CheckCircle, DollarSign, BookMarked
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner'; // Assuming this exists
import AlertBanner from '../../../components/shared/AlertBanner'; // Assuming this exists

const JobRoles = () => {
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        setLoading(true);
        const data = await applicantService.getJobRoles();
        setJobRoles(data || []);
      } catch (err) {
        console.error('Error fetching job roles:', err);
        setError('Failed to load job roles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchJobRoles();
  }, []);

  const getFilteredJobRoles = () => {
    if (!searchQuery) return jobRoles;
    const query = searchQuery.toLowerCase();
    return jobRoles.filter(role => 
      role.title.toLowerCase().includes(query) ||
      role.department.toLowerCase().includes(query) ||
      (role.description && role.description.toLowerCase().includes(query))
    );
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => window.location.reload(), 100);
  };

  if (loading) return <LoadingSpinner />;

  if (error) return (
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
      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: '0 0 8px 0' }}>Error</h2>
      <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>{error}</p>
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
    </div>
  );

  const filteredJobRoles = getFilteredJobRoles();
  const sampleJobRoles = [
    {
      id: 1,
      title: 'Loan Officer',
      department: 'Operations',
      description: 'Evaluate loan applications, ensure compliance with lending policies, and provide excellent customer service.',
      requirements: [
        "Bachelor's degree in Finance, Business, or related field",
        'Strong analytical and decision-making skills',
        'Excellent communication and interpersonal abilities',
        'Knowledge of lending regulations and compliance requirements'
      ],
      responsibilities: [
        'Process and evaluate loan applications',
        'Conduct financial analysis and risk assessment',
        'Ensure compliance with lending policies and regulations',
        'Build and maintain client relationships',
        'Document and maintain accurate records'
      ],
      programs: ['Loan Officer Basics', 'Advanced Loan Training']
    },
    {
      id: 2,
      title: 'Financial Educator',
      department: 'Training',
      description: 'Develop and deliver financial literacy training programs to clients and community members.',
      requirements: [
        "Bachelor's degree in Education, Finance, or related field",
        'Teaching or training experience',
        'Strong presentation and public speaking skills',
        'Knowledge of personal finance and financial literacy concepts'
      ],
      responsibilities: [
        'Develop financial literacy curriculum and training materials',
        'Conduct workshops and training sessions',
        'Assess learning outcomes and program effectiveness',
        'Stay updated on financial education best practices',
        'Collaborate with community organizations'
      ],
      programs: ['Policy Refresher 2025']
    },
    {
      id: 3,
      title: 'Credit Analyst',
      department: 'Risk Management',
      description: 'Analyze financial data to assess credit risk and make recommendations on loan approvals.',
      requirements: [
        "Bachelor's degree in Finance, Accounting, or related field",
        'Strong analytical and quantitative skills',
        'Proficiency in financial analysis software',
        'Knowledge of credit risk assessment methodologies'
      ],
      responsibilities: [
        'Evaluate creditworthiness of loan applicants',
        'Analyze financial statements and credit reports',
        'Assess collateral values and loan security',
        'Prepare credit risk reports and recommendations',
        'Monitor and review existing loan portfolios'
      ],
      programs: ['Advanced Loan Training']
    }
  ];

  const displayJobRoles = jobRoles.length === 0 ? sampleJobRoles : filteredJobRoles;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ marginBottom: '8px' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Briefcase size={24} style={{ color: '#1E88E5' }} /> Job Roles
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '4px 0 0 0' }}>
            Explore available job roles and their requirements
          </p>
        </div>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      <div style={{ marginBottom: '24px', maxWidth: '600px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search job roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              outline: 'none',
              ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                fontSize: '1rem',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {displayJobRoles.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          textAlign: 'center'
        }}>
          <AlertTriangle size={48} style={{ color: '#f39c12', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>No job roles found</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>
            {searchQuery ? 'Try adjusting your search to see more results.' : 'There are no job roles available at the moment.'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {displayJobRoles.map(role => (
            <div key={role.id} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              padding: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{role.title}</h2>
                  <span style={{
                    backgroundColor: '#E3F2FD',
                    color: '#1E88E5',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>{role.department}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0', lineHeight: '1.5' }}>{role.description}</p>

              <div style={{ display: 'grid', gap: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                    <Users size={18} /> Requirements
                  </h3>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                    {role.requirements.map((req, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{req}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                    <CheckCircle size={18} /> Responsibilities
                  </h3>
                  <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                    {role.responsibilities.map((resp, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>{resp}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                    <BookOpen size={18} /> Related Programs
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.875rem', color: '#1e293b' }}>
                    {role.programs.map((program, index) => (
                      <li key={index} style={{ backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', marginBottom: '4px' }}>{program}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={{ marginTop: '24px', textAlign: 'right' }}>
                <Link
                  to="/applicant/programs"
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
                  View Related Programs
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1200px', margin: '48px auto 0' }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px',
          display: 'flex',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '12px', borderRadius: '9999px', color: '#1E88E5' }}>
            <BookMarked size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px 0' }}>Training Path</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              Each job role has specific training programs that will prepare you for the position. Complete these programs to increase your chances of success.
            </p>
          </div>
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px',
          display: 'flex',
          gap: '16px'
        }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '12px', borderRadius: '9999px', color: '#1E88E5' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: '0 0 8px 0' }}>Career Growth</h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
              We offer clear career progression paths with opportunities for advancement and professional development.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRoles;