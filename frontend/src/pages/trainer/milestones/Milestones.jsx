import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Flag, Plus, Filter, Search, Clock, Calendar, BookOpen, 
  CheckCircle, AlertTriangle, UserCheck, ChevronDown, ChevronUp, 
  Calendar as CalendarIcon, BookOpen as BookOpenIcon
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import trainerService from '../../../services/trainerService';

const Milestones = () => {
  const navigate = useNavigate();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [programs, setPrograms] = useState([]);
  const [sortField, setSortField] = useState('due_date');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showFilters, setShowFilters] = useState(false);

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

        const milestonesData = await trainerService.getMilestones();
        const programsData = await trainerService.getPrograms();

        setMilestones(milestonesData);
        setPrograms(programsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load milestones. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleSearchChange = (e) => setSearchQuery(e.target.value);
  const handleStatusFilterChange = (e) => setFilterStatus(e.target.value);
  const handleProgramFilterChange = (e) => setFilterProgram(e.target.value);
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  const toggleFilters = () => setShowFilters(!showFilters);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateStatus = (milestone) => {
    if (!milestone.trainees || milestone.trainees.length === 0) return { status: 'unassigned', label: 'Unassigned' };
    const completed = milestone.trainees.filter(t => t.progress?.status === 'completed').length;
    const total = milestone.trainees.length;
    if (completed === total) return { status: 'completed', label: 'Completed' };
    if (completed > 0) return { status: 'in-progress', label: 'In Progress' };
    return { status: 'not-started', label: 'Not Started' };
  };

  const filteredMilestones = milestones
    .filter(milestone => {
      const searchMatch = milestone.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (milestone.description && milestone.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const statusMatch = filterStatus === 'all' || calculateStatus(milestone).status === filterStatus;
      const programMatch = filterProgram === 'all' || milestone.program_id.toString() === filterProgram;
      return searchMatch && statusMatch && programMatch;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'title') comparison = a.title.localeCompare(b.title);
      else if (sortField === 'due_date') comparison = new Date(a.due_date) - new Date(b.due_date);
      else if (sortField === 'program') comparison = (a.program?.title || '').localeCompare(b.program?.title || '');
      else if (sortField === 'status') comparison = calculateStatus(a).status.localeCompare(calculateStatus(b).status);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const isPastDue = (dateString) => new Date(dateString).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  const isApproaching = (dateString) => {
    const dueDate = new Date(dateString).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    const diffDays = (dueDate - today) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 7;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '32px', fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif", color: '#1e293b' }}>
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flag size={24} style={{ color: '#1E88E5' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Milestones</h2>
        </div>
        <Link
          to="/trainer/milestones/create"
          style={{
            backgroundColor: '#1E88E5',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#1565C0' }
          }}
        >
          <Plus size={18} /> Create Milestone
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search milestones..."
            value={searchQuery}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              outline: 'none',
              ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
            }}
          />
        </div>
        <button
          onClick={toggleFilters}
          style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px 16px',
            border: '1px solid #1E88E5',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#E3F2FD' }
          }}
        >
          <Filter size={18} /> Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
            <label htmlFor="status-filter" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={handleStatusFilterChange}
              style={{
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                backgroundColor: '#ffffff',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="not-started">Not Started</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
            <label htmlFor="program-filter" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Program:</label>
            <select
              id="program-filter"
              value={filterProgram}
              onChange={handleProgramFilterChange}
              style={{
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                backgroundColor: '#ffffff',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            >
              <option value="all">All Programs</option>
              {programs.map(program => (
                <option key={program.id} value={program.id.toString()}>{program.title}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Milestones List */}
      {filteredMilestones.length > 0 ? (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '16px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '0.875rem', fontWeight: 600, color: '#64748b' }}>
            <div
              onClick={() => handleSort('title')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', ':hover': { color: '#1E88E5' } }}
            >
              Title {sortField === 'title' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
            </div>
            <div
              onClick={() => handleSort('program')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', ':hover': { color: '#1E88E5' } }}
            >
              Program {sortField === 'program' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
            </div>
            <div
              onClick={() => handleSort('due_date')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', ':hover': { color: '#1E88E5' } }}
            >
              Due Date {sortField === 'due_date' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
            </div>
            <div
              onClick={() => handleSort('status')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', ':hover': { color: '#1E88E5' } }}
            >
              Status {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>Trainees</div>
          </div>

          {/* Table Rows */}
          {filteredMilestones.map(milestone => {
            const status = calculateStatus(milestone);
            const pastDue = isPastDue(milestone.due_date);
            const approaching = isApproaching(milestone.due_date);

            return (
              <Link
                to={`/trainer/milestones/${milestone.id}`}
                key={milestone.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  padding: '16px',
                  borderBottom: '1px solid #e2e8f0',
                  textDecoration: 'none',
                  color: '#1e293b',
                  transition: 'background-color 0.3s ease',
                  ':hover': { backgroundColor: '#E3F2FD' }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Flag size={18} style={{ color: status.status === 'completed' ? '#2ecc71' : status.status === 'in-progress' ? '#f39c12' : status.status === 'not-started' ? '#e74c3c' : '#64748b' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{milestone.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: '#64748b' }}>
                  <BookOpenIcon size={16} /> {milestone.program?.title || 'Unknown Program'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem' }}>
                  <CalendarIcon size={16} style={{ color: pastDue ? '#e74c3c' : approaching ? '#f39c12' : '#64748b' }} />
                  <span style={{ color: pastDue ? '#e74c3c' : approaching ? '#f39c12' : '#64748b' }}>
                    {formatDate(milestone.due_date)}
                    {pastDue && <span style={{ marginLeft: '4px', fontSize: '0.75rem', backgroundColor: '#ffe6e6', padding: '2px 4px', borderRadius: '4px' }}>Overdue</span>}
                    {!pastDue && approaching && <span style={{ marginLeft: '4px', fontSize: '0.75rem', backgroundColor: '#fef5e7', padding: '2px 4px', borderRadius: '4px' }}>Soon</span>}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    backgroundColor: status.status === 'completed' ? '#e6ffe6' : status.status === 'in-progress' ? '#fef5e7' : status.status === 'not-started' ? '#ffe6e6' : '#f1f5f9',
                    color: status.status === 'completed' ? '#2ecc71' : status.status === 'in-progress' ? '#f39c12' : status.status === 'not-started' ? '#e74c3c' : '#64748b'
                  }}>
                    {status.status === 'completed' && <CheckCircle size={14} />}
                    {status.status === 'in-progress' && <Clock size={14} />}
                    {status.status === 'not-started' && <AlertTriangle size={14} />}
                    {status.status === 'unassigned' && <Flag size={14} />}
                    {status.label}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: '#64748b' }}>
                  <UserCheck size={16} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span>{milestone.trainees?.length || 0} trainees</span>
                    {milestone.trainees?.length > 0 && (
                      <span style={{ fontSize: '0.75rem' }}>
                        {milestone.trainees.filter(t => t.progress?.status === 'completed').length} completed
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)' }}>
          <Flag size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px 0' }}>No milestones found</h3>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>
            {searchQuery || filterStatus !== 'all' || filterProgram !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first milestone'}
          </p>
          <Link
            to="/trainer/milestones/create"
            style={{
              backgroundColor: '#1E88E5',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.875rem',
              transition: 'background-color 0.3s ease',
              ':hover': { backgroundColor: '#1565C0' }
            }}
          >
            <Plus size={18} /> Create Milestone
          </Link>
        </div>
      )}
    </div>
  );
};

export default Milestones;