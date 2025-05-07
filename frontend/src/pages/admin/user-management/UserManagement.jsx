import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Users, Search, Filter, Plus, Edit, Trash2, Download, ArrowLeft,
  User, RefreshCw, Mail, Shield, Key, FileText, Eye
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
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [activeTab, setActiveTab] = useState('trainees');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedUserDocuments, setSelectedUserDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, users, sortConfig, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserList();
      // Ensure data is an array and log for debugging
      if (!Array.isArray(data)) {
        throw new Error('Invalid user data: Expected an array');
      }
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
    
    // Apply tab-based filtering
    if (activeTab === 'trainees') {
      result = result.filter(user => user.role === 'trainee');
    } else if (activeTab === 'trainers') {
      result = result.filter(user => user.role === 'trainer');
    } else if (activeTab === 'admin') {
      result = result.filter(user => user.role === 'administrator');
    } else if (activeTab === 'applicants') {
      result = result.filter(user => user.role === 'applicant');
    }

    // Apply role filter only in 'all' tab
    if (roleFilter !== 'all' && activeTab === 'all') {
      result = result.filter(user => user.role === roleFilter);
    }

    // Search by full name or email
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(user => {
        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName.toLowerCase().includes(searchLower) ||
               (user.email && user.email.toLowerCase().includes(searchLower));
      });
    }

    // Sort
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === 'full_name') {
          aValue = `${a.first_name || ''} ${a.last_name || ''}`.trim();
          bValue = `${b.first_name || ''} ${b.last_name || ''}`.trim();
        }
        // Handle null/undefined values
        if (!aValue && !bValue) return 0;
        if (!aValue) return sortConfig.direction === 'asc' ? 1 : -1;
        if (!bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
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

  const handleViewDocuments = async (userId) => {
    try {
      setDocumentsLoading(true);
      setDocumentError(null);
      setShowDocumentsModal(true);
      const documents = await adminService.getUserDocuments(userId);
      setSelectedUserDocuments(documents || []);
    } catch (err) {
      console.error('Document fetch error:', err);
      setDocumentError(`Failed to load documents: ${err.message}`);
      setSelectedUserDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleDownloadDocument = async (documentId) => {
    try {
      setDocumentError(null);
      await adminService.downloadUserDocument(documentId);
    } catch (err) {
      setDocumentError(`Failed to download document: ${err.message}`);
    }
  };

  const handleViewDocument = async (documentId) => {
    try {
      await adminService.viewUserDocument(documentId);
    } catch (error) {
      console.error('Failed to view document:', error);
      alert('Failed to view document: ' + error.message);
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
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={() => navigate('/administrator-dashboard')} style={{
            background: 'none',
            border: 'none',
            color: '#1E88E5',
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
            borderRadius: '8px',
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
            transition: 'background-color 0.3s ease'
          }}>
            <Plus size={16} /> Add User
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        marginBottom: '24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        gap: '8px'
      }}>
        {[
          { id: 'trainees', label: 'Trainees' },
          { id: 'trainers', label: 'Trainers' },
          { id: 'admin', label: 'Admin' },
          { id: 'applicants', label: 'Applicants' },
          { id: 'all', label: 'All Users' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: 'none',
              fontSize: '0.875rem',
              color: activeTab === tab.id ? '#1E88E5' : '#64748b',
              borderBottom: activeTab === tab.id ? '2px solid #1E88E5' : 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
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
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              outline: 'none',
              transition: 'border-color 0.3s ease'
            }}
          />
        </div>
        {activeTab === 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: '#1E88E5' }} />
            <select value={roleFilter} onChange={handleRoleFilterChange} style={{
              padding: '8px',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#1e293b',
              backgroundColor: '#ffffff',
              outline: 'none'
            }}>
              <option value="all">All Roles</option>
              <option value="administrator">Administrators</option>
              <option value="trainer">Trainers</option>
              <option value="trainee">Trainees</option>
              <option value="employee">Employees</option>
              <option value="applicant">Applicants</option>
            </select>
          </div>
        )}
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
          fontSize: '0.875rem',
          transition: 'background-color 0.3s ease'
        }}>
          <Download size={16} /> Export
        </button>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
              {['full_name', 'email', 'role', 'position_name'].map(key => (
                <th key={key} onClick={() => handleSort(key)} style={{
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                  position: 'relative'
                }}>
                  {key === 'full_name' ? 'Name' : 
                   key === 'position_name' ? 'Position' :
                   key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
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
                  transition: 'background-color 0.3s ease'
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
  {(user.full_name || 'U').charAt(0).toUpperCase()}
</div>
                    <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>
  {user.full_name || 'Unnamed User'}
</span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
                    <Mail size={14} style={{ verticalAlign: 'middle', marginRight: '8px', color: '#64748b' }} />
                    {user.email || 'N/A'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
                    {user.role === 'administrator' && <Shield size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />}
                    {user.role || 'N/A'}
                  </td>
                  <td style={{ padding: '16px', fontSize: '0.875rem', color: '#1e293b' }}>
                    {user.position_name || 'N/A'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditUser(user.id)} style={{
                        backgroundColor: '#1E88E5',
                        color: '#ffffff',
                        padding: '4px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }} title="Edit User">
                        <Edit size={16} />
                      </button>
                      {user.role === 'applicant' && (
                        <>
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
                          <button
                            onClick={() => handleViewDocuments(user.id)}
                            style={{
                              backgroundColor: '#4CAF50',
                              color: '#ffffff',
                              padding: '4px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            title="View Documents"
                          >
                            <FileText size={16} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDeleteClick(user)} style={{
                        backgroundColor: '#e74c3c',
                        color: '#ffffff',
                        padding: '4px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }} title="Delete User">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{
                  padding: '32px',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: '#64748b'
                }}>
                  {searchTerm || roleFilter !== 'all' || activeTab !== 'all'
                    ? 'No users match your search criteria.'
                    : 'No users available.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Documents Modal */}
      {showDocumentsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            padding: '24px',
            width: '600px',
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.25rem', 
              fontWeight: 600, 
              marginBottom: '16px',
              color: '#1e293b'
            }}>
              Applicant Documents
            </h2>
            {documentError && (
              <div style={{
                backgroundColor: '#ffe6e6',
                color: '#e74c3c',
                padding: '8px 16px',
                borderRadius: '4px',
                marginBottom: '16px',
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l3 3a1 1 0 001.414-1.414L11 9.586V6z" clipRule="evenodd" />
                </svg>
                {documentError}
              </div>
            )}
            {documentsLoading ? (
              <LoadingSpinner />
            ) : selectedUserDocuments.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      Document Name
                    </th>
                    <th style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      Category
                    </th>
                    <th style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      Uploaded At
                    </th>
                    <th style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#1e293b'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {selectedUserDocuments.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px', fontSize: '0.875rem', color: '#1e293b' }}>
                        {doc.description || 'Unnamed Document'}
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.875rem', color: '#1e293b' }}>
                        {doc.category || 'N/A'}
                      </td>
                      <td style={{ padding: '8px', fontSize: '0.875rem', color: '#1e293b' }}>
                        {new Date(doc.created_at).toLocaleString()}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleViewDocument(doc.id)}
                            disabled={viewingDocument === doc.id}
                            style={{
                              backgroundColor: '#1E88E5',
                              color: '#ffffff',
                              padding: '6px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: viewingDocument === doc.id ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="View Document"
                          >
                            {viewingDocument === doc.id ? (
                              <span>Loading...</span>
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                          <button
                            onClick={() => handleDownloadDocument(doc.id)}
                            style={{
                              backgroundColor: '#4CAF50',
                              color: '#ffffff',
                              padding: '6px',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Download Document"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '0.875rem', color: '#64748b', textAlign: 'center' }}>
                No documents available for this applicant.
              </p>
            )}
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDocumentsModal(false);
                  setSelectedUserDocuments([]);
                  setDocumentError(null);
                  setViewingDocument(null);
                }}
                style={{
                  backgroundColor: '#EF5350',
                  color: '#ffffff',
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.3s ease'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <ConfirmationModal
          title="Delete User"
          message={`Are you sure you want to delete user "${(userToDelete?.first_name || '') + ' ' + (userToDelete?.last_name || '')}"? This action cannot be undone.`}
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