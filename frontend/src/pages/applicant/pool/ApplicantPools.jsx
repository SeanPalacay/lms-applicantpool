import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  ChevronLeft, 
  Search, 
  RefreshCw, 
  Building, 
  Clock, 
  Filter, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import applicantService from '../../../services/applicantService';

const ApplicantPools = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  // Data states
  const [dashboardData, setDashboardData] = useState({
    user: {
      full_name: '',
      email: '',
      status: ''
    },
    myApplications: []
  });
  const [departments, setDepartments] = useState([]);
  const [myPools, setMyPools] = useState([]);
  const [availablePools, setAvailablePools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        // 1) Get applicant's dashboard data
        const data = await applicantService.getDashboardData();
        setDashboardData(data);

        // 2) Get list of departments (for filtering)
        const departmentsData = await applicantService.getDepartments();
        setDepartments(departmentsData);

        // 3) Pools the applicant already joined/applied to
        const myPoolsData = await applicantService.getUserAppliedPools();
        setMyPools(myPoolsData);

        // 4) Pools the applicant can still apply to
        const availablePoolsData = await applicantService.getAvailablePools();
        setAvailablePools(availablePoolsData);

        setError(null);
      } catch (err) {
        console.error('Error fetching applicant pools data:', err);
        setError('Failed to load applicant pools data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /**
   * Apply to a chosen pool (creates a new application and assignment).
   */
  const handleApplyToPool = async (poolId) => {
    try {
      setLoading(true);

      // If the selected pool has positions, pick the first one as the job role
      const selectedPosition =
        selectedPool && selectedPool.positions?.length > 0
          ? selectedPool.positions[0]
          : null;

      // This will create a new application in the backend.
      // The backend no longer expects a "program_id", so we omit it:
      await applicantService.applyToPool(poolId, {
        position_name: selectedPosition
      });

      // After successful apply, refresh data:
      const myPoolsData = await applicantService.getUserAppliedPools();
      setMyPools(myPoolsData);

      const availablePoolsData = await applicantService.getAvailablePools();
      setAvailablePools(availablePoolsData);

      // If we just applied to the pool that's currently selected, unselect it
      if (selectedPool && selectedPool.id === poolId) {
        setSelectedPool(null);
      }

      setError(null);
    } catch (err) {
      console.error('Error applying to pool:', err);
      setError('Failed to apply to pool. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPool = (pool) => {
    setSelectedPool(pool);
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const myPoolsData = await applicantService.getUserAppliedPools();
      setMyPools(myPoolsData);

      const availablePoolsData = await applicantService.getAvailablePools();
      setAvailablePools(availablePoolsData);

      setError(null);
    } catch (err) {
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setStatusFilter(e.target.value);
  const handleDepartmentFilterChange = (e) => setDepartmentFilter(e.target.value);

  // Filter "My Pools" (ones the user has already applied to)
  const filteredMyPools = myPools.filter((pool) => {
    const matchesSearch =
      !searchTerm ||
      pool.pool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pool.description && pool.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept =
      departmentFilter === 'all' ? true : pool.department === departmentFilter;

    const matchesStatus =
      statusFilter === 'all' ? true : pool.status === statusFilter;

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Filter "Available Pools" (ones not yet applied to)
  const filteredAvailablePools = availablePools.filter((pool) => {
    const matchesSearch =
      !searchTerm ||
      pool.pool_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (pool.description && pool.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept =
      departmentFilter === 'all' ? true : pool.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  if (loading && myPools.length === 0 && availablePools.length === 0) {
    return <LoadingSpinner />;
  }

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '32px',
        fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
        color: '#1e293b'
      }}
    >
      {error && (
        <AlertBanner type="error" message={error} onClose={() => setError(null)} />
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/applicant-dashboard"
            style={{
              background: 'none',
              border: 'none',
              color: '#1E88E5',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            <ChevronLeft size={16} /> Back to Dashboard
          </Link>
          <h1
            style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1e293b'
            }}
          >
            Applicant Pools
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
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
          <button
            onClick={handleRefresh}
            style={{
              backgroundColor: '#ffffff',
              color: '#1E88E5',
              padding: '8px',
              border: '1px solid #1E88E5',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          marginBottom: '24px',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: '#1E88E5' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Filters:</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Building size={14} style={{ color: '#1E88E5' }} />
          <select
            value={departmentFilter}
            onChange={handleDepartmentFilterChange}
            style={{
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: '#1E88E5' }} />
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
              outline: 'none'
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

      {/* Main Content Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '24px'
        }}
      >
        {/* Left Column - "My Pools" and "Available Pools" */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* My Pools */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              padding: '24px'
            }}
          >
            <h2
              style={{
                margin: '0 0 16px 0',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              My Pools
            </h2>

            {filteredMyPools.length > 0 ? (
              <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                {filteredMyPools.map((pool) => (
                  <div
                    key={pool.id}
                    onClick={() => handleSelectPool(pool)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease',
                      backgroundColor:
                        selectedPool && selectedPool.id === pool.id
                          ? '#E3F2FD'
                          : '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        {pool.pool_name}
                      </h3>

                      {/* Status Badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          color:
                            pool.status === 'pending'
                              ? '#f39c12'
                              : pool.status === 'shortlisted'
                              ? '#1E88E5'
                              : pool.status === 'hired'
                              ? '#2ecc71'
                              : '#e74c3c',
                          backgroundColor:
                            pool.status === 'pending'
                              ? '#fff8e6'
                              : pool.status === 'shortlisted'
                              ? '#E3F2FD'
                              : pool.status === 'hired'
                              ? '#e6ffe6'
                              : '#ffe6e6'
                        }}
                      >
                        {pool.status === 'pending' && <Clock size={14} />}
                        {pool.status === 'shortlisted' && <CheckCircle size={14} />}
                        {pool.status === 'hired' && <CheckCircle size={14} />}
                        {pool.status === 'rejected' && <XCircle size={14} />}
                        <span>{pool.status}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Building size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {pool.department}
                      </span>
                    </div>

                    <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                      {pool.description || 'No description'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '12px',
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}
                    >
                      <span>Applied: {formatDate(pool.applied_at || pool.created_at)}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Briefcase size={14} />{' '}
                        {pool.job_role ||
                          (pool.positions && pool.positions.length > 0
                            ? pool.positions[0]
                            : 'Position')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                  ? 'No pools match your search criteria.'
                  : 'You have not been added to any applicant pools yet.'}
              </div>
            )}
          </div>

          {/* Available Pools */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
              padding: '24px'
            }}
          >
            <h2
              style={{
                margin: '0 0 16px 0',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: '#1e293b'
              }}
            >
              Available Pools
            </h2>

            {filteredAvailablePools.length > 0 ? (
              <div style={{ maxHeight: 'calc(100vh - 350px)', overflowY: 'auto' }}>
                {filteredAvailablePools.map((pool) => (
                  <div
                    key={pool.id}
                    onClick={() => handleSelectPool(pool)}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease',
                      backgroundColor:
                        selectedPool && selectedPool.id === pool.id
                          ? '#E3F2FD'
                          : '#ffffff'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#1e293b'
                        }}
                      >
                        {pool.pool_name}
                      </h3>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                      <Building size={14} style={{ color: '#64748b' }} />
                      <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {pool.department}
                      </span>
                    </div>

                    <p style={{ margin: '8px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                      {pool.description || 'No description'}
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        marginTop: '12px',
                        gap: '12px'
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Created: {formatDate(pool.created_at)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApplyToPool(pool.id);
                        }}
                        style={{
                          backgroundColor: '#1E88E5',
                          color: '#ffffff',
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '32px',
                  color: '#64748b',
                  fontSize: '0.875rem'
                }}
              >
                {searchTerm || departmentFilter !== 'all'
                  ? 'No available pools match your search criteria.'
                  : 'No available pools at the moment.'}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Selected Pool Details */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
            padding: '24px'
          }}
        >
          {selectedPool ? (
            <>
              <div style={{ marginBottom: '24px' }}>
                <h2
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                >
                  {selectedPool.pool_name}
                </h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                  <div>
                    <span style={{ fontWeight: 600 }}>Department:</span> {selectedPool.department}
                  </div>
                  {selectedPool.status && (
                    <div>
                      <span style={{ fontWeight: 600 }}>Status:</span>
                      <span
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          marginLeft: '8px',
                          color:
                            selectedPool.status === 'pending'
                              ? '#f39c12'
                              : selectedPool.status === 'shortlisted'
                              ? '#1E88E5'
                              : selectedPool.status === 'hired'
                              ? '#2ecc71'
                              : '#e74c3c',
                          backgroundColor:
                            selectedPool.status === 'pending'
                              ? '#fff8e6'
                              : selectedPool.status === 'shortlisted'
                              ? '#E3F2FD'
                              : selectedPool.status === 'hired'
                              ? '#e6ffe6'
                              : '#ffe6e6'
                        }}
                      >
                        {selectedPool.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div
                style={{
                  backgroundColor: '#E3F2FD',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '24px'
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#1e293b'
                  }}
                >
                  Description
                </h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                  {selectedPool.description || 'No description provided for this pool.'}
                </p>
              </div>

              {/* Positions */}
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}
                >
                  Available Positions
                </h3>
                {selectedPool.positions && selectedPool.positions.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {selectedPool.positions.map((position, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: '#f1f5f9',
                          borderRadius: '4px',
                          fontSize: '0.875rem',
                          color: '#1e293b',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <Briefcase size={14} />
                        {position}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    No specific positions listed for this pool.
                  </p>
                )}
              </div>

              {/* If the pool is in "My Pools," show some application details */}
              {myPools.some((p) => p.id === selectedPool.id) && (
                <div>
                  <h3
                    style={{
                      margin: '0 0 16px 0',
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}
                  >
                    Your Application
                  </h3>

                  {/* Could display application details, like status, ID, or scores */}
                  {/* In your snippet, you show possible evaluation_score or fst_score, etc. */}
                  {/* ... Add custom logic if desired ... */}
                  <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    You have already applied to this pool.
                  </p>
                </div>
              )}

              {/* If not yet applied, show an "Apply" button */}
              {!myPools.some((p) => p.id === selectedPool.id) && (
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      marginBottom: '16px'
                    }}
                  >
                    Interested in joining this pool? Submit your application now!
                  </p>
                  <button
                    onClick={() => handleApplyToPool(selectedPool.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#1E88E5',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      margin: '0 auto'
                    }}
                  >
                    <Briefcase size={16} />
                    Apply to Pool
                  </button>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#64748b',
                textAlign: 'center',
                padding: '64px 0'
              }}
            >
              <Briefcase size={48} style={{ marginBottom: '16px', color: '#1E88E5' }} />
              <h3
                style={{
                  margin: '0 0 8px 0',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#1e293b'
                }}
              >
                Select a pool to view details
              </h3>
              <p style={{ margin: 0, fontSize: '0.875rem', maxWidth: '400px' }}>
                Choose an applicant pool from the list to view more information and manage your
                application.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicantPools;
