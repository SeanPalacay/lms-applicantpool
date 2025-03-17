import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Search, AlertTriangle, RefreshCw,
  BookOpen, Users, CheckCircle, DollarSign, BookMarked
} from 'lucide-react';
import './styles/JobRoles.css';
import applicantService from '../../../services/applicantService'; // Import the applicant service

const JobRoles = () => {
  const [jobRoles, setJobRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch job roles
  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        setLoading(true);
        
        // Use applicantService to fetch job roles instead of axios
        const data = await applicantService.getJobRoles();
        
        setJobRoles(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching job roles:', err);
        setError('Failed to load job roles. Please try again later.');
        setLoading(false);
      }
    };

    fetchJobRoles();
  }, []);
  
  // Filter job roles based on search
  const getFilteredJobRoles = () => {
    if (!searchQuery) return jobRoles;
    
    const query = searchQuery.toLowerCase();
    return jobRoles.filter(role => 
      role.title.toLowerCase().includes(query) ||
      role.department.toLowerCase().includes(query) ||
      (role.description && role.description.toLowerCase().includes(query))
    );
  };
  
  // Retry loading
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Re-fetch data on next render cycle
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  if (loading) {
    return (
      <div className="job-roles-loading">
        <div className="spinner"></div>
        <p>Loading job roles...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="job-roles-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={handleRetry} 
          className="btn-primary retry-btn"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  const filteredJobRoles = getFilteredJobRoles();
  
  // If no actual job roles data is available, use sample data
  if (jobRoles.length === 0) {
    // Sample data for job roles
    const sampleJobRoles = [
      {
        id: 1,
        title: 'Loan Officer',
        department: 'Operations',
        description: 'Evaluate loan applications, ensure compliance with lending policies, and provide excellent customer service.',
        requirements: [
          'Bachelor\'s degree in Finance, Business, or related field',
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
          'Bachelor\'s degree in Education, Finance, or related field',
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
          'Bachelor\'s degree in Finance, Accounting, or related field',
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
    
    return (
      <div className="job-roles-container">
        <div className="job-roles-header">
          <div className="header-title">
            <h1><Briefcase size={24} /> Job Roles</h1>
            <p>Explore available job roles and their requirements</p>
          </div>
        </div>
        
        <div className="search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search job roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={() => setSearchQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        <div className="job-roles-list">
          {sampleJobRoles.map(role => (
            <div key={role.id} className="job-role-card">
              <div className="job-role-header">
                <div className="job-role-title">
                  <h2>{role.title}</h2>
                  <span className="department-badge">{role.department}</span>
                </div>
              </div>
              
              <p className="job-role-description">{role.description}</p>
              
              <div className="job-role-details">
                <div className="detail-section">
                  <h3><Users size={18} /> Requirements</h3>
                  <ul className="detail-list">
                    {role.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h3><CheckCircle size={18} /> Responsibilities</h3>
                  <ul className="detail-list">
                    {role.responsibilities.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h3><BookOpen size={18} /> Related Programs</h3>
                  <ul className="programs-list">
                    {role.programs.map((program, index) => (
                      <li key={index} className="program-item">{program}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="job-role-footer">
                <Link to="/applicant/programs" className="btn-primary">
                  View Related Programs
                </Link>
              </div>
            </div>
          ))}
        </div>
        
        <div className="job-roles-info">
          <div className="info-card">
            <div className="info-icon">
              <BookMarked size={24} />
            </div>
            <div className="info-content">
              <h3>Training Path</h3>
              <p>Each job role has specific training programs that will prepare you for the position. Complete these programs to increase your chances of success.</p>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">
              <DollarSign size={24} />
            </div>
            <div className="info-content">
              <h3>Career Growth</h3>
              <p>We offer clear career progression paths with opportunities for advancement and professional development.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="job-roles-container">
      <div className="job-roles-header">
        <div className="header-title">
          <h1><Briefcase size={24} /> Job Roles</h1>
          <p>Explore available job roles and their requirements</p>
        </div>
      </div>
      
      <div className="search-filter">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search job roles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button 
              className="clear-search" 
              onClick={() => setSearchQuery('')}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      {filteredJobRoles.length === 0 ? (
        <div className="no-job-roles">
          <AlertTriangle size={48} className="no-data-icon" />
          <h3>No job roles found</h3>
          <p>
            {searchQuery
              ? 'Try adjusting your search to see more results.'
              : 'There are no job roles available at the moment.'}
          </p>
          {searchQuery && (
            <button 
              className="btn-primary"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="job-roles-list">
          {filteredJobRoles.map(role => (
            <div key={role.id} className="job-role-card">
              <div className="job-role-header">
                <div className="job-role-title">
                  <h2>{role.title}</h2>
                  <span className="department-badge">{role.department}</span>
                </div>
              </div>
              
              <p className="job-role-description">{role.description}</p>
              
              <div className="job-role-details">
                <div className="detail-section">
                  <h3><Users size={18} /> Requirements</h3>
                  <ul className="detail-list">
                    {role.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h3><CheckCircle size={18} /> Responsibilities</h3>
                  <ul className="detail-list">
                    {role.responsibilities.map((resp, index) => (
                      <li key={index}>{resp}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="detail-section">
                  <h3><BookOpen size={18} /> Related Programs</h3>
                  <ul className="programs-list">
                    {role.programs.map((program, index) => (
                      <li key={index} className="program-item">{program}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="job-role-footer">
                <Link to="/applicant/programs" className="btn-primary">
                  View Related Programs
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="job-roles-info">
        <div className="info-card">
          <div className="info-icon">
            <BookMarked size={24} />
          </div>
          <div className="info-content">
            <h3>Training Path</h3>
            <p>Each job role has specific training programs that will prepare you for the position. Complete these programs to increase your chances of success.</p>
          </div>
        </div>
        
        <div className="info-card">
          <div className="info-icon">
            <DollarSign size={24} />
          </div>
          <div className="info-content">
            <h3>Career Growth</h3>
            <p>We offer clear career progression paths with opportunities for advancement and professional development.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobRoles;