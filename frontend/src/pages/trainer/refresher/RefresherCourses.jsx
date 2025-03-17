import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  RotateCw, Plus, Search, Filter, ChevronDown, ChevronUp, 
  Users, Calendar, Clock, CheckCircle, AlertTriangle, 
  BookOpen, FileText
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';
import './styles/RefresherCourses.css';

/**
 * RefresherCourses Component
 * Displays a list of refresher courses for trainers to manage
 */
const RefresherCourses = () => {
  const navigate = useNavigate();
  const [refresherCourses, setRefresherCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch refresher courses on component mount
  useEffect(() => {
    const fetchRefresherCourses = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Check if user is logged in and has correct role
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
        
        // Fetch refresher courses using trainerService
        const courses = await trainerService.getRefresherCourses();
        setRefresherCourses(courses);
      } catch (err) {
        console.error('Error fetching refresher courses:', err);
        setError('Failed to load refresher courses. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRefresherCourses();
  }, [navigate]);

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

  // Filter and sort refresher courses
  const filteredCourses = refresherCourses
    .filter(course => {
      // Search filter
      const searchMatch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (course.description && course.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Status filter
      let statusMatch = true;
      if (filterStatus !== 'all') {
        statusMatch = course.status === filterStatus;
      }
      
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Sorting logic
      let comparison = 0;
      
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      } else if (sortField === 'enrollments') {
        const aCount = a.enrollments?.length || 0;
        const bCount = b.enrollments?.length || 0;
        comparison = aCount - bCount;
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return (
          <div className="status-badge status-active">
            <CheckCircle size={14} />
            <span>Active</span>
          </div>
        );
      case 'draft':
        return (
          <div className="status-badge status-draft">
            <FileText size={14} />
            <span>Draft</span>
          </div>
        );
      case 'archived':
        return (
          <div className="status-badge status-archived">
            <AlertTriangle size={14} />
            <span>Archived</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Calculate completion rate
  const calculateCompletionRate = (course) => {
    if (!course.enrollments || course.enrollments.length === 0) {
      return 0;
    }
    
    const completedCount = course.enrollments.filter(
      enrollment => enrollment.completion_status === 'completed'
    ).length;
    
    return Math.round((completedCount / course.enrollments.length) * 100);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="refresher-courses-container">
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header with action buttons */}
      <div className="refresher-header">
        <div className="header-title">
          <RotateCw size={24} className="header-icon" />
          <h2>Refresher Courses</h2>
        </div>
        <div className="header-actions">
          <Link to="/trainer/refresher-courses/create" className="btn-create">
            <Plus size={18} />
            <span>Create Course</span>
          </Link>
          <Link to="/trainer/refresher-enrollment" className="btn-enroll">
            <Users size={18} />
            <span>Enroll Trainees</span>
          </Link>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search refresher courses..." 
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
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      )}
      
      {/* Refresher Courses List */}
      {filteredCourses.length > 0 ? (
        <div className="refresher-courses-list">
          {/* Table header */}
          <div className="refresher-table-header">
            <div 
              className={`refresher-header title-col ${sortField === 'title' ? 'sorted' : ''}`}
              onClick={() => handleSort('title')}
            >
              <span>Title</span>
              {sortField === 'title' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div className="refresher-header description-col">
              <span>Description</span>
            </div>
            <div 
              className={`refresher-header date-col ${sortField === 'created_at' ? 'sorted' : ''}`}
              onClick={() => handleSort('created_at')}
            >
              <span>Created</span>
              {sortField === 'created_at' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`refresher-header enrollments-col ${sortField === 'enrollments' ? 'sorted' : ''}`}
              onClick={() => handleSort('enrollments')}
            >
              <span>Enrollments</span>
              {sortField === 'enrollments' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div className="refresher-header completion-col">
              <span>Completion Rate</span>
            </div>
            <div className="refresher-header status-col">
              <span>Status</span>
            </div>
          </div>
          
          {/* Table rows */}
          {filteredCourses.map(course => (
            <Link 
              to={`/trainer/refresher-courses/${course.id}`} 
              key={course.id}
              className="refresher-item"
            >
              <div className="refresher-col title-col">
                <RotateCw size={18} className="refresher-icon" />
                <span className="refresher-title">{course.title}</span>
              </div>
              <div className="refresher-col description-col">
                <p className="refresher-description">
                  {course.description ? 
                    (course.description.length > 80 ? 
                      course.description.substring(0, 80) + '...' : 
                      course.description) : 
                    'No description'}
                </p>
              </div>
              <div className="refresher-col date-col">
                <Calendar size={16} className="col-icon" />
                <span>{formatDate(course.created_at)}</span>
              </div>
              <div className="refresher-col enrollments-col">
                <Users size={16} className="col-icon" />
                <span>{course.enrollments?.length || 0} trainees</span>
              </div>
              <div className="refresher-col completion-col">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateCompletionRate(course)}%` }}
                  ></div>
                </div>
                <span className="completion-rate">{calculateCompletionRate(course)}%</span>
              </div>
              <div className="refresher-col status-col">
                {getStatusBadge(course.status)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="no-refresher-courses-message">
          <RotateCw size={48} />
          <h3>No refresher courses found</h3>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first refresher course'}
          </p>
          <Link to="/trainer/refresher-courses/create" className="btn-create-large">
            <Plus size={18} />
            Create Refresher Course
          </Link>
        </div>
      )}
    </div>
  );
};

export default RefresherCourses;