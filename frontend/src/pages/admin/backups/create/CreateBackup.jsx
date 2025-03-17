// src/components/admin/backups/CreateBackup.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/CreateBackup.css'; // Create this CSS file

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

    const handleCancel = () => {
        navigate('/admin/backups');
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="create-backup-container">
            <div className="section-header">
                <h1>Create New Backup</h1>
                <div className="header-line"></div>
            </div>
            
            {error && (
                <AlertBanner 
                    message={error} 
                    type="error" 
                    onDismiss={() => setError(null)} 
                />
            )}
            
            {success && (
                <AlertBanner 
                    message={success} 
                    type="success" 
                    onDismiss={() => setSuccess(null)} 
                />
            )}
            
            <div className="back-link" onClick={handleCancel}>
                <ArrowLeft size={16} className="icon-inline" />
                <span>Back to Backups</span>
            </div>
            
            <div className="backup-card">
                <div className="card-header gradient-blue">
                    <div className="header-icon">
                        <Database size={20} />
                    </div>
                    <div className="header-content">
                        <h3>Create System Backup</h3>
                    </div>
                </div>
                
                <div className="card-content">
                    <p className="backup-info">
                        Creating a system backup will capture the current state of your LMS database, including all user data, 
                        training programs, quizzes, and application records. This process may take a few moments to complete.
                    </p>
                    
                    <div className="backup-benefits">
                        <h4>Benefits of regular backups:</h4>
                        <ul>
                            <li>Protect against data loss</li>
                            <li>Recover from unexpected system issues</li>
                            <li>Create restore points before major system changes</li>
                            <li>Maintain data integrity and history</li>
                        </ul>
                    </div>
                    
                    <div className="create-actions">
                        <button 
                            className="action-button primary" 
                            onClick={handleCreateBackup}
                            disabled={loading}
                        >
                            <Database size={16} className="icon-inline" /> Create Backup Now
                        </button>
                        <button 
                            className="action-button secondary" 
                            onClick={handleCancel}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBackup;