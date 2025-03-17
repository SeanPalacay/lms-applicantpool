import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Database, Download, Calendar, RotateCcw, Trash2, FileText, AlertTriangle, Plus, RefreshCw, Server } from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService';

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
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
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
    } catch (err) {
      console.error('Error downloading backup:', err);
      setError('Failed to download backup. Please try again.');
    }
  };

  const startRestoreConfirmation = (backupId) => setRestoreConfirm(backupId);
  const cancelRestoreConfirmation = () => setRestoreConfirm(null);
  const startDeleteConfirmation = (backupId) => setDeleteConfirm(backupId);
  const cancelDeleteConfirmation = () => setDeleteConfirm(null);

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
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !backups.length) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>System Backups</h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={handleCreateBackup}
          disabled={creating}
          style={{
            backgroundColor: '#1E88E5',
            color: '#ffffff',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            cursor: creating ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            transition: 'background-color 0.3s ease',
            ':hover': creating ? {} : { backgroundColor: '#1565C0' }
          }}
        >
          {creating ? (
            <>
              <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating Backup...
            </>
          ) : (
            <>
              <Plus size={16} /> Create New Backup
            </>
          )}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: '#f39c12' }}>
          <AlertTriangle size={16} />
          <span>Restoring a backup will replace all current data. Make sure to create a backup of the current state first.</span>
        </div>
      </div>

      {restoring && (
        <div style={{
          backgroundColor: '#E3F2FD',
          padding: '24px',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', color: '#1E88E5' }} />
          <h3 style={{ margin: '8px 0', fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>
            System Restoration in Progress
          </h3>
          <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
            Please do not close this window or navigate away during the restoration process.
          </p>
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        padding: '24px',
        marginBottom: '32px'
      }}>
        {backups.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#E3F2FD', borderBottom: '1px solid #e2e8f0' }}>
                  {['Backup Name', 'Type', 'Created By', 'Date', 'Actions'].map((header, index) => (
                    <th key={index} style={{
                      padding: '16px',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: '#1e293b'
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {backups.map(backup => (
                  <tr key={backup.id} style={{ borderBottom: '1px solid #e2e8f0', ':hover': { backgroundColor: '#f8fafc' } }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} style={{ color: '#64748b' }} />
                        <span style={{ fontSize: '0.875rem', color: '#1e293b' }}>{backup.backup_name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: backup.backup_type === 'scheduled' ? '#2ecc71' : '#1E88E5',
                        backgroundColor: backup.backup_type === 'scheduled' ? '#e6ffe6' : '#E3F2FD'
                      }}>
                        {backup.backup_type === 'scheduled' ? 'Scheduled' : 'Manual'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '0.875rem', color: '#64748b' }}>
                      {backup.created_by_name || 'System'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.875rem', color: '#64748b' }}>
                        <Calendar size={14} />
                        <span>{formatDate(backup.created_at)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {restoreConfirm === backup.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                          <span>Restore?</span>
                          <button onClick={() => handleRestoreBackup(backup.id)} style={{
                            backgroundColor: '#1E88E5',
                            color: '#ffffff',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>Yes</button>
                          <button onClick={cancelRestoreConfirmation} style={{
                            backgroundColor: '#e74c3c',
                            color: '#ffffff',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>No</button>
                        </div>
                      ) : deleteConfirm === backup.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                          <span>Delete?</span>
                          <button onClick={() => handleDeleteBackup(backup.id)} style={{
                            backgroundColor: '#1E88E5',
                            color: '#ffffff',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>Yes</button>
                          <button onClick={cancelDeleteConfirmation} style={{
                            backgroundColor: '#e74c3c',
                            color: '#ffffff',
                            padding: '4px 12px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>No</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleDownloadBackup(backup.id, backup.backup_name)} style={{
                            backgroundColor: '#1E88E5',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <Download size={16} />
                          </button>
                          <button onClick={() => startRestoreConfirmation(backup.id)} style={{
                            backgroundColor: '#2ecc71',
                            color: '#ffffff',
                            padding: '4px',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}>
                            <RotateCcw size={16} />
                          </button>
                          <button onClick={() => startDeleteConfirmation(backup.id)} style={{
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
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Database size={48} style={{ color: '#1E88E5', marginBottom: '16px' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.125rem', fontWeight: 600, color: '#1e293b' }}>
              No Backups Found
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              You haven't created any backups yet. Create your first backup to protect your data.
            </p>
          </div>
        )}
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        padding: '24px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Server size={20} style={{ color: '#1E88E5' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>About System Backups</h3>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 16px 0' }}>
          Backups are essential for data protection and recovery. They capture the complete state of your LMS at a specific point in time, including:
        </p>
        <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '0 0 16px 0', fontSize: '0.875rem', color: '#64748b' }}>
          <li>User accounts and permissions</li>
          <li>Training programs and content</li>
          <li>Applicant data and evaluations</li>
          <li>Quiz results and progress tracking</li>
        </ul>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0 }}>
          <strong>Scheduled backups</strong> are automatically created by the system, while <strong>manual backups</strong> are created by administrators. It's recommended to create a manual backup before making significant changes to the system.
        </p>
      </div>
    </div>
  );
};

export default Backups;