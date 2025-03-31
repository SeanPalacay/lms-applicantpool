import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  ArrowLeft,
  GraduationCap,
  BarChart2,
  Flag,
  HelpCircle,
  Clock,
  Plus,
  User,
  CheckSquare,
  Activity
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import trainerService from '../../../../services/trainerService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ProgramDetails = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [program, setProgram] = useState({
    id: '',
    title: '',
    description: '',
    type: '',
    status: '',
    created_by: '',
    created_at: '',
    createdByName: '',
    enrollments: [],
    milestones: [],
    quizzes: [],
    stats: {
      totalEnrollments: 0,
      completionRate: 0,
      averageScore: 0
    },
    progressData: []
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchProgramDetails = async () => {
      setLoading(true);
      setError(null);
      
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
        
        const data = await trainerService.getProgramDetails(programId);
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusClass = (status) => {
    return status === 'active' ? 'status-active' : 'status-inactive';
  };

  const getProgramTypeClass = (type) => {
    return type === 'regular' ? 'type-regular' : 'type-refresher';
  };

  const getEnrollmentStatusClass = (status) => {
    switch(status) {
      case 'completed': return 'status-success';
      case 'in_progress': return 'status-info';
      default: return 'status-secondary';
    }
  };

  const goBack = () => {
    navigate('/trainer/programs');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
          Program Details
        </h1>
        <div style={{ height: '2px', width: '60px', backgroundColor: 'var(--primary-color)' }}></div>
      </div>
      
      {error && (
        <AlertBanner 
          message={error} 
          type="error" 
          onDismiss={() => setError(null)} 
        />
      )}
      
      {success && (
        <AlertBanner 
          message={success} 
          type="success" 
          onDismiss={() => setSuccess(null)} 
        />
      )}
      
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          color: 'var(--primary-color)', 
          cursor: 'pointer', 
          marginBottom: 'var(--spacing-md)' 
        }}
        onClick={goBack}
      >
        <ArrowLeft size={16} />
        <span>Back to Programs</span>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {program.title}
          </h2>
          <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
            <span 
              style={{ 
                padding: 'var(--spacing-xs) var(--spacing-sm)', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '12px', 
                fontWeight: '500', 
                backgroundColor: program.type === 'regular' ? 'var(--primary-ultralight)' : 'var(--secondary-color)', 
                color: program.type === 'regular' ? 'var(--primary-color)' : 'white' 
              }}
            >
              {program.type === 'regular' ? 'Regular Program' : 'Refresher Program'}
            </span>
            <span 
              style={{ 
                padding: 'var(--spacing-xs) var(--spacing-sm)', 
                borderRadius: 'var(--radius-sm)', 
                fontSize: '12px', 
                fontWeight: '500', 
                backgroundColor: program.status === 'active' ? 'var(--success-color)' : 'var(--danger-color)', 
                color: 'white' 
              }}
            >
              {program.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
        <button 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm)', 
            borderRadius: 'var(--radius-sm)', 
            border: 'none', 
            backgroundColor: activeTab === 'overview' ? 'var(--primary-color)' : 'var(--light-gray)', 
            color: activeTab === 'overview' ? 'white' : 'var(--text-primary)', 
            cursor: 'pointer' 
          }}
          onClick={() => handleTabChange('overview')}
        >
          <BookOpen size={16} />
          <span>Overview</span>
        </button>
        <button 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm)', 
            borderRadius: 'var(--radius-sm)', 
            border: 'none', 
            backgroundColor: activeTab === 'trainees' ? 'var(--primary-color)' : 'var(--light-gray)', 
            color: activeTab === 'trainees' ? 'white' : 'var(--text-primary)', 
            cursor: 'pointer' 
          }}
          onClick={() => handleTabChange('trainees')}
        >
          <Users size={16} />
          <span>Trainees ({program.enrollments ? program.enrollments.length : 0})</span>
        </button>
        {/* <button 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm)', 
            borderRadius: 'var(--radius-sm)', 
            border: 'none', 
            backgroundColor: activeTab === 'milestones' ? 'var(--primary-color)' : 'var(--light-gray)', 
            color: activeTab === 'milestones' ? 'white' : 'var(--text-primary)', 
            cursor: 'pointer' 
          }}
          onClick={() => handleTabChange('milestones')}
        >
          <Flag size={16} />
          <span>Milestones ({program.milestones ? program.milestones.length : 0})</span>
        </button> */}
        <button 
  style={{ 
    flex: 1, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 'var(--spacing-xs)', 
    padding: 'var(--spacing-sm)', 
    borderRadius: 'var(--radius-sm)', 
    border: 'none', 
    backgroundColor: activeTab === 'exams' ? 'var(--primary-color)' : 'var(--light-gray)', 
    color: activeTab === 'exams' ? 'white' : 'var(--text-primary)', 
    cursor: 'pointer' 
  }}
  onClick={() => handleTabChange('exams')}
>
  <GraduationCap size={16} />
  <span>Practical Exams ({program.practicalExams ? program.practicalExams.length : 0})</span>
</button>
        <button 
          style={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm)', 
            borderRadius: 'var(--radius-sm)', 
            border: 'none', 
            backgroundColor: activeTab === 'quizzes' ? 'var(--primary-color)' : 'var(--light-gray)', 
            color: activeTab === 'quizzes' ? 'white' : 'var(--text-primary)', 
            cursor: 'pointer' 
          }}
          onClick={() => handleTabChange('quizzes')}
        >
          <HelpCircle size={16} />
          <span>Quizzes ({program.quizzes ? program.quizzes.length : 0})</span>
        </button>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <BookOpen size={20} color="var(--primary-color)" />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Program Description
                </h3>
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                {program.description}
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                    <Calendar size={16} />
                    <span>Created: {formatDate(program.created_at)}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                    <User size={16} />
                    <span>Created By: {program.createdByName}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <BarChart2 size={20} color="var(--primary-color)" />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Program Statistics
                </h3>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                <div style={{ textAlign: 'center' }}>
                  <Users size={24} color="var(--primary-color)" />
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {program.stats.totalEnrollments}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Total Enrollments</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <CheckSquare size={24} color="var(--primary-color)" />
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {program.stats.completionRate}%
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Completion Rate</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <HelpCircle size={24} color="var(--primary-color)" />
                  <div style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {program.stats.averageScore || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Average Quiz Score</div>
                </div>
              </div>
              {program.progressData && program.progressData.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-sm)' }}>
                    Completion Progress Over Time
                  </h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={program.progressData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(date) => new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Completion Rate']}
                        labelFormatter={(date) => new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completionRate" 
                        stroke="#4361ee" 
                        strokeWidth={2} 
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            
            <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <Activity size={20} color="var(--primary-color)" />
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  Recent Activity
                </h3>
              </div>
              {program.recentActivity && program.recentActivity.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                  {program.recentActivity.map((activity, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--primary-ultralight)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        {activity.type === 'enrollment' && <Users size={16} color="var(--primary-color)" />}
                        {activity.type === 'quiz' && <HelpCircle size={16} color="var(--primary-color)" />}
                        {activity.type === 'milestone' && <Flag size={16} color="var(--primary-color)" />}
                        {activity.type === 'completion' && <CheckSquare size={16} color="var(--primary-color)" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                          {activity.message}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          <Clock size={14} style={{ marginRight: 'var(--spacing-xs)' }} />
                          {formatDate(activity.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p>No recent activity to display.</p>
                </div>
              )}
            </div>
          </div>
        )}

{activeTab === 'exams' && (
  <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
      <GraduationCap size={20} color="var(--primary-color)" />
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
        Practical Exams
      </h3>
      <Link 
        to={`/trainer/practical-exams/create?programId=${program.id}`} 
        style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          padding: 'var(--spacing-sm) var(--spacing-md)', 
          borderRadius: 'var(--radius-sm)', 
          backgroundColor: 'var(--primary-color)', 
          color: 'white', 
          textDecoration: 'none', 
          fontSize: '14px' 
        }}
      >
        <Plus size={14} />
        <span>Add Exam</span>
      </Link>
    </div>
    {program.practicalExams && program.practicalExams.length > 0 ? (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
        {program.practicalExams.map((exam) => (
          <div key={exam.id} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
              {exam.title}
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
              {exam.description}
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Max Score:</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {exam.max_score}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Attempts:</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {exam.attempt_count || 0}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg. Score:</div>
                <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                  {exam.average_score || 'N/A'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Link 
                to={`/trainer/practical-exams/${exam.id}`} 
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: 'var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-ultralight)', 
                  color: 'var(--primary-color)', 
                  textDecoration: 'none', 
                  fontSize: '14px' 
                }}
              >
                View Exam
              </Link>
              <Link 
                to={`/trainer/practical-exams/${exam.id}/grade`} 
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: 'var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-ultralight)', 
                  color: 'var(--primary-color)', 
                  textDecoration: 'none', 
                  fontSize: '14px' 
                }}
              >
                View Grades
              </Link>
              <Link 
                to={`/trainer/practical-exams/${exam.id}/edit`} 
                style={{ 
                  flex: 1, 
                  textAlign: 'center', 
                  padding: 'var(--spacing-sm)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-ultralight)', 
                  color: 'var(--primary-color)', 
                  textDecoration: 'none', 
                  fontSize: '14px' 
                }}
              >
                Edit Exam
              </Link>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No practical exams have been added to this program yet.</p>
        <Link 
          to={`/trainer/practical-exams/create?programId=${program.id}`} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm) var(--spacing-md)', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '14px' 
          }}
        >
          <Plus size={16} />
          <span>Create First Exam</span>
        </Link>
      </div>
    )}
  </div>
)}
        
        {activeTab === 'trainees' && (
  <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
      <Users size={20} color="var(--primary-color)" />
      <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
        Enrolled Trainees
      </h3>
      <Link 
        to={`/trainer/programs/${program.id}/enroll-trainees`}
        style={{ 
          marginLeft: 'auto', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          padding: 'var(--spacing-sm) var(--spacing-md)', 
          borderRadius: 'var(--radius-sm)', 
          backgroundColor: 'var(--primary-color)', 
          color: 'white', 
          textDecoration: 'none', 
          fontSize: '14px' 
        }}
      >
        <Plus size={14} />
        <span>Enroll Trainee</span>
      </Link>
    </div>
    {program.enrollments && program.enrollments.length > 0 ? (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--medium-gray)' }}>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)' }}>Trainee</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)' }}>Enrollment Date</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)' }}>Progress</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)' }}>Status</th>
              <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--text-primary)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {program.enrollments.map((enrollment) => (
              <tr key={enrollment.id} style={{ borderBottom: '1px solid var(--medium-gray)' }}>
                <td style={{ padding: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div 
                      style={{ 
                        width: '40px', 
                        height: '40px', 
                        borderRadius: '50%', 
                        backgroundColor: 'var(--primary-ultralight)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontWeight: '600', 
                        color: 'var(--primary-color)' 
                      }}
                    >
                      {enrollment.trainee_name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                        {enrollment.trainee_name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {enrollment.trainee_email}
                      </div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>
                  {formatDate(enrollment.enrollment_date)}
                </td>
                <td style={{ padding: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--light-gray)', borderRadius: 'var(--radius-full)' }}>
                      <div 
                        style={{ 
                          width: `${enrollment.completion_percentage}%`, 
                          height: '100%', 
                          backgroundColor: 'var(--primary-color)', 
                          borderRadius: 'var(--radius-full)' 
                        }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {enrollment.completion_percentage}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: 'var(--spacing-sm)' }}>
                  <span 
                    style={{ 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '12px', 
                      fontWeight: '500', 
                      backgroundColor: enrollment.completion_status === 'completed' ? 'var(--success-color)' : 
                                     enrollment.completion_status === 'in_progress' ? 'var(--primary-ultralight)' : 'var(--light-gray)', 
                      color: enrollment.completion_status === 'completed' ? 'white' : 'var(--text-primary)' 
                    }}
                  >
                    {enrollment.completion_status === 'not_started' ? 'Not Started' : 
                     enrollment.completion_status === 'in_progress' ? 'In Progress' : 'Completed'}
                  </span>
                </td>
                <td style={{ padding: 'var(--spacing-sm)' }}>
                  <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                    <Link 
                      to={`/trainer/trainees/${enrollment.user_id}`} 
                      style={{ 
                        color: 'var(--primary-color)', 
                        textDecoration: 'none', 
                        fontSize: '14px' 
                      }}
                    >
                      View Details
                    </Link>
                    <Link 
                      to={`/trainer/trainees/${enrollment.user_id}/progress`} 
                      style={{ 
                        color: 'var(--primary-color)', 
                        textDecoration: 'none', 
                        fontSize: '14px' 
                      }}
                    >
                      Track Progress
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>No trainees are currently enrolled in this program.</p>

      </div>
    )}
  </div>
)}
        
        {activeTab === 'milestones' && (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <Flag size={20} color="var(--primary-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Program Milestones
              </h3>
              <Link 
                to={`/trainer/milestones/create?programId=${program.id}`} 
                style={{ 
                  marginLeft: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '14px' 
                }}
              >
                <Plus size={14} />
                <span>Add Milestone</span>
              </Link>
            </div>
            {program.milestones && program.milestones.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {program.milestones.map((milestone, index) => (
                  <div key={milestone.id} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                      <div 
                        style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--primary-ultralight)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: '600', 
                          color: 'var(--primary-color)' 
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
                            {milestone.title}
                          </h4>
                          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <Link 
                              to={`/trainer/milestones/${milestone.id}`} 
                              style={{ 
                                color: 'var(--primary-color)', 
                                textDecoration: 'none', 
                                fontSize: '14px' 
                              }}
                            >
                              View
                            </Link>
                            <Link 
                              to={`/trainer/milestones/edit/${milestone.id}`} 
                              style={{ 
                                color: 'var(--primary-color)', 
                                textDecoration: 'none', 
                                fontSize: '14px' 
                              }}
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                          {milestone.description}
                        </p>
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                            <Calendar size={14} />
                            <span>Due: {formatDate(milestone.due_date)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                            <Users size={14} />
                            <span>
                              Completion: {milestone.completionCount || 0}/{program.stats.totalEnrollments} trainees
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No milestones have been added to this program yet.</p>
                <Link 
                  to={`/trainer/milestones/create?programId=${program.id}`} 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-xs)', 
                    padding: 'var(--spacing-sm) var(--spacing-md)', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '14px' 
                  }}
                >
                  <Plus size={16} />
                  <span>Add First Milestone</span>
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'quizzes' && (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <HelpCircle size={20} color="var(--primary-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Program Quizzes
              </h3>
              <Link 
                to={`/trainer/quizzes/create?programId=${program.id}`} 
                style={{ 
                  marginLeft: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  textDecoration: 'none', 
                  fontSize: '14px' 
                }}
              >
                <Plus size={14} />
                <span>Add Quiz</span>
              </Link>
            </div>
            {program.quizzes && program.quizzes.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--spacing-md)' }}>
                {program.quizzes.map((quiz) => (
                  <div key={quiz.id} style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                      {quiz.title}
                    </h4>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                      {quiz.description}
                    </p>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                        <Clock size={14} />
                        <span>{quiz.time_limit} minutes</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                        <HelpCircle size={14} />
                        <span>{quiz.question_count} questions</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--text-secondary)' }}>
                        <CheckSquare size={14} />
                        <span>Pass: {quiz.passing_score}%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Avg. Score:</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {quiz.average_score || 'N/A'}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pass Rate:</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {quiz.pass_rate || 0}%
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Attempts:</div>
                        <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                          {quiz.attempt_count || 0}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                      <Link 
                        to={`/trainer/quizzes/${quiz.id}`} 
                        style={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          padding: 'var(--spacing-sm)', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: 'var(--primary-ultralight)', 
                          color: 'var(--primary-color)', 
                          textDecoration: 'none', 
                          fontSize: '14px' 
                        }}
                      >
                        View Quiz
                      </Link>
                      <Link 
                        to={`/trainer/quizzes/${quiz.id}/results`} 
                        style={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          padding: 'var(--spacing-sm)', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: 'var(--primary-ultralight)', 
                          color: 'var(--primary-color)', 
                          textDecoration: 'none', 
                          fontSize: '14px' 
                        }}
                      >
                        View Results
                      </Link>
                      <Link 
                        to={`/trainer/quizzes/edit/${quiz.id}`} 
                        style={{ 
                          flex: 1, 
                          textAlign: 'center', 
                          padding: 'var(--spacing-sm)', 
                          borderRadius: 'var(--radius-sm)', 
                          backgroundColor: 'var(--primary-ultralight)', 
                          color: 'var(--primary-color)', 
                          textDecoration: 'none', 
                          fontSize: '14px' 
                        }}
                      >
                        Edit Quiz
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No quizzes have been added to this program yet.</p>
                <Link 
                  to={`/trainer/quizzes/create?programId=${program.id}`} 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-xs)', 
                    padding: 'var(--spacing-sm) var(--spacing-md)', 
                    borderRadius: 'var(--radius-sm)', 
                    backgroundColor: 'var(--primary-color)', 
                    color: 'white', 
                    textDecoration: 'none', 
                    fontSize: '14px' 
                  }}
                >
                  <Plus size={16} />
                  <span>Create First Quiz</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramDetails;