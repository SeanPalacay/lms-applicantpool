// src/components/admin/system/SystemHealth.jsx
import React, { useState, useEffect } from 'react';
import { Server, Database, Shield, AlertTriangle } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/SystemHealth.css'; // Create this CSS file

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
        <div className="system-health">
            <div className="section-header">
                <h2><Server size={24} className="icon-inline" /> System Health</h2>
            </div>

            <div className="health-metrics">
                <div className="health-metric">
                    <div className="metric-info">
                        <div className="metric-label">Database Status</div>
                    </div>
                    <div className={`metric-value ${systemStatus?.databaseStatus === 'healthy' ? 'status-healthy' : 'status-error'}`}>
                        <Database size={16} className="icon-inline" />
                        {systemStatus?.databaseStatus || 'Healthy'}
                    </div>
                    <div className={`metric-indicator ${systemStatus?.databaseStatus === 'healthy' ? 'healthy' : 'error'}`}></div>
                </div>

                <div className="health-metric">
                    <div className="metric-info">
                        <div className="metric-label">Last Backup</div>
                    </div>
                    <div className={`metric-value ${systemStatus?.lastBackupDays <= 7 ? 'status-healthy' : 'status-warning'}`}>
                        <AlertTriangle size={16} className="icon-inline" />
                        {systemStatus?.lastBackupDays !== null
                            ? `${systemStatus.lastBackupDays} days ago`
                            : 'No recent backup'}
                    </div>
                    <div className={`metric-indicator ${systemStatus?.lastBackupDays <= 7 ? 'healthy' : 'warning'}`}></div>
                </div>

                <div className="health-metric">
                    <div className="metric-info">
                        <div className="metric-label">System Load</div>
                    </div>
                    <div className={`metric-value ${systemStatus?.systemLoad === 'normal' ? 'status-healthy' : 'status-error'}`}>
                        <Shield size={16} className="icon-inline" />
                        {systemStatus?.systemLoad || 'Normal'}
                    </div>
                    <div className={`metric-indicator ${systemStatus?.systemLoad === 'normal' ? 'healthy' : 'error'}`}></div>
                </div>
            </div>
        </div>
    );
};

export default SystemHealth;