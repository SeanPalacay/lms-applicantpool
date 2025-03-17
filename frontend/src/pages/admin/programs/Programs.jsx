import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
    ChevronDown,ChevronUp,
  BookOpen, 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/Programs.css';

const Programs = () => {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchPrograms();
    
    // Check for success message from navigation
    if (location.state?.message) {
      const timer = setTimeout(() => {
        navigate(location.pathname, { replace: true, state: {} });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location, navigate]);

  const fetchPrograms = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await adminService.getProgramList();
      setPrograms(data);
    } catch (err) {
      console.error('Error fetching programs:', err);
      setError('Failed to load programs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (programId) => {
    if (deleteConfirm === programId) {
      try {
        await adminService.deleteProgram(programId);
        setPrograms(programs.filter(program => program.id !== programId));
        setDeleteConfirm(null);
      } catch (err) {
        console.error('Error deleting program:', err);
        setError('Failed to delete program. Please try again.');
      }
    } else {
      setDeleteConfirm(programId);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleRefresh = () => {
    fetchPrograms();
  };

  const handleViewDetails = (programId) => {
    navigate(`/admin/programs/details/${programId}`);
  };

  const filteredPrograms = programs
    .filter(program => {
      // Search filter
      const searchMatch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Status filter
      let statusMatch = true;
      if (filterStatus !== 'all') {
        statusMatch = program.status === filterStatus;
      }
      
      return searchMatch && statusMatch;
    });
    
  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <div className="status-badge status-active">
            <CheckCircle size={14} />
            <span>Active</span>
          </div>
        );
      case 'inactive':
        return (
          <div className="status-badge status-inactive">
            <XCircle size={14} />
            <span>Inactive</span>
          </div>
        );
      case 'draft':
        return (
          <div className="status-badge status-draft">
            <Clock size={14} />
            <span>Draft</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading && programs.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="programs-container">
      {error && <div className="error-message">{error}</div>}
      {location.state?.message && (
        <AlertBanner 
          message={location.state.message} 
          type="success" 
        />
      )}
      
      <div className="programs-header">
        <div className="header-title">
          <BookOpen size={24} className="header-icon" />
          <h1>Training Programs</h1>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Search programs..." 
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button className="refresh-button" onClick={handleRefresh}>
            <RefreshCw size={16} />
          </button>
          <button 
            className="create-button"
            onClick={() => navigate('/admin/programs/create')}
          >
            <Plus size={16} />
            <span>Create Program</span>
          </button>
        </div>
      </div>
      
      <div className="search-filter-bar">
        <button onClick={toggleFilters} className="btn-toggle-filters">
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select 
              id="status-filter" 
              value={filterStatus}
              onChange={handleFilterChange}
              className="filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      )}
      
      {filteredPrograms.length > 0 ? (
        <div className="programs-list">
          <table className="programs-table">
            <thead>
              <tr>
                <th className="title-column">Program Title</th>
                <th className="description-column">Description</th>
                <th className="status-column">Status</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map(program => (
                <tr key={program.id}>
                  <td 
                    className="title-column program-title"
                    onClick={() => handleViewDetails(program.id)}
                  >
                    <BookOpen size={16} className="icon-inline" />
                    {program.title}
                  </td>
                  <td className="description-column">
                    <div className="description-truncate">
                      {program.description}
                    </div>
                  </td>
                  <td className="status-column">
                    {getStatusBadge(program.status)}
                  </td>
                  <td className="actions-column">
                    <div className="program-actions">
                      <button 
                        className="view-button"
                        onClick={() => handleViewDetails(program.id)}
                        title="View Details"
                      >
                        <BookOpen size={16} />
                      </button>
                      <button 
                        className="edit-button"
                        onClick={() => navigate(`/admin/programs/edit/${program.id}`)}
                        title="Edit Program"
                      >
                        <Edit size={16} />
                      </button>
                      {deleteConfirm === program.id ? (
                        <div className="delete-confirmation inline">
                          <button className="confirm-yes" onClick={() => handleDeleteProgram(program.id)}>
                            <CheckCircle size={16} />
                          </button>
                          <button className="confirm-no" onClick={cancelDelete}>
                            <XCircle size={16} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="delete-button"
                          onClick={() => handleDeleteProgram(program.id)}
                          title="Delete Program"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data-message">
          {searchTerm || filterStatus !== 'all' ? 
            'No programs match your search or filter criteria.' : 
            'No programs available. Create your first program to get started.'}
        </div>
      )}
    </div>
  );
};

export default Programs;