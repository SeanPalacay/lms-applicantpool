import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart, PieChart, CheckCircle, Clock, Award, AlertTriangle, 
  BookOpen, TrendingUp, Filter, Calendar, Download, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner'; // Assuming you have this
import AlertBanner from '../../../components/shared/AlertBanner'; // Assuming you have this
import traineeService from '../../../services/traineeService';
import './styles/ProgressTracking.css';

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
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'not_started': default: return 'status-not-started';
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
    <div className="progress-error">
      <AlertTriangle size={48} className="error-icon" />
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={refreshProgressData} className="btn-primary">
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const filteredEnrollments = getFilteredEnrollments();

  return (
    <div className="progress-tracking-container">
      <div className="progress-header">
        <div className="progress-title">
          <h1>Progress Tracking</h1>
          <p>Track your learning journey and achievements</p>
        </div>
        <div className="progress-actions">
          <button className="btn-secondary" onClick={exportProgressPDF}>
            <Download size={16} /> Export Report
          </button>
          <button className="btn-secondary" onClick={refreshProgressData}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="progress-summary">
        <div className="progress-stats-card">
          <div className="card-icon"><BarChart size={24} className="icon-primary" /></div>
          <div className="card-content">
            <h3>Overall Progress</h3>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <div className="progress-percentage">{overallProgress.toFixed(2)}%</div>
          </div>
        </div>
        <div className="progress-stats-card">
          <div className="card-icon"><BookOpen size={24} className="icon-success" /></div>
          <div className="card-content">
            <h3>Programs Enrolled</h3>
            <div className="stat-value">{enrollments.length}</div>
          </div>
        </div>
        <div className="progress-stats-card">
          <div className="card-icon"><CheckCircle size={24} className="icon-info" /></div>
          <div className="card-content">
            <h3>Completed Programs</h3>
            <div className="stat-value">{enrollments.filter(e => e.completion_status === 'completed').length}</div>
          </div>
        </div>
        <div className="progress-stats-card">
          <div className="card-icon"><Award size={24} className="icon-warning" /></div>
          <div className="card-content">
            <h3>Quiz Average</h3>
            <div className="stat-value">
              {quizAttempts.length > 0 
                ? (quizAttempts.reduce((sum, attempt) => sum + parseFloat(attempt.score || 0), 0) / quizAttempts.length).toFixed(2)
                : '0.00'}%
            </div>
          </div>
        </div>
      </div>

      <div className="progress-filters">
        <div className="filter-group">
          <span className="filter-label"><Filter size={16} /> Filter by Status:</span>
          <div className="filter-buttons">
            <button className={`filter-btn ${filterActive === 'all' ? 'active' : ''}`} onClick={() => setFilterActive('all')}>All</button>
            <button className={`filter-btn ${filterActive === 'in_progress' ? 'active' : ''}`} onClick={() => setFilterActive('in_progress')}>In Progress</button>
            <button className={`filter-btn ${filterActive === 'completed' ? 'active' : ''}`} onClick={() => setFilterActive('completed')}>Completed</button>
            <button className={`filter-btn ${filterActive === 'not_started' ? 'active' : ''}`} onClick={() => setFilterActive('not_started')}>Not Started</button>
          </div>
        </div>
        <div className="sort-group">
          <span className="sort-label">Sort by:</span>
          <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Recently Enrolled</option>
            <option value="progress">Progress (High to Low)</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      <div className="progress-section">
        <h2 className="section-title"><BookOpen size={20} /> Program Progress</h2>
        {filteredEnrollments.length === 0 ? (
          <div className="no-data-message">
            <p>No program enrollments found. Enroll in programs to track your progress.</p>
          </div>
        ) : (
          <div className="program-progress-list">
            {filteredEnrollments.map(enrollment => (
              <div key={enrollment.id} className="program-progress-card">
                <div className="program-info">
                  <h3 className="program-title">{enrollment.title}</h3>
                  <div className="program-details">
                    <span className="enrollment-date"><Calendar size={14} /> Enrolled: {new Date(enrollment.enrollment_date).toLocaleDateString()}</span>
                    <span className={`program-status status-${enrollment.completion_status}`}>
                      {enrollment.completion_status === 'completed' && <CheckCircle size={14} />}
                      {enrollment.completion_status === 'in_progress' && <Clock size={14} />}
                      {enrollment.completion_status === 'not_started' && <AlertTriangle size={14} />}
                      {enrollment.completion_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="program-progress">
                  <div className="progress-bar-label">
                    <span>Progress</span>
                    <span className="progress-percentage">{enrollment.completion_percentage}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${enrollment.completion_percentage}%` }}></div>
                  </div>
                </div>
                <Link to={`/trainee/programs/${enrollment.id}`} className="btn-primary view-details-btn">View Details</Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-section">
        <h2 className="section-title"><TrendingUp size={20} /> Milestone Progress</h2>
        {milestones.length === 0 ? (
          <div className="no-data-message">
            <p>No milestones assigned yet. Milestones will appear here as they are assigned.</p>
          </div>
        ) : (
          <div className="milestone-list">
            {milestones.map(milestone => (
              <div key={milestone.id} className="milestone-card">
                <div className={`milestone-status ${getMilestoneStatusClass(milestone.status)}`}>
                  {getMilestoneStatusIcon(milestone.status)}
                </div>
                <div className="milestone-info">
                  <h3 className="milestone-title">{milestone.title}</h3>
                  <p className="milestone-description">{milestone.description}</p>
                  <div className="milestone-meta">
                    <span className="program-name">{milestone.program_title}</span>
                    <span className="due-date"><Clock size={14} /> Due: {new Date(milestone.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                {milestone.completion_date && (
                  <div className="milestone-completion">
                    <CheckCircle size={16} className="completion-icon" />
                    <span>Completed on {new Date(milestone.completion_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="progress-section">
        <h2 className="section-title"><PieChart size={20} /> Quiz Performance</h2>
        {quizAttempts.length === 0 ? (
          <div className="no-data-message">
            <p>No quiz attempts found. Complete quizzes to see your performance.</p>
          </div>
        ) : (
          <div className="quiz-performance-table">
            <div className="table-header">
              <div className="column-quiz">Quiz Name</div>
              <div className="column-program">Program</div>
              <div className="column-date">Attempt Date</div>
              <div className="column-score">Score</div>
              <div className="column-status">Status</div>
              <div className="column-actions">Actions</div>
            </div>
            <div className="table-body">
              {quizAttempts.map(attempt => (
                <div key={attempt.id} className="table-row">
                  <div className="column-quiz">{attempt.quiz_title}</div>
                  <div className="column-program">{attempt.program_title}</div>
                  <div className="column-date">{new Date(attempt.attempt_date).toLocaleString()}</div>
                  <div className="column-score">{attempt.score}%</div>
                  <div className="column-status">
                    <span className={`status-badge ${parseFloat(attempt.score) >= parseFloat(attempt.passing_score) ? 'passed' : 'failed'}`}>
                      {parseFloat(attempt.score) >= parseFloat(attempt.passing_score) ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <div className="column-actions">
                    <Link to={`/trainee/assessments/quiz/${attempt.quiz_id}/feedback?attempt=${attempt.id}`} className="btn-small">View Feedback</Link>
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