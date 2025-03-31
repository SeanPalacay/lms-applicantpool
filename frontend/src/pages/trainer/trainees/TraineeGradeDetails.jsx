import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  BarChart2, BookOpen, CheckCircle, AlertTriangle, 
  Calendar, Clock, FileText, GraduationCap, Award,ClipboardList
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

const TraineeGradeDetails = () => {
  const { traineeId } = useParams();
  const navigate = useNavigate();
  const [gradeData, setGradeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const programsData = await trainerService.getPrograms();
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching programs:', err);
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {
    const fetchGradeData = async () => {
      setLoading(true);
      setError('');
      
      try {
        const data = await trainerService.getTraineeGrades(
          traineeId, 
          selectedProgram ? selectedProgram : null
        );
        setGradeData(data);
      } catch (err) {
        console.error('Error fetching grade data:', err);
        setError('Failed to load grade data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchGradeData();
  }, [traineeId, selectedProgram]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatScore = (score, maxScore = 100) => {
    if (score === null || score === undefined) return 'N/A';
    const scoreNum = Number(score);
    if (isNaN(scoreNum)) return 'N/A';
    
    if (maxScore !== 100) {
      const percentage = (scoreNum / maxScore) * 100;
      return `${scoreNum} / ${maxScore} (${percentage.toFixed(1)}%)`;
    }
    
    return `${scoreNum.toFixed(1)}%`;
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'passed': return { background: '#d4edda', color: '#155724' };
      case 'failed': return { background: '#f8d7da', color: '#721c24' };
      default: return { background: '#f8f9fa', color: '#333' };
    }
  };

  const handleProgramChange = (e) => {
    setSelectedProgram(e.target.value);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!gradeData) {
    return <AlertBanner message="No grade data available" type="info" />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ 
        background: '#fff', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px' }}>
            Grade Report: {gradeData.trainee.full_name}
          </h2>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <label htmlFor="program-filter">Program:</label>
            <select 
              id="program-filter"
              value={selectedProgram}
              onChange={handleProgramChange}
              style={{ 
                padding: '8px', 
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          marginBottom: '30px' 
        }}>
          <div style={{ 
            flex: '1', 
            minWidth: '250px', 
            background: 'linear-gradient(to right, #007bff, #00a5ff)', 
            color: 'white',
            borderRadius: '8px',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 10px 0' }}>Final Grade</h3>
            <div style={{ fontSize: '42px', fontWeight: 'bold' }}>
              {gradeData.final_grade.toFixed(1)}%
            </div>
            <div style={{ 
              marginTop: '10px',
              padding: '5px 15px',
              borderRadius: '20px',
              background: gradeData.passed ? 'rgba(255,255,255,0.3)' : 'rgba(255,0,0,0.3)',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              {gradeData.passed ? (
                <><CheckCircle size={14} /> Passed</>
              ) : (
                <><AlertTriangle size={14} /> Failed</>
              )}
            </div>
          </div>
          
          <div style={{ 
            flex: '1', 
            minWidth: '250px',
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 15px 0' }}>Grade Components</h3>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Quizzes ({(gradeData.grade_config.quiz_weight * 100).toFixed(0)}%)</span>
                <span>{gradeData.quiz_average.toFixed(1)}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#e9ecef', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${gradeData.quiz_average}%`, 
                  height: '100%', 
                  background: '#007bff',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Contribution: {gradeData.components.quiz_component.toFixed(1)}%
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>Practical Exams ({(gradeData.grade_config.practical_exam_weight * 100).toFixed(0)}%)</span>
                <span>{gradeData.practical_average.toFixed(1)}%</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                background: '#e9ecef', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${gradeData.practical_average}%`, 
                  height: '100%', 
                  background: '#28a745',
                  borderRadius: '4px'
                }}></div>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                Contribution: {gradeData.components.practical_component.toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div style={{ 
            flex: '1', 
            minWidth: '250px',
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 15px 0' }}>Grade Configuration</h3>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Passing Grade:</span>
                <span style={{ fontWeight: 'bold' }}>{gradeData.grade_config.passing_grade}%</span>
              </div>
            </div>
            
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Quiz Weight:</span>
                <span>{(gradeData.grade_config.quiz_weight * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Practical Exam Weight:</span>
                <span>{(gradeData.grade_config.practical_exam_weight * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList size={20} />
              <span>Quiz Attempts</span>
            </div>
          </h3>
          
          {gradeData.quiz_attempts && gradeData.quiz_attempts.length > 0 ? (
            <div style={{ 
              border: '1px solid #dee2e6', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Quiz</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Program</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Date</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Score</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.quiz_attempts.map((attempt, index) => (
                    <tr key={attempt.attempt_id} style={{ 
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>{attempt.title}</td>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>{attempt.program_title || 'N/A'}</td>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>{formatDate(attempt.attempt_date)}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>
                        {formatScore(attempt.score)}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                        <span style={{ 
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          ...getStatusStyle(attempt.score >= (attempt.passing_score || 70) ? 'passed' : 'failed')
                        }}>
                          {attempt.score >= (attempt.passing_score || 70) ? (
                            <><CheckCircle size={12} /> Passed</>
                          ) : (
                            <><AlertTriangle size={12} /> Failed</>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              background: '#f8f9fa',
              borderRadius: '8px',
              color: '#666'
            }}>
              <ClipboardList size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No quiz attempts found.</p>
            </div>
          )}
        </div>

        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <GraduationCap size={20} />
              <span>Practical Exam Attempts</span>
            </div>
          </h3>
          
          {gradeData.practical_attempts && gradeData.practical_attempts.length > 0 ? (
            <div style={{ 
              border: '1px solid #dee2e6', 
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ 
                width: '100%',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Exam</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Program</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Submitted</th>
                    <th style={{ padding: '12px 15px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Graded</th>
                    <th style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>Score</th>
                    <th style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {gradeData.practical_attempts.map((attempt, index) => (
                    <tr key={attempt.attempt_id} style={{ 
                      background: index % 2 === 0 ? '#fff' : '#f8f9fa'
                    }}>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>{attempt.exam_title}</td>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>{attempt.program_title || 'N/A'}</td>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>{formatDate(attempt.submitted_at)}</td>
                      <td style={{ padding: '12px 15px', borderBottom: '1px solid #dee2e6' }}>
                        {attempt.graded_at ? formatDate(attempt.graded_at) : (
                          <span style={{ color: '#dc3545', fontStyle: 'italic' }}>Not graded</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'right', borderBottom: '1px solid #dee2e6', fontWeight: 'bold' }}>
                        {attempt.graded_at ? formatScore(attempt.score, attempt.max_score) : 'Pending'}
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                        {attempt.graded_at && (
                          <span style={{ 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            ...getStatusStyle((attempt.score / attempt.max_score) >= 0.7 ? 'passed' : 'failed')
                          }}>
                            {(attempt.score / attempt.max_score) >= 0.7 ? (
                              <><CheckCircle size={12} /> Passed</>
                            ) : (
                              <><AlertTriangle size={12} /> Failed</>
                            )}
                          </span>
                        )}
                        {!attempt.graded_at && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            background: '#e9ecef',
                            color: '#495057'
                          }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              background: '#f8f9fa',
              borderRadius: '8px',
              color: '#666'
            }}>
              <GraduationCap size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No practical exam attempts found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraineeGradeDetails;