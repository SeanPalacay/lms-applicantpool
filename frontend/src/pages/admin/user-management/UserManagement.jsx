import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Download, ArrowLeft,
  User, RefreshCw, Mail, Shield, Key
} from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import ConfirmationModal from './ConfirmationModal';

const UserManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users, sortConfig]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserList();
      setUsers(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users. Please try again.');
      if (err.message.includes('Authentication') || err.message.includes('login')) {
        setTimeout(() => navigate('/login'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let result = [...users];
    if (roleFilter !== 'all') result = result.filter(user => user.role === roleFilter);
    if (statusFilter !== 'all') result = result.filter(user => user.status === statusFilter);
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(user => 
        user.username.toLowerCase().includes(searchLower) ||
        user.full_name.toLowerCase().includes(searchLower) ||
        (user.email && user.email.toLowerCase().includes(searchLower))
      );
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredUsers(result);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleRoleFilterChange = (e) => setRoleFilter(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);
  const handleEditUser = (userId) => navigate(`/admin/user-management/edit/${userId}`);
  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    try {
      setLoading(true);
      await adminService.deleteUser(userToDelete.id);
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      setError(`Failed to delete user: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      setLoading(true);
      await adminService.exportUsers('csv');
    } catch (err) {
      setError(`Failed to export users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (loading && users.length === 0) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
    }}>
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px' // --spacing-xl
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/administrator-dashboard')} style={{
            background: 'none',
            border: 'none',
            color: '#1E88E5', // --primary-color
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'color 0.3s ease'
          }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>User Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchUsers} style={{
            backgroundColor: '#ffffff',
            color: '#1E88E5',
            padding: '8px',
            border: '1px solid #1E88E5',
            borderRadius: '8px', // --radius-md
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}>
            <RefreshCw size={16} />
          </button>
          <Link to="/admin/user-management/create" style={{
            backgroundColor: '#1E88E5',
            color: '#ffffff',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#1565C0' } // --primary-dark
          }}>
            <Plus size={16} /> Add User
          </Link>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        padding: '16px', // --spacing-md
        marginBottom: '32px', // --spacing-xl
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          flex: 1,
          minWidth: '200px',
          position: 'relative'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{
              width: '100%',
              padding: '8px 8px 8px 36px',
              border: '1px solid #e2e8f0', // --medium-gray
              borderRadius: '8px', // --radius-md
              fontSize: '0.875rem',
              color: '#1e293b',
              outline: 'none',
              ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
            }}
          />
        </div>
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <Filter size={14} style={{ color: '#1E88E5' }} />
  <select value={roleFilter} onChange={handleRoleFilterChange} style={{
    padding: '8px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    ':focus': { borderColor: '#1E88E5' }
  }}>
    <option value="all">All Roles</option>
    <option value="administrator">Administrators</option>
    <option value="trainer">Trainers</option>
    <option value="trainee">Trainees</option>
    <option value="employee">Employees</option>
    <option value="applicant">Applicants</option>
  </select>
</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} style={{ color: '#1E88E5' }} />
          <select value={statusFilter} onChange={handleStatusFilterChange} style={{
            padding: '8px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#1e293b',
            backgroundColor: '#ffffff',
            outline: 'none',
            ':focus': { borderColor: '#1E88E5' }
          }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <button onClick={handleExportUsers} style={{
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
          <Download size={16} /> Export
        </button>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
              {['username', 'full_name', 'email', 'role', 'status', 'last_login'].map(key => (
                <th key={key} onClick={() => handleSort(key)} style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  {key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {sortConfig.key === key && (
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      width: '0',
                      height: '0',
                      borderLeft: '4px solid transparent',
                      borderRight: '4px solid transparent',
                      borderBottom: sortConfig.direction === 'asc' ? '4px solid #1E88E5' : 'none',
                      borderTop: sortConfig.direction === 'desc' ? '4px solid #1E88E5' : 'none',
                      verticalAlign: 'middle'
                    }}></span>
                  )}
                </th>
              ))}
              <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <tr key={user.id} style={{
                  borderBottom: '1px solid #e2e8f0',
                  transition: 'background-color 0.3s ease',
                  ':hover': { backgroundColor: '#f8fafc' } // --light-gray
                }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#1E88E5',
                      borderRadius: '9999px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      fontSize: '14px',
                      fontWeight: 600
                    }}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>{user.username}</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>{user.full_name}</td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
                    <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#64748b' }} />
                    {user.email}
                  </td>
                  <td style={{ padding: '16px' }}>
  <span style={{
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: '#ffffff',
    backgroundColor: user.role === 'administrator' ? '#1E88E5' :
                    user.role === 'trainer' ? '#1565C0' :
                    user.role === 'trainee' ? '#64B5F6' :
                    user.role === 'employee' ? '#00897B' : // Teal color for employees
                    '#64748b'
  }}>
    {user.role === 'administrator' && <Shield size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
    {user.role}
  </span>
</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: user.status === 'active' ? '#2ecc71' : '#e74c3c',
                      backgroundColor: user.status === 'active' ? '#e6ffe6' : '#ffe6e6'
                    }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>{formatDate(user.last_login)}</td>
<td style={{ padding: '16px' }}>
  <div style={{ display: 'flex', gap: '8px' }}>
    <button onClick={() => handleEditUser(user.id)} style={{
      backgroundColor: '#1E88E5',
      color: '#ffffff',
      padding: '4px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}>
      <Edit size={16} />
    </button>
    
    {/* Add this button for applicant users */}
    {user.role === 'applicant' && (
      <button 
        onClick={() => navigate(`/admin/user-management/access-code/${user.id}`)} 
        style={{
          backgroundColor: '#00897B',
          color: '#ffffff',
          padding: '4px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        title="Manage Access Code"
      >
        <Key size={16} />
      </button>
    )}
    
    <button onClick={() => handleDeleteClick(user)} style={{
      backgroundColor: '#e74c3c',
      color: '#ffffff',
      padding: '4px',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}>
      <Trash2 size={16} />
    </button>
  </div>
</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{
                  padding: '32px',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' 
                    ? 'No users match your search criteria.' 
                    : 'No users available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Delete User"
          message={`Are you sure you want to delete user "${userToDelete?.username}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;