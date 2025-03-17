    import React, { useState, useEffect } from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import { 
    Users, Search, Filter, Plus, Edit, Trash2, Download, ArrowLeft,
    User, RefreshCw, Mail, Shield
    } from 'lucide-react';
    import adminService from '../../../services/adminService';
    import LoadingSpinner from '../../../components/shared/LoadingSpinner';
    import AlertBanner from '../../../components/shared/AlertBanner';
    import './styles/UserManagement.css';
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
        // Apply filters and search whenever these criteria or users change
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
        
        // If authentication error, redirect to login
        if (err.message.includes('Authentication') || err.message.includes('login')) {
            setTimeout(() => navigate('/login'), 2000);
        }
        } finally {
        setLoading(false);
        }
    };

    const filterUsers = () => {
        let result = [...users];
        
        // Apply role filter
        if (roleFilter !== 'all') {
        result = result.filter(user => user.role === roleFilter);
        }
        
        // Apply status filter
        if (statusFilter !== 'all') {
        result = result.filter(user => user.status === statusFilter);
        }
        
        // Apply search
        if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        result = result.filter(user => 
            user.username.toLowerCase().includes(searchLower) ||
            user.full_name.toLowerCase().includes(searchLower) ||
            (user.email && user.email.toLowerCase().includes(searchLower))
        );
        }
        
        // Apply sorting
        if (sortConfig.key) {
        result.sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
            return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        }
        
        setFilteredUsers(result);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
        }
        
        setSortConfig({ key, direction });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleRoleFilterChange = (e) => {
        setRoleFilter(e.target.value);
    };

    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    const handleEditUser = (userId) => {
        navigate(`/admin/user-management/edit/${userId}`);
    };

    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!userToDelete) return;
        
        try {
        setLoading(true);
        await adminService.deleteUser(userToDelete.id);
        
        // Remove from local state
        setUsers(users.filter(user => user.id !== userToDelete.id));
        
        // Close modal
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
        // Success will trigger a download, handled by the browser
        } catch (err) {
        setError(`Failed to export users: ${err.message}`);
        } finally {
        setLoading(false);
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    // Get appropriate role badge class
    const getRoleBadgeClass = (role) => {
        switch (role) {
        case 'administrator': return 'role-badge admin';
        case 'trainer': return 'role-badge trainer';
        case 'trainee': return 'role-badge trainee';
        case 'applicant': return 'role-badge applicant';
        default: return 'role-badge';
        }
    };

    if (loading && users.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="user-management-container">
        {error && <AlertBanner message={error} type="error" />}
        
        <div className="page-header">
            <div className="header-left">
            <button className="back-button" onClick={() => navigate('/administrator-dashboard')}>
                <ArrowLeft size={16} />
                <span>Back to Dashboard</span>
            </button>
            <h1>User Management</h1>
            </div>
            <div className="header-actions">
            <button className="refresh-button" onClick={fetchUsers}>
                <RefreshCw size={16} />
            </button>
            <Link to="/admin/user-management/create" className="create-button">
                <Plus size={16} />
                <span>Add User</span>
            </Link>
            </div>
        </div>
        
        <div className="filters-bar">
            <div className="search-bar">
            <Search size={16} />
            <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={handleSearchChange}
            />
            </div>
            
            <div className="filter-group">
            <div className="filter-label">
                <Filter size={14} />
                <span>Role:</span>
            </div>
            <select value={roleFilter} onChange={handleRoleFilterChange}>
                <option value="all">All Roles</option>
                <option value="administrator">Administrators</option>
                <option value="trainer">Trainers</option>
                <option value="trainee">Trainees</option>
                <option value="applicant">Applicants</option>
            </select>
            </div>
            
            <div className="filter-group">
            <div className="filter-label">
                <Filter size={14} />
                <span>Status:</span>
            </div>
            <select value={statusFilter} onChange={handleStatusFilterChange}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
            </div>
            
            <button className="export-button" onClick={handleExportUsers}>
            <Download size={16} />
            <span>Export</span>
            </button>
        </div>
        
        <div className="users-table-container">
            <table className="users-table">
            <thead>
                <tr>
                <th onClick={() => handleSort('username')} className="sortable">
                    Username
                    {sortConfig.key === 'username' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}></span>
                    )}
                </th>
                <th onClick={() => handleSort('full_name')} className="sortable">
                    Full Name
                    {sortConfig.key === 'full_name' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}></span>
                    )}
                </th>
                <th onClick={() => handleSort('email')} className="sortable">
                    Email
                    {sortConfig.key === 'email' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}></span>
                    )}
                </th>
                <th onClick={() => handleSort('role')} className="sortable">
                    Role
                    {sortConfig.key === 'role' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}></span>
                    )}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                    Status
                    {sortConfig.key === 'status' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}></span>
                    )}
                </th>
                <th onClick={() => handleSort('last_login')} className="sortable">
                    Last Login
                    {sortConfig.key === 'last_login' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}></span>
                    )}
                </th>
                <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                    <tr key={user.id}>
                    <td className="username-cell">
                        <div className="user-avatar">
                        {user.username.charAt(0).toUpperCase()}
                        </div>
                        {user.username}
                    </td>
                    <td>{user.full_name}</td>
                    <td className="email-cell">
                        <Mail size={14} className="icon-inline" />
                        {user.email}
                    </td>
                    <td>
                        <div className={getRoleBadgeClass(user.role)}>
                        {user.role === 'administrator' && <Shield size={12} className="icon-inline" />}
                        {user.role}
                        </div>
                    </td>
                    <td>
                        <div className={`status-badge status-${user.status}`}>
                        {user.status}
                        </div>
                    </td>
                    <td>{formatDate(user.last_login)}</td>
                    <td>
                        <div className="action-buttons">
                        <button 
                            className="edit-button" 
                            title="Edit User"
                            onClick={() => handleEditUser(user.id)}
                        >
                            <Edit size={16} />
                        </button>
                        <button 
                            className="delete-button" 
                            title="Delete User"
                            onClick={() => handleDeleteClick(user)}
                        >
                            <Trash2 size={16} />
                        </button>
                        </div>
                    </td>
                    </tr>
                ))
                ) : (
                <tr>
                    <td colSpan="7" className="no-results">
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