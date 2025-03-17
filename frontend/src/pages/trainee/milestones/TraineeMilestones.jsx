import React, { useState, useEffect } from 'react';
import { 
  Flag, CheckCircle, Clock, AlertTriangle, Calendar, 
  BookOpen, CheckSquare, Filter, Search, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner'; // Assuming you have this
import AlertBanner from '../../../components/shared/AlertBanner'; // Assuming you have this
import traineeService from '../../../services/traineeService';
import './styles/TraineeMilestones.css';

const TraineeMilestones = () => {
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [completingMilestone, setCompletingMilestone] = useState(null);
  const [allStats, setAllStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    dueThisWeek: 0,
    overdue: 0
  });

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        setLoading(true);

        const milestonesData = await traineeService.getTraineeMilestones();
        const programsData = await traineeService.getPrograms();

        setMilestones(milestonesData);

        const uniquePrograms = programsData.map(program => ({
          id: program.id,
          title: program.title
        }));
        setPrograms(uniquePrograms);

        const stats = {
          total: milestonesData.length,
          completed: milestonesData.filter(m => m.status === 'completed').length,
          inProgress: milestonesData.filter(m => m.status === 'in_progress').length,
          notStarted: milestonesData.filter(m => m.status === 'not_started').length,
          dueThisWeek: 0,
          overdue: 0
        };

        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);

        milestonesData.forEach(milestone => {
          const dueDate = new Date(milestone.due_date);
          if (milestone.status !== 'completed') {
            if (dueDate < today) {
              stats.overdue++;
            } else if (dueDate <= oneWeekFromNow) {
              stats.dueThisWeek++;
            }
          }
        });

        setAllStats(stats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching milestones:', err);
        setError(err.message || 'Failed to load milestones. Please try again later.');
        setLoading(false);
      }
    };

    fetchMilestones();
  }, [completingMilestone]);

  const getFilteredMilestones = () => {
    return milestones.filter(milestone => {
      if (filterStatus !== 'all' && milestone.status !== filterStatus) return false;
      if (selectedProgram !== 'all' && milestone.program_id !== parseInt(selectedProgram)) return false;
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        return (
          milestone.title.toLowerCase().includes(lowerQuery) ||
          (milestone.description && milestone.description.toLowerCase().includes(lowerQuery)) ||
          milestone.program_title.toLowerCase().includes(lowerQuery)
        );
      }
      return true;
    });
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

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const markAsComplete = async (milestoneId) => {
    try {
      setCompletingMilestone(milestoneId);
      await traineeService.updateMilestoneProgress(milestoneId, 'completed');
    } catch (err) {
      console.error('Error completing milestone:', err);
      alert('Failed to mark milestone as complete. Please try again.');
    } finally {
      setCompletingMilestone(null);
    }
  };

  const markAsInProgress = async (milestoneId) => {
    try {
      setCompletingMilestone(milestoneId);
      await traineeService.updateMilestoneProgress(milestoneId, 'in_progress');
    } catch (err) {
      console.error('Error updating milestone:', err);
      alert('Failed to update milestone status. Please try again.');
    } finally {
      setCompletingMilestone(null);
    }
  };

  const resetFilters = () => {
    setFilterStatus('all');
    setSearchQuery('');
    setSelectedProgram('all');
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="milestones-error">
      <AlertTriangle size={48} className="error-icon" />
      <h2>Error</h2>
      <p>{error}</p>
      <button onClick={() => setLoading(true)} className="btn-primary retry-btn">
        <RefreshCw size={16} /> Retry
      </button>
    </div>
  );

  const filteredMilestones = getFilteredMilestones();

  return (
    <div className="trainee-milestones-container">
      <div className="milestones-header">
        <div className="header-title">
          <h1><Flag size={24} /> Milestones</h1>
          <p>Track your progress with program milestones</p>
        </div>
      </div>

      <div className="milestone-stats">
        <div className="stat-card">
          <div className="stat-value">{allStats.total}</div>
          <div className="stat-label">Total Milestones</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-value">{allStats.completed}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card in-progress">
          <div className="stat-value">{allStats.inProgress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card not-started">
          <div className="stat-value">{allStats.notStarted}</div>
          <div className="stat-label">Not Started</div>
        </div>
        <div className="stat-card upcoming">
          <div className="stat-value">{allStats.dueThisWeek}</div>
          <div className="stat-label">Due This Week</div>
        </div>
        <div className="stat-card overdue">
          <div className="stat-value">{allStats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      <div className="milestones-filters">
        <div className="search-filter">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>

        <div className="filter-group">
          <div className="filter-label">
            <Filter size={16} />
            <span>Filter by Status:</span>
          </div>
          <div className="filter-options">
            <button className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
              All
            </button>
            <button className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`} onClick={() => setFilterStatus('completed')}>
              <CheckCircle size={14} /> Completed
            </button>
            <button className={`filter-btn ${filterStatus === 'in_progress' ? 'active' : ''}`} onClick={() => setFilterStatus('in_progress')}>
              <Clock size={14} /> In Progress
            </button>
            <button className={`filter-btn ${filterStatus === 'not_started' ? 'active' : ''}`} onClick={() => setFilterStatus('not_started')}>
              <AlertTriangle size={14} /> Not Started
            </button>
          </div>
        </div>

        <div className="program-filter">
          <label htmlFor="program-select">Program:</label>
          <select
            id="program-select"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            className="program-select"
          >
            <option value="all">All Programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.title}</option>
            ))}
          </select>
        </div>

        <button className="btn-secondary reset-filters" onClick={resetFilters}>
          <RefreshCw size={14} /> Reset Filters
        </button>
      </div>

      {filteredMilestones.length === 0 ? (
        <div className="no-milestones">
          <AlertTriangle size={48} className="no-data-icon" />
          <h3>No milestones found</h3>
          <p>
            {searchQuery || filterStatus !== 'all' || selectedProgram !== 'all'
              ? 'Try adjusting your search or filters to see more results.'
              : 'No milestones have been assigned to you yet.'}
          </p>
          {(searchQuery || filterStatus !== 'all' || selectedProgram !== 'all') && (
            <button className="btn-primary" onClick={resetFilters}>Clear Filters</button>
          )}
        </div>
      ) : (
        <div className="milestones-list">
          {filteredMilestones.map(milestone => (
            <div
              key={milestone.id}
              className={`milestone-card ${isOverdue(milestone.due_date) && milestone.status !== 'completed' ? 'overdue' : ''}`}
            >
              <div className={`milestone-status ${getMilestoneStatusClass(milestone.status)}`}>
                {getMilestoneStatusIcon(milestone.status)}
                <span className="status-text">{milestone.status.replace('_', ' ')}</span>
              </div>

              <div className="milestone-content">
                <h3 className="milestone-title">{milestone.title}</h3>
                {milestone.description && <p className="milestone-description">{milestone.description}</p>}
                <div className="milestone-meta">
                  <div className="meta-item program">
                    <BookOpen size={14} />
                    <span>{milestone.program_title}</span>
                  </div>
                  <div className={`meta-item due-date ${isOverdue(milestone.due_date) && milestone.status !== 'completed' ? 'overdue' : ''}`}>
                    <Calendar size={14} />
                    <span>
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                      {isOverdue(milestone.due_date) && milestone.status !== 'completed' && (
                        <span className="overdue-label"> (Overdue)</span>
                      )}
                    </span>
                  </div>
                </div>
                {milestone.completion_date && (
                  <div className="completion-date">
                    <CheckSquare size={14} />
                    <span>Completed on: {new Date(milestone.completion_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="milestone-actions">
                {milestone.status === 'completed' ? (
                  <button
                    className="btn-outline"
                    onClick={() => markAsInProgress(milestone.id)}
                    disabled={completingMilestone === milestone.id}
                  >
                    {completingMilestone === milestone.id ? 'Updating...' : 'Mark as In Progress'}
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => markAsComplete(milestone.id)}
                    disabled={completingMilestone === milestone.id}
                  >
                    {completingMilestone === milestone.id ? 'Completing...' : 'Mark as Complete'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TraineeMilestones;