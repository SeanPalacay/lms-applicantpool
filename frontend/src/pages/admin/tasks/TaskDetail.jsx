// src/components/admin/tasks/TaskDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Activity } from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TaskDetail.css'; // Create this CSS file

const TaskDetail = () => {
    const { taskId } = useParams();
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Simulate fetching task details (replace with real API call)
        setTimeout(() => {
            setTask({
                id: taskId,
                title: `Task ${taskId}`,
                description: 'This is a sample task description.',
                deadline: '2025-03-20',
            });
            setLoading(false);
        }, 1000);
    }, [taskId]);

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div className="task-detail">
            <div className="section-header">
                <h2><Activity size={24} className="icon-inline" /> Task Details</h2>
            </div>
            <div className="task-content">
                <h3>{task.title}</h3>
                <p>{task.description}</p>
                <p><strong>Deadline:</strong> {task.deadline}</p>
            </div>
        </div>
    );
};

export default TaskDetail;