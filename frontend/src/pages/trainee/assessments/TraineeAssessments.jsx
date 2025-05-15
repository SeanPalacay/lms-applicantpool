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

const TraineeAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterQuizStatus, setFilterQuizStatus] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await traineeService.getAssessments();
      console.log("Raw assessment data:", data);
      
      const assessmentsArray = Array.isArray(data) ? data : [];
      setAssessments(assessmentsArray);
      
      const programsMap = {};
      assessmentsArray
        .filter(assessment => assessment.program && assessment.program.id)
        .forEach(assessment => {
          const programId = assessment.program.id.toString();
          if (!programsMap[programId]) {
            programsMap[programId] = {
              id: programId,
              title: assessment.program.title || 'Unknown Program'
            };
          }
        });
      const uniquePrograms = Object.values(programsMap);
      console.log("Extracted unique programs:", uniquePrograms);
      setPrograms(uniquePrograms);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      setError(err.message || 'Failed to load your assessments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  const handleQuizStatusFilterChange = (e) => {
    setFilterQuizStatus(e.target.value);
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
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch {
      return 'N/A';
    }
  };

  const getAssessmentStatus = (assessment) => {
    if (!assessment) return 'pending';
    const attempts = Array.isArray(assessment.attempts) ? assessment.attempts : [];
    if (attempts.length > 0) {
      const latestAttempt = attempts[0];
      const score = parseFloat(latestAttempt.score) || 0;
      const passingScore = parseFloat(assessment.passing_score) || 70;
      console.log('Comparing:', score, '>=', passingScore, score >= passingScore);
      return score >= passingScore ? 'passed' : 'failed';
    }
    return 'pending';
  };

  const filteredAssessments = assessments
    .filter(assessment => {
      if (!assessment) return false;
      
      const searchMatch = 
        (assessment.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assessment.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      let statusMatch = true;
      if (filterStatus !== 'all') {
        const status = getAssessmentStatus(assessment);
        statusMatch = status === filterStatus;
      }
      
      let programMatch = true;
      if (filterProgram !== 'all' && assessment.program && assessment.program.id) {
        programMatch = assessment.program.id.toString() === filterProgram;
      }
      
      let quizStatusMatch = true;
      if (filterQuizStatus !== 'all') {
        const quizStatus = assessment.status ? assessment.status.toLowerCase() : 'unknown';
        quizStatusMatch = quizStatus === filterQuizStatus;
      }
      
      return searchMatch && statusMatch && programMatch && quizStatusMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'title') {
        const titleA = a.title || '';
        const titleB = b.title || '';
        comparison = titleA.localeCompare(titleB);
      } else if (sortField === 'score') {
        const scoreA = a.attempts && a.attempts.length > 0 ? parseFloat(a.attempts[0].score) || 0 : -1;
        const scoreB = b.attempts && b.attempts.length > 0 ? parseFloat(b.attempts[0].score) || 0 : -1;
        comparison = scoreA - scoreB;
      } else if (sortField === 'due_date') {
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        comparison = dateA - dateB;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {error && <AlertBanner message={error} type="error" onDismiss={() => setError('')} />}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <ClipboardList size={24} style={{ color: '#007bff' }} />
        <h2 style={{ fontSize: '24px', margin: 0 }}>Assessments & Quizzes</h2>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
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
            placeholder="Search assessments..." 
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
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer', 
            fontSize: '14px' 
          }}
        >
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        <button 
          onClick={fetchAssessments}
          style={{ 
            padding: '10px 15px', 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            fontSize: '14px' 
          }}
        >
          Refresh
        </button>
      </div>
      
      {showFilters && (
        <div style={{ 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
          padding: '15px', 
          marginBottom: '20px', 
          display: 'flex', 
          gap: '20px', 
          flexWrap: 'wrap' 
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
            <label htmlFor="status-filter" style={{ fontSize: '14px', fontWeight: 'bold' }}>Attempt Status:</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={handleStatusFilterChange}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                fontSize: '14px' 
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
            <label htmlFor="program-filter" style={{ fontSize: '14px', fontWeight: 'bold' }}>Program:</label>
            <select 
              id="program-filter" 
              value={filterProgram}
              onChange={handleProgramFilterChange}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                fontSize: '14px' 
              }}
            >
              <option value="all">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '200px' }}>
            <label htmlFor="quiz-status-filter" style={{ fontSize: '14px', fontWeight: 'bold' }}>Quiz Status:</label>
            <select 
              id="quiz-status-filter" 
              value={filterQuizStatus}
              onChange={handleQuizStatusFilterChange}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                fontSize: '14px' 
              }}
            >
              <option value="all">All Quiz Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      )}
      
      {filteredAssessments.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredAssessments.map(assessment => {
            const attemptStatus = getAssessmentStatus(assessment);
            const quizStatus = assessment.status ? assessment.status.toLowerCase() : 'unknown';
            console.log(`Quiz ID: ${assessment.id}, Title: ${assessment.title}, Status: ${assessment.status}, QuizStatus: ${quizStatus}`);
            const latestAttempt = Array.isArray(assessment.attempts) && assessment.attempts.length > 0
              ? assessment.attempts[0]
              : null;
            
            return (
              <div 
                key={assessment.id} 
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid #eee',
                  ':last-child': { borderBottom: 'none' }
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: '10px', 
                  flexWrap: 'wrap', 
                  gap: '15px' 
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
                    <ClipboardList size={24} style={{ color: '#007bff' }} />
                    <h3 style={{ fontSize: '16px', margin: 0 }}>{assessment.title || 'Untitled'}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      fontSize: '12px',
                      ...(attemptStatus === 'passed' ? { background: '#d4edda', color: '#155724' } :
                         attemptStatus === 'failed' ? { background: '#f8d7da', color: '#721c24' } :
                         { background: '#cce5ff', color: '#004085' })
                    }}>
                      {attemptStatus === 'passed' && <CheckCircle size={16} />}
                      {attemptStatus === 'failed' && <AlertTriangle size={16} />}
                      {attemptStatus === 'pending' && <Clock size={16} />}
                      <span>{attemptStatus.charAt(0).toUpperCase() + attemptStatus.slice(1)}</span>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      ...(quizStatus === 'active' ? { background: '#d4edda', color: '#155724' } :
                         quizStatus === 'draft' ? { background: '#fff3cd', color: '#856404' } :
                         { background: '#f8d7da', color: '#721c24' })
                    }}>
                      {quizStatus === 'active' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      <span>{quizStatus === 'unknown' ? 'Unknown' : quizStatus.charAt(0).toUpperCase() + quizStatus.slice(1)}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginLeft: '34px' }}>
                  {assessment.description && (
                    <p style={{ fontSize: '14px', color: '#666', margin: '0 0 10px 0' }}>{assessment.description}</p>
                  )}
                  
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '15px', 
                    fontSize: '14px', 
                    color: 'black', 
                    marginBottom: '10px' 
                  }}>
                    {assessment.program && assessment.program.title && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <BookOpen size={14} />
                        <span>{assessment.program.title}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} />
                      <span>{assessment.time_limit ? `${assessment.time_limit} minutes` : 'No time limit'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <BarChart2 size={14} />
                      <span>Passing Score: {parseFloat(assessment.passing_score) || 70}%</span>
                    </div>
                  </div>
                  
                  {latestAttempt && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Your Score:</span>
                        <span style={{ 
                          marginLeft: '5px', 
                          color: parseFloat(latestAttempt.score) >= parseFloat(assessment.passing_score || 70) ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {parseFloat(latestAttempt.score)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Calendar size={14} />
                        <span>Attempted: {formatDate(latestAttempt.attempt_date)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={{ marginTop: '15px', marginLeft: '34px' }}>
                  {quizStatus === 'active' && attemptStatus === 'pending' ? (
                    <Link 
                      to={`/trainee/assessments/quiz/${assessment.id}`}
                      style={{ 
                        padding: '8px 15px', 
                        background: '#007bff', 
                        color: 'white', 
                        borderRadius: '4px', 
                        textDecoration: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        fontSize: '14px' 
                      }}
                    >
                      <ClipboardList size={16} />
                      <span>Take Quiz</span>
                    </Link>
                  ) : quizStatus === 'draft' ? (
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#856404', 
                      background: '#fff3cd', 
                      padding: '8px 15px', 
                      borderRadius: '4px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <AlertTriangle size={16} />
                      <span>This quiz is in draft mode and cannot be taken yet.</span>
                    </div>
                  ) : quizStatus === 'unknown' ? (
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#721c24', 
                      background: '#f8d7da', 
                      padding: '8px 15px', 
                      borderRadius: '4px', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '5px' 
                    }}>
                      <AlertTriangle size={16} />
                      <span>Quiz status unavailable. Please contact support.</span>
                    </div>
                  ) : (
                    <Link 
                      to={`/trainee/assessments/quiz/${assessment.id}/feedback${latestAttempt ? `?attempt=${latestAttempt.id}` : ''}`}
                      style={{ 
                        padding: '8px 15px', 
                        background: '#6c757d', 
                        color: 'white', 
                        borderRadius: '4px', 
                        textDecoration: 'none', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '5px', 
                        fontSize: '14px' 
                      }}
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
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          background: '#fff', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <ClipboardList size={48} style={{ color: '#007bff', marginBottom: '15px' }} />
          <h3 style={{ fontSize: '18px', margin: '0 0 10px 0' }}>No assessments found</h3>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            {searchQuery || filterStatus !== 'all' || filterProgram !== 'all' || filterQuizStatus !== 'all'
              ? 'Try adjusting your search or filters'
              : 'You don\'t have any assessments assigned yet'}
          </p>
        </div>
      )}
    </div>
  );
};

export default TraineeAssessments;