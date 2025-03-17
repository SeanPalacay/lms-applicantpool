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
    const badgeStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--spacing-xs)',
      padding: 'var(--spacing-xs) var(--spacing-sm)',
      borderRadius: 'var(--radius-sm)',
      fontSize: '12px',
      fontWeight: '500',
    };

    switch(status) {
      case 'active':
        return (
          <div style={{ ...badgeStyle, backgroundColor: 'var(--primary-ultralight)', color: 'var(--primary-color)' }}>
            <CheckCircle size={14} />
            <span>Active</span>
          </div>
        );
      case 'draft':
        return (
          <div style={{ ...badgeStyle, backgroundColor: 'var(--light-gray)', color: 'var(--text-secondary)' }}>
            <FileText size={14} />
            <span>Draft</span>
          </div>
        );
      case 'archived':
        return (
          <div style={{ ...badgeStyle, backgroundColor: 'rgba(231, 76, 60, 0.1)', color: 'var(--danger-color)' }}>
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
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header with action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <RotateCw size={24} style={{ color: 'var(--primary-color)' }} />
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Refresher Courses</h2>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link 
            to="/trainer/refresher-courses/create" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              borderRadius: 'var(--radius-md)', 
              textDecoration: 'none',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
          >
            <Plus size={18} />
            <span>Create Course</span>
          </Link>
          <Link 
            to="/trainer/refresher-enrollment" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              backgroundColor: 'var(--secondary-color)', 
              color: 'white', 
              borderRadius: 'var(--radius-md)', 
              textDecoration: 'none',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#28a79c'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--secondary-color)'}
          >
            <Users size={18} />
            <span>Enroll Trainees</span>
          </Link>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search refresher courses..." 
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ 
              flex: 1, 
              padding: 'var(--spacing-sm)', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-md)', 
              outline: 'none',
              transition: 'border-color var(--transition-fast)',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--medium-gray)'}
          />
        </div>
        
        <button 
          onClick={toggleFilters} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm) var(--spacing-md)', 
            backgroundColor: 'transparent', 
            border: '1px solid var(--medium-gray)', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            transition: 'background-color var(--transition-fast)',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--light-gray)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Filter size={18} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div style={{ 
          padding: 'var(--spacing-md)', 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: 'var(--spacing-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
            <label htmlFor="status-filter" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Status:</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={handleStatusFilterChange}
              style={{ 
                padding: 'var(--spacing-sm)', 
                border: '1px solid var(--medium-gray)', 
                borderRadius: 'var(--radius-md)', 
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--medium-gray)'}
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
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
          {/* Table header */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr 1fr', 
            gap: 'var(--spacing-md)', 
            padding: 'var(--spacing-md)', 
            borderBottom: '1px solid var(--medium-gray)', 
            fontWeight: '600', 
            color: 'var(--text-secondary)',
          }}>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              onClick={() => handleSort('title')}
            >
              <span>Title</span>
              {sortField === 'title' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div>Description</div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              onClick={() => handleSort('created_at')}
            >
              <span>Created</span>
              {sortField === 'created_at' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              onClick={() => handleSort('enrollments')}
            >
              <span>Enrollments</span>
              {sortField === 'enrollments' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div>Completion Rate</div>
            <div>Status</div>
          </div>
          
          {/* Table rows */}
          {filteredCourses.map(course => (
            <Link 
              to={`/trainer/refresher-courses/${course.id}`} 
              key={course.id}
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr 1fr', 
                gap: 'var(--spacing-md)', 
                padding: 'var(--spacing-md)', 
                borderBottom: '1px solid var(--medium-gray)', 
                textDecoration: 'none', 
                color: 'var(--text-primary)',
                transition: 'background-color var(--transition-fast)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--light-gray)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <RotateCw size={18} style={{ color: 'var(--primary-color)' }} />
                <span style={{ fontWeight: '500' }}>{course.title}</span>
              </div>
              <div>
                <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                  {course.description ? 
                    (course.description.length > 80 ? 
                      course.description.substring(0, 80) + '...' : 
                      course.description) : 
                    'No description'}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                <Calendar size={16} />
                <span>{formatDate(course.created_at)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                <Users size={16} />
                <span>{course.enrollments?.length || 0} trainees</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--light-gray)', borderRadius: 'var(--radius-full)' }}>
                  <div 
                    style={{ 
                      width: `${calculateCompletionRate(course)}%`, 
                      height: '100%', 
                      backgroundColor: 'var(--primary-color)', 
                      borderRadius: 'var(--radius-full)',
                    }}
                  ></div>
                </div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{calculateCompletionRate(course)}%</span>
              </div>
              <div>
                {getStatusBadge(course.status)}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 'var(--spacing-md)', 
          padding: 'var(--spacing-xl)', 
          textAlign: 'center', 
          color: 'var(--text-secondary)',
        }}>
          <RotateCw size={48} style={{ color: 'var(--primary-color)' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>No refresher courses found</h3>
          <p>
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first refresher course'}
          </p>
          <Link 
            to="/trainer/refresher-courses/create" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              borderRadius: 'var(--radius-md)', 
              textDecoration: 'none',
              transition: 'background-color var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
          >
            <Plus size={18} />
            Create Refresher Course
          </Link>
        </div>
      )}
    </div>
  );
};

export default RefresherCourses;