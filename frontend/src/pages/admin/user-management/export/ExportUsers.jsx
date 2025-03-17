import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

const ExportUsers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      await adminService.exportUsers('csv');
      navigate('/admin/user-management', { state: { message: 'Users exported successfully!' } });
    } catch (err) {
      setError('Failed to export users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '32px',
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <FileDown size={24} style={{ color: '#1E88E5' }} /> Export Users
        </h2>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0 0 24px 0' }}>
          Click the button below to export all users as a CSV file.
        </p>
        <button
          onClick={handleExport}
          style={{
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
            margin: '0 auto',
            transition: 'background-color 0.3s ease',
            ':hover': { backgroundColor: '#1565C0' }
          }}
        >
          <FileDown size={16} /> Export Users
        </button>
      </div>
    </div>
  );
};

export default ExportUsers;