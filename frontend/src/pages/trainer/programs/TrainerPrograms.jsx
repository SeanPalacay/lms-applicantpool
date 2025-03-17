// src/pages/trainer/programs/TrainerPrograms.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Calendar, 
  Clock,
  Users,
  X,
  Plus,
  Eye,
  BarChart2,
  GraduationCap
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';
import './styles/TrainerPrograms.css';

const TrainerPrograms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.message || null);
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    status: 'active'
  });
  
  const programTypes = [
    { value: '', label: 'All Types' },
    { value: 'regular', label: 'Regular' },
    { value: 'refresher', label: 'Refresher' }
  ];
  
  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: '', label: 'All Status' }
  ];

  useEffect(() => {
    const fetchPrograms = async () => {
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
        
        // Check if user has trainer role
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch programs data
        const data = await trainerService.getPrograms();
        setPrograms(data);
        
        // Apply initial filter for active programs
        const activePrograms = data.filter(program => program.status === 'active');
        setFilteredPrograms(activePrograms);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError('Failed to load programs. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
    
    // Clear location state after using it
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location.state]);

  useEffect(() => {
    // Apply filters and search
    let results = programs;
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(program => 
        program.title.toLowerCase().includes(term) || 
        (program.description && program.description.toLowerCase().includes(term))
      );
    }
    
    // Apply filters
    if (filters.type) {
      results = results.filter(program => program.type === filters.type);
    }
    
    if (filters.status) {
      results = results.filter(program => program.status === filters.status);
    }
    
    setFilteredPrograms(results);
  }, [programs, searchTerm, filters]);

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
      type: '',
      status: 'active'
    });
    setSearchTerm('');
  };

  const getStatusClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  const getProgramTypeClass = (type) => {
    return type === 'regular' ? 'type-regular' : 'type-refresher';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="trainer-programs-container">
      <div className="section-header">
        <h1>Training Programs</h1>
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
      
      <div className="programs-actions">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search programs..."
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
          <Link to="/trainer/quizzes/create" className="action-button primary">
            <Plus size={16} className="icon-inline" /> Add Quiz
          </Link>
          <Link to="/trainer/milestones/create" className="action-button secondary">
            <Plus size={16} className="icon-inline" /> Add Milestone
          </Link>
        </div>
      </div>
      
      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="type">Program Type</label>
                <select 
                  id="type" 
                  name="type" 
                  value={filters.type}
                  onChange={handleFilterChange}
                >
                  {programTypes.map((type, index) => (
                    <option key={index} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="status">Status</label>
                <select 
                  id="status" 
                  name="status" 
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  {statusOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>
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
      
      <div className="programs-content">
        {filteredPrograms.length > 0 ? (
          <div className="programs-grid">
            {filteredPrograms.map((program) => (
              <div key={program.id} className="program-card">
                <div className="program-header">
                  <div className="program-badges">
                    <span className={`program-type ${getProgramTypeClass(program.type)}`}>
                      {program.type === 'regular' ? 'Regular' : 'Refresher'}
                    </span>
                    <span className={`program-status ${getStatusClass(program.status)}`}>
                      {program.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Link 
                    to={`/trainer/programs/${program.id}`}
                    className="view-program"
                    title="View details"
                  >
                    <Eye size={20} />
                  </Link>
                </div>
                
                <div className="program-title">
                  <h3>{program.title}</h3>
                </div>
                
                <div className="program-content">
                  <div className="program-description">
                    <p>{program.description}</p>
                  </div>
                  
                  <div className="program-stats">
                    <div className="stat-item">
                      <div className="stat-icon">
                        <Users size={18} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{program.enrollmentCount || 0}</div>
                        <div className="stat-label">Trainees</div>
                      </div>
                    </div>
                    
                    <div className="stat-item">
                      <div className="stat-icon">
                        <GraduationCap size={18} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{program.completionRate || 0}%</div>
                        <div className="stat-label">Completion</div>
                      </div>
                    </div>
                    
                    <div className="stat-item">
                      <div className="stat-icon">
                        <BarChart2 size={18} />
                      </div>
                      <div className="stat-content">
                        <div className="stat-value">{program.averageScore || 'N/A'}</div>
                        <div className="stat-label">Avg. Score</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="program-meta">
                    <div className="meta-item">
                      <Calendar size={14} className="icon-inline" />
                      <span>Created: {formatDate(program.created_at)}</span>
                    </div>
                    
                    <div className="meta-item">
                      <Clock size={14} className="icon-inline" />
                      <span>{program.quizCount || 0} Quizzes</span>
                    </div>
                  </div>
                  
                  <div className="program-actions">
                    <Link to={`/trainer/quizzes?programId=${program.id}`} className="program-action">
                      Manage Quizzes
                    </Link>
                    <Link to={`/trainer/milestones?programId=${program.id}`} className="program-action">
                      Manage Milestones
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-programs">
            <BookOpen size={48} className="no-programs-icon" />
            <h3>No Programs Found</h3>
            <p>No programs match your search criteria or no programs have been assigned to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerPrograms;