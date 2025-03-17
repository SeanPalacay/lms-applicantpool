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
        console.log("Raw assessment data:", data);
        setAssessments(data);
        
        const programsMap = {};
        data
          .filter(assessment => assessment.program)
          .forEach(assessment => {
            console.log("Processing program:", assessment.program);
            const programId = assessment.program.id;
            if (!programsMap[programId]) {
              programsMap[programId] = {
                id: programId,
                title: assessment.program.title
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
    return 'pending';
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
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      {error && <AlertBanner message={error} type="error" />}
      
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
            <label htmlFor="status-filter" style={{ fontSize: '14px', fontWeight: 'bold' }}>Status:</label>
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
        </div>
      )}
      
      {filteredAssessments.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {filteredAssessments.map(assessment => {
            const status = getAssessmentStatus(assessment);
            const latestAttempt = assessment.attempts && assessment.attempts.length > 0
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
                    <h3 style={{ fontSize: '16px', margin: 0 }}>{assessment.title}</h3>
                  </div>
                  <div style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '12px',
                    ...(status === 'passed' ? { background: '#d4edda', color: '#155724' } :
                       status === 'failed' ? { background: '#f8d7da', color: '#721c24' } :
                       { background: '#cce5ff', color: '#004085' })
                  }}>
                    {status === 'passed' && <CheckCircle size={16} />}
                    {status === 'failed' && <AlertTriangle size={16} />}
                    {status === 'pending' && <Clock size={16} />}
                    <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
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
                    color: '#666', 
                    marginBottom: '10px' 
                  }}>
                    {assessment.program && (
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
                      <span>Passing Score: {assessment.passing_score || 70}%</span>
                    </div>
                  </div>
                  
                  {latestAttempt && (
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ fontWeight: 'bold' }}>Your Score:</span>
                        <span style={{ 
                          marginLeft: '5px', 
                          color: latestAttempt.score >= (assessment.passing_score || 70) ? '#28a745' : '#dc3545',
                          fontWeight: 'bold'
                        }}>
                          {latestAttempt.score}%
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
                  {status === 'pending' ? (
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
                  ) : (
                    <Link 
                      to={`/trainee/assessments/quiz/${assessment.id}/feedback${latestAttempt ? `?attempt=${assessment.attempts[0].id}` : ''}`}
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