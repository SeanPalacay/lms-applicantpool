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
        
        const data = await trainerService.getPrograms();
        setPrograms(data);
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
    
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location.state]);

  useEffect(() => {
    let results = programs;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(program => 
        program.title.toLowerCase().includes(term) || 
        (program.description && program.description.toLowerCase().includes(term))
      );
    }
    
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
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
          Training Programs
        </h1>
        <div style={{ height: '2px', width: '60px', backgroundColor: 'var(--primary-color)' }}></div>
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
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <div style={{ position: 'absolute', left: 'var(--spacing-sm)', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: 'var(--spacing-sm) var(--spacing-md) var(--spacing-sm) calc(var(--spacing-md) + 24px)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--medium-gray)',
                outline: 'none',
                backgroundColor: 'white'
              }}
            />
            {searchTerm && (
              <button 
                style={{ 
                  position: 'absolute', 
                  right: 'var(--spacing-sm)', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)' 
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
              gap: 'var(--spacing-xs)', 
              background: 'none', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-sm)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              cursor: 'pointer', 
              color: 'var(--text-primary)' 
            }}
            onClick={toggleFilter}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link 
            to="/trainer/quizzes/create" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              background: 'var(--primary-color)', 
              color: 'white', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              borderRadius: 'var(--radius-sm)', 
              textDecoration: 'none' 
            }}
          >
            <Plus size={16} />
            <span>Add Quiz</span>
          </Link>
          <Link 
            to="/trainer/milestones/create" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              background: 'var(--secondary-color)', 
              color: 'white', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              borderRadius: 'var(--radius-sm)', 
              textDecoration: 'none' 
            }}
          >
            <Plus size={16} />
            <span>Add Milestone</span>
          </Link>
        </div>
      </div>
      
      {filterOpen && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)', 
          marginBottom: 'var(--spacing-md)', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="type" style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                Program Type
              </label>
              <select 
                id="type" 
                name="type" 
                value={filters.type}
                onChange={handleFilterChange}
                style={{ 
                  width: '100%', 
                  padding: 'var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--medium-gray)', 
                  outline: 'none', 
                  backgroundColor: 'white' 
                }}
              >
                {programTypes.map((type, index) => (
                  <option key={index} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ flex: 1 }}>
              <label htmlFor="status" style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                Status
              </label>
              <select 
                id="status" 
                name="status" 
                value={filters.status}
                onChange={handleFilterChange}
                style={{ 
                  width: '100%', 
                  padding: 'var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--medium-gray)', 
                  outline: 'none', 
                  backgroundColor: 'white' 
                }}
              >
                {statusOptions.map((option, index) => (
                  <option key={index} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <button 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-xs)', 
                background: 'none', 
                border: '1px solid var(--medium-gray)', 
                borderRadius: 'var(--radius-sm)', 
                padding: 'var(--spacing-sm) var(--spacing-md)', 
                cursor: 'pointer', 
                color: 'var(--text-primary)' 
              }}
              onClick={resetFilters}
            >
              <X size={14} />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>
      )}
      
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        {filteredPrograms.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
            {filteredPrograms.map((program) => (
              <div key={program.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-md)', 
                boxShadow: 'var(--shadow-sm)', 
                border: '1px solid var(--medium-gray)' 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                    <span style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      backgroundColor: program.type === 'regular' ? 'var(--primary-ultralight)' : 'var(--secondary-color)', 
                      color: program.type === 'regular' ? 'var(--primary-color)' : 'white' 
                    }}>
                      {program.type === 'regular' ? 'Regular' : 'Refresher'}
                    </span>
                    <span style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      backgroundColor: program.status === 'active' ? 'var(--success-color)' : 'var(--danger-color)', 
                      color: 'white' 
                    }}>
                      {program.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <Link 
                    to={`/trainer/programs/${program.id}`}
                    style={{ color: 'var(--text-primary)', textDecoration: 'none' }}
                    title="View details"
                  >
                    <Eye size={20} />
                  </Link>
                </div>
                
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                  {program.title}
                </h3>
                
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                  {program.description}
                </p>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <Users size={18} color="var(--text-secondary)" />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {program.enrollmentCount || 0}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Trainees</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <GraduationCap size={18} color="var(--text-secondary)" />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {program.completionRate || 0}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completion</div>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <BarChart2 size={18} color="var(--text-secondary)" />
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {program.averageScore || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg. Score</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                    <Calendar size={14} />
                    <span>Created: {formatDate(program.created_at)}</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                    <Clock size={14} />
                    <span>{program.quizCount || 0} Quizzes</span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                  <Link 
                    to={`/trainer/quizzes?programId=${program.id}`} 
                    style={{ 
                      flex: 1, 
                      textAlign: 'center', 
                      padding: 'var(--spacing-sm)', 
                      borderRadius: 'var(--radius-sm)', 
                      backgroundColor: 'var(--primary-ultralight)', 
                      color: 'var(--primary-color)', 
                      textDecoration: 'none' 
                    }}
                  >
                    Manage Quizzes
                  </Link>
                  <Link 
                    to={`/trainer/milestones?programId=${program.id}`} 
                    style={{ 
                      flex: 1, 
                      textAlign: 'center', 
                      padding: 'var(--spacing-sm)', 
                      borderRadius: 'var(--radius-sm)', 
                      backgroundColor: 'var(--primary-ultralight)', 
                      color: 'var(--primary-color)', 
                      textDecoration: 'none' 
                    }}
                  >
                    Manage Milestones
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--text-muted)' }}>
            <BookOpen size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: 'var(--spacing-xs)' }}>
              No Programs Found
            </h3>
            <p>No programs match your search criteria or no programs have been assigned to you yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainerPrograms;