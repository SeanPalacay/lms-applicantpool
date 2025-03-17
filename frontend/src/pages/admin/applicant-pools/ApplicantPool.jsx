import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Filter, RefreshCw, 
  Edit, Trash2, Users, CheckCircle, XCircle, Clock
} from 'lucide-react';
import applicantService from '../../../services/applicantService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import './styles/ApplicantPool.css';

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
      // We don't set error state here to avoid disrupting the UI if only applications fail to load
    }
  };

  const handleDeletePool = async (poolId) => {
    if (window.confirm('Are you sure you want to delete this applicant pool?')) {
      try {
        setLoading(true);
        await applicantService.deleteApplicantPool(poolId);
        await fetchPools();
        if (selectedPool && selectedPool.id === poolId) {
          setSelectedPool(null);
        }
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
      // Fetch applicants first
      const applicants = await applicantService.getApplicantsByPool(pool.id);
      
      // Create a new pool object with the applicants attached
      const updatedPool = {
        ...pool,
        applicants: applicants
      };
      
      // Set the selected pool with applicants already attached
      setSelectedPool(updatedPool);
    } catch (err) {
      console.error('Error fetching applicants for pool:', err);
      // Show error to user
      setError(`Failed to load applicants for ${pool.pool_name}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateStatus = async (applicationId, newStatus) => {
    try {
      await applicantService.updateApplicationStatus(applicationId, newStatus);
      
      // Update local state to reflect the change
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status: newStatus } : app
      ));
      
      // If this application is in the selectedPool, update that too
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
      
      // Refresh the pool data to include the newly assigned applicant
      const pool = await applicantService.getApplicantPoolById(selectedPool.id);
      const applicants = await applicantService.getApplicantsByPool(selectedPool.id);
      pool.applicants = applicants;
      setSelectedPool(pool);
    } catch (err) {
      console.error('Error assigning applicant to pool:', err);
      alert('Failed to assign applicant to pool. Please try again.');
    }
  };

  const handleRemoveFromPool = async (assignmentId) => {
    if (window.confirm('Are you sure you want to remove this applicant from the pool?')) {
      try {
        await applicantService.removeApplicantFromPool(assignmentId);
        
        // Refresh the pool data
        if (selectedPool) {
          const pool = await applicantService.getApplicantPoolById(selectedPool.id);
          const applicants = await applicantService.getApplicantsByPool(selectedPool.id);
          pool.applicants = applicants;
          setSelectedPool(pool);
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
    if (selectedPool) {
      handleSelectPool(selectedPool);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

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

  if (loading && pools.length === 0) {
    return <LoadingSpinner />;
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="applicant-pool-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="pool-header">
        <div className="header-left">
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
          <h1>Applicant Pools</h1>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search pools..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="refresh-button" onClick={handleRefresh}>
            <RefreshCw size={16} />
          </button>
          <button 
            className="create-button"
            onClick={() => navigate('/admin/applicant-pools/create')}
          >
            <Plus size={16} />
            <span>Create Pool</span>
          </button>
        </div>
      </div>
      
      <div className="pool-content">
        <div className="pools-list">
          <div className="list-header">
            <h2>Available Pools</h2>
            <span className="pool-count">{pools.length} pools</span>
          </div>
          
          {filteredPools.length > 0 ? (
            <div className="pool-items">
              {filteredPools.map(pool => (
                <div 
                  key={pool.id} 
                  className={`pool-item ${selectedPool && selectedPool.id === pool.id ? 'selected' : ''}`}
                  onClick={() => handleSelectPool(pool)}
                >
                  <div className="pool-item-header">
                    <h3>{pool.pool_name}</h3>
                    <div className="pool-actions">
                      <button 
                        className="edit-button" 
                        title="Edit Pool"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering pool selection
                          navigate(`/admin/applicant-pools/edit/${pool.id}`);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="delete-button" 
                        title="Delete Pool"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePool(pool.id);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="pool-description">{pool.description || 'No description'}</p>
                  <div className="pool-meta">
                    <div className="pool-date">Created: {formatDate(pool.created_at)}</div>
                    <div className="pool-applicants">
                      <Users size={14} />
                      <span>{pool.applicant_count || 0} applicants</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-data-message">
              {searchTerm ? 'No pools match your search.' : 'No applicant pools available.'}
            </div>
          )}
        </div>
        
        <div className="pool-details">
          {selectedPool ? (
            <>
              <div className="details-header">
                <h2>{selectedPool.pool_name}</h2>
                <div className="details-meta">
                  <div className="detail-item">
                    <span className="label">Created:</span>
                    <span className="value">{formatDate(selectedPool.created_at)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Total Applicants:</span>
                    <span className="value">{selectedPool.applicants ? selectedPool.applicants.length : 0}</span>
                  </div>
                </div>
              </div>
              
              <div className="description-box">
                <h3>Description</h3>
                <p>{selectedPool.description || 'No description provided for this pool.'}</p>
              </div>
              
              <div className="applicants-section">
                <div className="section-header">
                  <h3>Applicants in this Pool</h3>
                  <div className="filter-dropdown">
                    <Filter size={14} />
                    <select value={statusFilter} onChange={handleFilterChange}>
                      <option value="all">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="shortlisted">Shortlisted</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
                
                {selectedPool.applicants && selectedPool.applicants.length > 0 ? (
                  <div className="applicants-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPool.applicants.map(applicant => (
                          <tr key={applicant.id}>
                            <td className="applicant-name">
                              <div 
                                className="applicant-info-container"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/applicant-pools/${selectedPool.id}/applicant/${applicant.id}`);
                                }}
                              >
                                <div className="applicant-avatar">
                                  {applicant.full_name ? applicant.full_name.charAt(0) : 'A'}
                                </div>
                                <div className="applicant-info">
                                  <div className="name">{applicant.full_name}</div>
                                  <div className="applied-date">Applied: {formatDate(applicant.applied_at)}</div>
                                </div>
                              </div>
                            </td>
                            <td>{applicant.job_role || 'N/A'} - {applicant.department || 'N/A'}</td>
                            <td>
                              <div className={`status-badge status-${applicant.status}`}>
                                {applicant.status === 'pending' && <Clock size={14} />}
                                {applicant.status === 'shortlisted' && <CheckCircle size={14} />}
                                {applicant.status === 'hired' && <CheckCircle size={14} />}
                                {applicant.status === 'rejected' && <XCircle size={14} />}
                                <span>{applicant.status}</span>
                              </div>
                            </td>
                            <td className="actions-cell">
                              <div className="table-actions">
                                <div className="status-dropdown">
                                  <select 
                                    value={applicant.status} 
                                    onChange={(e) => handleUpdateStatus(applicant.application_id, e.target.value)}
                                  >
                                    <option value="pending">Pending</option>
                                    <option value="shortlisted">Shortlist</option>
                                    <option value="hired">Hire</option>
                                    <option value="rejected">Reject</option>
                                  </select>
                                </div>
                                <button 
                                  className="remove-button" 
                                  onClick={() => handleRemoveFromPool(applicant.id)}
                                  title="Remove from Pool"
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
                  <div className="no-data-message">
                    No applicants in this pool.
                  </div>
                )}
              </div>
              
              <div className="add-applicants-section">
                <div className="section-header">
                  <h3>Add Applicants to Pool</h3>
                </div>
                
                {applications.length > 0 ? (
                  <div className="applicants-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Applicant</th>
                          <th>Role</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications
                          .filter(app => 
                            // Don't show applicants already in the pool
                            !selectedPool.applicants || 
                            !selectedPool.applicants.some(a => a.application_id === app.id)
                          )
                          .map(app => (
                            <tr key={app.id}>
                              <td className="applicant-name">
                                <div className="applicant-avatar">
                                  {app.full_name ? app.full_name.charAt(0) : 'A'}
                                </div>
                                <div className="applicant-info">
                                  <div className="name">{app.full_name}</div>
                                  <div className="applied-date">Applied: {formatDate(app.applied_at)}</div>
                                </div>
                              </td>
                              <td>{app.job_role || 'N/A'} - {app.department || 'N/A'}</td>
                              <td>
                                <div className={`status-badge status-${app.status}`}>
                                  {app.status === 'pending' && <Clock size={14} />}
                                  {app.status === 'shortlisted' && <CheckCircle size={14} />}
                                  {app.status === 'hired' && <CheckCircle size={14} />}
                                  {app.status === 'rejected' && <XCircle size={14} />}
                                  <span>{app.status}</span>
                                </div>
                              </td>
                              <td>
                                <button 
                                  className="add-to-pool-button"
                                  onClick={() => handleAssignToPool(app.id)}
                                >
                                  <Plus size={14} />
                                  <span>Add to Pool</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="no-data-message">
                    No available applicants to add.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-selection-message">
              <Users size={48} className="icon" />
              <h3>Select a pool to view details</h3>
              <p>Choose an applicant pool from the list or create a new one to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantPool;