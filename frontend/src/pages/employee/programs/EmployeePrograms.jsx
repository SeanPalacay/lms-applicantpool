import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Search, Filter, ChevronDown, ChevronUp, 
  Calendar, Clock, CheckCircle, AlertTriangle
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import employeeService from '../../../services/employeeService'; // Import employeeService instead

const EmployeePrograms = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('enrollment_date');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    const fetchPrograms = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await employeeService.getPrograms(); // Use employeeService
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

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setFilterStatus(e.target.value);
  const toggleFilters = () => setShowFilters(!showFilters);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const filteredPrograms = programs
    .filter(program => {
      const searchMatch = program.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const statusMatch = filterStatus === 'all' || program.completion_status === filterStatus;
      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'enrollment_date') {
        comparison = new Date(a.enrollment_date || 0) - new Date(b.enrollment_date || 0);
      } else if (sortField === 'completion_percentage') {
        comparison = (parseFloat(a.completion_percentage) || 0) - (parseFloat(b.completion_percentage) || 0);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {error && <AlertBanner message={error} type="error" />}

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <BookOpen size={24} style={{ color: '#007bff' }} />
        <h2 style={{ fontSize: '24px', margin: 0, color: '#333' }}>My Training Programs</h2>
      </div>

      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px', 
        flexWrap: 'wrap', 
        alignItems: 'center' 
      }}>
        {/* Search and filter UI remains the same */}
        <div style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
          <input 
            type="text" 
            placeholder="Search programs..." 
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ 
              width: '100%', 
              padding: '10px 10px 10px 35px', 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              fontSize: '14px' 
            }}
          />
        </div>
        <button 
          onClick={toggleFilters}
          style={{ 
            padding: '10px 15px', 
            background: '#f8f9fa', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            fontSize: '14px', 
            color: '#666' 
          }}
        >
          <Filter size={18} /> <span>Filters</span> {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showFilters && (
        <div style={{ 
          background: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px' 
        }}>
          {/* Filter controls remain the same */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
            <label htmlFor="status-filter" style={{ fontSize: '14px', color: '#666' }}>Status:</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={handleStatusFilterChange}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                fontSize: '14px', 
                flex: '1' 
              }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="not_started">Not Started</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
            <label htmlFor="sort-field" style={{ fontSize: '14px', color: '#666' }}>Sort By:</label>
            <select
              id="sort-field"
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                fontSize: '14px', 
                flex: '1' 
              }}
            >
              <option value="enrollment_date">Enrollment Date</option>
              <option value="title">Title</option>
              <option value="completion_percentage">Completion Percentage</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              style={{ 
                padding: '8px', 
                background: '#f8f9fa', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              {sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      )}

      {filteredPrograms.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          {filteredPrograms.map(program => (
            <Link 
              to={`/employee/programs/${program.id}`} // Update link path to employee route
              key={program.id}
              style={{ 
                textDecoration: 'none', 
                background: '#fff', 
                borderRadius: '8px', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
                padding: '15px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '15px' 
              }}
            >
              {/* Program card contents remain the same */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#007bff' }}>
                  <BookOpen size={24} />
                </div>
                <div style={{ fontSize: '12px' }}>
                  {program.completion_status === 'completed' && (
                    <div style={{ 
                      padding: '4px 8px', 
                      background: '#d4edda', 
                      color: '#155724', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <CheckCircle size={16} /> <span>Completed</span>
                    </div>
                  )}
                  {program.completion_status === 'in_progress' && (
                    <div style={{ 
                      padding: '4px 8px', 
                      background: '#cce5ff', 
                      color: '#004085', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <Clock size={16} /> <span>In Progress</span>
                    </div>
                  )}
                  {program.completion_status === 'not_started' && (
                    <div style={{ 
                      padding: '4px 8px', 
                      background: '#fff3cd', 
                      color: '#856404', 
                      borderRadius: '4px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <AlertTriangle size={16} /> <span>Not Started</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '16px', margin: '0 0 10px 0', color: '#333' }}>{program.title}</h3>
                {program.description && (
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    {program.description.length > 120 ? program.description.substring(0, 120) + '...' : program.description}
                  </p>
                )}
              </div>

              <div style={{ fontSize: '12px', color: '#666' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Calendar size={14} /> <span>Enrolled: {formatDate(program.enrollment_date)}</span>
                  </div>
                  <span style={{ 
                    padding: '2px 6px', 
                    background: '#e9ecef', 
                    borderRadius: '4px' 
                  }}>
                    {program.type || 'Regular'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: '#e9ecef', 
                    borderRadius: '3px', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      width: `${program.completion_percentage || 0}%`, 
                      height: '100%', 
                      background: '#007bff', 
                      transition: 'width 0.3s' 
                    }}></div>
                  </div>
                  <span>{program.completion_percentage || 0}% complete</span>
                </div>
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
          padding: '40px', 
          textAlign: 'center' 
        }}>
          <BookOpen size={48} style={{ color: '#666', marginBottom: '15px' }} />
          <h3 style={{ fontSize: '18px', margin: '0 0 10px 0', color: '#333' }}>No programs found</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filters' : 'You are not enrolled in any training programs yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default EmployeePrograms;