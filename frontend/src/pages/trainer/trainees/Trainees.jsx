import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, ChevronDown, ChevronUp, User, Mail, 
  Phone, Calendar, CheckCircle, Clock, AlertTriangle, Plus
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';
import './styles/Trainees.css';

/**
 * Trainees Component
 * Displays a list of trainees for trainers to manage
 */
const Trainees = () => {
  const navigate = useNavigate();
  const [trainees, setTrainees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Fetch trainees and programs on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch trainees using trainerService
        const traineesData = await trainerService.getTrainees();
        setTrainees(traineesData);
        
        // Fetch programs for filtering
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load trainees. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  // Handle program filter change
  const handleProgramFilterChange = (e) => {
    setFilterProgram(e.target.value);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle sorting
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

  // Filter and sort trainees
  const filteredTrainees = trainees
    .filter(trainee => {
      // Search filter
      const searchMatch = trainee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      let statusMatch = true;
      if (filterStatus !== 'all') {
        statusMatch = trainee.status === filterStatus;
      }
      
      // Program filter
      let programMatch = true;
      if (filterProgram !== 'all') {
        programMatch = trainee.programs?.some(program => 
          program.id.toString() === filterProgram
        ) || false;
      }
      
      return searchMatch && statusMatch && programMatch;
    })
    .sort((a, b) => {
      // Sorting logic
      let comparison = 0;
      
      if (sortField === 'name') {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortField === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortField === 'progress') {
        const progressA = a.progress || 0;
        const progressB = b.progress || 0;
        comparison = progressA - progressB;
      } else if (sortField === 'enrollment_date') {
        comparison = new Date(a.enrollment_date || 0) - new Date(b.enrollment_date || 0);
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Calculate overall progress for a trainee
  const calculateProgress = (trainee) => {
    if (!trainee.programs || trainee.programs.length === 0) {
      return 0;
    }
    
    const totalPrograms = trainee.programs.length;
    const completedPrograms = trainee.programs.filter(program => 
      program.completion_status === 'completed'
    ).length;
    
    const inProgressPrograms = trainee.programs.filter(program => 
      program.completion_status === 'in_progress'
    ).length;
    
    if (completedPrograms === totalPrograms) {
      return 100;
    } else {
      const completedPercentage = (completedPrograms / totalPrograms) * 100;
      const inProgressContribution = (inProgressPrograms / totalPrograms) * 
        (trainee.programs
          .filter(program => program.completion_status === 'in_progress')
          .reduce((sum, program) => sum + (program.completion_percentage || 0), 0) / 
          (inProgressPrograms || 1));
      
      return Math.round(completedPercentage + inProgressContribution);
    }
  };

  // Determine trainee status badge
  const getStatusBadge = (trainee) => {
    const progress = calculateProgress(trainee);
    
    if (progress === 100) {
      return { class: 'status-completed', icon: <CheckCircle size={14} />, label: 'Completed' };
    } else if (progress > 0) {
      return { class: 'status-in-progress', icon: <Clock size={14} />, label: 'In Progress' };
    } else {
      return { class: 'status-not-started', icon: <AlertTriangle size={14} />, label: 'Not Started' };
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="trainees-container">
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header with action buttons */}
      <div className="trainees-header">
        <div className="header-title">
          <Users size={24} className="header-icon" />
          <h2>Trainees</h2>
        </div>
        <div className="header-actions">
          <Link to="/trainer/trainees/export" className="btn-export">
            <span>Export List</span>
          </Link>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search trainees..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <button onClick={toggleFilters} className="btn-toggle-filters">
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="program-filter">Program:</label>
            <select 
              id="program-filter" 
              value={filterProgram}
              onChange={handleProgramFilterChange}
              className="filter-select"
            >
              <option value="all">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id.toString()}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Trainees list */}
      {filteredTrainees.length > 0 ? (
        <div className="trainees-list">
          {/* Table header */}
          <div className="trainees-table-header">
            <div 
              className={`trainee-header name-col ${sortField === 'name' ? 'sorted' : ''}`}
              onClick={() => handleSort('name')}
            >
              <span>Name</span>
              {sortField === 'name' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`trainee-header email-col ${sortField === 'email' ? 'sorted' : ''}`}
              onClick={() => handleSort('email')}
            >
              <span>Email</span>
              {sortField === 'email' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div className="trainee-header phone-col">
              <span>Phone</span>
            </div>
            <div 
              className={`trainee-header enrollment-col ${sortField === 'enrollment_date' ? 'sorted' : ''}`}
              onClick={() => handleSort('enrollment_date')}
            >
              <span>Enrollment Date</span>
              {sortField === 'enrollment_date' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`trainee-header progress-col ${sortField === 'progress' ? 'sorted' : ''}`}
              onClick={() => handleSort('progress')}
            >
              <span>Progress</span>
              {sortField === 'progress' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div className="trainee-header status-col">
              <span>Status</span>
            </div>
          </div>
          
          {/* Table rows */}
          {filteredTrainees.map(trainee => {
            const statusBadge = getStatusBadge(trainee);
            const progress = calculateProgress(trainee);
            
            return (
              <Link 
                to={`/trainer/trainees/${trainee.id}`} 
                key={trainee.id}
                className="trainee-item"
              >
                <div className="trainee-col name-col">
                  <div className="trainee-avatar">
                    {trainee.full_name.charAt(0)}
                  </div>
                  <span className="trainee-name">{trainee.full_name}</span>
                </div>
                <div className="trainee-col email-col">
                  <Mail size={16} className="col-icon" />
                  <span>{trainee.email}</span>
                </div>
                <div className="trainee-col phone-col">
                  <Phone size={16} className="col-icon" />
                  <span>{trainee.phone || 'N/A'}</span>
                </div>
                <div className="trainee-col enrollment-col">
                  <Calendar size={16} className="col-icon" />
                  <span>{trainee.enrollment_date ? formatDate(trainee.enrollment_date) : 'N/A'}</span>
                </div>
                <div className="trainee-col progress-col">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{progress}%</span>
                </div>
                <div className="trainee-col status-col">
                  <div className={`status-badge ${statusBadge.class}`}>
                    {statusBadge.icon}
                    <span>{statusBadge.label}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="no-trainees-message">
          <Users size={48} />
          <h3>No trainees found</h3>
          <p>
            {searchQuery || filterStatus !== 'all' || filterProgram !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No trainees are currently enrolled in your programs'}
          </p>
        </div>
      )}
    </div>
  );
};

export default Trainees;