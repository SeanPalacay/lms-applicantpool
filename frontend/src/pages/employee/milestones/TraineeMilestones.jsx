import React, { useState, useEffect } from 'react';
import { 
  Flag, CheckCircle, Clock, AlertTriangle, Calendar, 
  BookOpen, CheckSquare, Filter, Search, RefreshCw
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner'; // Assuming you have this
import AlertBanner from '../../../components/shared/AlertBanner'; // Assuming you have this
import traineeService from '../../../services/traineeService';

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
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: 'var(--spacing-md)', 
      padding: 'var(--spacing-xl)', 
      textAlign: 'center', 
      color: 'var(--text-secondary)',
    }}>
      <AlertTriangle size={48} style={{ color: 'var(--danger-color)' }} />
      <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Error</h2>
      <p>{error}</p>
      <button 
        onClick={() => setLoading(true)} 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 'var(--spacing-xs)', 
          padding: 'var(--spacing-sm) var(--spacing-md)', 
          backgroundColor: 'var(--primary-color)', 
          color: 'white', 
          borderRadius: 'var(--radius-md)', 
          border: 'none', 
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

  const filteredMilestones = getFilteredMilestones();

  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: 'var(--spacing-xl)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
          <Flag size={24} style={{ color: 'var(--primary-color)' }} />
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Milestones</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Track your progress with program milestones</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-xl)',
      }}>
        {Object.entries(allStats).map(([key, value]) => (
          <div key={key} style={{ 
            backgroundColor: 'white', 
            padding: 'var(--spacing-md)', 
            borderRadius: 'var(--radius-md)', 
            boxShadow: 'var(--shadow-sm)', 
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>{value}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-xl)',
      }}>
        <div style={{ flex: 1, maxWidth: '400px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-sm)', 
            backgroundColor: 'white', 
            padding: 'var(--spacing-sm)', 
            borderRadius: 'var(--radius-md)', 
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Search size={18} style={{ color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                flex: 1, 
                border: 'none', 
                outline: 'none', 
                fontSize: '14px', 
                color: 'var(--text-primary)',
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                style={{ 
                  backgroundColor: 'transparent', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: 'var(--text-secondary)',
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
            <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Filter by Status:</span>
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            {['all', 'completed', 'in_progress', 'not_started'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)', 
                  padding: 'var(--spacing-xs) var(--spacing-sm)', 
                  backgroundColor: filterStatus === status ? 'var(--primary-color)' : 'transparent', 
                  color: filterStatus === status ? 'white' : 'var(--text-secondary)', 
                  border: `1px solid ${filterStatus === status ? 'var(--primary-color)' : 'var(--medium-gray)'}`, 
                  borderRadius: 'var(--radius-md)', 
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {status === 'completed' && <CheckCircle size={14} />}
                {status === 'in_progress' && <Clock size={14} />}
                {status === 'not_started' && <AlertTriangle size={14} />}
                <span>{status.replace('_', ' ')}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <label htmlFor="program-select" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Program:</label>
          <select
            id="program-select"
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            style={{ 
              padding: 'var(--spacing-xs) var(--spacing-sm)', 
              border: '1px solid var(--medium-gray)', 
              borderRadius: 'var(--radius-md)', 
              outline: 'none', 
              fontSize: '14px', 
              color: 'var(--text-primary)',
            }}
          >
            <option value="all">All Programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.id}>{program.title}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={resetFilters} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-xs) var(--spacing-sm)', 
            backgroundColor: 'transparent', 
            color: 'var(--text-secondary)', 
            border: '1px solid var(--medium-gray)', 
            borderRadius: 'var(--radius-md)', 
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
          }}
        >
          <RefreshCw size={14} /> Reset Filters
        </button>
      </div>

      {filteredMilestones.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: 'var(--spacing-md)', 
          padding: 'var(--spacing-xl)', 
          textAlign: 'center', 
          color: 'var(--text-secondary)',
        }}>
          <AlertTriangle size={48} style={{ color: 'var(--danger-color)' }} />
          <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>No milestones found</h3>
          <p>
            {searchQuery || filterStatus !== 'all' || selectedProgram !== 'all'
              ? 'Try adjusting your search or filters to see more results.'
              : 'No milestones have been assigned to you yet.'}
          </p>
          {(searchQuery || filterStatus !== 'all' || selectedProgram !== 'all') && (
            <button 
              onClick={resetFilters} 
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
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
          {filteredMilestones.map(milestone => (
            <div
              key={milestone.id}
              style={{ 
                backgroundColor: 'white', 
                padding: 'var(--spacing-md)', 
                borderRadius: 'var(--radius-md)', 
                boxShadow: 'var(--shadow-sm)', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 'var(--spacing-md)',
                borderLeft: `4px solid ${isOverdue(milestone.due_date) && milestone.status !== 'completed' ? 'var(--danger-color)' : 'transparent'}`,
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--spacing-sm)', 
                padding: 'var(--spacing-xs) var(--spacing-sm)', 
                borderRadius: 'var(--radius-sm)', 
                ...getMilestoneStatusClass(milestone.status),
              }}>
                {getMilestoneStatusIcon(milestone.status)}
                <span style={{ fontSize: '14px', fontWeight: '500' }}>{milestone.status.replace('_', ' ')}</span>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: 'var(--spacing-xs)' }}>
                  {milestone.title}
                </h3>
                {milestone.description && (
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                    {milestone.description}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <BookOpen size={14} />
                    <span>{milestone.program_title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Calendar size={14} />
                    <span>
                      Due: {new Date(milestone.due_date).toLocaleDateString()}
                      {isOverdue(milestone.due_date) && milestone.status !== 'completed' && (
                        <span style={{ color: 'var(--danger-color)', marginLeft: 'var(--spacing-xs)' }}>(Overdue)</span>
                      )}
                    </span>
                  </div>
                </div>
                {milestone.completion_date && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
                    <CheckSquare size={14} />
                    <span>Completed on: {new Date(milestone.completion_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                {milestone.status === 'completed' ? (
                  <button
                    onClick={() => markAsInProgress(milestone.id)}
                    disabled={completingMilestone === milestone.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)', 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      backgroundColor: 'transparent', 
                      color: 'var(--text-secondary)', 
                      border: '1px solid var(--medium-gray)', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    {completingMilestone === milestone.id ? 'Updating...' : 'Mark as In Progress'}
                  </button>
                ) : (
                  <button
                    onClick={() => markAsComplete(milestone.id)}
                    disabled={completingMilestone === milestone.id}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 'var(--spacing-xs)', 
                      padding: 'var(--spacing-xs) var(--spacing-sm)', 
                      backgroundColor: 'var(--primary-color)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 'var(--radius-md)', 
                      cursor: 'pointer',
                      transition: 'background-color var(--transition-fast)',
                    }}
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