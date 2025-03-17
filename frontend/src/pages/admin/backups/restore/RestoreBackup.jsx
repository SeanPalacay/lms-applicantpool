import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Database, AlertTriangle, Calendar, Clock, ArrowLeft, RefreshCw, XCircle, User, RotateCcw } from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';

const RestoreBackup = () => {
  const { backupId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [backup, setBackup] = useState({
    id: '', backup_name: '', file_path: '', backup_type: '', created_by: '', created_at: '', size: '', created_by_name: ''
  });

  useEffect(() => {
    const fetchBackupData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
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
      setTimeout(() => navigate('/admin/backups'), 3000);
    } catch (err) {
      console.error('Error restoring backup:', err);
      setError('Failed to restore backup. Please try again.');
      setConfirmRestore(false);
    } finally {
      setRestoring(false);
    }
  };

  const cancelRestore = () => setConfirmRestore(false);
  const handleCancel = () => navigate('/admin/backups');

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatSize = (sizeInBytes) => {
    if (!sizeInBytes) return 'Unknown';
    let size = parseInt(sizeInBytes);
    let unitIndex = 0;
    const units = ['B', 'KB', 'MB', 'GB'];
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
          Restore System Backup
        </h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      {error && <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />}
      {success && <AlertBanner message={success} type="success" onDismiss={() => setSuccess(null)} />}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#1E88E5',
        cursor: 'pointer',
        marginBottom: '24px',
        fontSize: '0.875rem'
      }} onClick={handleCancel}>
        <ArrowLeft size={16} /> Back to Backups
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#E3F2FD',
          padding: '16px',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Database size={20} style={{ color: '#1E88E5' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Backup Information</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <div style={{
            backgroundColor: '#ffe6e6',
            padding: '16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <AlertTriangle size={20} style={{ color: '#e74c3c' }} />
            <div style={{ fontSize: '0.875rem', color: '#e74c3c' }}>
              <strong>Warning:</strong> Restoring this backup will replace all current data in the system. This action cannot be undone. Make sure you want to proceed.
            </div>
          </div>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>{backup.backup_name}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: Calendar, label: 'Date Created', value: formatDate(backup.created_at) },
                { icon: User, label: 'Created By', value: backup.created_by_name || 'System' },
                { icon: Database, label: 'Backup Type', value: backup.backup_type === 'scheduled' ? 'Scheduled' : 'Manual' },
                { icon: Clock, label: 'Size', value: formatSize(backup.size) }
              ].map((item, index) => (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <item.icon size={16} style={{ color: '#64748b' }} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.label}</div>
                    <div style={{ fontSize: '0.875rem', color: '#1e293b' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>File Path</div>
              <div style={{ fontSize: '0.875rem', color: '#1e293b', wordBreak: 'break-all' }}>{backup.file_path}</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            {confirmRestore ? (
              <>
                <div style={{ fontSize: '0.875rem', color: '#1e293b', marginRight: '16px' }}>
                  Are you absolutely sure you want to restore this backup?
                </div>
                <button
                  onClick={handleRestoreBackup}
                  disabled={restoring}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: '#ffffff',
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: restoring ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem'
                  }}
                >
                  {restoring ? (
                    <>
                      <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Restoring...
                    </>
                  ) : (
                    <>
                      <RotateCcw size={16} /> Yes, Restore Backup
                    </>
                  )}
                </button>
                <button
                  onClick={cancelRestore}
                  disabled={restoring}
                  style={{
                    backgroundColor: '#ffffff',
                    color: '#1E88E5',
                    padding: '8px 16px',
                    border: '1px solid #1E88E5',
                    borderRadius: '8px',
                    cursor: restoring ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.875rem'
                  }}
                >
                  <XCircle size={16} /> Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancel}
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
                    fontSize: '0.875rem'
                  }}
                >
                  <XCircle size={16} /> Cancel
                </button>
                <button
                  onClick={handleRestoreBackup}
                  style={{
                    backgroundColor: '#e74c3c',
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
                    ':hover': { backgroundColor: '#c0392b' }
                  }}
                >
                  <RotateCcw size={16} /> Restore Backup
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestoreBackup;