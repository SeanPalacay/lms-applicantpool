import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Plus, Search, Filter, RefreshCw, 
  Edit, Trash2, Users, CheckCircle, XCircle, Clock,
  Briefcase, Building, UserPlus
} from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';

const TraineePool = ({ onBack }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [eligibleTrainees, setEligibleTrainees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    fetchPools();
    fetchPrograms();
  }, []);

  const fetchPools = async () => {
    try {
      setLoading(true);
      const data = await adminService.getTraineePools();
      setPools(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching trainee pools:', err);
      setError('Failed to load trainee pools. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (traineeId, newStatus) => {
    try {
      await adminService.updateTraineeStatus(traineeId, newStatus);
      if (selectedPool && selectedPool.trainees) {
        setSelectedPool({
          ...selectedPool,
          trainees: selectedPool.trainees.map(trainee => 
            trainee.trainee_id === traineeId ? { ...trainee, status: newStatus } : trainee
          )
        });
      }
    } catch (err) {
      console.error('Error updating trainee status:', err);
      alert('Failed to update trainee status. Please try again.');
    }
  };
  

  const fetchPrograms = async () => {
    try {
      const data = await adminService.getPrograms();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
    }
  };

  const fetchEligibleTrainees = async (programId) => {
    try {
      const trainees = await adminService.getTraineesByProgram(programId);
      setEligibleTrainees(trainees);
    } catch (err) {
      console.error('Error fetching eligible trainees:', err);
      setError('Failed to load eligible trainees for this program.');
    }
  };

  const handleDeletePool = async (poolId) => {
    if (window.confirm('Are you sure you want to delete this trainee pool?')) {
      try {
        setLoading(true);
        await adminService.deleteTraineePool(poolId);
        await fetchPools();
        if (selectedPool && selectedPool.id === poolId) {
          setSelectedPool(null);
          setEligibleTrainees([]);
        }
      } catch (err) {
        setError('Failed to delete trainee pool. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectPool = async (pool) => {
    try {
      setLoading(true);
      // Fetch trainees for the selected pool
      const trainees = await adminService.getTraineesByPool(pool.id);
      setSelectedPool({ ...pool, trainees });
  
      // Fetch eligible trainees for the program (not in the pool yet)
      await fetchEligibleTrainees(pool.program_id);
    } catch (err) {
      console.error('Error fetching trainees for pool:', err);
      setError(`Failed to load trainees for ${pool.pool_name}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  

  const handleAddTraineeToPool = async (traineeId) => {
    try {
      // Add trainee to pool
      await adminService.addTraineeToPool(selectedPool.id, traineeId);
  
      // Fetch the updated list of trainees in the pool after adding the trainee
      const updatedTrainees = await adminService.getTraineesByPool(selectedPool.id);
  
      // Update selectedPool state with the new list of trainees
      setSelectedPool({ ...selectedPool, trainees: updatedTrainees });
  
      // Refresh eligible trainees for the program
      await fetchEligibleTrainees(selectedPool.program_id);
  
      // Optionally, remove the trainee from eligible trainees list if they are added
      setEligibleTrainees(prevState => prevState.filter(trainee => trainee.trainee_id !== traineeId));
  
      alert('Trainee added to pool successfully.');
    } catch (err) {
      console.error('Error adding trainee to pool:', err);
      alert('Failed to add trainee to pool. Please try again.');
    }
  };
  

  const handleRemoveFromPool = async (traineeId) => {
    if (window.confirm('Are you sure you want to remove this trainee from the pool?')) {
      try {
        await adminService.removeTraineeFromPool(traineeId);
        if (selectedPool) {
          setSelectedPool({
            ...selectedPool,
            trainees: selectedPool.trainees.filter(trainee => trainee.trainee_id !== traineeId)
          });
        }
        // Refresh eligible trainees
        await fetchEligibleTrainees(selectedPool.program_id);
        alert('Trainee successfully removed from the pool.');
      } catch (err) {
        console.error('Error removing trainee from pool:', err);
        alert('Failed to remove trainee from pool. Please try again.');
      }
    }
  };

  const handleRefresh = () => {
    fetchPools();
    if (selectedPool) {
      handleSelectPool(selectedPool);
      fetchEligibleTrainees(selectedPool.program_id);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);

  const filteredPools = searchTerm
    ? pools.filter(pool => 
        pool.pool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pool.description && pool.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : pools;

    const getFilteredTrainees = () => {
        if (!selectedPool || !selectedPool.trainees) return [];
      
        let trainees = selectedPool.trainees;
      
        if (statusFilter !== 'all') {
          trainees = trainees.filter(trainee => trainee.status === statusFilter);
        }
      
        if (programFilter !== 'all') {
          trainees = trainees.filter(trainee => trainee.program_id === parseInt(programFilter));
        }
      
        return trainees;
      };
      

  if (loading && pools.length === 0) return <LoadingSpinner />;

  const formatDate = (dateString) => {
    if (!dateString || dateString === 'undefined') {
      return 'No date available';
    }

    const formattedDate = new Date(dateString);

    if (isNaN(formattedDate.getTime())) {
      return 'Invalid Date';
    }

    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return formattedDate.toLocaleDateString(undefined, options);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      {error && (
        <div style={{
          backgroundColor: '#ffe6e6',
          color: '#e74c3c',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '32px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}>
          {error}
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} style={{
            background: 'none',
            border: 'none',
            color: '#1E88E5',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'color 0.3s ease'
          }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Trainee Pools</h1>
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
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                minWidth: '200px'
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
            fontSize: '0.875rem'
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
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px',
          minWidth: '0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
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
                    backgroundColor: selectedPool && selectedPool.id === pool.id ? '#E3F2FD' : '#ffffff',
                    cursor: 'pointer'
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
                    color: '#94a3b8'
                  }}>
                    <span>Created: {formatDate(pool.created_at)}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Users size={14} /> {pool.trainee_count || 0} trainees
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
              {searchTerm ? 'No pools match your search.' : 'No trainee pools available.'}
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
                    <span style={{ fontWeight: 600 }}>Program:</span> {selectedPool.program_title}
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Total Trainees:</span> {selectedPool.trainees ? selectedPool.trainees.length : 0}
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

              {/* Eligible Trainees to Add */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
                  Eligible Trainees to Add
                </h3>
                {eligibleTrainees.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                          {['Trainee', 'Email', 'Final Grade','Action'].map((header, index) => (
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
                        {eligibleTrainees.map(trainee => (
                          <tr key={trainee.trainee_id} style={{
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background-color 0.3s ease'
                          }}>
                            <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
                              {trainee.full_name}
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                              {trainee.email}
                            </td>
                            <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
                              {trainee.final_grade ? trainee.final_grade.toFixed(2) : 'N/A'}
                            </td>
                            <td style={{ padding: '16px' }}>
                              <button
                                onClick={() => handleAddTraineeToPool(trainee.trainee_id)}
                                disabled={trainee.in_pool > 0}
                                style={{
                                  backgroundColor: trainee.in_pool > 0 ? '#d3d3d3' : '#1E88E5',
                                  color: '#ffffff',
                                  padding: '4px 8px',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: trainee.in_pool > 0 ? 'not-allowed' : 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <UserPlus size={14} />
                                Add to Pool
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
                    No eligible trainees found for this program.
                  </div>
                )}
              </div>

              {/* Trainees in Pool */}
              <div style={{ marginBottom: '32px' }}>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  }}>
    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
      Trainees in this Pool
    </h3>
  </div>

  {selectedPool && selectedPool.trainees && selectedPool.trainees.length > 0 ? (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
            {['Trainee', 'Program', 'Role', 'Status', 'Actions'].map((header, index) => (
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
          {getFilteredTrainees().map(trainee => (
            <tr key={trainee.trainee_id} style={{
              borderBottom: '1px solid #e2e8f0',
              transition: 'background-color 0.3s ease'
            }}>
              <td style={{ padding: '16px' }}>
                <div
                  onClick={() => navigate(`/admin/applicant-pools/${selectedPool.id}/trainee/${trainee.trainee_id}`)}
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
                    {trainee.full_name ? trainee.full_name.charAt(0) : 'T'}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{trainee.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Added: {formatDate(trainee.added_at)}
                    </div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Building size={14} />
                  {trainee.program_name || 'N/A'}
                </div>
              </td>
              <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Briefcase size={14} />
                  {trainee.role || 'N/A'}
                </div>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  color: trainee.status === 'active' ? '#1E88E5' :
                          trainee.status === 'completed' ? '#2ecc71' : '#e74c3c',
                  backgroundColor: trainee.status === 'active' ? '#E3F2FD' :
                                  trainee.status === 'completed' ? '#e6ffe6' : '#ffe6e6'
                }}>
                  {trainee.status === 'active' && <Clock size={14} />}
                  {trainee.status === 'completed' && <CheckCircle size={14} />}
                  {trainee.status === 'dropped' && <XCircle size={14} />}
                  <span>{trainee.status}</span>
                </div>
              </td>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    value={trainee.status}
                    onChange={(e) => handleUpdateStatus(trainee.trainee_id, e.target.value)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '4px',
                      fontSize: '0.875rem',
                      color: '#1e293b',
                      backgroundColor: '#ffffff',
                      outline: 'none'
                    }}
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </select>
                  <button
                    onClick={() => handleRemoveFromPool(trainee.trainee_id)}
                    style={{
                      backgroundColor: '#e74c3c',
                      color: '#ffffff',
                      padding: '4px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Remove trainee from pool"
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
      {selectedPool.trainees && selectedPool.trainees.length > 0 ? 
        'No trainees match the current filters.' : 
        'No trainees in this pool.'}
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
                Choose a trainee pool from the list or create a new one to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraineePool;

