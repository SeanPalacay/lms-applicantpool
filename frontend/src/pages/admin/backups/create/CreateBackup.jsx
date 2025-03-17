import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const CreateBackup = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminService.createBackup();
      setSuccess('Backup created successfully! You will be redirected to the backups page.');
      setTimeout(() => navigate('/admin/backups'), 2000);
    } catch (err) {
      setError('Failed to create backup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => navigate('/admin/backups');

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
          Create New Backup
        </h1>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div> {/* --primary-color */}
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
        fontSize: '0.875rem',
        transition: 'color 0.3s ease'
      }} onClick={handleCancel}>
        <ArrowLeft size={16} /> Back to Backups
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: '#E3F2FD', // --primary-ultralight
          padding: '16px',
          borderRadius: '12px 12px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <Database size={20} style={{ color: '#1E88E5' }} />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#1e293b' }}>Create System Backup</h3>
        </div>
        <div style={{ padding: '24px' }}>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>
            Creating a system backup will capture the current state of your LMS database, including all user data, training programs, quizzes, and application records. This process may take a few moments to complete.
          </p>
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b', margin: '0 0 8px 0' }}>
              Benefits of regular backups:
            </h4>
            <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <li>Protect against data loss</li>
              <li>Recover from unexpected system issues</li>
              <li>Create restore points before major system changes</li>
              <li>Maintain data integrity and history</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
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
              Cancel
            </button>
            <button
              onClick={handleCreateBackup}
              disabled={loading}
              style={{
                backgroundColor: '#1E88E5',
                color: '#ffffff',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': loading ? {} : { backgroundColor: '#1565C0' }
              }}
            >
              <Database size={16} /> Create Backup Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBackup;