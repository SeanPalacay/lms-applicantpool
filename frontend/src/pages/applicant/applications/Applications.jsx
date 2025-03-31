import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Filter, Search, AlertTriangle, RefreshCw,
  Clock, CheckCircle, XCircle, Eye, Calendar, BookOpen
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner'; // Assuming this exists
import AlertBanner from '../../../components/shared/AlertBanner'; // Assuming this exists

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const dashboardData = await applicantService.getDashboardData();
        setApplications(dashboardData.myApplications || []);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError('Failed to load applications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const getFilteredApplications = () => {
    let filtered = [...applications];
    if (filterStatus !== 'all') filtered = filtered.filter(app => app.status === filterStatus);
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.program_title.toLowerCase().includes(query) ||
        (app.job_role && app.job_role.toLowerCase().includes(query)) ||
        (app.department && app.department.toLowerCase().includes(query))
      );
    }
    if (sortBy === 'recent') filtered.sort((a, b) => new Date(b.applied_at) - new Date(a.applied_at));
    else if (sortBy === 'oldest') filtered.sort((a, b) => new Date(a.applied_at) - new Date(b.applied_at));
    else if (sortBy === 'program') filtered.sort((a, b) => a.program_title.localeCompare(b.program_title));
    return filtered;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={16} />;
      case 'shortlisted': return <CheckCircle size={16} />;
      case 'hired': return <CheckCircle size={16} />;
      case 'rejected': return <XCircle size={16} />;
      default: return null;
    }
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSortBy('recent');
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

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

  const filteredApplications = getFilteredApplications();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', margin: '0 0 4px 0' }}>
            <FileText size={24} style={{ color: '#1E88E5' }} /> My Applications
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>Track the status of your program applications</p>
        </div>
        <Link
          to="/applicant/pool"
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
          Apply for a New Position
        </Link>
      </div>

      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '200px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search applications..."
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
                  top: '50%',
                  transform: 'translateY(-50%)',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>
              <Filter size={16} /> Status:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'pending', 'shortlisted', 'hired', 'rejected'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  style={{
                    backgroundColor: filterStatus === status ? '#1E88E5' : '#ffffff',
                    color: filterStatus === status ? '#ffffff' : '#1e293b',
                    padding: '6px 12px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    transition: 'all 0.3s ease',
                    ':hover': filterStatus === status ? { backgroundColor: '#1565C0' } : { backgroundColor: '#E3F2FD' }
                  }}
                >
                  {status !== 'all' && getStatusIcon(status)}
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="sort-select" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Sort by:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                backgroundColor: '#ffffff',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="program">Program Name</option>
            </select>
          </div>

          <button
            onClick={resetFilters}
            style={{
              backgroundColor: '#ffffff',
              color: '#1E88E5',
              padding: '8px 16px',
              border: '1px solid #1E88E5',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              transition: 'background-color 0.3s ease',
              ':hover': { backgroundColor: '#E3F2FD' }
            }}
          >
            <RefreshCw size={14} /> Reset
          </button>
        </div>
      </div>

      {applications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <FileText size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>No applications found</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>You haven't applied to any programs yet.</p>
          <Link
            to="/applicant/pool"
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
            View Available Positions
          </Link>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px' }}>
          <AlertTriangle size={48} style={{ color: '#f39c12', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>No matching applications</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>No applications match your current filters.</p>
          <button
            onClick={resetFilters}
            style={{
              backgroundColor: '#1E88E5',
              color: '#ffffff',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              transition: 'background-color 0.3s ease',
              ':hover': { backgroundColor: '#1565C0' }
            }}
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {filteredApplications.map(application => (
            <div key={application.application_id || application.id} style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              padding: '24px',
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  backgroundColor: application.status === 'pending' ? '#fef5e7' : application.status === 'shortlisted' ? '#e6ffe6' : application.status === 'hired' ? '#e6ffe6' : '#ffe6e6',
                  color: application.status === 'pending' ? '#f39c12' : application.status === 'shortlisted' ? '#2ecc71' : application.status === 'hired' ? '#2ecc71' : '#e74c3c',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  {getStatusIcon(application.status)}
                  <span>{application.status.charAt(0).toUpperCase() + application.status.slice(1)}</span>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 8px 0' }}>{application.program_title}</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.875rem', color: '#64748b' }}>
                  {application.job_role && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Role:</span> {application.job_role}
                    </div>
                  )}
                  {application.department && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Department:</span> {application.department}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={14} /> Applied: {formatDate(application.applied_at)}
                  </div>
                  {application.updated_at && application.updated_at !== application.applied_at && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> Updated: {formatDate(application.updated_at)}
                    </div>
                  )}
                  {application.evaluation_score && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontWeight: 600 }}>Evaluation Score:</span> {application.evaluation_score}
                    </div>
                  )}
                  {application.fst_score && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span style={{ fontWeight: 600 }}>FST Score:</span> {application.fst_score}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <Link
                  to={`/applicant/applications/${application.application_id || application.id}`}
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
                    fontSize: '0.875rem',
                    transition: 'background-color 0.3s ease',
                    ':hover': { backgroundColor: '#1565C0' }
                  }}
                >
                  <Eye size={16} /> View Details
                </Link>
                {/* <Link
                  to={`/applicant/programs`}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1E88E5',
                    padding: '8px 16px',
                    border: '1px solid #1E88E5',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.3s ease',
                    ':hover': { backgroundColor: '#E3F2FD' }
                  }}
                >
                  <BookOpen size={16} /> Program Info
                </Link> */}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '48px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 16px 0' }}>Application Status Guide</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          {[
            { status: 'Pending', icon: <Clock size={16} />, color: '#f39c12', bg: '#fef5e7', message: 'Your application is being reviewed by our team.' },
            { status: 'Shortlisted', icon: <CheckCircle size={16} />, color: '#2ecc71', bg: '#e6ffe6', message: 'You’ve been shortlisted and may be contacted for an assessment or interview.' },
            { status: 'Hired', icon: <CheckCircle size={16} />, color: '#2ecc71', bg: '#e6ffe6', message: 'Congratulations! You’ve been selected for the program.' },
            { status: 'Rejected', icon: <XCircle size={16} />, color: '#e74c3c', bg: '#ffe6e6', message: 'Your application was not successful at this time.' }
          ].map(({ status, icon, color, bg, message }) => (
            <div key={status} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: bg, color, padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 500 }}>
                  {icon} <span>{status}</span>
                </div>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>{message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Applications;