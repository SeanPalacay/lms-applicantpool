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
import '../styles/QuizResults.css';

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
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Check if user has trainer role
        const userRole = localStorage.getItem('userRole');
        if (userRole !== 'trainer') {
          setError('You do not have permission to access this page.');
          setLoading(false);
          setTimeout(() => navigate(`/${userRole}-dashboard`), 2000);
          return;
        }
        
        // Fetch quiz data and results
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
    // Apply filters and search
    let results = [...attempts];
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(attempt => 
        attempt.trainee_name.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (filters.status === 'pass') {
      results = results.filter(attempt => attempt.score >= quiz.passing_score);
    } else if (filters.status === 'fail') {
      results = results.filter(attempt => attempt.score < quiz.passing_score);
    }
    
    // Apply date filters
    if (filters.date_from) {
      const fromDate = new Date(filters.date_from);
      results = results.filter(attempt => new Date(attempt.attempt_date) >= fromDate);
    }
    
    if (filters.date_to) {
      const toDate = new Date(filters.date_to);
      toDate.setHours(23, 59, 59); // End of day
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
    // Navigate to attempt details page
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
    <div className="quiz-results-container">
      <div className="section-header">
        <h1>Quiz Results</h1>
        <div className="header-line"></div>
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
      
      <div className="back-link" onClick={goBack}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Quiz</span>
      </div>
      
      <div className="quiz-title-section">
        <h2>{quiz.title}</h2>
        <Link to={`/trainer/programs/${quiz.program_id}`} className="program-link">
          <span className="program-label">Program:</span> {quiz.program_title}
        </Link>
      </div>
      
      <div className="stats-summary-card">
        <div className="card-header gradient-blue">
          <div className="header-icon">
            <BarChart2 size={20} />
          </div>
          <div className="header-content">
            <h3>Overall Performance</h3>
          </div>
        </div>
        
        <div className="card-content">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">{quiz.stats?.total_attempts || 0}</div>
              <div className="stat-label">Total Attempts</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">{quiz.stats?.pass_rate || 0}%</div>
              <div className="stat-label">Pass Rate</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">{quiz.stats?.average_score || 'N/A'}</div>
              <div className="stat-label">Average Score</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">{quiz.stats?.highest_score || 'N/A'}</div>
              <div className="stat-label">Highest Score</div>
            </div>
            
            <div className="stat-item">
              <div className="stat-value">{quiz.stats?.lowest_score || 'N/A'}</div>
              <div className="stat-label">Lowest Score</div>
            </div>
          </div>
          
          <div className="quiz-info">
            <div className="info-item">
              <HelpCircle size={16} className="icon-inline" />
              <span>Passing Score: {quiz.passing_score}%</span>
            </div>
            <div className="info-item">
              <Clock size={16} className="icon-inline" />
              <span>Time Limit: {quiz.time_limit} minutes</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="results-actions">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search by trainee name..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search" 
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          <button 
            className={`filter-toggle ${filterOpen ? 'active' : ''}`} 
            onClick={toggleFilter}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        
        <button className="export-button" onClick={handleExportResults}>
          <FileDown size={16} className="icon-inline" /> Export Results
        </button>
      </div>
      
      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="status">Result Status</label>
                <select 
                  id="status" 
                  name="status" 
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  {statusOptions.map((option, index) => (
                    <option key={index} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="filter-group">
                <label htmlFor="date_from">Date From</label>
                <input 
                  type="date" 
                  id="date_from" 
                  name="date_from" 
                  value={filters.date_from}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="filter-group">
                <label htmlFor="date_to">Date To</label>
                <input 
                  type="date" 
                  id="date_to" 
                  name="date_to" 
                  value={filters.date_to}
                  onChange={handleFilterChange}
                />
              </div>
              
              <div className="filter-actions">
                <button className="reset-filters" onClick={resetFilters}>
                  <X size={14} className="icon-inline" />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="results-list-container">
        {filteredAttempts.length > 0 ? (
          <div className="results-table">
          <table>
              <thead>
                <tr>
                  <th>Trainee</th>
                  <th>Date</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Time Taken</th> {/* Ensure this matches the data */}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td>
                      <div className="trainee-info">
                        <div className="trainee-avatar">
                          {attempt.trainee_name.charAt(0)}
                        </div>
                        <div className="trainee-name">{attempt.trainee_name}</div>
                      </div>
                    </td>
                    <td>
                      <div className="attempt-date">
                        <Calendar size={14} className="icon-inline" />
                        <span>{formatDate(attempt.attempt_date)}</span>
                        <span className="attempt-time">{formatTime(attempt.attempt_date)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="score">
                        <span className={`score-value ${getPassStatus(attempt.score) ? 'passing' : 'failing'}`}>
                          {attempt.score}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="status">
                        {getPassStatus(attempt.score) ? (
                          <span className="status-passed">
                            <CheckCircle size={14} className="icon-inline" /> Passed
                          </span>
                        ) : (
                          <span className="status-failed">
                            <XCircle size={14} className="icon-inline" /> Failed
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="time-taken">
                        {attempt.time_taken ? `${attempt.time_taken} min` : 'N/A'}
                      </div>
                    </td>
                    <td>
                      <div className="result-actions">
                        <button 
                          className="view-details-button"
                          onClick={() => viewAttemptDetails(attempt.id)}
                          title="View detailed results"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="no-results">
            <AlertTriangle size={48} className="no-results-icon" />
            <h3>No Results Found</h3>
            <p>
              {attempts.length === 0 
                ? "No trainees have attempted this quiz yet." 
                : "No results match your search criteria."}
            </p>
            {attempts.length > 0 && (
              <button className="reset-button" onClick={resetFilters}>
                <X size={16} className="icon-inline" /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
      
      {filteredAttempts.length > 0 && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {filteredAttempts.length} of {attempts.length} results
          </div>
          {/* Pagination controls would go here if implementing pagination */}
        </div>
      )}
    </div>
  );
};

export default QuizResults;