import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { BookOpen, Calendar, Users, User, Clock, Edit, ArrowLeft, Trash2, Flag, CheckSquare, HelpCircle, GraduationCap, BarChart2 } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';

const ProgramDetails = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [program, setProgram] = useState({
    id: '', title: '', description: '', type: '', created_by: '', created_at: '', createdByName: '',
    enrollments: [], milestones: [], quizzes: [], stats: { totalEnrollments: 0, completionRate: 0, averageScore: 0 }
  });

  useEffect(() => {
    const fetchProgramDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        const data = await adminService.getProgramDetails(programId);
        setProgram(data);
      } catch (err) {
        console.error('Error fetching program details:', err);
        setError('Failed to load program details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgramDetails();
  }, [programId, navigate]);

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const handleEdit = () => navigate(`/admin/programs/edit/${programId}`);
  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    try {
      await adminService.deleteProgram(programId);
      navigate('/admin/programs', { state: { message: 'Program deleted successfully.' } });
    } catch (err) {
      console.error('Error deleting program:', err);
      setError(err.message || 'Failed to delete program. Please try again.');
      setDeleteConfirm(false);
    }
  };
  const cancelDelete = () => setDeleteConfirm(false);
  const goBack = () => navigate('/admin/programs');

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Program Details</h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', cursor: 'pointer', marginBottom: '24px', fontSize: '0.875rem' }} onClick={goBack}>
        <ArrowLeft size={16} /> Back to Programs
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#1e293b' }}>{program.title}</h2>
          <span style={{
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            color: program.type === 'regular' ? '#1E88E5' : '#f39c12',
            backgroundColor: program.type === 'regular' ? '#E3F2FD' : '#fef5e7'
          }}>{program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}</span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={handleEdit} style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px 16px',
            border: '1px solid #1E88E5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem'
          }}>
            <Edit size={16} /> Edit
          </button>
          {deleteConfirm ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
              <span>Confirm deletion?</span>
              <button onClick={handleDelete} style={{ backgroundColor: '#1E88E5', color: '#ffffff', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Yes</button>
              <button onClick={cancelDelete} style={{ backgroundColor: '#e74c3c', color: '#ffffff', padding: '4px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>No</button>
            </div>
          ) : (
            <button onClick={handleDelete} style={{
              backgroundColor: '#e74c3c',
              color: '#ffffff',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              transition: 'background-color 0.3s ease',
              ':hover': { backgroundColor: '#c0392b' }
            }}>
              <Trash2 size={16} /> Delete
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '32px' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BookOpen size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Program Overview</h3>
          </div>
          <div style={{ padding: '24px' }}>
            <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>{program.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {[
                { icon: Calendar, label: 'Type', value: program.type === 'regular' ? 'Regular Program' : 'Refresher Program' },
                { icon: User, label: 'Created By', value: program.createdByName },
                { icon: Clock, label: 'Created Date', value: formatDate(program.created_at) }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <item.icon size={16} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ backgroundColor: '#E3F2FD', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BarChart2 size={20} style={{ color: '#1E88E5' }} />
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Program Statistics</h3>
          </div>
          <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            {[
              { icon: Users, label: 'Total Enrollments', value: program.stats?.totalEnrollments || 0 },
              { icon: CheckSquare, label: 'Completion Rate', value: `${program.stats?.completionRate || 0}%` },
              { icon: HelpCircle, label: 'Average Quiz Score', value: program.stats?.averageScore || 'N/A' }
            ].map((stat, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                <stat.icon size={24} style={{ color: '#1E88E5' }} />
                <div>
                  <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>{stat.value}</div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '32px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ backgroundColor: '#fef5e7', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <GraduationCap size={20} style={{ color: '#f39c12' }} />
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Enrolled Trainees</h3>
            </div>
            <div style={{ padding: '24px' }}>
              {program.enrollments && program.enrollments.length > 0 ? (
                program.enrollments.map((enrollment, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #e2e8f0', ':last-child': { borderBottom: 'none' } }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '9999px', backgroundColor: '#1E88E5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '1rem', fontWeight: 600 }}>
                        {enrollment.trainee_name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{enrollment.trainee_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Enrolled: {formatDate(enrollment.enrollment_date)}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: enrollment.completion_status === 'completed' ? '#2ecc71' : enrollment.completion_status === 'in_progress' ? '#1E88E5' : '#64748b',
                        backgroundColor: enrollment.completion_status === 'completed' ? '#e6ffe6' : enrollment.completion_status === 'in_progress' ? '#E3F2FD' : '#f1f5f9'
                      }}>
                        {enrollment.completion_status === 'not_started' ? 'Not Started' : enrollment.completion_status === 'in_progress' ? 'In Progress' : 'Completed'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{enrollment.completion_percentage}% complete</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                  No trainees are currently enrolled in this program.
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ backgroundColor: '#e6fffa', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Flag size={20} style={{ color: '#2ecc71' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Milestones</h3>
              </div>
              <Link to={`/admin/milestones/create?programId=${programId}`} style={{ color: '#1E88E5', fontSize: '0.875rem', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>
                Add Milestone
              </Link>
            </div>
            <div style={{ padding: '24px' }}>
              {program.milestones && program.milestones.length > 0 ? (
                program.milestones.map((milestone, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderBottom: '1px solid #e2e8f0', ':last-child': { borderBottom: 'none' } }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '9999px', backgroundColor: '#2ecc71', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: '0.875rem', fontWeight: 600 }}>
                      {index + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{milestone.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{milestone.description}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <Calendar size={14} /> Due: {formatDate(milestone.due_date)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                  No milestones have been added to this program.
                </div>
              )}
            </div>
          </div>

          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ backgroundColor: '#ffe6e6', padding: '16px', borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <HelpCircle size={20} style={{ color: '#e74c3c' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Quizzes</h3>
              </div>
              <Link to={`/admin/quizzes/create?programId=${programId}`} style={{ color: '#1E88E5', fontSize: '0.875rem', textDecoration: 'none', ':hover': { textDecoration: 'underline' } }}>
                Add Quiz
              </Link>
            </div>
            <div style={{ padding: '24px' }}>
              {program.quizzes && program.quizzes.length > 0 ? (
                program.quizzes.map((quiz, index) => (
                  <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: '1px solid #e2e8f0', ':last-child': { borderBottom: 'none' } }}>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>{quiz.title}</div>
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>{quiz.description}</div>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> {quiz.time_limit} minutes</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><CheckSquare size={14} /> Passing score: {quiz.passing_score}%</span>
                      </div>
                    </div>
                    <div style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#E3F2FD', color: '#1E88E5', fontSize: '0.75rem' }}>
                      {quiz.question_count} Questions
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                  No quizzes have been added to this program.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgramDetails;