import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Added useNavigate
import { 
  Flag, Plus, Filter, Search, Clock, Calendar, BookOpen, 
  CheckCircle, AlertTriangle, UserCheck, ChevronDown, ChevronUp, 
  Calendar as CalendarIcon, BookOpen as BookOpenIcon
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService'; // Import trainerService
import './styles/Milestones.css';

/**
 * Milestones Component
 * Lists all milestones for trainers to manage
 */
const Milestones = () => {
  const navigate = useNavigate(); // Added for navigation checks
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [sortField, setSortField] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch milestones and programs on component mount
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

        // Fetch milestones and programs using trainerService
        const milestonesData = await trainerService.getMilestones();
        const programsData = await trainerService.getPrograms();

        setMilestones(milestonesData);
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load milestones. Please try again later.');
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

  // Handle sort change
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
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

  // Calculate status based on trainees' progress
  const calculateStatus = (milestone) => {
    if (!milestone.trainees || milestone.trainees.length === 0) {
      return { status: 'unassigned', label: 'Unassigned' };
    }
    
    const completed = milestone.trainees.filter(t => 
      t.progress && t.progress.status === 'completed'
    ).length;
    
    const total = milestone.trainees.length;
    
    if (completed === total) {
      return { status: 'completed', label: 'Completed' };
    } else if (completed > 0) {
      return { status: 'in-progress', label: 'In Progress' };
    } else {
      return { status: 'not-started', label: 'Not Started' };
    }
  };

  // Filter and sort milestones
  const filteredMilestones = milestones
    .filter(milestone => {
      const searchMatch = milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (milestone.description && milestone.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let statusMatch = true;
      if (filterStatus !== 'all') {
        const status = calculateStatus(milestone).status;
        statusMatch = filterStatus === status;
      }
      
      let programMatch = true;
      if (filterProgram !== 'all') {
        programMatch = milestone.program_id.toString() === filterProgram;
      }
      
      return searchMatch && statusMatch && programMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'due_date') {
        comparison = new Date(a.due_date) - new Date(b.due_date);
      } else if (sortField === 'program') {
        comparison = (a.program?.title || '').localeCompare(b.program?.title || '');
      } else if (sortField === 'status') {
        const statusA = calculateStatus(a).status;
        const statusB = calculateStatus(b).status;
        comparison = statusA.localeCompare(statusB);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Check if due date is past
  const isPastDue = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Check if due date is approaching (within 7 days)
  const isApproaching = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateString);
    dueDate.setHours(0, 0, 0, 0);
    const differenceInTime = dueDate.getTime() - today.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays >= 0 && differenceInDays <= 7;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="milestones-container">
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header with action buttons */}
      <div className="milestones-header">
        <div className="header-title">
          <Flag size={24} className="header-icon" />
          <h2>Milestones</h2>
        </div>
        <div className="header-actions">
          <Link to="/trainer/milestones/create" className="btn-create">
            <Plus size={18} />
            <span>Create Milestone</span>
          </Link>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search milestones..." 
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
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="not-started">Not Started</option>
              <option value="unassigned">Unassigned</option>
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
      
      {/* Milestones list */}
      {filteredMilestones.length > 0 ? (
        <div className="milestones-list">
          {/* Table header */}
          <div className="milestones-table-header">
            <div 
              className={`milestone-header title-col ${sortField === 'title' ? 'sorted' : ''}`}
              onClick={() => handleSort('title')}
            >
              <span>Title</span>
              {sortField === 'title' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`milestone-header program-col ${sortField === 'program' ? 'sorted' : ''}`}
              onClick={() => handleSort('program')}
            >
              <span>Program</span>
              {sortField === 'program' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`milestone-header due-date-col ${sortField === 'due_date' ? 'sorted' : ''}`}
              onClick={() => handleSort('due_date')}
            >
              <span>Due Date</span>
              {sortField === 'due_date' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`milestone-header status-col ${sortField === 'status' ? 'sorted' : ''}`}
              onClick={() => handleSort('status')}
            >
              <span>Status</span>
              {sortField === 'status' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div className="milestone-header trainees-col">
              <span>Trainees</span>
            </div>
          </div>
          
          {/* Table rows */}
          {filteredMilestones.map(milestone => {
            const status = calculateStatus(milestone);
            const pastDue = isPastDue(milestone.due_date);
            const approaching = isApproaching(milestone.due_date);
            
            return (
              <Link 
                to={`/trainer/milestones/${milestone.id}`} 
                key={milestone.id}
                className="milestone-item"
              >
                <div className="milestone-col title-col">
                  <Flag size={18} className={`milestone-icon status-${status.status}`} />
                  <span className="milestone-title">{milestone.title}</span>
                </div>
                <div className="milestone-col program-col">
                  <BookOpenIcon size={16} className="col-icon" />
                  <span>{milestone.program?.title || 'Unknown Program'}</span>
                </div>
                <div className="milestone-col due-date-col">
                  <CalendarIcon size={16} className={`col-icon ${pastDue ? 'overdue' : (approaching ? 'approaching' : '')}`} />
                  <span className={pastDue ? 'overdue' : (approaching ? 'approaching' : '')}>
                    {formatDate(milestone.due_date)}
                    {pastDue && <span className="overdue-label">Overdue</span>}
                    {!pastDue && approaching && <span className="approaching-label">Soon</span>}
                  </span>
                </div>
                <div className="milestone-col status-col">
                  <div className={`status-badge status-${status.status}`}>
                    {status.status === 'completed' && <CheckCircle size={14} />}
                    {status.status === 'in-progress' && <Clock size={14} />}
                    {status.status === 'not-started' && <AlertTriangle size={14} />}
                    {status.status === 'unassigned' && <Flag size={14} />}
                    <span>{status.label}</span>
                  </div>
                </div>
                <div className="milestone-col trainees-col">
                  <UserCheck size={16} className="col-icon" />
                  <div className="trainee-counts">
                    <span className="total-trainees">
                      {milestone.trainees?.length || 0} trainees
                    </span>
                    {milestone.trainees && milestone.trainees.length > 0 && (
                      <span className="completed-trainees">
                        {milestone.trainees.filter(t => t.progress && t.progress.status === 'completed').length} completed
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="no-milestones-message">
          <Flag size={48} />
          <h3>No milestones found</h3>
          <p>
            {searchQuery || filterStatus !== 'all' || filterProgram !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first milestone'}
          </p>
          <Link to="/trainer/milestones/create" className="btn-create-large">
            <Plus size={18} />
            Create Milestone
          </Link>
        </div>
      )}
    </div>
  );
};

export default Milestones;