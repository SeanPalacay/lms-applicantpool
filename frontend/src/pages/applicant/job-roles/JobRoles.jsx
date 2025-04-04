import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Briefcase, Search, AlertTriangle, RefreshCw,
  BookOpen, Users, CheckCircle, Clock, 
  Filter, X, AlertCircle
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const JobRoles = () => {
  const [jobRoles, setJobRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userApplications, setUserApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch job roles
        const data = await applicantService.getJobRoles();
        setJobRoles(data || []);
        
        // Extract unique departments
        if (data && data.length > 0) {
          const uniqueDepartments = [...new Set(data.map(role => role.department))];
          setDepartments(uniqueDepartments.sort());
        }
        
        // Fetch user's submitted applications to check for duplicates
        try {
          setLoadingApplications(true);
          const applicationsData = await applicantService.getUserApplications();
          setUserApplications(applicationsData || []);
        } catch (appErr) {
          console.error('Error fetching user applications:', appErr);
          // Don't fail the whole component if just this part fails
        } finally {
          setLoadingApplications(false);
        }
      } catch (err) {
        console.error('Error fetching job roles:', err);
        setError('Failed to load job roles. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Check if user has already applied for a specific position
  const getApplicationStatus = (positionId) => {
    if (!userApplications || userApplications.length === 0) return null;
    
    const existingApplication = userApplications.find(app => 
      app.position_id === positionId || 
      app.position_id === String(positionId)
    );
    
    return existingApplication || null;
  };

  const getFilteredJobRoles = () => {
    if (!searchQuery && !selectedDepartment) return jobRoles;
    
    return jobRoles.filter(role => {
      // Apply department filter
      if (selectedDepartment && role.department !== selectedDepartment) {
        return false;
      }
      
      // Apply search filter if there's a query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          (role.title || '').toLowerCase().includes(query) ||
          (role.department || '').toLowerCase().includes(query) ||
          (role.description && role.description.toLowerCase().includes(query))
        );
      }
      
      return true;
    });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('');
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
          transition: 'background-color 0.3s ease'
        }}
      >
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const filteredJobRoles = getFilteredJobRoles();
  const isFiltered = searchQuery || selectedDepartment;

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

      <div style={{ marginBottom: '24px', maxWidth: '100%' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '16px',
          background: '#ffffff',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {/* Search and filter toggle row */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
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
                  outline: 'none'
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

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: showFilters ? '#E3F2FD' : '#ffffff',
                color: '#1E88E5',
                border: '1px solid #1E88E5',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              <Filter size={16} /> Filters
            </button>

            {isFiltered && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <X size={16} /> Clear Filters
              </button>
            )}
          </div>

          {/* Department filter options */}
          {showFilters && (
            <div style={{ 
              padding: '12px 0', 
              borderTop: '1px solid #e2e8f0'
            }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>Filter by Department</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button
                  onClick={() => setSelectedDepartment('')}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: selectedDepartment === '' ? '#E3F2FD' : '#f8fafc',
                    color: selectedDepartment === '' ? '#1E88E5' : '#64748b',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: selectedDepartment === '' ? 600 : 400
                  }}
                >
                  All Departments
                </button>
                
                {departments.map(dept => (
                  <button
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: selectedDepartment === dept ? '#E3F2FD' : '#f8fafc',
                      color: selectedDepartment === dept ? '#1E88E5' : '#64748b',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      fontWeight: selectedDepartment === dept ? 600 : 400
                    }}
                  >
                    {dept}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Filter stats */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            <p style={{ margin: 0 }}>
              {filteredJobRoles.length} {filteredJobRoles.length === 1 ? 'position' : 'positions'} found
              {selectedDepartment && ` in ${selectedDepartment}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
            
            {loadingApplications && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#1E88E5', animation: 'spin 1s linear infinite' }}></div>
                <span>Loading application status...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {filteredJobRoles.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
          textAlign: 'center',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        }}>
          <AlertTriangle size={48} style={{ color: '#f39c12', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>No job roles found</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>
            {isFiltered ? 'Try adjusting your filters to see more results.' : 'There are no job roles available at the moment.'}
          </p>
          {isFiltered && (
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease'
              }}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {filteredJobRoles.map(role => {
            // Check if user has already applied for this position
            const existingApplication = getApplicationStatus(role.id);
            const hasApplied = !!existingApplication;
            const applicationStatus = hasApplied ? (existingApplication.status || 'pending') : null;
            
            return (
              <div key={role.id} style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                padding: '24px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>{role.title || role.position_name}</h2>
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
                      {role.requirements && role.requirements.length > 0 ? (
                        role.requirements.map((req, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{req}</li>
                        ))
                      ) : (
                        <li style={{ marginBottom: '4px' }}>No specific requirements listed</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 8px 0' }}>
                      <BookOpen size={18} /> Responsibilities
                    </h3>
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '0', fontSize: '0.875rem', color: '#1e293b' }}>
                      {role.responsibilities && role.responsibilities.length > 0 ? (
                        role.responsibilities.map((resp, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>{resp}</li>
                        ))
                      ) : (
                        <li style={{ marginBottom: '4px' }}>No specific responsibilities listed</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Application status and apply button */}
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {hasApplied ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px 16px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {applicationStatus === 'pending' && (
                        <>
                          <Clock size={16} color="#f59e0b" />
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Already Applied - <span style={{ color: '#f59e0b', fontWeight: 500 }}>Pending Review</span>
                          </span>
                        </>
                      )}
                      {applicationStatus === 'shortlisted' && (
                        <>
                          <CheckCircle size={16} color="#10b981" />
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Already Applied - <span style={{ color: '#10b981', fontWeight: 500 }}>Shortlisted</span>
                          </span>
                        </>
                      )}
                      {applicationStatus === 'hired' && (
                        <>
                          <CheckCircle size={16} color="#10b981" />
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Already Applied - <span style={{ color: '#10b981', fontWeight: 500 }}>Hired</span>
                          </span>
                        </>
                      )}
                      {applicationStatus === 'rejected' && (
                        <>
                          <AlertCircle size={16} color="#ef4444" />
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Already Applied - <span style={{ color: '#ef4444', fontWeight: 500 }}>Not Selected</span>
                          </span>
                        </>
                      )}
                      {(applicationStatus !== 'pending' && 
                        applicationStatus !== 'shortlisted' && 
                        applicationStatus !== 'hired' && 
                        applicationStatus !== 'rejected') && (
                        <>
                          <CheckCircle size={16} color="#3b82f6" />
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            Already Applied - {applicationStatus.charAt(0).toUpperCase() + applicationStatus.slice(1)}
                          </span>
                        </>
                      )}
                      
                      <Link
                        to={`/applicant/applications/${existingApplication.id}`}
                        style={{
                          marginLeft: '8px',
                          textDecoration: 'none',
                          color: '#1E88E5',
                          fontSize: '0.75rem',
                          fontWeight: 500
                        }}
                      >
                        View Application
                      </Link>
                    </div>
                  ) : (
                    <Link
                      to={`/applicant/apply/${role.id}`}
                      style={{
                        backgroundColor: '#1E88E5',
                        color: '#ffffff',
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Briefcase size={16} /> Apply for this Position
                    </Link>
                  )}
                  
                  <span style={{
                    backgroundColor: '#E3F2FD',
                    color: '#1E88E5',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {role.is_active ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobRoles;