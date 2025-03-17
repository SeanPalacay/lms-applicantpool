import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ClipboardList, Search, Filter, ChevronDown, ChevronUp, 
  BookOpen, Calendar, Clock, CheckCircle, AlertTriangle, FileText,
  BarChart2
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import traineeService from '../../../services/traineeService';
import './styles/TraineeAssessments.css';

const TraineeAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');

  useEffect(() => {
    const fetchAssessments = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await traineeService.getAssessments();
        console.log("Raw assessment data:", data); // Debug log to see what your API returns
        setAssessments(data);
        
        const programsMap = {};
        data
          .filter(assessment => assessment.program)
          .forEach(assessment => {
            console.log("Processing program:", assessment.program); // Debug each program
            const programId = assessment.program.id;
            if (!programsMap[programId]) {
              programsMap[programId] = {
                id: programId,
                title: assessment.program.title
              };
            }
          });
        const uniquePrograms = Object.values(programsMap);
        console.log("Extracted unique programs:", uniquePrograms); // Debug final result
        setPrograms(uniquePrograms);
      } catch (err) {
        console.error('Error fetching assessments:', err);
        setError(err.message || 'Failed to load your assessments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
  
    fetchAssessments();
  }, []);
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
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getAssessmentStatus = (assessment) => {
    if (assessment.attempts && assessment.attempts.length > 0) {
      const latestAttempt = assessment.attempts[0];
      return latestAttempt.score >= (assessment.passing_score || 70) ? 'passed' : 'failed';
    }
    return 'pending'; // Removed due_date logic since it's not in quizzes table
  };

  const filteredAssessments = assessments
    .filter(assessment => {
      const searchMatch = assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assessment.description && assessment.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      let statusMatch = true;
      if (filterStatus !== 'all') {
        const status = getAssessmentStatus(assessment);
        statusMatch = status === filterStatus;
      }
      
      let programMatch = true;
      if (filterProgram !== 'all' && assessment.program) {
        programMatch = assessment.program.id.toString() === filterProgram;
      }
      
      return searchMatch && statusMatch && programMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'score') {
        const scoreA = a.attempts && a.attempts.length > 0 ? a.attempts[0].score : -1;
        const scoreB = b.attempts && b.attempts.length > 0 ? b.attempts[0].score : -1;
        comparison = scoreA - scoreB;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="trainee-assessments-container">
      {error && <AlertBanner message={error} type="error" />}
      
      <div className="assessments-header">
        <div className="header-title">
          <ClipboardList size={24} className="header-icon" />
          <h2>Assessments & Quizzes</h2>
        </div>
      </div>
      
      <div className="search-filter-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search assessments..." 
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
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
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
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {filteredAssessments.length > 0 ? (
        <div className="assessments-list">
          {filteredAssessments.map(assessment => {
            const status = getAssessmentStatus(assessment);
            const latestAttempt = assessment.attempts && assessment.attempts.length > 0
              ? assessment.attempts[0]
              : null;
            
            return (
              <div key={assessment.id} className="assessment-card">
                <div className="assessment-header">
                  <div className="assessment-title-section">
                    <div className="assessment-icon">
                      <ClipboardList size={24} />
                    </div>
                    <h3 className="assessment-title">{assessment.title}</h3>
                  </div>
                  
                  <div className="assessment-status">
                    {status === 'passed' && (
                      <div className="status-badge status-passed">
                        <CheckCircle size={16} />
                        <span>Passed</span>
                      </div>
                    )}
                    {status === 'failed' && (
                      <div className="status-badge status-failed">
                        <AlertTriangle size={16} />
                        <span>Failed</span>
                      </div>
                    )}
                    {status === 'pending' && (
                      <div className="status-badge status-pending">
                        <Clock size={16} />
                        <span>Pending</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="assessment-content">
                  {assessment.description && (
                    <p className="assessment-description">{assessment.description}</p>
                  )}
                  
                  <div className="assessment-meta">
                    {assessment.program && (
                      <div className="meta-item">
                        <BookOpen size={14} className="meta-icon" />
                        <span>{assessment.program.title}</span>
                      </div>
                    )}
                    
                    <div className="meta-item">
                      <Clock size={14} className="meta-icon" />
                      <span>{assessment.time_limit ? `${assessment.time_limit} minutes` : 'No time limit'}</span>
                    </div>
                    
                    <div className="meta-item">
                      <BarChart2 size={14} className="meta-icon" />
                      <span>Passing Score: {assessment.passing_score || 70}%</span>
                    </div>
                  </div>
                  
                  {latestAttempt && (
                    <div className="attempt-info">
                      <div className="attempt-score">
                        <span className="score-label">Your Score:</span>
                        <span className={`score-value ${latestAttempt.score >= (assessment.passing_score || 70) ? 'passing' : 'failing'}`}>
                          {latestAttempt.score}%
                        </span>
                      </div>
                      
                      <div className="attempt-date">
                        <Calendar size={14} className="meta-icon" />
                        <span>Attempted: {formatDate(latestAttempt.attempt_date)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="assessment-actions">
                  {status === 'pending' ? (
                    <Link to={`/trainee/assessments/quiz/${assessment.id}`} className="take-quiz-btn">
                      <ClipboardList size={16} />
                      <span>Take Quiz</span>
                    </Link>
                  ) : (
                    <Link 
                      to={`/trainee/assessments/quiz/${assessment.id}/feedback${latestAttempt ? `?attempt=${assessment.attempts[0].id}` : ''}`} 
                      className="view-feedback-btn"
                    >
                      <FileText size={16} />
                      <span>View Feedback</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="no-assessments-message">
          <ClipboardList size={48} />
          <h3>No assessments found</h3>
          <p>
            {searchQuery || filterStatus !== 'all' || filterProgram !== 'all'
              ? 'Try adjusting your search or filters'
              : 'You don\'t have any assessments assigned yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TraineeAssessments;