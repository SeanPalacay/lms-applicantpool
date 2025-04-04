import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Calendar, 
  HelpCircle, 
  PieChart, 
  AlertTriangle, 
  Info, 
  ChevronRight, 
  Clock, 
  Edit 
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

const TrainerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    user: { full_name: '' },
    createdPrograms: [],
    totalPrograms: 0,
    activeTrainees: 0,
    createdQuizzes: [],
    createdMilestones: [],
    traineeProgress: [],
    alerts: []
  });

  const navigate = useNavigate();

  const transformApiDataToTrainerFormat = (apiData) => {
    console.log("Transforming API data to trainer format:", apiData);
    if (apiData.createdPrograms) return apiData;
    const transformedData = {
      user: apiData.user || { full_name: 'Trainer' },
      createdPrograms: (apiData.enrollments || []).map(enrollment => ({
        id: enrollment.program_id,
        title: enrollment.program_title || "Program",
        type: "Course",
        created_at: enrollment.enrollment_date
      })),
      totalPrograms: (apiData.enrollments || []).length,
      activeTrainees: Math.max(2, (apiData.enrollments || []).length),
      createdQuizzes: (apiData.quizAttempts || []).map(attempt => ({
        id: attempt.id,
        title: attempt.quiz_title || "Quiz",
        program_title: "Training Program",
        time_limit: 30
      })),
      createdMilestones: (apiData.milestoneStatus || []).map(milestone => ({
        id: milestone.milestone_id,
        title: milestone.title || "Milestone",
        program_title: milestone.program_title || "Training Program",
        due_date: milestone.due_date
      })),
      traineeProgress: apiData.enrollments ? [{
        id: 1,
        title: "Overall Progress",
        enrolled_count: apiData.enrollments.length,
        avg_completion: apiData.enrollments.reduce((sum, enr) => sum + (enr.completion_percentage || 0), 0) / (apiData.enrollments.length || 1),
        quiz_attempts: (apiData.quizAttempts || []).length
      }] : [],
      alerts: (apiData.notifications || []).map(notification => ({
        type: notification.type || "info",
        title: notification.title || "Notification",
        message: notification.message || "",
        dueDate: notification.created_at,
        actionLink: "/notifications",
        actionText: "View Details"
      })).concat(
        (apiData.alerts || []).map(alert => ({
          type: "warning",
          title: alert.title || "Alert",
          message: alert.message || "",
          actionLink: "/trainer/programs",
          actionText: "View Programs"
        }))
      )
    };
    console.log("Transformed data:", transformedData);
    return transformedData;
  };

  useEffect(() => {
    (async () => {
      try {
        const userRole = localStorage.getItem('userRole');
        console.log('User Role:', userRole);
        /*
        if (userRole !== 'trainer') {
          setError('You do not have permission to view the Trainer Dashboard.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        */
        const apiData = await trainerService.getDashboardData();
        console.log('Dashboard Data:', apiData);
        const transformedData = transformApiDataToTrainerFormat(apiData);
        setDashboardData(transformedData);
      } catch (err) {
        console.error('Error fetching trainer dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) return 'Due Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Due Tomorrow';
    return date.toLocaleDateString();
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return '0.00%';
    return parseFloat(value).toFixed(2) + '%';
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertBanner message={error} type="error" />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      {dashboardData.alerts?.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Alerts & Notifications</h2>
            <div style={{ flex: 1, height: '2px', backgroundColor: '#e2e8f0' }}></div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* 1. Created Programs */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#1E88E5' }}><GraduationCap size={20} /></div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>My Programs</h3>
            </div>
            <Link to="/trainer/programs" style={{ color: '#1E88E5', fontSize: '0.875rem', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>
              View All
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {dashboardData.createdPrograms?.length > 0 ? (
              dashboardData.createdPrograms.map((program, index) => (
                <div key={index} style={{ padding: '12px 0', borderBottom: index < dashboardData.createdPrograms.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 4px 0' }}>{program.title || 'Untitled Program'}</h4>
                  <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 8px 0' }}>
                    {program.type || 'Standard'} • Created: {program.created_at ? new Date(program.created_at).toLocaleDateString() : 'Unknown Date'}
                  </p>
                  <Link
                    to={`/trainer/programs/${program.id}`}
                    style={{
                      color: '#1E88E5',
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      ':hover': { textDecoration: 'underline' }
                    }}
                  >
                    Manage <ChevronRight size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 16px 0' }}>You haven't created any programs yet.</p>
                <Link
                  to="/trainer/programs/create"
                  style={{
                    backgroundColor: '#1E88E5',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    transition: 'background-color 0.3s ease',
                    ':hover': { backgroundColor: '#1565C0' }
                  }}
                >
                  Create Program
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 2. Created Milestones */}
        {/* <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ color: '#1E88E5' }}><Calendar size={20} /></div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Recent Milestones</h3>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {dashboardData.createdMilestones?.length > 0 ? (
              dashboardData.createdMilestones.map((milestone, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index < dashboardData.createdMilestones.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 4px 0' }}>{milestone.title || 'Untitled Milestone'}</h4>
                    {milestone.program_title && (
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>{milestone.program_title}</p>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', color: formatDueDate(milestone.due_date) === 'Due Today' ? '#e74c3c' : '#64748b', marginBottom: '4px' }}>
                      {formatDueDate(milestone.due_date)}
                    </div>
                    <Link
                      to={`/trainer/milestones/${milestone.id}`}
                      style={{
                        color: '#1E88E5',
                        fontSize: '0.75rem',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        ':hover': { textDecoration: 'underline' }
                      }}
                    >
                      Details <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No milestones created yet.</p>
              </div>
            )}
          </div>
        </div> */}

        {/* 3. Created Quizzes */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: '#1E88E5' }}><HelpCircle size={20} /></div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Recent Quizzes</h3>
            </div>
            <Link to="/trainer/quizzes" style={{ color: '#1E88E5', fontSize: '0.875rem', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>
              View All
            </Link>
          </div>
          <div style={{ display: 'grid', gap: '16px' }}>
            {dashboardData.createdQuizzes?.length > 0 ? (
              dashboardData.createdQuizzes.map((quiz, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: index < dashboardData.createdQuizzes.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 4px 0' }}>{quiz.title || 'Untitled Quiz'}</h4>
                    {quiz.program_title && (
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0' }}>{quiz.program_title}</p>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={14} /> {quiz.time_limit || 'No'} minutes
                    </div>
                  </div>
                  <Link
                    to={`/trainer/quizzes/${quiz.id}`}
                    style={{
                      backgroundColor: '#1E88E5',
                      color: '#ffffff',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'background-color 0.3s ease',
                      ':hover': { backgroundColor: '#1565C0' }
                    }}
                  >
                    Edit <Edit size={14} />
                  </Link>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>No quizzes created yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Trainee Progress */}
        {dashboardData.traineeProgress?.length > 0 && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ color: '#1E88E5' }}><PieChart size={20} /></div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Trainee Progress</h3>
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>{dashboardData.totalPrograms}</span>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Programs</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b', display: 'block' }}>{dashboardData.activeTrainees}</span>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Active Trainees</span>
                </div>
              </div>
              {dashboardData.traineeProgress.map((prog, index) => (
                <div key={index} style={{ padding: '12px 0', borderTop: index > 0 ? '1px solid #e2e8f0' : 'none' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 8px 0' }}>{prog.title || 'Overall Progress'}</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>Enrolled:</span> {prog.enrolled_count || 0}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Avg. Completion:</span> {formatPercentage(prog.avg_completion)}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600 }}>Quiz Attempts:</span> {prog.quiz_attempts || 0}
                    </div>
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

export default TrainerDashboard;