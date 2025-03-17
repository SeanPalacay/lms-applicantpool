import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown } from 'lucide-react';
import adminService from '../../../../services/adminService';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc', // --light-gray
      padding: '32px', // --spacing-xl
      fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
      color: '#1e293b', // --text-primary
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        marginBottom: '32px', // --spacing-xl
        textAlign: 'center'
      }}>
        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px' // --spacing-sm
        }}>
          <FileDown size={24} style={{ color: '#1E88E5' }} /> Export Applicants
        </h2>
        <div style={{
          height: '2px',
          width: '80px',
          backgroundColor: '#1E88E5', // --primary-color
          margin: '0 auto'
        }}></div>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px', // --radius-lg
        boxShadow: '0 4px 6px rgba(0,0,0,0.07)', // --shadow-md
        padding: '24px', // --spacing-lg
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <p style={{
          fontSize: '0.875rem',
          color: '#64748b', // --text-secondary
          margin: '0 0 24px 0' // --spacing-lg below
        }}>
          Click the button below to export all applicants as a CSV file.
        </p>
        <button
          onClick={handleExport}
          style={{
            backgroundColor: '#1E88E5', // --primary-color
            color: '#ffffff',
            padding: '8px 16px', // --spacing-sm vertical, --spacing-md horizontal
            border: 'none',
            borderRadius: '8px', // --radius-md
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px', // --spacing-sm
            fontSize: '0.875rem',
            fontWeight: 500,
            width: '100%',
            transition: 'background-color 0.3s ease', // --transition-normal
            ':hover': { backgroundColor: '#1565C0' } // --primary-dark
          }}
        >
          <FileDown size={16} /> Export Applicants
        </button>
      </div>
    </div>
  );
};

export default ExportApplicants;