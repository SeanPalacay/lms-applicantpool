import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Calendar, Search, Filter, Clock, 
  CheckCircle, RefreshCw, AlertTriangle, Info
} from 'lucide-react';
import './styles/ApplicantPrograms.css';
import applicantService from '../../../services/applicantService';

const ApplicantPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Fetch programs and existing applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get programs and application data from applicant dashboard
        const dashboardData = await applicantService.getDashboardData();
        
        // Set applications from dashboard data
        setApplications(dashboardData.myApplications || []);
        
        // Get available programs from separate API endpoint
        const programsResponse = await applicantService.getPrograms();
        setPrograms(programsResponse || []);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Filter programs based on search and type
  const getFilteredPrograms = () => {
    return programs.filter(program => {
      // Filter by program type
      if (filterType !== 'all' && program.type !== filterType) {
        return false;
      }
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          program.title.toLowerCase().includes(query) ||
          (program.description && program.description.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  };
  
  // Check if user has already applied to a program
  const hasApplied = (programId) => {
    return applications.some(app => app.program_id === programId);
  };
  
  // Get application status for a program
  const getApplicationStatus = (programId) => {
    const application = applications.find(app => app.program_id === programId);
    return application ? application.status : null;
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
  };
  
  // Retry loading data
  const retryLoading = () => {
    setLoading(true);
    setError(null);
    
    // Re-fetch data on next render cycle
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  if (loading) {
    return (
      <div className="programs-loading">
        <div className="spinner"></div>
        <p>Loading programs...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="programs-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={retryLoading} 
          className="btn-primary retry-btn"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  const filteredPrograms = getFilteredPrograms();
  
  return (
    <div className="applicant-programs-container">
      <div className="programs-header">
        <div className="header-title">
          <h1><BookOpen size={24} /> Available Programs</h1>
          <p>Browse and apply for training programs</p>
        </div>
      </div>
      
      <div className="programs-filters">
        <div className="search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search programs..."
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
        
        <div className="filter-group">
          <div className="filter-label">
            <Filter size={16} />
            <span>Program Type:</span>
          </div>
          
          <div className="filter-options">
            <button 
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterType === 'regular' ? 'active' : ''}`}
              onClick={() => setFilterType('regular')}
            >
              Regular
            </button>
            <button 
              className={`filter-btn ${filterType === 'refresher' ? 'active' : ''}`}
              onClick={() => setFilterType('refresher')}
            >
              Refresher
            </button>
          </div>
        </div>
        
        <button 
          className="btn-secondary reset-filters" 
          onClick={resetFilters}
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>
      
      {filteredPrograms.length === 0 ? (
        <div className="no-programs">
          <AlertTriangle size={48} className="no-data-icon" />
          <h3>No programs found</h3>
          <p>
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters to see more results.'
              : 'There are no programs available at the moment.'}
          </p>
          {(searchQuery || filterType !== 'all') && (
            <button 
              className="btn-primary"
              onClick={resetFilters}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="programs-grid">
          {filteredPrograms.map(program => {
            const applied = hasApplied(program.id);
            const status = getApplicationStatus(program.id);
            
            return (
              <div key={program.id} className="program-card">
                <div className={`program-type ${program.type}`}>
                  {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
                </div>
                
                <div className="program-content">
                  <h3 className="program-title">{program.title}</h3>
                  
                  {program.description && (
                    <p className="program-description">{program.description}</p>
                  )}
                  
                  <div className="program-meta">
                    <div className="meta-item created-date">
                      <Calendar size={14} />
                      <span>Created: {formatDate(program.created_at)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="program-status">
                  {applied ? (
                    <div className={`application-status status-${status}`}>
                      {status === 'pending' && <Clock size={16} />}
                      {status === 'shortlisted' && <CheckCircle size={16} />}
                      {status === 'hired' && <CheckCircle size={16} />}
                      {status === 'rejected' && <AlertTriangle size={16} />}
                      <span>Application {status}</span>
                    </div>
                  ) : (
                    <Link 
                      to={`/applicant/programs/${program.id}/apply`}
                      className="btn-primary apply-btn"
                    >
                      Apply Now
                    </Link>
                  )}
                </div>
                
                {(status === 'shortlisted' || status === 'hired') && (
                  <div className="application-message success">
                    <Info size={16} />
                    <span>You have been {status} for this program!</span>
                  </div>
                )}
                
                {status === 'rejected' && (
                  <div className="application-message error">
                    <Info size={16} />
                    <span>Your application has been rejected.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="programs-info-section">
        <h3>Application Process</h3>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Apply</h4>
              <p>Submit your application for your preferred program</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Review</h4>
              <p>Your application will be reviewed by our team</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Assessment</h4>
              <p>Selected candidates will be invited for further assessment</p>
            </div>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Enrollment</h4>
              <p>Successful candidates will be enrolled in the program</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantPrograms;