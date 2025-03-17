import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, PieChart, CheckCircle, Clock, Award, AlertTriangle, 
  BookOpen, TrendingUp, Filter, Calendar, Download, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner'; // Assuming you have this
import AlertBanner from '../../../components/shared/AlertBanner'; // Assuming you have this
import traineeService from '../../../services/traineeService';

const ProgressTracking = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [overallProgress, setOverallProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterActive, setFilterActive] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        setLoading(true);

        const enrollmentsData = await traineeService.getPrograms();
        const quizAttemptsData = await traineeService.getTraineeQuizAttempts();
        const milestonesData = await traineeService.getTraineeMilestones();

        setEnrollments(enrollmentsData);
        setQuizAttempts(quizAttemptsData);
        setMilestones(milestonesData);

        if (enrollmentsData.length > 0) {
          const totalPercentage = enrollmentsData.reduce(
            (sum, enrollment) => sum + parseFloat(enrollment.completion_percentage || 0), 
            0
          );
          setOverallProgress(totalPercentage / enrollmentsData.length);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching progress data:', err);
        setError(err.message || 'Failed to load progress data. Please try again later.');
        setLoading(false);
      }
    };

    fetchProgressData();
  }, []);

  const getFilteredEnrollments = () => {
    let filtered = [...enrollments];
    
    if (filterActive !== 'all') {
      filtered = filtered.filter(enrollment => enrollment.completion_status === filterActive);
    }
    
    if (sortBy === 'recent') {
      filtered = filtered.sort((a, b) => new Date(b.enrollment_date) - new Date(a.enrollment_date));
    } else if (sortBy === 'progress') {
      filtered = filtered.sort((a, b) => (b.completion_percentage || 0) - (a.completion_percentage || 0));
    } else if (sortBy === 'alphabetical') {
      filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return filtered;
  };

  const getMilestoneStatusClass = (status) => {
    switch (status) {
      case 'completed': return { backgroundColor: 'var(--primary-ultralight)', color: 'var(--primary-color)' };
      case 'in_progress': return { backgroundColor: 'rgba(243, 156, 18, 0.1)', color: 'var(--warning-color)' };
      case 'not_started': default: return { backgroundColor: 'var(--light-gray)', color: 'var(--text-secondary)' };
    }
  };

  const getMilestoneStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={18} />;
      case 'in_progress': return <Clock size={18} />;
      case 'not_started': default: return <AlertTriangle size={18} />;
    }
  };

  const exportProgressPDF = async () => {
    try {
      const blob = await traineeService.exportProgressPDF();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Progress_Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error exporting progress:', err);
      alert('Failed to export progress report. Please try again.');
    }
  };

  const refreshProgressData = () => {
    setLoading(true);
    setEnrollments([]);
    setQuizAttempts([]);
    setMilestones([]);
    setOverallProgress(0);
    setError(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      gap: 'var(--spacing-md)', 
      color: 'var(--text-secondary)',
    }}>
      <AlertTriangle size={48} style={{ color: 'var(--danger-color)' }} />
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Error</h2>
      <p>{error}</p>
      <button 
        onClick={refreshProgressData} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          padding: 'var(--spacing-sm) var(--spacing-md)', 
          backgroundColor: 'var(--primary-color)', 
          color: 'white', 
          border: 'none', 
          borderRadius: 'var(--radius-md)', 
          cursor: 'pointer',
          transition: 'background-color var(--transition-fast)',
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
      >
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const filteredEnrollments = getFilteredEnrollments();

  return (
    <div style={{ 
      padding: 'var(--spacing-xl)', 
      backgroundColor: 'var(--light-gray)', 
      minHeight: '100vh',
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--spacing-xl)',
      }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Progress Tracking</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Track your learning journey and achievements</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <button 
            onClick={exportProgressPDF} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              backgroundColor: 'transparent', 
              color: 'var(--text-secondary)', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--light-gray)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Download size={16} /> Export Report
          </button>
          <button 
            onClick={refreshProgressData} 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              backgroundColor: 'transparent', 
              color: 'var(--text-secondary)', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--light-gray)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-xl)',
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: 'var(--spacing-md)', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-md)',
          }}>
            <BarChart size={24} style={{ color: 'var(--primary-color)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Overall Progress</h3>
          </div>
          <div style={{ 
            height: '8px', 
            backgroundColor: 'var(--light-gray)', 
            borderRadius: 'var(--radius-full)', 
            marginBottom: 'var(--spacing-sm)',
          }}>
            <div 
              style={{ 
                width: `${overallProgress}%`, 
                height: '100%', 
                backgroundColor: 'var(--primary-color)', 
                borderRadius: 'var(--radius-full)',
              }}
            ></div>
          </div>
          <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {overallProgress.toFixed(2)}%
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: 'var(--spacing-md)', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-md)',
          }}>
            <BookOpen size={24} style={{ color: 'var(--success-color)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Programs Enrolled</h3>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {enrollments.length}
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: 'var(--spacing-md)', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-md)',
          }}>
            <CheckCircle size={24} style={{ color: 'var(--info-color)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Completed Programs</h3>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {enrollments.filter(e => e.completion_status === 'completed').length}
          </div>
        </div>

        <div style={{ 
          backgroundColor: 'white', 
          padding: 'var(--spacing-md)', 
          borderRadius: 'var(--radius-md)', 
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            marginBottom: 'var(--spacing-md)',
          }}>
            <Award size={24} style={{ color: 'var(--warning-color)' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>Quiz Average</h3>
          </div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {quizAttempts.length > 0 
              ? (quizAttempts.reduce((sum, attempt) => sum + parseFloat(attempt.score || 0), 0) / quizAttempts.length).toFixed(2)
              : '0.00'}%
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 'var(--spacing-md)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Filter by Status:</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {['all', 'in_progress', 'completed', 'not_started'].map(status => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-xs) var(--spacing-sm)', 
                  backgroundColor: filterActive === status ? 'var(--primary-color)' : 'transparent', 
                  color: filterActive === status ? 'white' : 'var(--text-secondary)', 
                  border: `1px solid ${filterActive === status ? 'var(--primary-color)' : 'var(--medium-gray)'}`, 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ 
              padding: 'var(--spacing-xs) var(--spacing-sm)', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-md)', 
              outline: 'none', 
              fontSize: '14px', 
              color: 'var(--text-primary)',
            }}
          >
            <option value="recent">Recently Enrolled</option>
            <option value="progress">Progress (High to Low)</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-sm)', 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          marginBottom: 'var(--spacing-md)',
        }}>
          <BookOpen size={20} /> Program Progress
        </h2>
        {filteredEnrollments.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 'var(--spacing-md)', 
            color: 'var(--text-secondary)',
          }}>
            <p>No program enrollments found. Enroll in programs to track your progress.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {filteredEnrollments.map(enrollment => (
              <div key={enrollment.id} style={{ 
                backgroundColor: 'white', 
                padding: 'var(--spacing-md)', 
                borderRadius: 'var(--radius-md)', 
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{enrollment.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} /> Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}
                    </span>
                    <span style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      backgroundColor: enrollment.completion_status === 'completed' ? 'var(--primary-ultralight)' : 'var(--light-gray)', 
                      color: enrollment.completion_status === 'completed' ? 'var(--primary-color)' : 'var(--text-secondary)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '14px', 
                      fontWeight: '500',
                    }}>
                      {enrollment.completion_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 'var(--spacing-xs)',
                  }}>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {enrollment.completion_percentage}%
                    </span>
                  </div>
                  <div style={{ 
                    height: '8px', 
                    backgroundColor: 'var(--light-gray)', 
                    borderRadius: 'var(--radius-full)',
                  }}>
                    <div 
                      style={{ 
                        width: `${enrollment.completion_percentage}%`, 
                        height: '100%', 
                        backgroundColor: 'var(--primary-color)', 
                        borderRadius: 'var(--radius-full)',
                      }}
                    ></div>
                  </div>
                </div>
                <Link 
                  to={`/trainee/programs/${enrollment.id}`} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: 'var(--spacing-sm) var(--spacing-md)', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    borderRadius: 'var(--radius-md)', 
                    textDecoration: 'none',
                    transition: 'background-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
                >
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h2 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-sm)', 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          marginBottom: 'var(--spacing-md)',
        }}>
          <TrendingUp size={20} /> Milestone Progress
        </h2>
        {milestones.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 'var(--spacing-md)', 
            color: 'var(--text-secondary)',
          }}>
            <p>No milestones assigned yet. Milestones will appear here as they are assigned.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {milestones.map(milestone => (
              <div key={milestone.id} style={{ 
                backgroundColor: 'white', 
                padding: 'var(--spacing-md)', 
                borderRadius: 'var(--radius-md)', 
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: 'var(--radius-full)', 
                    ...getMilestoneStatusClass(milestone.status),
                  }}>
                    {getMilestoneStatusIcon(milestone.status)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>{milestone.title}</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                      {milestone.description}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <span>{milestone.program_title}</span>
                      <span><Clock size={14} /> Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {milestone.completion_date && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <CheckCircle size={16} style={{ color: 'var(--primary-color)' }} />
                      <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Completed on {new Date(milestone.completion_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-sm)', 
          fontSize: '20px', 
          fontWeight: '600', 
          color: 'var(--text-primary)', 
          marginBottom: 'var(--spacing-md)',
        }}>
          <PieChart size={20} /> Quiz Performance
        </h2>
        {quizAttempts.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: 'var(--spacing-md)', 
            color: 'var(--text-secondary)',
          }}>
            <p>No quiz attempts found. Complete quizzes to see your performance.</p>
          </div>
        ) : (
          <div style={{ 
            backgroundColor: 'white', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-md)', 
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
              gap: 'var(--spacing-md)', 
              marginBottom: 'var(--spacing-md)',
            }}>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Quiz Name</div>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Program</div>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Attempt Date</div>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Score</div>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Status</div>
              <div style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</div>
            </div>
            <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
              {quizAttempts.map(attempt => (
                <div key={attempt.id} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                  gap: 'var(--spacing-md)', 
                  alignItems: 'center',
                }}>
                  <div style={{ color: 'var(--text-primary)' }}>{attempt.quiz_title}</div>
                  <div style={{ color: 'var(--text-primary)' }}>{attempt.program_title}</div>
                  <div style={{ color: 'var(--text-primary)' }}>{new Date(attempt.attempt_date).toLocaleString()}</div>
                  <div style={{ color: 'var(--text-primary)' }}>{attempt.score}%</div>
                  <div>
                    <span style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      backgroundColor: parseFloat(attempt.score) >= parseFloat(attempt.passing_score) ? 'var(--primary-ultralight)' : 'rgba(231, 76, 60, 0.1)', 
                      color: parseFloat(attempt.score) >= parseFloat(attempt.passing_score) ? 'var(--primary-color)' : 'var(--danger-color)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '14px', 
                      fontWeight: '500',
                    }}>
                      {parseFloat(attempt.score) >= parseFloat(attempt.passing_score) ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div>
                    <Link 
                      to={`/trainee/assessments/quiz/${attempt.quiz_id}/feedback?attempt=${attempt.id}`} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        padding: 'var(--spacing-xs) var(--spacing-sm)', 
                        backgroundColor: 'var(--primary-color)', 
                        color: 'white', 
                        borderRadius: 'var(--radius-md)', 
                        textDecoration: 'none',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-dark)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-color)'}
                    >
                      View Feedback
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressTracking;