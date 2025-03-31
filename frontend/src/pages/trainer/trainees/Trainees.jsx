import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, ChevronDown, ChevronUp, User, Mail, Trophy,
  Phone, Calendar, CheckCircle, Clock, AlertTriangle, Plus
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

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
        
        const traineesData = await trainerService.getTrainees();
        setTrainees(traineesData);
        
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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleProgramFilterChange = (e) => {
    setFilterProgram(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredTrainees = trainees
    .filter(trainee => {
      const searchMatch = trainee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      let statusMatch = true;
      if (filterStatus !== 'all') {
        statusMatch = trainee.status === filterStatus;
      }
      
      let programMatch = true;
      if (filterProgram !== 'all') {
        programMatch = trainee.programs?.some(program => 
          program.id.toString() === filterProgram
        ) || false;
      }
      
      return searchMatch && statusMatch && programMatch;
    })
    .sort((a, b) => {
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
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

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

  const getStatusBadge = (trainee) => {
    const progress = calculateProgress(trainee);
    
    if (progress === 100) {
      return { style: { background: '#d4edda', color: '#155724' }, icon: <CheckCircle size={14} />, label: 'Completed' };
    } else if (progress > 0) {
      return { style: { background: '#cce5ff', color: '#004085' }, icon: <Clock size={14} />, label: 'In Progress' };
    } else {
      return { style: { background: '#fff3cd', color: '#856404' }, icon: <AlertTriangle size={14} />, label: 'Not Started' };
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {error && <AlertBanner message={error} type="error" />}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px' 
        }}>
          <Users size={24} style={{ color: '#007bff' }} />
          <h2 style={{ 
            fontSize: '24px', 
            margin: 0 
          }}>Trainees</h2>
        </div>
        <div>
  <Link 
    to="/trainer/leaderboard"
    style={{
      padding: '8px 15px',
      background: '#ffc107', // Gold color for leaderboard
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      textDecoration: 'none',
      fontSize: '14px',
      marginRight: '10px' // Add margin between buttons
    }}
  >
    <Trophy size={16} style={{ marginRight: '5px' }} />
    View Leaderboard
  </Link>
  <Link 
    to="/trainer/trainees/export"
    style={{
      padding: '8px 15px',
      background: '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      textDecoration: 'none',
      fontSize: '14px'
    }}
  >
    Export List
  </Link>
</div>
      </div>
      
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          position: 'relative', 
          flex: '1', 
          minWidth: '200px' 
        }}>
          <Search size={18} style={{ 
            position: 'absolute', 
            left: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }} />
          <input 
            type="text" 
            placeholder="Search trainees..." 
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 10px 8px 35px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        <button 
          onClick={toggleFilters}
          style={{
            padding: '8px 15px',
            background: showFilters ? '#007bff' : '#f8f9fa',
            color: showFilters ? 'white' : '#333',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '14px'
          }}
        >
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {showFilters && (
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold'
              }} htmlFor="status-filter">Status:</label>
              <select 
                id="status-filter" 
                value={filterStatus}
                onChange={handleStatusFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold'
              }} htmlFor="program-filter">Program:</label>
              <select 
                id="program-filter" 
                value={filterProgram}
                onChange={handleProgramFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
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
        </div>
      )}
      
      {filteredTrainees.length > 0 ? (
        <div style={{
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
            background: '#f8f9fa',
            padding: '10px 15px',
            borderBottom: '1px solid #eee',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            <div 
              onClick={() => handleSort('name')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'name' ? '#007bff' : '#333'
              }}
            >
              <span>Name</span>
              {sortField === 'name' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              onClick={() => handleSort('email')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'email' ? '#007bff' : '#333'
              }}
            >
              <span>Email</span>
              {sortField === 'email' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>Phone</span>
            </div>
            <div 
              onClick={() => handleSort('enrollment_date')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'enrollment_date' ? '#007bff' : '#333'
              }}
            >
              <span>Enrollment Date</span>
              {sortField === 'enrollment_date' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              onClick={() => handleSort('progress')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                cursor: 'pointer',
                color: sortField === 'progress' ? '#007bff' : '#333'
              }}
            >
              <span>Progress</span>
              {sortField === 'progress' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span>Status</span>
            </div>
          </div>
          
          {filteredTrainees.map(trainee => {
            const statusBadge = getStatusBadge(trainee);
            const progress = calculateProgress(trainee);
            
            return (
              <Link 
                to={`/trainer/trainees/${trainee.id}`} 
                key={trainee.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 1fr',
                  padding: '15px',
                  borderBottom: '1px solid #eee',
                  textDecoration: 'none',
                  color: '#333',
                  transition: 'background 0.2s',
                  ':hover': { background: '#f8f9fa' }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  <div style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: '#007bff',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px'
                  }}>
                    {trainee.full_name.charAt(0)}
                  </div>
                  <span style={{ fontSize: '14px' }}>{trainee.full_name}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '14px'
                }}>
                  <Mail size={16} style={{ color: '#666' }} />
                  <span>{trainee.email}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '14px'
                }}>
                  <Phone size={16} style={{ color: '#666' }} />
                  <span>{trainee.phone || 'N/A'}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  fontSize: '14px'
                }}>
                  <Calendar size={16} style={{ color: '#666' }} />
                  <span>{trainee.enrollment_date ? formatDate(trainee.enrollment_date) : 'N/A'}</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px' 
                }}>
                  <div style={{
                    width: '100px',
                    height: '6px',
                    background: '#eee',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${progress}%`,
                      height: '100%',
                      background: '#007bff',
                      transition: 'width 0.3s'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '14px' }}>{progress}%</span>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <div style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '12px',
                    ...statusBadge.style
                  }}>
                    {statusBadge.icon}
                    <span>{statusBadge.label}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Users size={48} style={{ 
            color: '#007bff', 
            marginBottom: '15px' 
          }} />
          <h3 style={{ 
            margin: '0 0 10px 0',
            fontSize: '20px'
          }}>No trainees found</h3>
          <p style={{ 
            margin: 0,
            color: '#666',
            fontSize: '14px'
          }}>
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