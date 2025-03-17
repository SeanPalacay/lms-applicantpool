// src/components/admin/settings/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/Settings.css'; // Create this CSS file

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);
            await adminService.updateSettings(formData);
            alert('Settings updated successfully!');
            navigate('/admin/dashboard');
        } catch (err) {
            setError('Failed to update settings: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div className="settings">
            <div className="section-header">
                <h2><Settings size={24} className="icon-inline" /> System Settings</h2>
            </div>
            <form onSubmit={handleSubmit} className="settings-form">
                <div className="form-group">
                    <label htmlFor="systemName">System Name</label>
                    <input
                        type="text"
                        id="systemName"
                        name="systemName"
                        value={formData.systemName}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="maxUsers">Max Users</label>
                    <input
                        type="number"
                        id="maxUsers"
                        name="maxUsers"
                        value={formData.maxUsers}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="backupFrequency">Backup Frequency (days)</label>
                    <input
                        type="number"
                        id="backupFrequency"
                        name="backupFrequency"
                        value={formData.backupFrequency}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-actions">
                    <button type="submit" className="action-button primary">
                        Save Settings
                    </button>
                    <button
                        type="button"
                        className="action-button secondary"
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SystemSettings;