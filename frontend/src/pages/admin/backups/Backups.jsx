// src/pages/admin/backups/Backups.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Database, 
  Download, 
  Calendar, 
  RotateCcw, 
  Trash2, 
  FileText,
  AlertTriangle,
  Plus,
  RefreshCw,
  Clock,
  Server
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService';
import './styles/Backups.css';

const Backups = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [backups, setBackups] = useState([]);
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const fetchBackups = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Check if token exists
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        // Fetch backups data
        const data = await adminService.getBackups();
        setBackups(data.backups || []);
      } catch (err) {
        console.error('Error fetching backups:', err);
        setError('Failed to load backups. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBackups();
  }, [navigate]);

  const handleCreateBackup = async () => {
    setCreating(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await adminService.createBackup();
      setSuccess('Backup created successfully.');
      
      // Refresh backups list to show the new backup
      const data = await adminService.getBackups();
      setBackups(data.backups || []);
    } catch (err) {
      console.error('Error creating backup:', err);
      setError('Failed to create backup. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (backupId, backupName) => {
    try {
      await adminService.downloadBackup(backupId);
      // Browser will handle the download
    } catch (err) {
      console.error('Error downloading backup:', err);
      setError('Failed to download backup. Please try again.');
    }
  };

  const startRestoreConfirmation = (backupId) => {
    setRestoreConfirm(backupId);
    setDeleteConfirm(null);
  };

  const cancelRestoreConfirmation = () => {
    setRestoreConfirm(null);
  };

  const startDeleteConfirmation = (backupId) => {
    setDeleteConfirm(backupId);
    setRestoreConfirm(null);
  };

  const cancelDeleteConfirmation = () => {
    setDeleteConfirm(null);
  };

  const handleRestoreBackup = async (backupId) => {
    setRestoring(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminService.restoreBackup(backupId);
      setSuccess('Backup restored successfully. The system has been reset to the selected backup point.');
      setRestoreConfirm(null);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError('Failed to restore backup. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  const handleDeleteBackup = async (backupId) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminService.deleteBackup(backupId);
      setSuccess('Backup deleted successfully.');
      setDeleteConfirm(null);
      
      // Refresh the list after deletion
      const data = await adminService.getBackups();
      setBackups(data.backups || []);
    } catch (err) {
      console.error('Error deleting backup:', err);
      setError('Failed to delete backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getBackupTypeLabel = (type) => {
    switch(type) {
      case 'scheduled': return 'Scheduled';
      case 'manual': return 'Manual';
      default: return type;
    }
  };

  const getBackupTypeClass = (type) => {
    switch(type) {
      case 'scheduled': return 'type-scheduled';
      case 'manual': return 'type-manual';
      default: return 'type-other';
    }
  };

  if (loading && !backups.length) {
    return <LoadingSpinner />;
  }

  return (
    <div className="backups-container">
      <div className="section-header">
        <h1>System Backups</h1>
        <div className="header-line"></div>
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
      
      <div className="backup-actions">
        <button 
          className="action-button primary"
          onClick={handleCreateBackup}
          disabled={creating}
        >
          {creating ? (
            <>
              <RefreshCw size={16} className="icon-inline spin" /> Creating Backup...
            </>
          ) : (
            <>
              <Plus size={16} className="icon-inline" /> Create New Backup
            </>
          )}
        </button>
        
        <div className="backup-info">
          <AlertTriangle size={16} className="icon-inline warning" />
          <span>
            Restoring a backup will replace all current data. Make sure to create a backup of the current state first.
          </span>
        </div>
      </div>
      
      {restoring && (
        <div className="restoration-in-progress">
          <div className="restoration-message">
            <RefreshCw size={24} className="spin" />
            <h3>System Restoration in Progress</h3>
            <p>Please do not close this window or navigate away during the restoration process.</p>
          </div>
        </div>
      )}
      
      <div className="backups-table-container">
        {backups.length > 0 ? (
          <table className="backups-table">
            <thead>
              <tr>
                <th>Backup Name</th>
                <th>Type</th>
                <th>Created By</th>
                <th>Date</th>
                <th className="actions-column">Actions</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id}>
                  <td>
                    <div className="backup-name">
                      <FileText size={16} className="icon-inline" />
                      <span>{backup.backup_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`backup-type-badge ${getBackupTypeClass(backup.backup_type)}`}>
                      {getBackupTypeLabel(backup.backup_type)}
                    </span>
                  </td>
                  <td>{backup.created_by_name || 'System'}</td>
                  <td>
                    <div className="date-info">
                      <Calendar size={14} className="icon-inline" />
                      <span>{formatDate(backup.created_at)}</span>
                    </div>
                  </td>
                  <td className="actions-column">
                    {restoreConfirm === backup.id ? (
                      <div className="confirmation-buttons">
                        <span>Restore?</span>
                        <button 
                          className="confirm-yes" 
                          onClick={() => handleRestoreBackup(backup.id)}
                        >
                          Yes
                        </button>
                        <button 
                          className="confirm-no"
                          onClick={cancelRestoreConfirmation}
                        >
                          No
                        </button>
                      </div>
                    ) : deleteConfirm === backup.id ? (
                      <div className="confirmation-buttons">
                        <span>Delete?</span>
                        <button 
                          className="confirm-yes" 
                          onClick={() => handleDeleteBackup(backup.id)}
                        >
                          Yes
                        </button>
                        <button 
                          className="confirm-no"
                          onClick={cancelDeleteConfirmation}
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <div className="backup-actions">
                        <button 
                          className="action-icon" 
                          onClick={() => handleDownloadBackup(backup.id, backup.backup_name)}
                          title="Download backup"
                        >
                          <Download size={16} />
                        </button>
                        <button 
                          className="action-icon" 
                          onClick={() => startRestoreConfirmation(backup.id)}
                          title="Restore from this backup"
                        >
                          <RotateCcw size={16} />
                        </button>
                        <button 
                          className="action-icon delete" 
                          onClick={() => startDeleteConfirmation(backup.id)}
                          title="Delete backup"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-backups">
            <Database size={48} className="no-backups-icon" />
            <h3>No Backups Found</h3>
            <p>You haven't created any backups yet. Create your first backup to protect your data.</p>
          </div>
        )}
      </div>
      
      <div className="backup-info-card">
        <div className="info-header">
          <Server size={20} className="icon-inline" />
          <h3>About System Backups</h3>
        </div>
        <div className="info-content">
          <p>
            Backups are essential for data protection and recovery. They capture the complete state of your LMS at a specific point in time, including:
          </p>
          <ul>
            <li>User accounts and permissions</li>
            <li>Training programs and content</li>
            <li>Applicant data and evaluations</li>
            <li>Quiz results and progress tracking</li>
          </ul>
          <p>
            <strong>Scheduled backups</strong> are automatically created by the system, while <strong>manual backups</strong> are created by administrators. It's recommended to create a manual backup before making significant changes to the system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Backups;