import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Search, Filter, ChevronDown, ChevronUp, 
  Calendar, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import traineeService from '../../../services/traineeService';
import './styles/TraineePrograms.css';

/**
 * TraineePrograms Component
 * Displays a list of programs the trainee is enrolled in
 */
const TraineePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('enrollment_date');
  const [sortDirection, setSortDirection] = useState('desc');

  // Fetch trainee's programs on component mount
  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await traineeService.getPrograms();
        setPrograms(data);
      } catch (err) {
        console.error('Error fetching programs:', err);
        setError(err.message || 'Failed to load your programs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Filter and sort programs
  const filteredPrograms = programs
    .filter(program => {
      // Search filter
      const searchMatch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      let statusMatch = true;
      if (filterStatus !== 'all') {
        statusMatch = program.completion_status === filterStatus;
      }
      
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Sorting logic
      let comparison = 0;
      
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'enrollment_date') {
        comparison = new Date(a.enrollment_date || 0) - new Date(b.enrollment_date || 0);
      } else if (sortField === 'completion_percentage') {
        const percentA = parseFloat(a.completion_percentage) || 0;
        const percentB = parseFloat(b.completion_percentage) || 0;
        comparison = percentA - percentB;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="trainee-programs-container">
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header */}
      <div className="programs-header">
        <div className="header-title">
          <BookOpen size={24} className="header-icon" />
          <h2>My Programs</h2>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search programs..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <button 
          onClick={toggleFilters} 
          className="btn-toggle-filters"
          type="button"
        >
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={handleStatusFilterChange}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="sort-field">Sort By:</label>
            <select
              id="sort-field"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="filter-select"
            >
              <option value="enrollment_date">Enrollment Date</option>
              <option value="title">Title</option>
              <option value="completion_percentage">Completion Percentage</option>
            </select>
            
            <button
              type="button"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="btn-sort-direction"
            >
              {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      )}
      
      {/* Programs Grid */}
      {filteredPrograms.length > 0 ? (
        <div className="programs-grid">
          {filteredPrograms.map(program => (
            <Link 
              to={`/trainee/programs/${program.id}`} 
              key={program.id}
              className="program-card"
            >
              <div className="program-header">
                <div className="program-icon">
                  <BookOpen size={24} />
                </div>
                <div className="program-status">
                  {program.completion_status === 'completed' && (
                    <div className="status-badge status-completed">
                      <CheckCircle size={16} />
                      <span>Completed</span>
                    </div>
                  )}
                  {program.completion_status === 'in_progress' && (
                    <div className="status-badge status-in-progress">
                      <Clock size={16} />
                      <span>In Progress</span>
                    </div>
                  )}
                  {program.completion_status === 'not_started' && (
                    <div className="status-badge status-not-started">
                      <AlertTriangle size={16} />
                      <span>Not Started</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="program-content">
                <h3 className="program-title">{program.title}</h3>
                {program.description && (
                  <p className="program-description">
                    {program.description.length > 120 
                      ? program.description.substring(0, 120) + '...' 
                      : program.description}
                  </p>
                )}
              </div>
              
              <div className="program-footer">
                <div className="program-meta">
                  <div className="meta-item">
                    <Calendar size={14} className="meta-icon" />
                    <span>Enrolled: {formatDate(program.enrollment_date)}</span>
                  </div>
                  <div className="meta-item">
                    <span className="program-type">{program.type || 'Regular'}</span>
                  </div>
                </div>
                
                <div className="program-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${program.completion_percentage || 0}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{program.completion_percentage || 0}% complete</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="no-programs-message">
          <BookOpen size={48} />
          <h3>No programs found</h3>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'You are not enrolled in any programs yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TraineePrograms;