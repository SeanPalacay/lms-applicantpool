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
import './styles/Quizzes.css';

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
        
        // Fetch programs for filter
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
        
        // Fetch quizzes
        const quizzesData = await trainerService.getQuizzes(programIdParam);
        setQuizzes(quizzesData);
        
        // Apply initial filters
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
    
    // Clear location state after using it
    if (location.state?.message) {
      window.history.replaceState({}, document.title);
    }
  }, [navigate, location.state, programIdParam, filters.program_id]);

  useEffect(() => {
    // Apply filters and search
    let results = quizzes;
    
    // Apply search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      results = results.filter(quiz => 
        quiz.title.toLowerCase().includes(term) || 
        (quiz.description && quiz.description.toLowerCase().includes(term))
      );
    }
    
    // Apply program filter
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
    
    // Update URL if program_id filter changes
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
      
      // Update local state
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
    <div className="quizzes-container">
      <div className="section-header">
        <h1>Quizzes & Assessments</h1>
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
      
      <div className="quizzes-actions">
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search quizzes..."
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
        
        <div className="button-container">
          <Link to="/trainer/quizzes/create" className="action-button primary">
            <Plus size={16} className="icon-inline" /> Create Quiz
          </Link>
        </div>
      </div>
      
      {filterOpen && (
        <div className="filter-panel">
          <div className="filter-form">
            <div className="filter-row">
              <div className="filter-group">
                <label htmlFor="program_id">Program</label>
                <select 
                  id="program_id" 
                  name="program_id" 
                  value={filters.program_id}
                  onChange={handleFilterChange}
                >
                  <option value="">All Programs</option>
                  {programs.map((program) => (
                    <option key={program.id} value={program.id}>{program.title}</option>
                  ))}
                </select>
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
      
      <div className="quizzes-content">
        {filteredQuizzes.length > 0 ? (
          <div className="quizzes-grid">
            {filteredQuizzes.map((quiz) => (
              <div key={quiz.id} className="quiz-card">
                <div className="quiz-header">
                  <div className="quiz-actions-dropdown">
                    {deleteConfirm === quiz.id ? (
                      <div className="delete-confirmation">
                        <span>Are you sure?</span>
                        <button onClick={() => handleDelete(quiz.id)}>Yes</button>
                        <button onClick={cancelDelete}>No</button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <Link to={`/trainer/quizzes/${quiz.id}`} className="action-icon" title="View Quiz">
                          <Eye size={18} />
                        </Link>
                        <Link to={`/trainer/quizzes/edit/${quiz.id}`} className="action-icon" title="Edit Quiz">
                          <Edit size={18} />
                        </Link>
                        <button 
                          className="action-icon delete" 
                          onClick={() => handleDeleteConfirm(quiz.id)}
                          title="Delete Quiz"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="quiz-title">
                  <h3>{quiz.title}</h3>
                </div>
                
                <div className="quiz-program">
                  <BookOpen size={16} className="icon-inline" />
                  <span>{getProgramTitle(quiz.program_id)}</span>
                </div>
                
                <div className="quiz-description">
                  <p>{quiz.description}</p>
                </div>
                
                <div className="quiz-meta">
                  <div className="meta-item">
                    <HelpCircle size={14} className="icon-inline" />
                    <span>{quiz.question_count || 0} Questions</span>
                  </div>
                  <div className="meta-item">
                    <Clock size={14} className="icon-inline" />
                    <span>{quiz.time_limit || 0} Minutes</span>
                  </div>
                  <div className="meta-item">
                    <CheckSquare size={14} className="icon-inline" />
                    <span>Pass: {quiz.passing_score || 70}%</span>
                  </div>
                </div>
                
                <div className="quiz-stats">
                  <div className="stat-item">
                    <Users size={18} className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{quiz.attempt_count || 0}</div>
                      <div className="stat-label">Attempts</div>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <BarChart2 size={18} className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{quiz.average_score || 'N/A'}</div>
                      <div className="stat-label">Avg. Score</div>
                    </div>
                  </div>
                  
                  <div className="stat-item">
                    <CheckSquare size={18} className="stat-icon" />
                    <div className="stat-content">
                      <div className="stat-value">{quiz.pass_rate || 0}%</div>
                      <div className="stat-label">Pass Rate</div>
                    </div>
                  </div>
                </div>
                
                <div className="quiz-footer">
                  <Link to={`/trainer/quizzes/${quiz.id}/results`} className="view-results-link">
                    View Results
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-quizzes">
            <HelpCircle size={48} className="no-quizzes-icon" />
            <h3>No Quizzes Found</h3>
            <p>No quizzes match your search criteria or no quizzes have been created yet.</p>
            <Link to="/trainer/quizzes/create" className="action-button primary">
              <Plus size={16} className="icon-inline" /> Create New Quiz
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;