import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
User, ArrowLeft, Mail, Phone, Calendar, BookOpen, Flag, Trophy,
Award, CheckCircle, Clock, AlertTriangle, TrendingUp, FileText, GraduationCap,
Bell, BarChart2, ClipboardList
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import TraineeGradeDetails from '../TraineeGradeDetails';
import TraineeRankingCard from '../../leaderboard/TraineeRankingCard';
const TraineeDetails = () => {
const { traineeId } = useParams();
const navigate = useNavigate();
const [trainee, setTrainee] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');
const [activeTab, setActiveTab] = useState('programs');

useEffect(() => {
  if (trainee) {
    console.log('Trainee data:', trainee);
    console.log('Practical exam attempts:', trainee.practical_exam_attempts);
  }
}, [trainee]);


useEffect(() => {
  const fetchTraineeData = async () => {
    setLoading(true);
    setError('');
    
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
      
      const traineeData = await trainerService.getTraineeDetails(traineeId);
      setTrainee(traineeData);
    } catch (err) {
      console.error('Error fetching trainee data:', err);
      setError('Failed to load trainee details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  fetchTraineeData();
}, [traineeId, navigate]);

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

const calculateTotalProgress = () => {
  if (!trainee || !trainee.programs || trainee.programs.length === 0) {
    return 0;
  }
  return trainee.overall_progress || 0;
};

const getStatusStyle = (status) => {
  switch(status) {
    case 'completed': return { background: '#d4edda', color: '#155724' };
    case 'in_progress': return { background: '#cce5ff', color: '#004085' };
    case 'not_started': return { background: '#fff3cd', color: '#856404' };
    default: return { background: '#f8f9fa', color: '#333' };
  }
};

const getStatusLabel = (status) => {
  switch(status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'not_started': return 'Not Started';
    default: return status;
  }
};

const formatScore = (score) => {
  if (score === null || score === undefined) return 'N/A';
  const scoreNum = Number(score);
  if (isNaN(scoreNum)) return 'N/A';
  return `${scoreNum.toFixed(1)}%`;
};

const navigateToProgress = () => {
  navigate(`/trainer/trainees/${traineeId}/progress`);
};

if (loading) {
  return <LoadingSpinner />;
}

if (error) {
  return <AlertBanner message={error} type="error" />;
}

if (!trainee) {
  return <AlertBanner message="Trainee not found" type="error" />;
}

return (
  <div style={{ 
    padding: '20px', 
    maxWidth: '1200px', 
    margin: '0 auto' 
  }}>
    <div style={{ marginBottom: '20px' }}>
      <Link 
        to="/trainer/trainees"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px', 
          color: '#007bff', 
          textDecoration: 'none',
          fontSize: '14px'
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Trainees</span>
      </Link>
    </div>
    
    <div style={{ 
      background: '#fff', 
      borderRadius: '8px', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)', 
      padding: '20px', 
      marginBottom: '20px' 
    }}>
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '20px', 
        alignItems: 'center' 
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: '#007bff', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: '32px',
          flexShrink: 0
        }}>
          {trainee.full_name.charAt(0)}
        </div>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <h2 style={{ 
            fontSize: '24px', 
            margin: '0 0 10px 0' 
          }}>{trainee.full_name}</h2>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '15px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Mail size={16} />
              <span>{trainee.email}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Phone size={16} />
              <span>{trainee.phone || 'No phone number'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Calendar size={16} />
              <span>Joined: {formatDate(trainee.registration_date)}</span>
            </div>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '15px', 
          flexShrink: 0 
        }}>
          <div style={{ width: '80px', height: '80px' }}>
            <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
              <path 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="2.8"
              />
              <path 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#007bff"
                strokeWidth="2.8"
                strokeDasharray={`${calculateTotalProgress()}, 100`}
              />
              <text 
                x="18" 
                y="20.35" 
                textAnchor="middle" 
                fontSize="11px" 
                fill="#333"
              >
                {calculateTotalProgress()}%
              </text>
            </svg>
          </div>
          <button 
            onClick={navigateToProgress}
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
              fontSize: '14px'
            }}
          >
            <TrendingUp size={16} />
            <span>View Progress</span>
          </button>
        </div>
      </div>
    </div>
    
    <div style={{ 
      display: 'flex', 
      gap: '10px', 
      marginBottom: '20px', 
      flexWrap: 'wrap' 
    }}>
      {[
        { id: 'programs', icon: BookOpen, label: 'Programs' },
        // { id: 'milestones', icon: Flag, label: 'Milestones' },
        { id: 'assessments', icon: ClipboardList, label: 'Assessments' },
        { id: 'practical-exams', icon: GraduationCap, label: 'Practical Exams' },
        { id: 'performance', icon: BarChart2, label: 'Performance' },
        { id: 'ranking', icon: Trophy, label: 'Ranking' }, // New tab for leaderboard/ranking
        { id: 'grades', icon: Award, label: 'Final Grades' }, // New tab

      ].map(tab => (
        <button 
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
          style={{ 
            padding: '10px 15px', 
            background: activeTab === tab.id ? '#007bff' : '#f8f9fa', 
            color: activeTab === tab.id ? 'white' : '#333', 
            border: '1px solid #ddd', 
            borderRadius: '4px', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px',
            fontSize: '14px'
          }}
        >
          <tab.icon size={18} />
          <span>{tab.label}</span>
        </button>
      ))}
    </div>

    {activeTab === 'grades' && (
<TraineeGradeDetails traineeId={traineeId} />
)}

{activeTab === 'ranking' && (
  <TraineeRankingCard traineeId={traineeId} />
)}

    {activeTab === 'practical-exams' && (
<div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
  <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
    <h3 style={{ fontSize: '18px', margin: 0 }}>Practical Exam Attempts</h3>
  </div>
  {trainee.practical_exam_attempts && trainee.practical_exam_attempts.length > 0 ? (
    <div style={{ padding: '15px' }}>
      {trainee.practical_exam_attempts.map(attempt => (
        <div 
          key={attempt.id} 
          style={{ 
            padding: '15px', 
            borderBottom: '1px solid #eee' 
          }}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '10px' 
          }}>
            <GraduationCap size={20} style={{ color: '#007bff', flexShrink: 0 }} />
            <h4 style={{ 
              fontSize: '16px', 
              margin: 0, 
              flex: 1 
            }}>{attempt.exam_title || 'Unknown Exam'}</h4>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: attempt.score >= (attempt.max_score * 0.7) ? '#28a745' : '#dc3545' 
            }}>
              {formatScore(attempt.score)}
            </span>
          </div>
          <div style={{ 
            marginLeft: '30px', 
            fontSize: '14px', 
            color: '#666' 
          }}>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              marginBottom: '10px' 
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BookOpen size={14} />
                {attempt.program_title || 'Unknown Program'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} />
                Submitted: {formatDate(attempt.submitted_at)}
              </span>
              {attempt.graded_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <CheckCircle size={14} />
                  Graded: {formatDate(attempt.graded_at)}
                </span>
              )}
            </div>
            {attempt.feedback && (
              <div style={{ 
                display: 'flex', 
                gap: '5px', 
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                border: '1px solid #eee'
              }}>
                <FileText size={16} style={{ flexShrink: 0 }} />
                <p style={{ margin: 0 }}>{attempt.feedback}</p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: '12px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '5px', 
                fontSize: '12px',
                ...(attempt.score >= (attempt.max_score * 0.7) 
                  ? getStatusStyle('completed') 
                  : getStatusStyle('not_started'))
              }}>
                {attempt.score >= (attempt.max_score * 0.7) ? (
                  <CheckCircle size={14} />
                ) : (
                  <AlertTriangle size={14} />
                )}
                <span>{attempt.score >= (attempt.max_score * 0.7) ? 'Passed' : 'Failed'}</span>
              </div>
              <span>Max score: {attempt.max_score}</span>
              {attempt.graded_by_name && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={14} />
                  Graded by: {attempt.graded_by_name}
                </span>
              )}
            </div>
          </div>
          {/* {attempt.graded_at ? (
            <Link 
              to={`/trainer/practical-exams/${attempt.exam_id}/attempts/${attempt.id}`} 
              style={{ 
                display: 'block', 
                textAlign: 'right', 
                color: '#007bff', 
                textDecoration: 'none', 
                fontSize: '14px' 
              }}
            >
              View Details
            </Link>
          ) : (
            <Link 
              to={`/trainer/practical-exams/${attempt.exam_id}/grade/${attempt.id}`} 
              style={{ 
                display: 'block', 
                textAlign: 'right', 
                color: '#dc3545', 
                textDecoration: 'none', 
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Grade Now
            </Link>
          )} */}
        </div>
      ))}
    </div>
  ) : (
    <div style={{ 
      padding: '40px', 
      textAlign: 'center', 
      color: '#666' 
    }}>
      <GraduationCap size={48} style={{ marginBottom: '15px' }} />
      <p style={{ margin: 0, fontSize: '14px' }}>No practical exam attempts found for this trainee.</p>
    </div>
  )}
</div>
)}
    
    {activeTab === 'programs' && (
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>Enrolled Programs</h3>
        </div>
        {trainee.programs && trainee.programs.length > 0 ? (
          <div style={{ padding: '15px' }}>
            {trainee.programs.map(program => (
              <div 
                key={program.id} 
                style={{ 
                  display: 'flex', 
                  gap: '15px', 
                  padding: '15px', 
                  borderBottom: '1px solid #eee',
                  alignItems: 'center'
                }}
              >
                <BookOpen size={24} style={{ color: '#007bff', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{program.title}</h4>
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    marginBottom: '10px', 
                    fontSize: '14px', 
                    color: '#666' 
                  }}>
                    <span>{program.type || 'Regular'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} />
                      {formatDate(program.enrollment_date)}
                    </span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: '#eee', 
                    borderRadius: '3px', 
                    overflow: 'hidden', 
                    marginBottom: '10px' 
                  }}>
                    <div style={{ 
                      width: `${program.completion_percentage || 0}%`, 
                      height: '100%', 
                      background: '#007bff' 
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <span>{program.completion_percentage || 0}% complete</span>
                    <div style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      ...getStatusStyle(program.completion_status) 
                    }}>
                      {program.completion_status === 'completed' && <CheckCircle size={14} />}
                      {program.completion_status === 'in_progress' && <Clock size={14} />}
                      {program.completion_status === 'not_started' && <AlertTriangle size={14} />}
                      <span>{getStatusLabel(program.completion_status)}</span>
                    </div>
                  </div>
                </div>
                {/* <Link 
                  to={`/trainer/programs/${program.id}`} 
                  style={{ 
                    color: '#007bff', 
                    textDecoration: 'none', 
                    fontSize: '14px' 
                  }}
                >
                  View Program
                </Link> */}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <BookOpen size={48} style={{ marginBottom: '15px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>This trainee is not enrolled in any programs.</p>
          </div>
        )}
      </div>
    )}
    
    {activeTab === 'milestones' && (
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>Assigned Milestones</h3>
        </div>
        {trainee.milestones && trainee.milestones.length > 0 ? (
          <div style={{ padding: '15px' }}>
            {trainee.milestones.map(milestone => (
              <div 
                key={milestone.id} 
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid #eee' 
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginBottom: '10px' 
                }}>
                  <Flag size={20} style={{ color: '#007bff', flexShrink: 0 }} />
                  <h4 style={{ 
                    fontSize: '16px', 
                    margin: 0, 
                    flex: 1 
                  }}>{milestone.title}</h4>
                  <div style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px', 
                    fontSize: '12px',
                    ...getStatusStyle(milestone.status)
                  }}>
                    {milestone.status === 'completed' && <CheckCircle size={14} />}
                    {milestone.status === 'in_progress' && <Clock size={14} />}
                    {milestone.status === 'not_started' && <AlertTriangle size={14} />}
                    <span>{getStatusLabel(milestone.status)}</span>
                  </div>
                </div>
                <div style={{ 
                  marginLeft: '30px', 
                  fontSize: '14px', 
                  color: '#666' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    marginBottom: '10px' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <BookOpen size={14} />
                      {milestone.program_title || 'Unknown Program'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} />
                      Due: {formatDate(milestone.due_date)}
                    </span>
                  </div>
                  {milestone.description && (
                    <p style={{ margin: '0 0 10px 0' }}>{milestone.description}</p>
                  )}
                  {milestone.status === 'completed' && milestone.completion_date && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      color: '#28a745' 
                    }}>
                      <CheckCircle size={16} />
                      <span>Completed on {formatDate(milestone.completion_date)}</span>
                    </div>
                  )}
                </div>
                <Link 
                  to={`/trainer/milestones/${milestone.id}`} 
                  style={{ 
                    display: 'block', 
                    textAlign: 'right', 
                    color: '#007bff', 
                    textDecoration: 'none', 
                    fontSize: '14px' 
                  }}
                >
                  View Milestone
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <Flag size={48} style={{ marginBottom: '15px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No milestones have been assigned to this trainee.</p>
          </div>
        )}
      </div>
    )}
    
    {activeTab === 'assessments' && (
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>Quiz Attempts & Assessments</h3>
        </div>
        {trainee.quiz_attempts && trainee.quiz_attempts.length > 0 ? (
          <div style={{ padding: '15px' }}>
            {trainee.quiz_attempts.map(assessment => (
              <div 
                key={assessment.id} 
                style={{ 
                  padding: '15px', 
                  borderBottom: '1px solid #eee' 
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  marginBottom: '10px' 
                }}>
                  <ClipboardList size={20} style={{ color: '#007bff', flexShrink: 0 }} />
                  <h4 style={{ 
                    fontSize: '16px', 
                    margin: 0, 
                    flex: 1 
                  }}>{assessment.title || 'Unknown Quiz'}</h4>
                  <span style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold', 
                    color: assessment.score >= (assessment.passing_score || 70) ? '#28a745' : '#dc3545' 
                  }}>
                    {formatScore(assessment.score)}
                  </span>
                </div>
                <div style={{ 
                  marginLeft: '30px', 
                  fontSize: '14px', 
                  color: '#666' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: '15px', 
                    marginBottom: '10px' 
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <BookOpen size={14} />
                      {assessment.program_title || 'Unknown Program'}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={14} />
                      Attempted: {formatDate(assessment.attempt_date)}
                    </span>
                  </div>
                  {assessment.feedback && (
                    <div style={{ 
                      display: 'flex', 
                      gap: '5px', 
                      marginBottom: '10px' 
                    }}>
                      <FileText size={16} style={{ flexShrink: 0 }} />
                      <p style={{ margin: 0 }}>{assessment.feedback}</p>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '5px', 
                      fontSize: '12px',
                      ...(assessment.score >= (assessment.passing_score || 70) 
                        ? getStatusStyle('completed') 
                        : getStatusStyle('not_started'))
                    }}>
                      {assessment.score >= (assessment.passing_score || 70) ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertTriangle size={14} />
                      )}
                      <span>{assessment.score >= (assessment.passing_score || 70) ? 'Passed' : 'Failed'}</span>
                    </div>
                    {assessment.passing_score && (
                      <span>Passing score: {assessment.passing_score}%</span>
                    )}
                  </div>
                </div>
                {/* <Link 
                  to={`/trainer/quizzes/${assessment.id}/results`} 
                  style={{ 
                    display: 'block', 
                    textAlign: 'right', 
                    color: '#007bff', 
                    textDecoration: 'none', 
                    fontSize: '14px' 
                  }}
                >
                  View Results
                </Link> */}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            padding: '40px', 
            textAlign: 'center', 
            color: '#666' 
          }}>
            <ClipboardList size={48} style={{ marginBottom: '15px' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>No quiz attempts found for this trainee.</p>
          </div>
        )}
      </div>
    )}
    
    {activeTab === 'performance' && (
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: '18px', margin: 0 }}>Performance Overview</h3>
        </div>
        <div style={{ 
          padding: '15px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '20px' 
        }}>
          <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
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
              <h3 style={{ fontSize: '16px', margin: 0 }}>Performance Metrics</h3>
            </div>
            <div style={{ 
              padding: '15px', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '15px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{trainee.programs ? trainee.programs.length : 0}</div>
                <div style={{ fontSize: '14px', color: '#666' }}>Programs</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {trainee.quiz_attempts ? trainee.quiz_attempts.filter(a => a.score >= (a.passing_score || 70)).length : 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Quizzes Passed</div>
              </div>
              {/* <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {trainee.milestones ? trainee.milestones.filter(m => m.status === 'completed').length : 0}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Milestones Completed</div>
              </div> */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {trainee.average_quiz_score ? `${Number(trainee.average_quiz_score).toFixed(1)}%` : 'N/A'}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>Avg. Quiz Score</div>
              </div>
            </div>
          </div>

          {/* <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #ff8c00, #ffbc00)', 
              color: 'white', 
              padding: '10px 15px', 
              borderRadius: '8px 8px 0 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <Bell size={20} />
              <h3 style={{ fontSize: '16px', margin: 0 }}>Recent Notifications</h3>
            </div>
            <div style={{ padding: '15px' }}>
              {trainee.notifications && trainee.notifications.length > 0 ? (
                <div>
                  {trainee.notifications.slice(0, 5).map((notification, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        padding: '10px 0', 
                        borderBottom: index < 4 ? '1px solid #eee' : 'none' 
                      }}
                    >
                      <div style={{ 
                        color: notification.type === 'success' ? '#28a745' : 
                                notification.type === 'warning' ? '#ffc107' : 
                                notification.type === 'error' ? '#dc3545' : '#007bff',
                        flexShrink: 0
                      }}>
                        {notification.type === 'success' && <CheckCircle size={16} />}
                        {notification.type === 'warning' && <AlertTriangle size={16} />}
                        {notification.type === 'error' && <AlertTriangle size={16} />}
                        {notification.type === 'info' && <Bell size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '14px', display: 'block' }}>{notification.title}</strong>
                        <p style={{ fontSize: '14px', margin: '5px 0' }}>{notification.message}</p>
                        <span style={{ fontSize: '12px', color: '#666' }}>{formatDate(notification.created_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <Bell size={32} style={{ marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No recent notifications</p>
                </div>
              )}
            </div>
          </div> */}

          <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #ff3366, #ff6699)', 
              color: 'white', 
              padding: '10px 15px', 
              borderRadius: '8px 8px 0 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <AlertTriangle size={20} />
              <h3 style={{ fontSize: '16px', margin: 0 }}>Performance Incidents</h3>
            </div>
            <div style={{ padding: '15px' }}>
              {trainee.performance_incidents && trainee.performance_incidents.length > 0 ? (
                <div>
                  {trainee.performance_incidents.map((incident, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        gap: '10px', 
                        padding: '10px 0', 
                        borderBottom: index < trainee.performance_incidents.length - 1 ? '1px solid #eee' : 'none' 
                      }}
                    >
                      <div style={{ 
                        color: incident.incident_type === 'low_quiz_score' ? '#007bff' : 
                                incident.incident_type === 'policy_violation' ? '#dc3545' : '#ffc107',
                        flexShrink: 0
                      }}>
                        {incident.incident_type === 'low_quiz_score' && <ClipboardList size={16} />}
                        {incident.incident_type === 'policy_violation' && <AlertTriangle size={16} />}
                        {incident.incident_type === 'other' && <AlertTriangle size={16} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', marginBottom: '5px' }}>{incident.description}</div>
                        <div style={{ 
                          display: 'flex', 
                          gap: '15px', 
                          fontSize: '12px', 
                          color: '#666' 
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} />
                            {formatDate(incident.incident_date)}
                          </span>
                          {incident.reported_by_name && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <User size={14} />
                              Reported by: {incident.reported_by_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <CheckCircle size={32} style={{ marginBottom: '10px', color: '#28a745' }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No performance incidents reported</p>
                </div>
              )}
            </div>
          </div>

          {/* <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <div style={{ 
              background: 'linear-gradient(to right, #00b7b7, #00e0e0)', 
              color: 'white', 
              padding: '10px 15px', 
              borderRadius: '8px 8px 0 0', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px' 
            }}>
              <Award size={20} />
              <h3 style={{ fontSize: '16px', margin: 0 }}>Certificates & Achievements</h3>
            </div>
            <div style={{ padding: '15px' }}>
              {trainee.certificates && trainee.certificates.length > 0 ? (
                <div>
                  {trainee.certificates.map((certificate, index) => (
                    <div 
                      key={index} 
                      style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        padding: '10px 0', 
                        borderBottom: index < trainee.certificates.length - 1 ? '1px solid #eee' : 'none',
                        alignItems: 'center'
                      }}
                    >
                      <Award size={24} style={{ color: '#00b7b7', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{certificate.title}</h4>
                        <div style={{ 
                          display: 'flex', 
                          gap: '15px', 
                          fontSize: '14px', 
                          color: '#666' 
                        }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <BookOpen size={14} />
                            {certificate.program_title}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Calendar size={14} />
                            {formatDate(certificate.issue_date)}
                          </span>
                        </div>
                      </div>
                      <Link 
                        to={`/trainer/certificates/${certificate.id}`} 
                        style={{ 
                          color: '#007bff', 
                          textDecoration: 'none', 
                          fontSize: '14px' 
                        }}
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <Award size={32} style={{ marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No certificates earned yet</p>
                </div>
              )}
            </div>
          </div> */}
        </div>
      </div>
    )}
  </div>
);
};

export default TraineeDetails;