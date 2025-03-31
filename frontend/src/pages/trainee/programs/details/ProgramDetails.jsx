import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  BookOpen, ArrowLeft, Calendar, Clock, Flag, 
  CheckCircle, AlertTriangle, ClipboardList, FileText, 
  Award, BarChart2, TrendingUp
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import traineeService from '../../../../services/traineeService';

const ProgramDetails = () => {
  const { programId } = useParams();
  const [program, setProgram] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProgramData = async () => {
      setLoading(true);
      setError('');

      try {
        const programData = await traineeService.getProgramDetails(programId);
        setProgram(programData);

        const milestonesData = await traineeService.getProgramMilestones(programId);
        setMilestones(milestonesData);

        const quizzesData = await traineeService.getProgramQuizzes(programId);
        setQuizzes(quizzesData);
      } catch (err) {
        console.error('Error fetching program data:', err);
        setError(err.message || 'Failed to load program details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProgramData();
  }, [programId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Updated to return style objects instead of JSX elements
  const getStatusStyle = (status) => {
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px', // Using explicit values instead of CSS variables
      padding: '8px 16px',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
    };

    switch (status) {
      case 'completed':
        return {
          ...baseStyle,
          backgroundColor: '#e6f7ff', // Explicit color instead of var(--primary-ultralight)
          color: '#0066cc', // Explicit color instead of var(--primary-color)
        };
      case 'in_progress':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          color: '#f39c12', // Explicit color instead of var(--warning-color)
        };
      case 'not_started':
        return {
          ...baseStyle,
          backgroundColor: '#f5f5f5', // Explicit color instead of var(--light-gray)
          color: '#666666', // Explicit color instead of var(--text-secondary)
        };
      default:
        return baseStyle;
    }
  };

  // Separate function to render status badges as components
  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'completed':
        return (
          <div style={getStatusStyle('completed')}>
            <CheckCircle size={14} />
            <span>Completed</span>
          </div>
        );
      case 'in_progress':
        return (
          <div style={getStatusStyle('in_progress')}>
            <Clock size={14} />
            <span>In Progress</span>
          </div>
        );
      case 'not_started':
        return (
          <div style={getStatusStyle('not_started')}>
            <AlertTriangle size={14} />
            <span>Not Started</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <AlertBanner message={error} type="error" />;
  }

  if (!program) {
    return <AlertBanner message="Program not found" type="error" />;
  }

  // Define static styles instead of using CSS variables
  const styles = {
    container: {
      padding: '32px',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
    },
    backLink: {
      marginBottom: '32px',
    },
    backLinkStyle: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#0066cc',
      textDecoration: 'none',
    },
    card: {
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '32px',
    },
    programHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    },
    iconContainer: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      borderRadius: '8px',
      backgroundColor: '#e6f7ff',
      color: '#0066cc',
    },
    programInfo: {
      flex: 1,
    },
    programTitle: {
      fontSize: '24px',
      fontWeight: '600',
      color: '#333333',
      marginBottom: '8px',
    },
    programMeta: {
      display: 'flex',
      gap: '16px',
      alignItems: 'center',
    },
    metaItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#666666',
    },
    typeLabel: {
      padding: '8px 16px',
      backgroundColor: '#f5f5f5',
      color: '#666666',
      borderRadius: '4px',
      fontSize: '14px',
      fontWeight: '500',
    },
    sectionHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#333333',
    },
    progressBar: {
      height: '8px',
      backgroundColor: '#f5f5f5',
      borderRadius: '9999px',
      marginBottom: '16px',
    },
    progressFill: (percentage) => ({
      width: `${percentage || 0}%`,
      height: '100%',
      backgroundColor: '#0066cc',
      borderRadius: '9999px',
    }),
    completionInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#666666',
      fontSize: '14px',
    },
    sectionIcon: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '16px',
    },
    iconPrimary: {
      color: '#0066cc',
    },
    description: {
      color: '#666666',
      fontSize: '14px',
    },
    contentGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '32px',
      marginBottom: '32px',
    },
    listItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '8px',
      borderBottom: '1px solid #e0e0e0',
    },
    milestoneIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '40px',
      height: '40px',
      borderRadius: '50%',
    },
    itemContent: {
      flex: 1,
    },
    itemTitle: {
      fontSize: '16px',
      fontWeight: '600',
      color: '#333333',
    },
    itemMeta: {
      display: 'flex',
      gap: '16px',
      fontSize: '14px',
      color: '#666666',
    },
    itemDescription: {
      fontSize: '14px',
      color: '#666666',
      marginTop: '8px',
    },
    emptyState: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      color: '#666666',
    },
    actionButtons: {
      display: 'flex',
      gap: '8px',
    },
    primaryButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: '#0066cc',
      color: 'white',
      borderRadius: '8px',
      textDecoration: 'none',
    },
    secondaryButton: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      backgroundColor: 'transparent',
      color: '#666666',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      textDecoration: 'none',
    },
    certificateCard: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      padding: '16px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
    },
    certificateIcon: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      backgroundColor: '#e6f7ff',
      color: '#0066cc',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.backLink}>
        <Link to="/trainee/programs" style={styles.backLinkStyle}>
          <ArrowLeft size={18} />
          <span>Back to Programs</span>
        </Link>
      </div>
      
      <div style={styles.card}>
        <div style={styles.programHeader}>
          <div style={styles.iconContainer}>
            <BookOpen size={32} />
          </div>
          <div style={styles.programInfo}>
            <h1 style={styles.programTitle}>
              {program.title}
            </h1>
            <div style={styles.programMeta}>
              <div style={styles.metaItem}>
                <Calendar size={16} />
                <span>Enrolled: {formatDate(program.enrollment_date)}</span>
              </div>
              <div style={styles.typeLabel}>
                {program.type || 'Regular'}
              </div>
              <StatusBadge status={program.completion_status} />
            </div>
          </div>
        </div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>Your Progress</h3>
          <div style={styles.sectionTitle}>
            {program.completion_percentage || 0}%
          </div>
        </div>
        <div style={styles.progressBar}>
          <div style={styles.progressFill(program.completion_percentage)}></div>
        </div>
        {program.completion_status === 'completed' && program.completion_date && (
          <div style={styles.completionInfo}>
            <CheckCircle size={18} style={styles.iconPrimary} />
            <span>Completed on {formatDate(program.completion_date)}</span>
          </div>
        )}
      </div>
      
      {program.description && (
        <div style={styles.card}>
          <div style={styles.sectionIcon}>
            <FileText size={20} style={styles.iconPrimary} />
            <h3 style={styles.sectionTitle}>Description</h3>
          </div>
          <p style={styles.description}>{program.description}</p>
        </div>
      )}
      
      <div style={styles.contentGrid}>
        {/* <div style={styles.card}>
          <div style={styles.sectionIcon}>
            <Flag size={20} style={styles.iconPrimary} />
            <h3 style={styles.sectionTitle}>Milestones</h3>
          </div>
          {milestones.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {milestones.map(milestone => (
                <div key={milestone.id} style={styles.listItem}>
                  <div style={{
                    ...styles.milestoneIcon,
                    ...getStatusStyle(milestone.status)
                  }}>
                    {milestone.status === 'completed' && <CheckCircle size={20} />}
                    {milestone.status === 'in_progress' && <Clock size={20} />}
                    {milestone.status === 'not_started' && <AlertTriangle size={20} />}
                  </div>
                  <div style={styles.itemContent}>
                    <h4 style={styles.itemTitle}>{milestone.title}</h4>
                    <div style={styles.itemMeta}>
                      <span><Calendar size={14} /> Due: {formatDate(milestone.due_date)}</span>
                      {milestone.status === 'completed' && milestone.completion_date && (
                        <span><CheckCircle size={14} /> Completed: {formatDate(milestone.completion_date)}</span>
                      )}
                    </div>
                    {milestone.description && (
                      <p style={styles.itemDescription}>
                        {milestone.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <Flag size={32} />
              <p>No milestones have been set for this program</p>
            </div>
          )}
        </div> */}
        
        <div style={styles.card}>
          <div style={styles.sectionIcon}>
            <ClipboardList size={20} style={styles.iconPrimary} />
            <h3 style={styles.sectionTitle}>Quizzes & Assessments</h3>
          </div>
          {quizzes.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {quizzes.map(quiz => (
                <div key={quiz.id} style={styles.listItem}>
                  <div style={{
                    ...styles.milestoneIcon,
                    backgroundColor: '#f5f5f5',
                    color: '#666666',
                  }}>
                    <ClipboardList size={24} />
                  </div>
                  <div style={styles.itemContent}>
                    <h4 style={styles.itemTitle}>{quiz.title}</h4>
                    {quiz.description && (
                      <p style={styles.itemDescription}>
                        {quiz.description}
                      </p>
                    )}
                    <div style={styles.itemMeta}>
                      <span><Clock size={14} /> {quiz.time_limit ? `${quiz.time_limit} minutes` : 'No time limit'}</span>
                      <span><BarChart2 size={14} /> Passing Score: {quiz.passing_score || 70}%</span>
                    </div>
                  </div>
                  <div style={styles.actionButtons}>
                  {quiz.attempts && quiz.attempts.length > 0 ? (
  parseFloat(quiz.attempts[0].score) >= parseFloat(quiz.passing_score || 70) ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: '#e6f7ff',
                          color: '#0066cc',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}>
                          <CheckCircle size={18} />
                          <span>Passed ({quiz.attempts[0].score}%)</span>
                          </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 16px',
                          backgroundColor: 'rgba(231, 76, 60, 0.1)',
                          color: '#e74c3c',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}>
                          <AlertTriangle size={18} />
                          <span>Failed ({quiz.attempts[0].score}%)</span>
                          </div>
                      )
                    ) : (
                      <Link 
                        to={`/trainee/assessments/quiz/${quiz.id}`} 
                        style={styles.primaryButton}
                      >
                        <ClipboardList size={16} />
                        <span>Take Quiz</span>
                      </Link>
                    )}
                    
                    {quiz.attempts && quiz.attempts.length > 0 && (
                      <Link 
                        to={`/trainee/assessments/quiz/${quiz.id}/feedback?attempt=${quiz.attempts[0].id}`} 
                        style={styles.secondaryButton}
                      >
                        <FileText size={16} />
                        <span>View Feedback</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.emptyState}>
              <ClipboardList size={32} />
              <p>No quizzes are available for this program</p>
            </div>
          )}
        </div>
      </div>
      
      {program.completion_status === 'completed' && program.certificate && (
        <div style={styles.card}>
          <div style={styles.sectionIcon}>
            <Award size={20} style={styles.iconPrimary} />
            <h3 style={styles.sectionTitle}>Certificate of Completion</h3>
          </div>
          <div style={styles.certificateCard}>
            <div style={styles.certificateIcon}>
              <Award size={32} />
            </div>
            <div style={styles.itemContent}>
              <h4 style={styles.itemTitle}>
                {program.certificate.title || `${program.title} Certificate`}
              </h4>
              <p style={styles.description}>
                Congratulations on completing this program! Your certificate is now available.
              </p>
            </div>
            <Link 
              to={`/trainee/certificates/${program.certificate.id}`} 
              style={styles.primaryButton}
            >
              <Award size={16} />
              <span>View Certificate</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDetails;