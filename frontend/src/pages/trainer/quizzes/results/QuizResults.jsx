import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BarChart2, 
  HelpCircle, 
  ArrowLeft,
  Filter,
  X,
  Download,
  Eye,
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileDown,
  Clock,
  User
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const QuizResults = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [quiz, setQuiz] = useState({
    id: '',
    title: '',
    program_id: '',
    program_title: '',
    time_limit: 0,
    passing_score: 0,
    stats: {
      total_attempts: 0,
      pass_rate: 0,
      average_score: 0,
      highest_score: 0,
      lowest_score: 0
    }
  });
  const [attempts, setAttempts] = useState([]);
  const [filteredAttempts, setFilteredAttempts] = useState([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    date_from: '',
    date_to: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const statusOptions = [
    { value: '', label: 'All Attempts' },
    { value: 'pass', label: 'Passed' },
    { value: 'fail', label: 'Failed' }
  ];

  useEffect(() => {
    const fetchQuizResults = async () => {
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
        
        const quizData = await trainerService.getQuizById(quizId);
        const attemptsData = await trainerService.getQuizAttempts(quizId);
        
        setQuiz(quizData);
        setAttempts(attemptsData);
        setFilteredAttempts(attemptsData);
      } catch (err) {
        console.error('Error fetching quiz results:', err);
        setError('Failed to load quiz results. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizResults();
  }, [navigate, quizId]);

  useEffect(() => {
    let results = [...attempts];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(attempt => 
        attempt.trainee_name.toLowerCase().includes(term)
      );
    }
    
    if (filters.status === 'pass') {
      results = results.filter(attempt => attempt.score >= quiz.passing_score);
    } else if (filters.status === 'fail') {
      results = results.filter(attempt => attempt.score < quiz.passing_score);
    }
    
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      results = results.filter(attempt => new Date(attempt.attempt_date) >= fromDate);
    }
    
    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59);
      results = results.filter(attempt => new Date(attempt.attempt_date) <= toDate);
    }
    
    setFilteredAttempts(results);
  }, [attempts, searchTerm, filters, quiz.passing_score]);

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
      status: '',
      date_from: '',
      date_to: ''
    });
    setSearchTerm('');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleExportResults = async () => {
    try {
      await trainerService.exportQuizResults(quizId);
      setSuccess('Results exported successfully.');
    } catch (err) {
      console.error('Error exporting results:', err);
      setError('Failed to export results. Please try again.');
    }
  };

  const goBack = () => {
    navigate(`/trainer/quizzes/${quizId}`);
  };

  const viewAttemptDetails = (attemptId) => {
    navigate(`/trainer/quizzes/${quizId}/attempts/${attemptId}`);
  };

  const getPassStatus = (score) => {
    return score >= quiz.passing_score;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
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
        }}>Quiz Results</h1>
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
      
      <div 
        onClick={goBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          marginBottom: '20px',
          color: '#007bff'
        }}
      >
        <ArrowLeft size={16} style={{ marginRight: '5px' }} />
        <span>Back to Quiz</span>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <div>
          <h2 style={{ 
            fontSize: '20px', 
            margin: '0 0 5px 0' 
          }}>{quiz.title}</h2>
          <Link 
            to={`/trainer/programs/${quiz.program_id}`} 
            style={{ 
              color: '#007bff', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{ fontWeight: 'bold' }}>Program:</span> 
            {quiz.program_title}
          </Link>
        </div>
      </div>
      
      <div style={{
        background: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(to right, #007bff, #00b7ff)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '8px 8px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <BarChart2 size={20} />
          <h3 style={{ margin: 0 }}>Overall Performance</h3>
        </div>
        
        <div style={{ padding: '15px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '15px',
            marginBottom: '15px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold' 
              }}>{quiz.stats?.total_attempts || 0}</div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666' 
              }}>Total Attempts</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold' 
              }}>{quiz.stats?.pass_rate || 0}%</div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666' 
              }}>Pass Rate</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold' 
              }}>{quiz.stats?.average_score || 'N/A'}</div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666' 
              }}>Average Score</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold' 
              }}>{quiz.stats?.highest_score || 'N/A'}</div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666' 
              }}>Highest Score</div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold' 
              }}>{quiz.stats?.lowest_score || 'N/A'}</div>
              <div style={{ 
                fontSize: '14px', 
                color: '#666' 
              }}>Lowest Score</div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '15px',
            paddingTop: '15px',
            borderTop: '1px solid #eee'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px' 
            }}>
              <HelpCircle size={16} />
              <span>Passing Score: {quiz.passing_score}%</span>
            </div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '5px' 
            }}>
              <Clock size={16} />
              <span>Time Limit: {quiz.time_limit} minutes</span>
            </div>
          </div>
        </div>
      </div>
      
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
            <input
              type="text"
              placeholder="Search by trainee name..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '8px 30px 8px 10px',
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
                  right: '5px',
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
        
        <button 
          onClick={handleExportResults}
          style={{
            padding: '8px 15px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            whiteSpace: 'nowrap'
          }}
        >
          <FileDown size={16} /> 
          <span>Export Results</span>
        </button>
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
                fontSize: '14px'
              }} htmlFor="status">Result Status</label>
              <select 
                id="status" 
                name="status" 
                value={filters.status}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              >
                {statusOptions.map((option, index) => (
                  <option key={index} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ minWidth: '150px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px'
              }} htmlFor="date_from">Date From</label>
              <input 
                type="date" 
                id="date_from" 
                name="date_from" 
                value={filters.date_from}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ minWidth: '150px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '5px',
                fontSize: '14px'
              }} htmlFor="date_to">Date To</label>
              <input 
                type="date" 
                id="date_to" 
                name="date_to" 
                value={filters.date_to}
                onChange={handleFilterChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
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
        {filteredAttempts.length > 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse' 
            }}>
              <thead>
                <tr style={{ 
                  background: '#f8f9fa' 
                }}>
                  <th style={{ 
                    padding: '10px 15px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee'
                  }}>Trainee</th>
                  <th style={{ 
                    padding: '10px 15px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee'
                  }}>Date</th>
                  <th style={{ 
                    padding: '10px 15px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee'
                  }}>Score</th>
                  <th style={{ 
                    padding: '10px 15px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee'
                  }}>Status</th>
                  <th style={{ 
                    padding: '10px 15px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee'
                  }}>Time Taken</th>
                  <th style={{ 
                    padding: '10px 15px', 
                    textAlign: 'left',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #eee'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id} style={{
                    borderBottom: '1px solid #eee'
                  }}>
                    <td style={{ padding: '10px 15px' }}>
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
                          {attempt.trainee_name.charAt(0)}
                        </div>
                        <div style={{ fontSize: '14px' }}>
                          {attempt.trainee_name}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '5px' 
                        }}>
                          <Calendar size={14} />
                          <span>{formatDate(attempt.attempt_date)}</span>
                        </div>
                        <span style={{ 
                          fontSize: '12px', 
                          color: '#666' 
                        }}>{formatTime(attempt.attempt_date)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <span style={{ 
                        color: getPassStatus(attempt.score) ? '#28a745' : '#dc3545',
                        fontWeight: 'bold'
                      }}>
                        {attempt.score}%
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}>
                        {getPassStatus(attempt.score) ? (
                          <>
                            <CheckCircle size={14} style={{ color: '#28a745' }} />
                            <span style={{ color: '#28a745' }}>Passed</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={14} style={{ color: '#dc3545' }} />
                            <span style={{ color: '#dc3545' }}>Failed</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <span style={{ fontSize: '14px' }}>
                        {attempt.time_taken ? `${attempt.time_taken} min` : 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 15px' }}>
                      <button 
                        onClick={() => viewAttemptDetails(attempt.id)}
                        style={{
                          padding: '5px 10px',
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '20px'
          }}>
            <AlertTriangle size={48} style={{ 
              color: '#ffc107', 
              marginBottom: '15px' 
            }} />
            <h3 style={{ 
              margin: '0 0 10px 0',
              fontSize: '20px'
            }}>No Results Found</h3>
            <p style={{ 
              margin: '0 0 15px 0',
              color: '#666',
              fontSize: '14px'
            }}>
              {attempts.length === 0 
                ? "No trainees have attempted this quiz yet." 
                : "No results match your search criteria."}
            </p>
            {attempts.length > 0 && (
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
                  margin: '0 auto'
                }}
              >
                <X size={16} />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {filteredAttempts.length > 0 && (
        <div style={{
          textAlign: 'right',
          padding: '10px 0',
          fontSize: '14px',
          color: '#666'
        }}>
          Showing {filteredAttempts.length} of {attempts.length} results
        </div>
      )}
    </div>
  );
};

export default QuizResults;