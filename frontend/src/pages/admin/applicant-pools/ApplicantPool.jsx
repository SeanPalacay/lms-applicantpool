import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Filter, RefreshCw, 
  Edit, Trash2, Users, CheckCircle, XCircle, Clock
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const ApplicantPool = ({ onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pools, setPools] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchPools();
    fetchApplications();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const data = await applicantService.getApplicantPools();
      setPools(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching applicant pools:', err);
      setError('Failed to load applicant pools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async (filters = {}) => {
    try {
      const data = await applicantService.getApplications(filters);
      setApplications(data);
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const handleDeletePool = async (poolId) => {
    if (window.confirm('Are you sure you want to delete this applicant pool?')) {
      try {
        setLoading(true);
        await applicantService.deleteApplicantPool(poolId);
        await fetchPools();
        if (selectedPool && selectedPool.id === poolId) setSelectedPool(null);
      } catch (err) {
        setError('Failed to delete applicant pool. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectPool = async (pool) => {
    try {
      setLoading(true);
      const applicants = await applicantService.getApplicantsByPool(pool.id);
      setSelectedPool({ ...pool, applicants });
    } catch (err) {
      console.error('Error fetching applicants for pool:', err);
      setError(`Failed to load applicants for ${pool.pool_name}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await applicantService.updateApplicationStatus(applicationId, newStatus);
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      if (selectedPool && selectedPool.applicants) {
        setSelectedPool({
          ...selectedPool,
          applicants: selectedPool.applicants.map(app => 
            app.application_id === applicationId ? { ...app, status: newStatus } : app
          )
        });
      }
    } catch (err) {
      console.error('Error updating application status:', err);
      alert('Failed to update application status. Please try again.');
    }
  };

  const handleAssignToPool = async (applicationId) => {
    if (!selectedPool) return;
    try {
      await applicantService.assignApplicantToPool(applicationId, selectedPool.id);
      const pool = await applicantService.getApplicantPoolById(selectedPool.id);
      const applicants = await applicantService.getApplicantsByPool(selectedPool.id);
      setSelectedPool({ ...pool, applicants });
    } catch (err) {
      console.error('Error assigning applicant to pool:', err);
      alert('Failed to assign applicant to pool. Please try again.');
    }
  };

  const handleRemoveFromPool = async (assignmentId) => {
    if (window.confirm('Are you sure you want to remove this applicant from the pool?')) {
      try {
        await applicantService.removeApplicantFromPool(assignmentId);
        if (selectedPool) {
          const pool = await applicantService.getApplicantPoolById(selectedPool.id);
          const applicants = await applicantService.getApplicantsByPool(selectedPool.id);
          setSelectedPool({ ...pool, applicants });
        }
      } catch (err) {
        console.error('Error removing applicant from pool:', err);
        alert('Failed to remove applicant from pool. Please try again.');
      }
    }
  };

  const handleRefresh = () => {
    fetchPools();
    fetchApplications();
    if (selectedPool) handleSelectPool(selectedPool);
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    fetchApplications({ status: e.target.value === 'all' ? '' : e.target.value });
  };

  const filteredPools = searchTerm
    ? pools.filter(pool => 
        pool.pool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pool.description && pool.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : pools;

  if (loading && pools.length === 0) return <LoadingSpinner />;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
    }}>
      {error && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#e74c3c', // --danger-color
          padding: '16px',
          borderRadius: '8px', // --radius-md
          marginBottom: '32px', // --spacing-xl
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)' // --shadow-md
        }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px' // --spacing-xl
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{
            background: 'none',
            border: 'none',
            color: '#1E88E5', // --primary-color
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'color 0.3s ease' // --transition-normal
          }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Applicant Pools</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search pools..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                padding: '8px 8px 8px 36px',
                border: '1px solid #e2e8f0', // --medium-gray
                borderRadius: '8px', // --radius-md
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                minWidth: '200px',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
          </div>
          <button onClick={handleRefresh} style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px',
            border: '1px solid #1E88E5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => navigate('/admin/applicant-pools/create')} style={{
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
            ':hover': { backgroundColor: '#1565C0' } // --primary-dark
          }}>
            <Plus size={16} /> Create Pool
          </button>
        </div>
      </div>

      {/* Pool Content */}
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        {/* Pools List */}
        <div style={{
          flex: '1 1 300px',
          backgroundColor: '#ffffff',
          borderRadius: '12px', // --radius-lg
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
          padding: '24px', // --spacing-lg
          minWidth: '0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px' // --spacing-md
          }}>
            <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>Available Pools</h2>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{pools.length} pools</span>
          </div>
          {filteredPools.length > 0 ? (
            <div style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
              {filteredPools.map(pool => (
                <div
                  key={pool.id}
                  onClick={() => handleSelectPool(pool)}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    backgroundColor: selectedPool && selectedPool.id === pool.id ? '#E3F2FD' : '#ffffff', // --primary-ultralight
                    cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                    ':hover': { backgroundColor: '#f8fafc' } // --light-gray
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{pool.pool_name}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/applicant-pools/edit/${pool.id}`);
                        }}
                        style={{
                          backgroundColor: '#1E88E5',
                          color: '#ffffff',
                          padding: '4px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePool(pool.id);
                        }}
                        style={{
                          backgroundColor: '#e74c3c',
                          color: '#ffffff',
                          padding: '4px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                    {pool.description || 'No description'}
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginTop: '8px',
                    fontSize: '0.75rem',
                    color: '#94a3b8' // --text-muted
                  }}>
                    <span>Created: {formatDate(pool.created_at)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {pool.applicant_count || 0} applicants
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
              {searchTerm ? 'No pools match your search.' : 'No applicant pools available.'}
            </div>
          )}
        </div>

        {/* Pool Details */}
        <div style={{
          flex: '2 1 600px',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px',
          minWidth: '0'
        }}>
          {selectedPool ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>
                  {selectedPool.pool_name}
                </h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Created:</span> {formatDate(selectedPool.created_at)}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Total Applicants:</span> {selectedPool.applicants ? selectedPool.applicants.length : 0}
                  </div>
                </div>
              </div>

              <div style={{
                backgroundColor: '#E3F2FD',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Description</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  {selectedPool.description || 'No description provided for this pool.'}
                </p>
              </div>

              {/* Applicants in Pool */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                    Applicants in this Pool
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={14} style={{ color: '#1E88E5' }} />
                    <select
                      value={statusFilter}
                      onChange={handleFilterChange}
                      style={{
                        padding: '8px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        backgroundColor: '#ffffff',
                        outline: 'none',
                        ':focus': { borderColor: '#1E88E5' }
                      }}
                    >
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                {selectedPool.applicants && selectedPool.applicants.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                          {['Applicant', 'Role', 'Status', 'Actions'].map((header, index) => (
                            <th key={index} style={{
                              padding: '16px',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#1e293b'
                            }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPool.applicants.map(applicant => (
                          <tr key={applicant.id} style={{
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background-color 0.3s ease',
                            ':hover': { backgroundColor: '#f8fafc' }
                          }}>
                            <td style={{ padding: '16px' }}>
                              <div
                                onClick={() => navigate(`/admin/applicant-pools/${selectedPool.id}/applicant/${applicant.id}`)}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                              >
                                <div style={{
                                  width: '32px',
                                  height: '32px',
                                  backgroundColor: '#1E88E5',
                                  borderRadius: '9999px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#ffffff',
                                  fontSize: '14px',
                                  fontWeight: 600
                                }}>
                                  {applicant.full_name ? applicant.full_name.charAt(0) : 'A'}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{applicant.full_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                    Applied: {formatDate(applicant.applied_at)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                              {applicant.job_role || 'N/A'} - {applicant.department || 'N/A'}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                color: applicant.status === 'pending' ? '#f39c12' :
                                        applicant.status === 'shortlisted' ? '#1E88E5' :
                                        applicant.status === 'hired' ? '#2ecc71' : '#e74c3c',
                                backgroundColor: applicant.status === 'pending' ? '#fff8e6' :
                                               applicant.status === 'shortlisted' ? '#E3F2FD' :
                                               applicant.status === 'hired' ? '#e6ffe6' : '#ffe6e6'
                              }}>
                                {applicant.status === 'pending' && <Clock size={14} />}
                                {applicant.status === 'shortlisted' && <CheckCircle size={14} />}
                                {applicant.status === 'hired' && <CheckCircle size={14} />}
                                {applicant.status === 'rejected' && <XCircle size={14} />}
                                <span>{applicant.status}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px' }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select
                                  value={applicant.status}
                                  onChange={(e) => handleUpdateStatus(applicant.application_id, e.target.value)}
                                  style={{
                                    padding: '4px 8px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '4px',
                                    fontSize: '0.875rem',
                                    color: '#1e293b',
                                    backgroundColor: '#ffffff',
                                    outline: 'none',
                                    ':focus': { borderColor: '#1E88E5' }
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="shortlisted">Shortlist</option>
                                  <option value="hired">Hire</option>
                                  <option value="rejected">Reject</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveFromPool(applicant.id)}
                                  style={{
                                    backgroundColor: '#e74c3c',
                                    color: '#ffffff',
                                    padding: '4px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
                    No applicants in this pool.
                  </div>
                )}
              </div>

              {/* Add Applicants Section */}
              <div>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  Add Applicants to Pool
                </h3>
                {applications.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                          {['Applicant', 'Role', 'Status', 'Actions'].map((header, index) => (
                            <th key={index} style={{
                              padding: '16px',
                              textAlign: 'left',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#1e293b'
                            }}>
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {applications
                          .filter(app => !selectedPool.applicants || !selectedPool.applicants.some(a => a.application_id === app.id))
                          .map(app => (
                            <tr key={app.id} style={{
                              borderBottom: '1px solid #e2e8f0',
                              transition: 'background-color 0.3s ease',
                              ':hover': { backgroundColor: '#f8fafc' }
                            }}>
                              <td style={{ padding: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    backgroundColor: '#1E88E5',
                                    borderRadius: '9999px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    fontSize: '14px',
                                    fontWeight: 600
                                  }}>
                                    {app.full_name ? app.full_name.charAt(0) : 'A'}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{app.full_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                      Applied: {formatDate(app.applied_at)}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                                {app.job_role || 'N/A'} - {app.department || 'N/A'}
                              </td>
                              <td style={{ padding: '16px' }}>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  color: app.status === 'pending' ? '#f39c12' :
                                          app.status === 'shortlisted' ? '#1E88E5' :
                                          app.status === 'hired' ? '#2ecc71' : '#e74c3c',
                                  backgroundColor: app.status === 'pending' ? '#fff8e6' :
                                                 app.status === 'shortlisted' ? '#E3F2FD' :
                                                 app.status === 'hired' ? '#e6ffe6' : '#ffe6e6'
                                }}>
                                  {app.status === 'pending' && <Clock size={14} />}
                                  {app.status === 'shortlisted' && <CheckCircle size={14} />}
                                  {app.status === 'hired' && <CheckCircle size={14} />}
                                  {app.status === 'rejected' && <XCircle size={14} />}
                                  <span>{app.status}</span>
                                </div>
                              </td>
                              <td style={{ padding: '16px' }}>
                                <button
                                  onClick={() => handleAssignToPool(app.id)}
                                  style={{
                                    backgroundColor: '#1E88E5',
                                    color: '#ffffff',
                                    padding: '4px 8px',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <Plus size={14} /> Add to Pool
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
                    No available applicants to add.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#64748b',
              textAlign: 'center'
            }}>
              <Users size={48} style={{ marginBottom: '16px', color: '#1E88E5' }} />
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
                Select a pool to view details
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                Choose an applicant pool from the list or create a new one to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantPool;