import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, ArrowLeft, User, Calendar, CheckCircle, Clock, 
  AlertTriangle, BookOpen, Target, BarChart2, Flag, ClipboardList, 
  Award, ChevronDown, ChevronUp, FileText
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';

const TraineeProgress = () => {
  const { traineeId } = useParams();
  const navigate = useNavigate();
  const [trainee, setTrainee] = useState(null);
  const [progressData, setProgressData] = useState(null);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPrograms, setExpandedPrograms] = useState({});
  
  useEffect(() => {
    const fetchData = async () => {
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
        
        const progressData = await trainerService.getTraineeProgress(traineeId, timeRange);
        setProgressData(progressData);
        
        if (progressData && progressData.programs) {
          const initialExpandedState = {};
          progressData.programs.forEach(program => {
            initialExpandedState[program.id] = false;
          });
          setExpandedPrograms(initialExpandedState);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load progress data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [traineeId, timeRange, navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return '';
    const options = { month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  const toggleProgramExpansion = (programId) => {
    setExpandedPrograms({
      ...expandedPrograms,
      [programId]: !expandedPrograms[programId]
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      base: { 
        padding: '4px 8px', 
        borderRadius: '12px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '5px', 
        fontSize: '12px' 
      }
    };
    switch(status) {
      case 'completed':
        return (
          <div style={{ ...styles.base, background: '#d4edda', color: '#155724' }}>
            <CheckCircle size={14} />
            <span>Completed</span>
          </div>
        );
      case 'in_progress':
        return (
          <div style={{ ...styles.base, background: '#cce5ff', color: '#004085' }}>
            <Clock size={14} />
            <span>In Progress</span>
          </div>
        );
      case 'not_started':
        return (
          <div style={{ ...styles.base, background: '#fff3cd', color: '#856404' }}>
            <AlertTriangle size={14} />
            <span>Not Started</span>
          </div>
        );
      default:
        return null;
    }
  };

  const calculateOverallProgress = () => {
    if (!progressData || !progressData.programs || progressData.programs.length === 0) {
      return 0;
    }
    return Math.round(progressData.overallProgress || 0);
  };

  const prepareChartData = () => {
    if (!progressData || !progressData.progressHistory) {
      return [];
    }
    return progressData.progressHistory.map(entry => ({
      date: formatShortDate(entry.date),
      progress: entry.progressPercentage
    }));
  };

  const getRecentActivities = () => {
    if (!progressData || !progressData.activities) {
      return [];
    }
    return progressData.activities.slice(0, 5);
  };

  const getActivityIcon = (activityType) => {
    switch(activityType) {
      case 'program_enrollment': return <BookOpen size={16} style={{ color: '#007bff' }} />;
      case 'program_completion': return <CheckCircle size={16} style={{ color: '#28a745' }} />;
      case 'milestone_completion': return <Flag size={16} style={{ color: '#7209b7' }} />;
      case 'quiz_attempt': return <ClipboardList size={16} style={{ color: '#ff8c00' }} />;
      case 'certificate_earned': return <Award size={16} style={{ color: '#00b7b7' }} />;
      default: return <FileText size={16} style={{ color: '#666' }} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!trainee || !progressData) {
    return <AlertBanner message="Unable to load trainee progress data" type="error" />;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to={`/trainer/trainees/${traineeId}`} 
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
          <span>Back to Trainee Profile</span>
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
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: '15px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#007bff', 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '20px' 
            }}>
              {trainee.full_name.charAt(0)}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0' }}>{trainee.full_name}</h2>
              <span style={{ fontSize: '14px', color: '#666' }}>{trainee.email}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label htmlFor="time-range" style={{ fontSize: '14px' }}>Progress Period:</label>
            <select 
              id="time-range" 
              value={timeRange}
              onChange={handleTimeRangeChange}
              style={{ 
                padding: '8px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                fontSize: '14px' 
              }}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
<div style={{ 
  borderRadius: '8px', 
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  overflow: 'hidden', // Important: prevents content from spilling out
  background: 'white',
  display: 'flex',
  flexDirection: 'column',
  width: '100%' // Ensures the card takes full width of its container
}}>
  {/* Card Header */}
  <div style={{ 
    background: 'linear-gradient(to right, #007bff, #00b7ff)', 
    color: 'white', 
    padding: '12px 16px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '10px' 
  }}>
    <TrendingUp size={20} />
    <h3 style={{ fontSize: '16px', margin: 0, fontWeight: '600' }}>Overall Progress</h3>
  </div>
  
  {/* Card Content - Contained within the card */}
  <div style={{ 
    padding: '20px',
    display: 'flex',
    flexWrap: 'wrap', // Allows proper wrapping on smaller screens
    alignItems: 'center',
    justifyContent: 'center',
    gap: '20px'
  }}>
    {/* Progress Circle */}
    <div style={{ 
      width: '120px', 
      height: '120px', 
      position: 'relative',
      flexShrink: 0 // Prevents the circle from shrinking
    }}>
      <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#007bff" />
            <stop offset="100%" stopColor="#00b7ff" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle 
          cx="18" 
          cy="18" 
          r="15.9155" 
          fill="none" 
          stroke="#eee" 
          strokeWidth="3.8" 
          strokeLinecap="round"
        />
        
        {/* Progress circle */}
        <circle 
          cx="18" 
          cy="18" 
          r="15.9155" 
          fill="none" 
          stroke="url(#progressGradient)" 
          strokeWidth="3.8" 
          strokeLinecap="round"
          strokeDasharray={`${calculateOverallProgress()}, 100`} 
          transform="rotate(-90 18 18)" 
        />
        
        {/* Central text container */}
        <g>
          {/* Percentage number */}
          <text 
            x="18" 
            y="17" 
            style={{ 
              fontSize: '10px', 
              fontWeight: 'bold',
              fill: '#333', 
              textAnchor: 'middle',
            }}
          >
            {calculateOverallProgress()}
          </text>
          
          {/* Percentage symbol */}
          <text 
            x="18" 
            y="22" 
            style={{ 
              fontSize: '5px', 
              fill: '#666', 
              textAnchor: 'middle',
            }}
          >
            %
          </text>
        </g>
      </svg>
    </div>
    
    {/* Statistics - Properly contained */}
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '100%', // Ensures stats don't exceed card width
      flex: '1',
      minWidth: '180px' // Ensures stats have enough space
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        width: '100%'
      }}>
        {/* Programs */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '6px' 
          }}>
            Programs
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#333' 
          }}>
            {progressData.programs?.length || 0}
          </div>
        </div>
        
        {/* Complete */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '6px' 
          }}>
            Complete
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#28a745' 
          }}>
            {progressData.programs?.filter(p => p.completion_status === 'completed').length || 0}
          </div>
        </div>
        
        {/* In Progress */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '13px', 
            color: '#666', 
            marginBottom: '6px' 
          }}>
            Ongoing
          </div>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#007bff' 
          }}>
            {progressData.programs?.filter(p => p.completion_status === 'in_progress').length || 0}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
        
        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #7209b7, #b517ff)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <BarChart2 size={20} />
            <h3 style={{ fontSize: '16px', margin: 0 }}>Progress Over Time</h3>
          </div>
          <div style={{ padding: '15px' }}>
            {progressData.progressHistory && progressData.progressHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={prepareChartData()}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Progress']}
                    contentStyle={{ 
                      background: 'rgba(255, 255, 255, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="progress" 
                    stroke="#7209b7" 
                    strokeWidth={3} 
                    dot={{ r: 4 }}
                    activeDot={{ r: 6, stroke: '#7209b7', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <BarChart2 size={48} style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>Not enough data to display progress chart</p>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #ff8c00, #ffbc00)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <FileText size={20} />
            <h3 style={{ fontSize: '16px', margin: 0 }}>Recent Activities</h3>
          </div>
          <div style={{ padding: '15px' }}>
            {progressData.activities && progressData.activities.length > 0 ? (
              <div>
                {getRecentActivities().map((activity, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      gap: '10px', 
                      padding: '10px 0', 
                      borderBottom: index < 4 ? '1px solid #eee' : 'none' 
                    }}
                  >
                    <div style={{ flexShrink: 0 }}>{getActivityIcon(activity.type)}</div>
                    <div>
                      <div style={{ fontSize: '14px', marginBottom: '5px' }}>{activity.description}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#666' }}>
                        <Calendar size={14} />
                        <span>{formatDate(activity.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <FileText size={48} style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No recent activities recorded</p>
              </div>
            )}
          </div>
        </div>
        
        <div style={{ borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            background: 'linear-gradient(to right, #00b7b7, #00e0e0)', 
            color: 'white', 
            padding: '10px 15px', 
            borderRadius: '8px 8px 0 0', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px' 
          }}>
            <Target size={20} />
            <h3 style={{ fontSize: '16px', margin: 0 }}>Achievements</h3>
          </div>
          <div style={{ padding: '15px' }}>
            {progressData.achievements && progressData.achievements.length > 0 ? (
              <div>
                {progressData.achievements.map((achievement, index) => (
                  <div 
                    key={index} 
                    style={{ 
                      display: 'flex', 
                      gap: '15px', 
                      padding: '10px 0', 
                      borderBottom: index < progressData.achievements.length - 1 ? '1px solid #eee' : 'none' 
                    }}
                  >
                    <Award size={24} style={{ color: '#00b7b7', flexShrink: 0 }} />
                    <div>
                      <h4 style={{ fontSize: '16px', margin: '0 0 5px 0' }}>{achievement.title}</h4>
                      <p style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#666' }}>{achievement.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#666' }}>
                        <Calendar size={14} />
                        <span>{formatDate(achievement.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                <Award size={48} style={{ marginBottom: '10px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No achievements earned yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 10px 0' }}>Program Progress</h2>
        <div style={{ height: '2px', background: '#ddd' }}></div>
      </div>
      
      {progressData.programs && progressData.programs.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {progressData.programs.map(program => (
            <div 
              key={program.id} 
              style={{ 
                padding: '15px', 
                borderBottom: '1px solid #eee',
                ':last-child': { borderBottom: 'none' }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '15px', 
                flexWrap: 'wrap' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1', minWidth: '200px' }}>
                  <BookOpen size={20} style={{ color: '#007bff' }} />
                  <h3 style={{ fontSize: '16px', margin: 0 }}>{program.title}</h3>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  width: '200px', 
                  flexShrink: 0 
                }}>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: '#eee', 
                    borderRadius: '3px', 
                    overflow: 'hidden' 
                  }}>
                    <div style={{ 
                      width: `${program.completion_percentage || 0}%`, 
                      height: '100%', 
                      background: '#007bff',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease-in-out'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '14px' }}>{program.completion_percentage || 0}%</span>
                </div>
                <div style={{ flexShrink: 0 }}>{getStatusBadge(program.completion_status)}</div>
                <button 
                  onClick={() => toggleProgramExpansion(program.id)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    padding: '5px' 
                  }}
                >
                  {expandedPrograms[program.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
              
              {expandedPrograms[program.id] && (
                <div style={{ marginTop: '15px', marginLeft: '30px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '10px', 
                    marginBottom: '15px', 
                    fontSize: '14px', 
                    color: '#666' 
                  }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Enrollment Date:</span>
                      <span style={{ marginLeft: '5px' }}>{formatDate(program.enrollment_date)}</span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Type:</span>
                      <span style={{ marginLeft: '5px' }}>{program.type || 'Regular'}</span>
                    </div>
                    {program.completion_status === 'completed' && program.completion_date && (
                      <div>
                        <span style={{ fontWeight: 'bold' }}>Completion Date:</span>
                        <span style={{ marginLeft: '5px' }}>{formatDate(program.completion_date)}</span>
                      </div>
                    )}
                  </div>
                  
                  {program.milestones && program.milestones.length > 0 && (
                    <div style={{ marginBottom: '15px' }}>
                      <h4 style={{ 
                        fontSize: '14px', 
                        margin: '0 0 10px 0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}>
                        <Flag size={16} style={{ color: '#7209b7' }} />
                        <span>Milestones</span>
                      </h4>
                      <div>
                        {program.milestones.map((milestone, index) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              gap: '10px', 
                              padding: '10px 0', 
                              borderBottom: index < program.milestones.length - 1 ? '1px solid #eee' : 'none' 
                            }}
                          >
                            <div style={{ 
                              color: milestone.status === 'completed' ? '#28a745' : 
                                     milestone.status === 'in_progress' ? '#007bff' : '#ffc107',
                              flexShrink: 0
                            }}>
                              {milestone.status === 'completed' && <CheckCircle size={16} />}
                              {milestone.status === 'in_progress' && <Clock size={16} />}
                              {milestone.status === 'not_started' && <AlertTriangle size={16} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '14px', display: 'block' }}>{milestone.title}</span>
                              <span style={{ fontSize: '12px', color: '#666' }}>
                                {milestone.status === 'completed' 
                                  ? `Completed on ${formatDate(milestone.completion_date)}` 
                                  : `Due ${formatDate(milestone.due_date)}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {program.quizzes && program.quizzes.length > 0 && (
                    <div>
                      <h4 style={{ 
                        fontSize: '14px', 
                        margin: '0 0 10px 0', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '5px' 
                      }}>
                        <ClipboardList size={16} style={{ color: '#ff8c00' }} />
                        <span>Quizzes</span>
                      </h4>
                      <div>
                        {program.quizzes.map((quiz, index) => (
                          <div 
                            key={index} 
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              padding: '10px 0', 
                              borderBottom: index < program.quizzes.length - 1 ? '1px solid #eee' : 'none' 
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <span style={{ fontSize: '14px', display: 'block' }}>{quiz.title}</span>
                              {quiz.attempts?.length > 0 ? (
                                <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: '#666' }}>
                                  <span style={{ 
                                    color: quiz.attempts[0].score >= (quiz.passing_score || 70) ? '#28a745' : '#dc3545',
                                    fontWeight: 'bold' 
                                  }}>
                                    {quiz.attempts[0].score.toFixed(1)}%
                                  </span>
                                  <span>{quiz.attempts.length} {quiz.attempts.length === 1 ? 'attempt' : 'attempts'}</span>
                                </div>
                              ) : (<span style={{ fontSize: '12px', color: '#666' }}>Not attempted</span>
                              )}
                            </div>
                            <div style={{ 
                              padding: '4px 8px', 
                              borderRadius: '12px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '5px', 
                              fontSize: '12px',
                              ...(quiz.attempts?.length > 0 && quiz.attempts[0].score >= (quiz.passing_score || 70) 
                                ? { background: '#d4edda', color: '#155724' }
                                : quiz.attempts?.length > 0 
                                ? { background: '#fff3cd', color: '#856404' }
                                : { background: '#cce5ff', color: '#004085' })
                            }}>
                              {quiz.attempts?.length > 0 && quiz.attempts[0].score >= (quiz.passing_score || 70) && (
                                <>
                                  <CheckCircle size={14} />
                                  <span>Passed</span>
                                </>
                              )}
                              {quiz.attempts?.length > 0 && quiz.attempts[0].score < (quiz.passing_score || 70) && (
                                <>
                                  <AlertTriangle size={14} />
                                  <span>Failed</span>
                                </>
                              )}
                              {(!quiz.attempts || quiz.attempts.length === 0) && (
                                <>
                                  <Clock size={14} />
                                  <span>Pending</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
          <BookOpen size={48} style={{ color: '#007bff', marginBottom: '15px' }} />
          <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>This trainee is not enrolled in any programs</p>
        </div>
      )}
    </div>
  );
};

export default TraineeProgress;