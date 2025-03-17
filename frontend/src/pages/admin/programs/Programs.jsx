import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, BookOpen, Edit, Trash2, Search, Filter, RefreshCw, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

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
    if (location.state?.message) {
      const timer = setTimeout(() => navigate(location.pathname, { replace: true, state: {} }), 3000);
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

  const cancelDelete = () => setDeleteConfirm(null);
  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleFilterChange = (e) => setFilterStatus(e.target.value);
  const toggleFilters = () => setShowFilters(!showFilters);
  const handleRefresh = () => fetchPrograms();
  const handleViewDetails = (programId) => navigate(`/admin/programs/details/${programId}`);

  const filteredPrograms = programs.filter(program => {
    const searchMatch = program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.description && program.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const statusMatch = filterStatus === 'all' || program.status === filterStatus;
    return searchMatch && statusMatch;
  });

  if (loading && programs.length === 0) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {location.state?.message && <AlertBanner message={location.state.message} type="success" />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <BookOpen size={24} style={{ color: '#1E88E5' }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>Training Programs</h1>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={handleSearch}
              style={{
                padding: '8px 8px 8px 36px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                width: '200px',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
          </div>
          <button onClick={handleRefresh} style={{
            backgroundColor: '#1E88E5',
            color: '#ffffff',
            padding: '8px',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#1565C0' }
          }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => navigate('/admin/programs/create')} style={{
            backgroundColor: '#1E88E5',
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
            ':hover': { backgroundColor: '#1565C0' }
          }}>
            <Plus size={16} /> Create Program
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <button onClick={toggleFilters} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          backgroundColor: '#ffffff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          color: '#1e293b'
        }}>
          <Filter size={18} /> Filters {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showFilters && (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label htmlFor="status-filter" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={handleFilterChange}
              style={{
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5' }
              }}
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
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.07)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                {['Program Title', 'Description', 'Status', 'Actions'].map((header, index) => (
                  <th key={index} style={{
                    padding: '16px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    ':first-child': { minWidth: '200px' }
                  }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map(program => (
                <tr key={program.id} style={{ borderBottom: '1px solid #e2e8f0', ':hover': { backgroundColor: '#f8fafc' } }}>
                  <td style={{ padding: '16px', cursor: 'pointer' }} onClick={() => handleViewDetails(program.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#1E88E5' }}>
                      <BookOpen size={16} /> {program.title}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {program.description}
                  </td>
                  <td style={{ padding: '16px' }}>
  <span style={{
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    ...(program.status === 'active' ? { backgroundColor: '#e6ffe6', color: '#2ecc71' } :
      program.status === 'inactive' ? { backgroundColor: '#ffe6e6', color: '#e74c3c' } :
      { backgroundColor: '#f1f5f9', color: '#64748b' })
  }}>
    {program.status === 'active' ? <CheckCircle size={14} /> :
     program.status === 'inactive' ? <XCircle size={14} /> :
     <Clock size={14} />}
    {program.status 
      ? program.status.charAt(0).toUpperCase() + program.status.slice(1) 
      : 'Unknown'}
  </span>
</td>

                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {deleteConfirm === program.id ? (
                        <>
                          <button onClick={() => handleDeleteProgram(program.id)} style={{
                            backgroundColor: '#2ecc71',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <CheckCircle size={16} />
                          </button>
                          <button onClick={cancelDelete} style={{
                            backgroundColor: '#e74c3c',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <XCircle size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleViewDetails(program.id)} style={{
                            backgroundColor: '#1E88E5',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <BookOpen size={16} />
                          </button>
                          <button onClick={() => navigate(`/admin/programs/edit/${program.id}`)} style={{
                            backgroundColor: '#2ecc71',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDeleteProgram(program.id)} style={{
                            backgroundColor: '#e74c3c',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px', color: '#64748b', fontSize: '0.875rem' }}>
          {searchTerm || filterStatus !== 'all' ? 'No programs match your search or filter criteria.' :
            'No programs available. Create your first program to get started.'}
        </div>
      )}
    </div>
  );
};

export default Programs;