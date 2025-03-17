import React, { useState, useEffect } from 'react';
import { Activity, Users, BookOpen, HelpCircle, Briefcase, Settings, Clock } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

const ActivityLog = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchActivities = async () => {
            try {
                const data = await adminService.getDashboardData();
                setActivities(data.recentActivity || []);
            } catch (err) {
                setError('Failed to fetch activities. Please try again.');
                console.error('Error fetching activities:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivities();
    }, []);

    // Styles
    const containerStyle = {
        padding: '24px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };

    const headerStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
    };

    const headerIconStyle = {
        color: '#3b82f6',
    };

    const headerTextStyle = {
        fontSize: '24px',
        fontWeight: '600',
        color: '#1e293b',
    };

    const noDataMessageStyle = {
        textAlign: 'center',
        padding: '24px',
        color: '#64748b',
    };

    const activityListStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
    };

    const activityItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
    };

    const activityIconStyle = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#e2e8f0',
    };

    const activityContentStyle = {
        flex: 1,
    };

    const activityTextStyle = {
        fontSize: '14px',
        color: '#1e293b',
        marginBottom: '4px',
    };

    const activityTimeStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        color: '#64748b',
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <Activity size={24} style={headerIconStyle} />
                <h2 style={headerTextStyle}>Activity Log</h2>
            </div>

            {activities.length === 0 ? (
                <div style={noDataMessageStyle}>
                    <p>No recent activities to display.</p>
                </div>
            ) : (
                <div style={activityListStyle}>
                    {activities.map((activity, index) => (
                        <div key={index} style={activityItemStyle}>
                            <div style={activityIconStyle}>
                                {activity.type === 'user' && <Users size={16} />}
                                {activity.type === 'program' && <BookOpen size={16} />}
                                {activity.type === 'quiz' && <HelpCircle size={16} />}
                                {activity.type === 'applicant' && <Briefcase size={16} />}
                                {activity.type === 'system' && <Settings size={16} />}
                                {(!activity.type || activity.type === 'other') && <Activity size={16} />}
                            </div>
                            <div style={activityContentStyle}>
                                <p style={activityTextStyle}>{activity.message}</p>
                                <span style={activityTimeStyle}>
                                    <Clock size={12} />
                                    {new Date(activity.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ActivityLog;