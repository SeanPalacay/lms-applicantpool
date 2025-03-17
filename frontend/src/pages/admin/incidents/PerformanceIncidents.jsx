// src/pages/admin/incidents/PerformanceIncidents.jsx
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
import './styles/PerformanceIncidents.css';

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
    <div className="incidents-container">
      <div className="section-header">
        <h1>Performance Incidents</h1>
        <div className="header-line"></div>
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
      
      <div className="incidents-actions">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            className={`filter-toggle ${filterOpen ? 'active' : ''}`} 
            onClick={toggleFilter}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        <div className="button-container">
          <Link to="/admin/incidents/create" className="action-button primary">
            <Plus size={16} className="icon-inline" /> Record Incident
          </Link>
        </div>
      </div>
      
      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="incident_type">Incident Type</label>
                <select 
                  id="incident_type" 
                  name="incident_type" 
                  value={filters.incident_type}
                  onChange={handleFilterChange}
                >
                  {incidentTypes.map((type, index) => (
                    <option key={index} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="user_id">Trainee</label>
                <select 
                  id="user_id" 
                  name="user_id" 
                  value={filters.user_id}
                  onChange={handleFilterChange}
                >
                  {users.map((user, index) => (
                    <option key={index} value={user.value}>{user.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="date_from">Date From</label>
                <input 
                  type="date" 
                  id="date_from" 
                  name="date_from" 
                  value={filters.date_from}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="date_to">Date To</label>
                <input 
                  type="date" 
                  id="date_to" 
                  name="date_to" 
                  value={filters.date_to}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="filter-actions">
                <button className="reset-filters" onClick={resetFilters}>
                  <X size={14} className="icon-inline" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="incidents-content">
        {filteredIncidents.length > 0 ? (
          <div className="incidents-list">
            {filteredIncidents.map((incident) => (
              <div key={incident.id} className="incident-card">
                <div className="incident-header">
                  <div className={`incident-icon ${getIncidentTypeClass(incident.incident_type)}`}>
                    <AlertTriangle size={20} />
                  </div>
                  <div className="incident-title">
                    <h3>{getIncidentTypeLabel(incident.incident_type)}</h3>
                    <span className="incident-date">
                      <Calendar size={14} className="icon-inline" />
                      {formatDate(incident.incident_date)} at {formatTime(incident.incident_date)}
                    </span>
                  </div>
                  <div className="incident-actions">
                    <Link 
                      to={`/admin/incidents/${incident.id}`}
                      className="view-incident"
                      title="View details"
                    >
                      <Eye size={18} />
                    </Link>
                  </div>
                </div>
                
                <div className="incident-content">
                  <div className="incident-description">
                    <FileText size={16} className="icon-inline" />
                    <p>{incident.description}</p>
                  </div>
                  
                  <div className="incident-meta">
                    <div className="trainee-info">
                      <div className="info-label">Trainee:</div>
                      <div className="trainee-details">
                        <span className="trainee-avatar">
                          {incident.userName ? incident.userName.charAt(0) : '?'}
                        </span>
                        <span className="trainee-name">{incident.userName || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="reporter-info">
                      <div className="info-label">Reported by:</div>
                      <div className="reporter-name">
                        <User size={14} className="icon-inline" />
                        {incident.reporterName || 'System'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-incidents">
            <AlertTriangle size={48} className="no-incidents-icon" />
            <h3>No Incidents Found</h3>
            <p>No incidents match your search criteria or no incidents have been recorded yet.</p>
            <Link to="/admin/incidents/create" className="action-button primary">
              <Plus size={16} className="icon-inline" /> Record New Incident
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceIncidents;