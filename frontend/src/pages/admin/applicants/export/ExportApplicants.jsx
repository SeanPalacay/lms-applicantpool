// src/components/admin/applicants/ExportApplicants.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import '../styles/ExportApplicants.css'; // Create this CSS file

const ExportApplicants = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleExport = async () => {
        try {
            setLoading(true);
            setError(null);
            await adminService.exportApplicants('csv');
            alert('Applicants exported successfully!');
            navigate('/admin/applicant-pools');
        } catch (err) {
            setError('Failed to export applicants: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <AlertBanner message={error} type="error" />;

    return (
        <div className="export-applicants">
            <div className="section-header">
                <h2><FileDown size={24} className="icon-inline" /> Export Applicants</h2>
            </div>
            <div className="export-content">
                <p>Click the button below to export all applicants as a CSV file.</p>
                <button onClick={handleExport} className="action-button primary">
                    <FileDown size={16} className="icon-inline" /> Export Applicants
                </button>
            </div>
        </div>
    );
};

export default ExportApplicants;