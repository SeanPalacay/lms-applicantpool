import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Calendar, Search, Filter, Clock, 
  CheckCircle, RefreshCw, AlertTriangle, Info
} from 'lucide-react';
import applicantService from '../../../services/applicantService';

const ApplicantPrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardData = await applicantService.getDashboardData();
        setApplications(dashboardData.myApplications || []);
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
  
  const getFilteredPrograms = () => {
    return programs.filter(program => {
      if (filterType !== 'all' && program.type !== filterType) {
        return false;
      }
      
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
  
  const hasApplied = (programId) => {
    return applications.some(app => app.program_id === programId);
  };
  
  const getApplicationStatus = (programId) => {
    const application = applications.find(app => app.program_id === programId);
    return application ? application.status : null;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
  };
  
  const retryLoading = () => {
    setLoading(true);
    setError(null);
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <RefreshCw size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Loading programs...</p>
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
          onClick={retryLoading} 
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
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  const filteredPrograms = getFilteredPrograms();
  
  return (
    <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen size={24} /> Available Programs
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Browse and apply for training programs</p>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 16px 8px 40px', 
              borderRadius: '4px', 
              border: '1px solid var(--medium-gray)', 
              backgroundColor: 'white', 
              fontSize: '14px', 
              color: 'var(--text-primary)' 
            }}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)' 
              }}
            >
              ×
            </button>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '4px', 
              border: '1px solid var(--medium-gray)', 
              backgroundColor: 'white', 
              fontSize: '14px', 
              color: 'var(--text-primary)' 
            }}
          >
            <option value="all">All</option>
            <option value="regular">Regular</option>
            <option value="refresher">Refresher</option>
          </select>
        </div>
        
        <button 
          onClick={resetFilters}
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--medium-gray)', 
            color: 'var(--text-primary)', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <RefreshCw size={14} />
          Reset
        </button>
      </div>
      
      {filteredPrograms.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>No programs found</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters to see more results.'
              : 'There are no programs available at the moment.'}
          </p>
          {(searchQuery || filterType !== 'all') && (
            <button 
              onClick={resetFilters}
              style={{ 
                padding: '8px 16px', 
                borderRadius: '4px', 
                backgroundColor: 'var(--primary-color)', 
                color: 'white', 
                border: 'none', 
                cursor: 'pointer', 
                marginTop: '16px' 
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {filteredPrograms.map(program => {
            const applied = hasApplied(program.id);
            const status = getApplicationStatus(program.id);
            
            return (
              <div key={program.id} style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)', overflow: 'hidden' }}>
                <div style={{ 
                  padding: '12px', 
                  backgroundColor: program.type === 'regular' ? 'var(--primary-ultralight)' : 'var(--info-color)', 
                  color: program.type === 'regular' ? 'var(--primary-color)' : 'white', 
                  fontSize: '12px', 
                  fontWeight: '500', 
                  textAlign: 'center' 
                }}>
                  {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
                </div>
                
                <div style={{ padding: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>{program.title}</h3>
                  
                  {program.description && (
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{program.description}</p>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Calendar size={14} color="var(--text-secondary)" />
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Created: {formatDate(program.created_at)}</span>
                  </div>
                </div>
                
                <div style={{ padding: '16px', borderTop: '1px solid var(--medium-gray)' }}>
                  {applied ? (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      backgroundColor: status === 'pending' ? 'var(--warning-color)' : 
                                    status === 'shortlisted' ? 'var(--info-color)' : 
                                    status === 'hired' ? 'var(--success-color)' : 
                                    status === 'rejected' ? 'var(--danger-color)' : 'var(--medium-gray)', 
                      color: 'white', 
                      fontSize: '14px', 
                      fontWeight: '500' 
                    }}>
                      {status === 'pending' && <Clock size={16} />}
                      {status === 'shortlisted' && <CheckCircle size={16} />}
                      {status === 'hired' && <CheckCircle size={16} />}
                      {status === 'rejected' && <AlertTriangle size={16} />}
                      <span>Application {status}</span>
                    </div>
                  ) : (
                    <Link 
                      to={`/applicant/programs/${program.id}/apply`}
                      style={{ 
                        width: '100%', 
                        padding: '8px 16px', 
                        borderRadius: '4px', 
                        backgroundColor: 'var(--primary-color)', 
                        color: 'white', 
                        textAlign: 'center', 
                        textDecoration: 'none', 
                        fontSize: '14px', 
                        fontWeight: '500' 
                      }}
                    >
                      Apply Now
                    </Link>
                  )}
                </div>
                
                {(status === 'shortlisted' || status === 'hired') && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--success-color)', 
                    color: 'white', 
                    fontSize: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    <Info size={16} />
                    <span>You have been {status} for this program!</span>
                  </div>
                )}
                
                {status === 'rejected' && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: 'var(--danger-color)', 
                    color: 'white', 
                    fontSize: '14px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px' 
                  }}>
                    <Info size={16} />
                    <span>Your application has been rejected.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Application Process</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 8px', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              1
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Apply</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Submit your application for your preferred program</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 8px', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              2
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Review</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Your application will be reviewed by our team</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 8px', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              3
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Assessment</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Selected candidates will be invited for further assessment</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 8px', 
              fontSize: '18px', 
              fontWeight: '600' 
            }}>
              4
            </div>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Enrollment</h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Successful candidates will be enrolled in the program</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantPrograms;