import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate for back functionality
import { Activity, ArrowLeft } from 'lucide-react'; // Added ArrowLeft for navigation
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService'; // Assuming this exists for API calls

const TaskDetail = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTaskDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Uncomment and replace with actual API call when available
        // const data = await adminService.getTaskDetails(taskId);
        // setTask(data);

        // Simulated data (remove this when using real API)
        const simulatedData = {
          id: taskId,
          title: `Task ${taskId}`,
          description: 'This is a sample task description.',
          deadline: '2025-03-20',
        };
        setTask(simulatedData);
      } catch (err) {
        setError('Failed to fetch task details: ' + err.message);
        console.error('Error fetching task details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTaskDetails();
  }, [taskId]);

  const handleBack = () => navigate('/admin/tasks'); // Assuming a tasks list route exists

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
          <Activity size={24} style={{ color: '#1E88E5' }} /> Task Details
        </h2>
        <div style={{ height: '2px', width: '80px', backgroundColor: '#1E88E5' }}></div> {/* --primary-color */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1E88E5', cursor: 'pointer', marginBottom: '24px', fontSize: '0.875rem' }} onClick={handleBack}>
        <ArrowLeft size={16} /> Back to Tasks
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        maxWidth: '600px',
        margin: '0 auto',
        padding: '24px' // --spacing-lg
      }}>
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#1e293b',
          margin: '0 0 16px 0'
        }}>
          {task.title}
        </h3>
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b', // --text-secondary
          margin: '0 0 16px 0',
          lineHeight: '1.5'
        }}>
          {task.description}
        </p>
        <p style={{
          fontSize: '0.875rem',
          color: '#1e293b',
          margin: 0
        }}>
          <strong style={{ fontWeight: 600 }}>Deadline:</strong> {task.deadline}
        </p>
      </div>
    </div>
  );
};

export default TaskDetail;