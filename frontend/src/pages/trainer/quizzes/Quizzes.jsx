import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  HelpCircle, 
  Search, 
  Filter, 
  Clock, 
  CheckSquare,
  BookOpen,
  BarChart2,
  X,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

const Quizzes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const programIdParam = queryParams.get('programId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.message || null);
  const [quizzes, setQuizzes] = useState([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filters, setFilters] = useState({
    program_id: programIdParam || ''
  });

  useEffect(() => {
    const fetchQuizzes = async () => {
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
        
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
        
        const quizzesData = await trainerService.getQuizzes(programIdParam);
        setQuizzes(quizzesData);
        
        let filteredResults = quizzesData;
        if (filters.program_id) {
          filteredResults = filteredResults.filter(quiz => quiz.program_id.toString() === filters.program_id);
        }
        
        setFilteredQuizzes(filteredResults);
      } catch (err) {
        console.error('Error fetching quizzes:', err);
        setError('Failed to load quizzes. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
    
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location.state, programIdParam, filters.program_id]);

  useEffect(() => {
    let results = quizzes;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(quiz => 
        quiz.title.toLowerCase().includes(term) || 
        (quiz.description && quiz.description.toLowerCase().includes(term))
      );
    }
    
    if (filters.program_id) {
      results = results.filter(quiz => quiz.program_id.toString() === filters.program_id);
    }
    
    setFilteredQuizzes(results);
  }, [quizzes, searchTerm, filters]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'program_id' && value !== programIdParam) {
      const newUrl = value 
        ? `${location.pathname}?programId=${value}` 
        : location.pathname;
      navigate(newUrl, { replace: true });
    }
    
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
      program_id: ''
    });
    setSearchTerm('');
    navigate(location.pathname, { replace: true });
  };

  const handleDeleteConfirm = (quizId) => {
    setDeleteConfirm(quizId);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleDelete = async (quizId) => {
    try {
      await trainerService.deleteQuiz(quizId);
      
      const updatedQuizzes = quizzes.filter(quiz => quiz.id !== quizId);
      setQuizzes(updatedQuizzes);
      setFilteredQuizzes(updatedQuizzes.filter(quiz => {
        let keep = true;
        if (filters.program_id) {
          keep = keep && quiz.program_id.toString() === filters.program_id;
        }
        return keep;
      }));
      
      setSuccess('Quiz deleted successfully.');
    } catch (err) {
      console.error('Error deleting quiz:', err);
      setError('Failed to delete quiz. Please try again.');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const getProgramTitle = (programId) => {
    const program = programs.find(p => p.id === programId);
    return program ? program.title : 'Unknown Program';
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
      <div style={{ 
        marginBottom: '20px' 
      }}>
        <h1 style={{ 
          fontSize: '24px', 
          margin: '0 0 10px 0' 
        }}>Quizzes & Assessments</h1>
        <div style={{ 
          height: '2px', 
          background: '#ddd' 
        }}></div>
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
          gap: '10px', 
          flex: '1', 
          minWidth: '200px' 
        }}>
          <div style={{ 
            position: 'relative', 
            width: '100%' 
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
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '8px 30px 8px 35px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '5px'
                }}
              >
                <X size={16} style={{ color: '#666' }} />
              </button>
            )}
          </div>
          
          <button 
            onClick={toggleFilter}
            style={{
              padding: '8px 15px',
              background: filterOpen ? '#007bff' : '#f8f9fa',
              color: filterOpen ? 'white' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              whiteSpace: 'nowrap'
            }}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        <div>
          <Link 
            to="/trainer/quizzes/create"
            style={{
              padding: '8px 15px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '14px'
            }}
          >
            <Plus size={16} /> Create Quiz
          </Link>
        </div>
      </div>
      
      {filterOpen && (
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
            gap: '15px',
            alignItems: 'flex-end'
          }}>
            <div style={{ minWidth: '200px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px',
                fontWeight: 'bold'
              }} htmlFor="program_id">Program</label>
              <select 
                id="program_id" 
                name="program_id" 
                value={filters.program_id}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Programs</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>{program.title}</option>
                ))}
              </select>
            </div>
            
            <div>
              <button 
                onClick={resetFilters}
                style={{
                  padding: '8px 15px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '14px'
                }}
              >
                <X size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div>
        {filteredQuizzes.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {filteredQuizzes.map((quiz) => (
              <div 
                key={quiz.id}
                style={{
                  background: '#fff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '15px',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end',
                  marginBottom: '10px'
                }}>
                  {deleteConfirm === quiz.id ? (
                    <div style={{ 
                      display: 'flex', 
                      gap: '10px', 
                      alignItems: 'center' 
                    }}>
                      <span style={{ fontSize: '14px' }}>Are you sure?</span>
                      <button 
                        onClick={() => handleDelete(quiz.id)}
                        style={{
                          padding: '5px 10px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Yes
                      </button>
                      <button 
                        onClick={cancelDelete}
                        style={{
                          padding: '5px 10px',
                          background: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <Link 
                        to={`/trainer/quizzes/${quiz.id}`}
                        style={{ 
                          padding: '5px',
                          color: '#007bff',
                          textDecoration: 'none'
                        }}
                        title="View Quiz"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link 
                        to={`/trainer/quizzes/edit/${quiz.id}`}
                        style={{ 
                          padding: '5px',
                          color: '#007bff',
                          textDecoration: 'none'
                        }}
                        title="Edit Quiz"
                      >
                        <Edit size={18} />
                      </Link>
                      <button 
                        onClick={() => handleDeleteConfirm(quiz.id)}
                        style={{
                          padding: '5px',
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer'
                        }}
                        title="Delete Quiz"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  marginBottom: '10px' 
                }}>
                  {quiz.title}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px', 
                  marginBottom: '10px',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  <BookOpen size={16} />
                  <span>{getProgramTitle(quiz.program_id)}</span>
                </div>
                
                <div style={{ 
                  marginBottom: '15px', 
                  color: '#666', 
                  fontSize: '14px',
                  maxHeight: '60px',
                  overflow: 'hidden'
                }}>
                  <p style={{ margin: 0 }}>{quiz.description}</p>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  marginBottom: '15px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <HelpCircle size={14} />
                    <span>{quiz.question_count || 0} Questions</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <Clock size={14} />
                    <span>{quiz.time_limit || 0} Minutes</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    <CheckSquare size={14} />
                    <span>Pass: {quiz.passing_score || 70}%</span>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '10px', 
                  marginBottom: '15px' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px' 
                  }}>
                    <Users size={18} style={{ color: '#007bff' }} />
                    <div>
                      <div style={{ 
                        fontSize: '16px', 
                        fontWeight: 'bold' 
                      }}>{quiz.attempt_count || 0}</div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#666' 
                      }}>Attempts</div>
                    </div>
                  </div>
                  
                  <div style={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: '5px' 
}}>
  <BarChart2 size={18} style={{ color: '#007bff' }} />
  <div>
    <div style={{ 
      fontSize: '16px', 
      fontWeight: 'bold' 
    }}>
      {/* Display average score with one decimal point */}
      {quiz.average_score ? parseFloat(quiz.average_score).toFixed(2) : 'N/A'}
    </div>
    <div style={{ 
      fontSize: '12px', 
      color: '#666' 
    }}>Avg. Score</div>
  </div>
</div>

<div style={{ 
  display: 'flex', 
  alignItems: 'center', 
  gap: '5px' 
}}>
  <CheckSquare size={18} style={{ color: '#007bff' }} />
  <div>
    <div style={{ 
      fontSize: '16px', 
      fontWeight: 'bold' 
    }}>
      {/* Display pass rate as a whole percentage */}
      {quiz.pass_rate ? Math.round(quiz.pass_rate) : 0}%
    </div>
    <div style={{ 
      fontSize: '12px', 
      color: '#666' 
    }}>Pass Rate</div>
  </div>
</div>
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <Link 
                    to={`/trainer/quizzes/${quiz.id}/results`}
                    style={{
                      display: 'block',
                      textAlign: 'right',
                      color: '#007bff',
                      textDecoration: 'none',
                      fontSize: '14px'
                    }}
                  >
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <HelpCircle size={48} style={{ 
              color: '#007bff', 
              marginBottom: '15px' 
            }} />
            <h3 style={{ 
              margin: '0 0 10px 0',
              fontSize: '20px'
            }}>No Quizzes Found</h3>
            <p style={{ 
              margin: '0 0 20px 0',
              color: '#666',
              fontSize: '14px'
            }}>
              No quizzes match your search criteria or no quizzes have been created yet.
            </p>
            <Link 
              to="/trainer/quizzes/create"
              style={{
                padding: '8px 15px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '14px'
              }}
            >
              <Plus size={16} /> Create New Quiz
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;