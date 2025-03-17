import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Filter, Search, AlertTriangle, RefreshCw,
  Clock, CheckCircle, XCircle, Eye, Calendar, BookOpen
} from 'lucide-react';
import applicantService from '../../../services/applicantService'; // Import the applicant service
import './styles/Applications.css';

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  
  // Fetch applications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        
        // Use the dashboard data to get applications
        const dashboardData = await applicantService.getDashboardData();
        
        // Set applications from dashboard data
        setApplications(dashboardData.myApplications || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again later.');
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);
  
  // Get filtered and sorted applications
  const getFilteredApplications = () => {
    let filtered = [...applications];
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => app.status === filterStatus);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.program_title.toLowerCase().includes(query) ||
        (app.job_role && app.job_role.toLowerCase().includes(query)) ||
        (app.department && app.department.toLowerCase().includes(query))
      );
    }
    
    // Sort applications
    if (sortBy === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
    } else if (sortBy === 'oldest') {
      filtered = filtered.sort((a, b) => new Date(a.applied_at) - new Date(b.applied_at));
    } else if (sortBy === 'program') {
      filtered = filtered.sort((a, b) => a.program_title.localeCompare(b.program_title));
    }
    
    return filtered;
  };
  
  // Get status icon based on application status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} />;
      case 'shortlisted':
        return <CheckCircle size={16} />;
      case 'hired':
        return <CheckCircle size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      default:
        return null;
    }
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSortBy('recent');
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
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
      <div className="applications-loading">
        <div className="spinner"></div>
        <p>Loading applications...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="applications-error">
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
  
  const filteredApplications = getFilteredApplications();
  
  return (
    <div className="applications-container">
      <div className="applications-header">
        <div className="header-title">
          <h1><FileText size={24} /> My Applications</h1>
          <p>Track the status of your program applications</p>
        </div>
        
        <Link 
          to="/applicant/programs" 
          className="btn-primary new-application-btn"
        >
          Apply for New Program
        </Link>
      </div>
      
      <div className="applications-filters">
        <div className="search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search applications..."
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
            <span>Status:</span>
          </div>
          
          <div className="filter-options">
            <button 
              className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              All
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
            >
              <Clock size={14} />
              Pending
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'shortlisted' ? 'active' : ''}`}
              onClick={() => setFilterStatus('shortlisted')}
            >
              <CheckCircle size={14} />
              Shortlisted
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'hired' ? 'active' : ''}`}
              onClick={() => setFilterStatus('hired')}
            >
              <CheckCircle size={14} />
              Hired
            </button>
            <button 
              className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
              onClick={() => setFilterStatus('rejected')}
            >
              <XCircle size={14} />
              Rejected
            </button>
          </div>
        </div>
        
        <div className="sort-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="program">Program Name</option>
          </select>
        </div>
        
        <button 
          className="btn-secondary reset-filters" 
          onClick={resetFilters}
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>
      
      {applications.length === 0 ? (
        <div className="no-applications">
          <FileText size={48} className="no-data-icon" />
          <h3>No applications found</h3>
          <p>You haven't applied to any programs yet.</p>
          <Link 
            to="/applicant/programs" 
            className="btn-primary"
          >
            View Available Programs
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="no-applications">
          <AlertTriangle size={48} className="no-data-icon" />
          <h3>No matching applications</h3>
          <p>No applications match your current filters.</p>
          <button 
            className="btn-primary"
            onClick={resetFilters}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map(application => (
            <div key={application.application_id || application.id} className="application-card">
              <div className="application-status">
                <div className={`status-badge status-${application.status}`}>
                  {getStatusIcon(application.status)}
                  <span>{application.status}</span>
                </div>
              </div>
              
              <div className="application-content">
                <h3 className="program-title">{application.program_title}</h3>
                
                <div className="application-details">
                  {application.job_role && (
                    <div className="detail-item role">
                      <span className="detail-label">Role:</span>
                      <span className="detail-value">{application.job_role}</span>
                    </div>
                  )}
                  
                  {application.department && (
                    <div className="detail-item department">
                      <span className="detail-label">Department:</span>
                      <span className="detail-value">{application.department}</span>
                    </div>
                  )}
                  
                  <div className="detail-item date">
                    <Calendar size={14} />
                    <span className="detail-value">Applied: {formatDate(application.applied_at)}</span>
                  </div>
                  
                  {application.updated_at && application.updated_at !== application.applied_at && (
                    <div className="detail-item update">
                      <Clock size={14} />
                      <span className="detail-value">Updated: {formatDate(application.updated_at)}</span>
                    </div>
                  )}
                </div>
                
                {application.evaluation_score && (
                  <div className="evaluation-score">
                    <span className="score-label">Evaluation Score:</span>
                    <span className="score-value">{application.evaluation_score}</span>
                  </div>
                )}
                
                {application.fst_score && (
                  <div className="fst-score">
                    <span className="score-label">FST Score:</span>
                    <span className="score-value">{application.fst_score}</span>
                  </div>
                )}
              </div>
              
              <div className="application-actions">
                <Link 
                  to={`/applicant/applications/${application.application_id || application.id}`}
                  className="btn-primary view-details-btn"
                >
                  <Eye size={16} />
                  View Details
                </Link>
                
                <Link 
                  to={`/applicant/programs`}
                  className="btn-secondary program-btn"
                >
                  <BookOpen size={16} />
                  Program Info
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="application-status-info">
        <h3>Application Status Guide</h3>
        <div className="status-info-grid">
          <div className="status-info-item">
            <div className="status-badge status-pending">
              <Clock size={16} />
              <span>Pending</span>
            </div>
            <p>Your application is being reviewed by our team.</p>
          </div>
          
          <div className="status-info-item">
            <div className="status-badge status-shortlisted">
              <CheckCircle size={16} />
              <span>Shortlisted</span>
            </div>
            <p>You've been shortlisted and may be contacted for an assessment or interview.</p>
          </div>
          
          <div className="status-info-item">
            <div className="status-badge status-hired">
              <CheckCircle size={16} />
              <span>Hired</span>
            </div>
            <p>Congratulations! You've been selected for the program.</p>
          </div>
          
          <div className="status-info-item">
            <div className="status-badge status-rejected">
              <XCircle size={16} />
              <span>Rejected</span>
            </div>
            <p>Your application was not successful at this time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Applications;