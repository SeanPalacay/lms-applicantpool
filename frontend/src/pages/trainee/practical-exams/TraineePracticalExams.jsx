import React, { useState, useEffect } from 'react';
import { 
  Clipboard, Eye, Award, CheckCircle, Clock, 
  AlertCircle, BookOpen, BarChart2,
  Grid, List // Added these icons for the toggle
} from 'lucide-react';
import traineeService from '../../../services/traineeService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const TraineePracticalExams = () => {
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [error, setError] = useState(null);
  const [programName, setProgramName] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // Add view mode state

  // Extract program ID from URL
  const getProgramId = () => {
    const pathParts = window.location.pathname.split('/');
    const programIdIndex = pathParts.indexOf('programs') + 1;
    return programIdIndex < pathParts.length ? pathParts[programIdIndex] : null;
  };
  
  const programId = getProgramId();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If we have a programId, fetch program details for the title
        if (programId) {
          try {
            const programData = await traineeService.getProgramDetails(programId);
            setProgramName(programData.title || 'Program');
          } catch (err) {
            console.error('Error fetching program details:', err);
          }
        }
        
        // Fetch all practical exams for this program, or all if no programId
        const examsData = await traineeService.getPracticalExams(programId);
        setExams(examsData);
        
        // Fetch all trainee's attempts
        const attemptsData = await traineeService.getPracticalExamAttempts();
        setAttempts(attemptsData);
        
      } catch (err) {
        console.error('Error fetching practical exams:', err);
        setError('Failed to load practical exams. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [programId]);

  // Toggle view mode function
  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'table' : 'grid');
  };

  // Helper function to find attempt for a specific exam
  const findAttemptForExam = (examId) => {
    if (!attempts || !attempts.length) return null;
    
    // Log to see what's happening
    console.log(`Finding attempt for exam ${examId}:`, 
      attempts.filter(a => parseInt(a.exam_id) === parseInt(examId)));
    
    return attempts.find(att => parseInt(att.exam_id) === parseInt(examId));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  // Navigate to a different page
  const navigateTo = (path) => {
    window.location.href = path;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '5px' }}>
          {programId ? `Practical Exams for ${programName}` : 'All Practical Exams'}
        </h1>
        <div style={{ height: '2px', width: '60px', backgroundColor: '#007bff' }}></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {programId && (
            <a 
              href={`/trainee/programs/${programId}`} 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '5px', 
                color: '#333', 
                textDecoration: 'none' 
              }}
            >
              ← Back to Program
            </a>
          )}
          
          <button 
            onClick={toggleViewMode}
            style={{
              padding: '8px 15px',
              background: '#f8f9fa',
              color: '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginLeft: '10px'
            }}
            title={viewMode === 'grid' ? 'Switch to Table View' : 'Switch to Grid View'}
          >
            {viewMode === 'grid' ? <List size={18} /> : <Grid size={18} />}
            <span>{viewMode === 'grid' ? 'Table View' : 'Grid View'}</span>
          </button>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {exams.length > 0 ? (
          viewMode === 'grid' ? (
            // Grid View
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
              {exams.map(exam => {
                const attempt = findAttemptForExam(exam.id);
                const isPending = attempt && !attempt.graded_at;
                const isGraded = attempt && attempt.graded_at;
                
                return (
                  <div key={exam.id} style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    padding: '15px', 
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333' }}>{exam.title}</h3>
                      
                      <div style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500',
                        backgroundColor: isGraded ? '#d4edda' : isPending ? '#fff3cd' : '#e2e3e5',
                        color: isGraded ? '#155724' : isPending ? '#856404' : '#383d41'
                      }}>
                        {isGraded ? 'Graded' : isPending ? 'Submitted' : 'Not Started'}
                      </div>
                    </div>
                    
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#666', 
                      marginBottom: '15px',
                      minHeight: '40px' 
                    }}>
                      {exam.description || 'No description provided.'}
                    </p>
                    
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <BookOpen size={18} color="#666" />
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                              {exam.program_title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>Program</div>
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <BarChart2 size={18} color="#666" />
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '500', color: '#333' }}>
                              {exam.max_score || 100}
                            </div>
                            <div style={{ fontSize: '12px', color: '#888' }}>Max Score</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {isGraded && (
                      <div style={{ 
                        backgroundColor: '#d4edda', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        marginBottom: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Award size={18} color="#155724" />
                          <span style={{ fontWeight: '500', color: '#155724' }}>Score: {attempt.score} / {exam.max_score}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#155724' }}>
                          {formatDate(attempt.graded_at)}
                        </span>
                      </div>
                    )}
                    
                    {isPending && (
                      <div style={{ 
                        backgroundColor: '#fff3cd', 
                        borderRadius: '4px', 
                        padding: '8px', 
                        marginBottom: '15px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Clock size={18} color="#856404" />
                          <span style={{ fontWeight: '500', color: '#856404' }}>Awaiting Grading</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#856404' }}>
                          Submitted: {formatDate(attempt.submitted_at)}
                        </span>
                      </div>
                    )}
                    
                    <a 
                      href={
                        isGraded 
                          ? `/trainee/practical-exams/${exam.id}/results/${attempt.id}` 
                          : isPending 
                            ? `/trainee/practical-exams/${exam.id}/pending` 
                            : `/trainee/practical-exams/${exam.id}/take`
                      }
                      style={{ 
                        display: 'block', 
                        textAlign: 'center', 
                        padding: '8px', 
                        borderRadius: '4px', 
                        backgroundColor: isGraded ? '#28a745' : isPending ? '#ffc107' : '#007bff', 
                        color: 'white', 
                        textDecoration: 'none' 
                      }}
                    >
                      {isGraded ? 'View Results' : isPending ? 'View Submission' : 'Take Exam'}
                    </a>
                  </div>
                );
              })}
            </div>
          ) : (
            // Table View
            <div style={{ overflowX: 'auto' }}>
              <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                textAlign: 'left' 
              }}>
                <thead>
                  <tr style={{ 
                    backgroundColor: '#f8f9fa',
                    borderBottom: '2px solid #dee2e6'
                  }}>
                    <th style={{ padding: '12px 8px' }}>Title</th>
                    <th style={{ padding: '12px 8px' }}>Program</th>
                    <th style={{ padding: '12px 8px' }}>Max Score</th>
                    <th style={{ padding: '12px 8px' }}>Status</th>
                    <th style={{ padding: '12px 8px' }}>Score</th>
                    <th style={{ padding: '12px 8px' }}>Submission Date</th>
                    <th style={{ padding: '12px 8px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => {
                    const attempt = findAttemptForExam(exam.id);
                    const isPending = attempt && !attempt.graded_at;
                    const isGraded = attempt && attempt.graded_at;
                    
                    return (
                      <tr key={exam.id} style={{ 
                        borderBottom: '1px solid #dee2e6' 
                      }}>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ fontWeight: '600' }}>{exam.title}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {exam.description && exam.description.length > 50 
                              ? `${exam.description.substring(0, 50)}...` 
                              : exam.description || 'No description'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{exam.program_title}</td>
                        <td style={{ padding: '12px 8px' }}>{exam.max_score || 100}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <div style={{ 
                            display: 'inline-block',
                            padding: '4px 8px', 
                            borderRadius: '4px', 
                            fontSize: '12px', 
                            fontWeight: '500',
                            backgroundColor: isGraded ? '#d4edda' : isPending ? '#fff3cd' : '#e2e3e5',
                            color: isGraded ? '#155724' : isPending ? '#856404' : '#383d41'
                          }}>
                            {isGraded ? 'Graded' : isPending ? 'Submitted' : 'Not Started'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {isGraded ? `${attempt.score} / ${exam.max_score}` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          {isPending || isGraded ? formatDate(attempt.submitted_at) : 'Not submitted'}
                        </td>
                        <td style={{ padding: '12px 8px' }}>
                          <a 
                            href={isGraded 
                              ? `/trainee/practical-exams/${exam.id}/results/${attempt.id}` 
                              : isPending 
                                ? `/trainee/practical-exams/${exam.id}/pending` 
                                : `/trainee/practical-exams/${exam.id}/take`
                            } 
                            style={{ 
                              display: 'inline-block', 
                              padding: '6px 12px', 
                              borderRadius: '4px', 
                              backgroundColor: isGraded ? '#28a745' : isPending ? '#ffc107' : '#007bff', 
                              color: 'white', 
                              textDecoration: 'none',
                              fontSize: '14px'
                            }}
                          >
                            {isGraded ? 'View Results' : isPending ? 'View Submission' : 'Take Exam'}
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            <Clipboard size={48} style={{ marginBottom: '15px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '5px' }}>
              No Practical Exams Found
            </h3>

            <p>
              {programId 
                ? 'No practical exams have been assigned for this program yet.'
                : 'No practical exams have been assigned to you yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TraineePracticalExams;