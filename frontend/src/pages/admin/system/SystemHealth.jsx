import React, { useState, useEffect } from 'react';
import { Server, Database, Shield, AlertTriangle } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const SystemHealth = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        const data = await adminService.getSystemStatus();
        setSystemStatus(data);
      } catch (err) {
        setError('Failed to fetch system status. Please try again.');
        console.error('Error fetching system status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSystemStatus();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertBanner message={error} type="error" />;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b' // --text-primary
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
          <Server size={24} style={{ color: '#1E88E5' }} /> System Health
        </h2>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div> {/* --primary-color */}
      </div>

      <div style={{
        display: 'grid',
        gap: '24px', // --spacing-lg
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Database Status */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px', // --radius-lg
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Database Status</div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: systemStatus?.databaseStatus === 'healthy' ? '#2ecc71' : '#e74c3c',
            backgroundColor: systemStatus?.databaseStatus === 'healthy' ? '#e6ffe6' : '#ffe6e6',
            padding: '4px 12px',
            borderRadius: '4px'
          }}>
            <Database size={16} />
            {systemStatus?.databaseStatus || 'Healthy'}
          </div>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '9999px',
            backgroundColor: systemStatus?.databaseStatus === 'healthy' ? '#2ecc71' : '#e74c3c'
          }}></div>
        </div>

        {/* Last Backup */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>Last Backup</div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: systemStatus?.lastBackupDays <= 7 ? '#2ecc71' : '#f39c12',
            backgroundColor: systemStatus?.lastBackupDays <= 7 ? '#e6ffe6' : '#fef5e7',
            padding: '4px 12px',
            borderRadius: '4px'
          }}>
            <AlertTriangle size={16} />
            {systemStatus?.lastBackupDays !== null
              ? `${systemStatus.lastBackupDays} days ago`
              : 'No recent backup'}
          </div>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '9999px',
            backgroundColor: systemStatus?.lastBackupDays <= 7 ? '#2ecc71' : '#f39c12'
          }}></div>
        </div>

        {/* System Load */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1e293b' }}>System Load</div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: systemStatus?.systemLoad === 'normal' ? '#2ecc71' : '#e74c3c',
            backgroundColor: systemStatus?.systemLoad === 'normal' ? '#e6ffe6' : '#ffe6e6',
            padding: '4px 12px',
            borderRadius: '4px'
          }}>
            <Shield size={16} />
            {systemStatus?.systemLoad || 'Normal'}
          </div>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '9999px',
            backgroundColor: systemStatus?.systemLoad === 'normal' ? '#2ecc71' : '#e74c3c'
          }}></div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;