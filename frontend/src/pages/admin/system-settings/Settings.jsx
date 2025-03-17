import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Save, XCircle } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const SystemSettings = () => {
  const [formData, setFormData] = useState({
    systemName: '',
    maxUsers: '',
    backupFrequency: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await adminService.getSettings();
        setFormData({
          systemName: data.systemName || '',
          maxUsers: data.maxUsers || '',
          backupFrequency: data.backupFrequency || '',
        });
      } catch (err) {
        setError('Failed to fetch settings: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      await adminService.updateSettings(formData);
      navigate('/admin/dashboard', { state: { message: 'Settings updated successfully!' } });
    } catch (err) {
      setError('Failed to update settings: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <AlertBanner message={error} type="error" onDismiss={() => setError(null)} />;

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
          <Settings size={24} style={{ color: '#1E88E5' }} /> System Settings
        </h2>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div> {/* --primary-color */}
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px' // --spacing-lg
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="systemName" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              System Name
            </label>
            <input
              type="text"
              id="systemName"
              name="systemName"
              value={formData.systemName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0', // --border-color
                borderRadius: '8px', // --radius-md
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="maxUsers" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Max Users
            </label>
            <input
              type="number"
              id="maxUsers"
              name="maxUsers"
              value={formData.maxUsers}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="backupFrequency" style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Backup Frequency (days)
            </label>
            <input
              type="number"
              id="backupFrequency"
              name="backupFrequency"
              value={formData.backupFrequency}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#1e293b',
                outline: 'none',
                ':focus': { borderColor: '#1E88E5', boxShadow: '0 0 0 2px rgba(30, 136, 229, 0.2)' }
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/dashboard')}
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
                fontSize: '0.875rem',
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#E3F2FD' }
              }}
            >
              <XCircle size={16} /> Cancel
            </button>
            <button
              type="submit"
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
                transition: 'background-color 0.3s ease',
                ':hover': { backgroundColor: '#1565C0' }
              }}
            >
              <Save size={16} /> Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SystemSettings;