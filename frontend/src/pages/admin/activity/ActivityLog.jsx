// src/components/admin/activity/ActivityLog.jsx
import React, { useState, useEffect } from 'react';
import { Activity, Users, BookOpen, HelpCircle, Briefcase, Settings, Clock } from 'lucide-react';
import adminService from '../../../services/adminService';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/ActivityLog.css'; // Create this CSS file

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

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div className="activity-log">
            <div className="section-header">
                <h2><Activity size={24} className="icon-inline" /> Activity Log</h2>
            </div>

            {activities.length === 0 ? (
                <div className="no-data-message">
                    <p>No recent activities to display.</p>
                </div>
            ) : (
                <div className="activity-list">
                    {activities.map((activity, index) => (
                        <div key={index} className="activity-item">
                            <div className={`activity-icon activity-${activity.type || 'other'}`}>
                                {activity.type === 'user' && <Users size={16} />}
                                {activity.type === 'program' && <BookOpen size={16} />}
                                {activity.type === 'quiz' && <HelpCircle size={16} />}
                                {activity.type === 'applicant' && <Briefcase size={16} />}
                                {activity.type === 'system' && <Settings size={16} />}
                                {(!activity.type || activity.type === 'other') && <Activity size={16} />}
                            </div>
                            <div className="activity-content">
                                <p className="activity-text">{activity.message}</p>
                                <span className="activity-time">
                                    <Clock size={12} className="icon-inline" />
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