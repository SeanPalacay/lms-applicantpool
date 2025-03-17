import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertTriangle, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock,
  X,
  Plus,
  FileText,
  SlidersHorizontal,
  Eye
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService';

const PerformanceIncidents = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.message || null);
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    incident_type: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });
  const [incidentTypes, setIncidentTypes] = useState([
    { value: '', label: 'All Types' },
    { value: 'low_quiz_score', label: 'Low Quiz Score' },
    { value: 'policy_violation', label: 'Policy Violation' },
    { value: 'other', label: 'Other' }
  ]);
  const [users, setUsers] = useState([
    { value: '', label: 'All Users' }
  ]);

  useEffect(() => {
    const fetchIncidents = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Fetch incidents data
        const data = await adminService.getPerformanceIncidents();
        setIncidents(data.incidents);
        setFilteredIncidents(data.incidents);
        
        // Fetch users for filter - using getUserList instead of getUsers
        const usersResponse = await adminService.getUserList();
        // Filter to only show trainees
        const traineeUsers = usersResponse.users ? usersResponse.users.filter(user => user.role === 'trainee') : [];
        const userOptions = [
          { value: '', label: 'All Users' },
          ...traineeUsers.map(user => ({
            value: user.id,
            label: user.full_name
          }))
        ];
        setUsers(userOptions);
      } catch (err) {
        console.error('Error fetching incidents:', err);
        setError('Failed to load performance incidents. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    
    // Clear location state after using it
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location.state]);

  useEffect(() => {
    // Apply filters and search
    let results = incidents;
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(incident => 
        (incident.description && incident.description.toLowerCase().includes(term)) ||
        (incident.userName && incident.userName.toLowerCase().includes(term))
      );
    }
    
    // Apply filters
    if (filters.incident_type) {
      results = results.filter(incident => incident.incident_type === filters.incident_type);
    }
    
    if (filters.user_id) {
      results = results.filter(incident => incident.user_id === parseInt(filters.user_id));
    }
    
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      results = results.filter(incident => new Date(incident.incident_date) >= fromDate);
    }
    
    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59); // Set to end of day
      results = results.filter(incident => new Date(incident.incident_date) <= toDate);
    }
    
    setFilteredIncidents(results);
  }, [incidents, searchTerm, filters]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const toggleFilter = () => {
    setFilterOpen(!filterOpen);
  };

  const resetFilters = () => {
    setFilters({
      incident_type: '',
      user_id: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
  };

  const getIncidentTypeLabel = (type) => {
    const incidentType = incidentTypes.find(t => t.value === type);
    return incidentType ? incidentType.label : type;
  };

  const getIncidentTypeClass = (type) => {
    switch(type) {
      case 'low_quiz_score': return 'type-quiz';
      case 'policy_violation': return 'type-policy';
      default: return 'type-other';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Performance Incidents</h1>
        <div style={{ height: '2px', backgroundColor: '#e2e8f0', width: '100%' }}></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                padding: '8px 16px 8px 40px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                width: '300px',
                backgroundColor: 'white',
                color: '#1e293b'
              }}
            />
            {searchTerm && (
              <button 
                style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#64748b' 
                }}
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              backgroundColor: filterOpen ? '#E3F2FD' : 'white', 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              color: filterOpen ? '#1E88E5' : '#64748b', 
              cursor: 'pointer', 
              transition: 'background-color 0.15s ease, color 0.15s ease' 
            }}
            onClick={toggleFilter}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        <div>
          <Link 
            to="/admin/incidents/create" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '8px 16px', 
              backgroundColor: '#1E88E5', 
              color: 'white', 
              borderRadius: '8px', 
              textDecoration: 'none', 
              fontSize: '14px', 
              fontWeight: '500' 
            }}
          >
            <Plus size={16} />
            Record Incident
          </Link>
        </div>
      </div>
      
      {filterOpen && (
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Incident Type</label>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={filters.incident_type}
                onChange={handleFilterChange}
                name="incident_type"
              >
                {incidentTypes.map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Trainee</label>
              <select 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={filters.user_id}
                onChange={handleFilterChange}
                name="user_id"
              >
                {users.map((user, index) => (
                  <option key={index} value={user.value}>{user.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Date From</label>
              <input 
                type="date" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={filters.date_from}
                onChange={handleFilterChange}
                name="date_from"
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Date To</label>
              <input 
                type="date" 
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  fontSize: '14px', 
                  color: '#1e293b', 
                  backgroundColor: 'white' 
                }}
                value={filters.date_to}
                onChange={handleFilterChange}
                name="date_to"
              />
            </div>
            
            <button 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                color: '#64748b', 
                cursor: 'pointer', 
                transition: 'background-color 0.15s ease, color 0.15s ease' 
              }}
              onClick={resetFilters}
            >
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      )}
      
      <div>
        {filteredIncidents.length > 0 ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredIncidents.map((incident) => (
              <div key={incident.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '8px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      backgroundColor: getIncidentTypeClass(incident.incident_type) === 'type-quiz' ? '#E3F2FD' : 
                                      getIncidentTypeClass(incident.incident_type) === 'type-policy' ? '#FFEBEE' : '#F3E5F5'
                    }}>
                      <AlertTriangle size={20} color={getIncidentTypeClass(incident.incident_type) === 'type-quiz' ? '#1E88E5' : 
                                                      getIncidentTypeClass(incident.incident_type) === 'type-policy' ? '#E53935' : '#8E24AA'} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>{getIncidentTypeLabel(incident.incident_type)}</h3>
                      <span style={{ fontSize: '14px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={14} />
                        {formatDate(incident.incident_date)} at {formatTime(incident.incident_date)}
                      </span>
                    </div>
                  </div>
                  <Link 
                    to={`/admin/incidents/${incident.id}`}
                    style={{ color: '#1E88E5', textDecoration: 'none' }}
                    title="View details"
                  >
                    <Eye size={18} />
                  </Link>
                </div>
                
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                    <FileText size={16} />
                    <p style={{ margin: 0 }}>{incident.description}</p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: '#64748b' }}>
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>Trainee:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: '#E3F2FD', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '600', 
                        color: '#1E88E5' 
                      }}>
                        {incident.userName ? incident.userName.charAt(0) : '?'}
                      </div>
                      <span>{incident.userName || 'Unknown'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontWeight: '500', marginBottom: '4px' }}>Reported by:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={14} />
                      {incident.reporterName || 'System'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <AlertTriangle size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No Incidents Found</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>No incidents match your search criteria or no incidents have been recorded yet.</p>
            <Link 
              to="/admin/incidents/create" 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: '#1E88E5', 
                color: 'white', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontSize: '14px', 
                fontWeight: '500' 
              }}
            >
              <Plus size={16} />
              Record New Incident
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceIncidents;