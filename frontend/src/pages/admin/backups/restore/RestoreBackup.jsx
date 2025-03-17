// src/pages/admin/backups/restore/RestoreBackup.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Database, 
  AlertTriangle, 
  Calendar,
  Clock,
  ArrowLeft,
  RefreshCw,
  XCircle,
  User,
  RotateCcw
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';
import '../styles/RestoreBackup.css';

const RestoreBackup = () => {
  const { backupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [backup, setBackup] = useState({
    id: '',
    backup_name: '',
    file_path: '',
    backup_type: '',
    created_by: '',
    created_at: '',
    size: '',
    created_by_name: ''
  });

  useEffect(() => {
    const fetchBackupData = async () => {
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
        
        // Fetch backup data
        const data = await adminService.getBackupById(backupId);
        setBackup(data);
      } catch (err) {
        console.error('Error fetching backup data:', err);
        setError('Failed to load backup data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBackupData();
  }, [backupId, navigate]);

  const handleRestoreBackup = async () => {
    if (!confirmRestore) {
      setConfirmRestore(true);
      return;
    }
    
    setRestoring(true);
    setError(null);
    setSuccess(null);
    
    try {
      await adminService.restoreBackup(backupId);
      setSuccess('System backup restored successfully. The system will redirect you shortly.');
      
      // Redirect after short delay
      setTimeout(() => {
        navigate('/admin/backups');
      }, 3000);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError('Failed to restore backup. Please try again.');
      setConfirmRestore(false);
    } finally {
      setRestoring(false);
    }
  };

  const cancelRestore = () => {
    setConfirmRestore(false);
  };

  const handleCancel = () => {
    navigate('/admin/backups');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatSize = (sizeInBytes) => {
    if (!sizeInBytes) return 'Unknown';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = parseInt(sizeInBytes);
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="restore-backup-container">
      <div className="section-header">
        <h1>Restore System Backup</h1>
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
      
      <div className="back-link" onClick={handleCancel}>
        <ArrowLeft size={16} className="icon-inline" />
        <span>Back to Backups</span>
      </div>
      
      <div className="backup-content">
        <div className="backup-card">
          <div className="card-header gradient-teal">
            <div className="header-icon">
              <Database size={20} />
            </div>
            <div className="header-content">
              <h3>Backup Information</h3>
            </div>
          </div>
          
          <div className="card-content">
            <div className="warning-message">
              <AlertTriangle size={20} className="warning-icon" />
              <div className="warning-text">
                <strong>Warning:</strong> Restoring this backup will replace all current data in the system.
                This action cannot be undone. Make sure you want to proceed.
              </div>
            </div>
            
            <div className="backup-details">
              <div className="backup-name">{backup.backup_name}</div>
              
              <div className="details-grid">
                <div className="detail-item">
                  <div className="detail-icon">
                    <Calendar size={16} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Date Created</div>
                    <div className="detail-value">{formatDate(backup.created_at)}</div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon">
                    <User size={16} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Created By</div>
                    <div className="detail-value">{backup.created_by_name || 'System'}</div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon">
                    <Database size={16} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Backup Type</div>
                    <div className="detail-value">{backup.backup_type === 'scheduled' ? 'Scheduled' : 'Manual'}</div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-icon">
                    <Clock size={16} />
                  </div>
                  <div className="detail-content">
                    <div className="detail-label">Size</div>
                    <div className="detail-value">{formatSize(backup.size)}</div>
                  </div>
                </div>
              </div>
              
              <div className="file-path">
                <div className="detail-label">File Path</div>
                <div className="path-value">{backup.file_path}</div>
              </div>
            </div>
            
            <div className="restore-actions">
              {confirmRestore ? (
                <div className="confirm-restore">
                  <div className="confirm-message">Are you absolutely sure you want to restore this backup?</div>
                  <div className="confirm-buttons">
                    <button 
                      className="action-button danger" 
                      onClick={handleRestoreBackup}
                      disabled={restoring}
                    >
                      {restoring ? (
                        <>
                          <RefreshCw size={16} className="icon-inline spin" /> Restoring...
                        </>
                      ) : (
                        <>
                          <RotateCcw size={16} className="icon-inline" /> Yes, Restore Backup
                        </>
                      )}
                    </button>
                    <button 
                      className="action-button secondary" 
                      onClick={cancelRestore}
                      disabled={restoring}
                    >
                      <XCircle size={16} className="icon-inline" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="buttons-row">
                  <button 
                    className="action-button danger" 
                    onClick={handleRestoreBackup}
                  >
                    <RotateCcw size={16} className="icon-inline" /> Restore Backup
                  </button>
                  <button 
                    className="action-button secondary" 
                    onClick={handleCancel}
                  >
                    <XCircle size={16} className="icon-inline" /> Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreBackup;