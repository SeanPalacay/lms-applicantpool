import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Calendar, 
  Download, 
  Trash2, 
  Edit, 
  ArrowLeft,
  Tag,
  Info,
  ExternalLink
} from 'lucide-react';
import LoadingSpinner from '../../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../../components/shared/AlertBanner';
import adminService from '../../../../services/adminService';

const RecordDetails = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [record, setRecord] = useState({
    id: '',
    user_id: null,
    record_type: '',
    category: '',
    file_path: '',
    description: '',
    created_at: '',
    file_size: null,
    file_type: '',
    userName: '',
    userRole: ''
  });

  useEffect(() => {
    const fetchRecordDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        
        const data = await adminService.getRecordById(recordId);
        setRecord(data);
      } catch (err) {
        console.error('Error fetching record details:', err);
        setError('Failed to load record details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecordDetails();
  }, [recordId, navigate]);

  const handleDownload = async () => {
    try {
      await adminService.downloadRecord(recordId);
    } catch (err) {
      console.error('Error downloading record:', err);
      setError('Failed to download record. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }

    try {
      await adminService.deleteRecord(recordId);
      setSuccess('Record deleted successfully.');
      setTimeout(() => {
        navigate('/admin/records', { state: { message: 'Record deleted successfully.' } });
      }, 2000);
    } catch (err) {
      console.error('Error deleting record:', err);
      setError('Failed to delete record. Please try again.');
      setDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(false);
  };

  const goBack = () => {
    navigate('/admin/records');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatFileSize = (size) => {
    if (!size) return 'Unknown';

    const units = ['B', 'KB', 'MB', 'GB'];
    let fileSize = size;
    let unitIndex = 0;

    while (fileSize >= 1024 && unitIndex < units.length - 1) {
      fileSize /= 1024;
      unitIndex++;
    }

    return `${fileSize.toFixed(2)} ${units[unitIndex]}`;
  };

  const getRecordTypeLabel = (type) => {
    switch(type) {
      case 'training': return 'Training';
      case 'applicant': return 'Applicant';
      case 'backup': return 'Backup';
      default: return 'Other';
    }
  };

  const getRecordTypeClass = (type) => {
    switch(type) {
      case 'training': return 'type-training';
      case 'applicant': return 'type-applicant';
      case 'backup': return 'type-backup';
      default: return 'type-other';
    }
  };

  const getFileIcon = () => {
    const fileType = record.file_type?.toLowerCase() || '';

    if (fileType.includes('pdf')) {
      return <FileText size={48} style={{ color: '#E53E3E' }} />;
    } else if (fileType.includes('word') || fileType.includes('doc')) {
      return <FileText size={48} style={{ color: '#2B6CB0' }} />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xls')) {
      return <FileText size={48} style={{ color: '#2F855A' }} />;
    } else if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) {
      return <FileText size={48} style={{ color: '#D69E2E' }} />;
    } else {
      return <FileText size={48} style={{ color: '#4A5568' }} />;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Record Details</h1>
        <div style={{ height: '1px', backgroundColor: 'var(--medium-gray)', marginTop: '8px' }}></div>
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
      
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', cursor: 'pointer', marginBottom: '24px' }}
        onClick={goBack}
      >
        <ArrowLeft size={16} />
        <span>Back to Records</span>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)', padding: '24px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))', padding: '16px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <FileText size={20} color="white" />
          <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>Record Information</h3>
        </div>
        
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)' }}>{record.description}</h2>
              <span 
                style={{ 
                  display: 'inline-block', 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  backgroundColor: record.record_type === 'training' ? 'var(--primary-ultralight)' : 
                                  record.record_type === 'applicant' ? '#E3F2FD' : 
                                  record.record_type === 'backup' ? '#E8F5E9' : '#F5F5F5',
                  color: record.record_type === 'training' ? 'var(--primary-color)' : 
                         record.record_type === 'applicant' ? '#1565C0' : 
                         record.record_type === 'backup' ? '#2E7D32' : '#4A5568',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {getRecordTypeLabel(record.record_type)}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              {deleteConfirm ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Confirm deletion?</span>
                  <button 
                    style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', cursor: 'pointer' }}
                    onClick={handleDelete}
                  >
                    Yes
                  </button>
                  <button 
                    style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: 'var(--medium-gray)', color: 'var(--text-primary)', border: 'none', cursor: 'pointer' }}
                    onClick={cancelDelete}
                  >
                    No
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={handleDownload}
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </button>
                  <button 
                    style={{ padding: '8px 12px', borderRadius: '4px', backgroundColor: 'var(--danger-color)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    onClick={handleDelete}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '8px', backgroundColor: 'var(--light-gray)' }}>
              {getFileIcon()}
            </div>
            <div>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>File Path:</span>
                <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{record.file_path}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>File Type:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{record.file_type || 'Unknown'}</span>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>File Size:</span>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)', marginLeft: '8px' }}>{formatFileSize(record.file_size)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Tag size={16} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Category</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{record.category || 'Not categorized'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Calendar size={16} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Date Uploaded</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formatDate(record.created_at)}</div>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <User size={16} color="var(--text-secondary)" />
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Associated User</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {record.userName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600' }}>
                            {record.userName.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600' }}>{record.userName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{record.userRole}</div>
                          </div>
                        </div>
                      ) : (
                        'System Record (No Associated User)'
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', backgroundColor: 'var(--light-gray)', borderRadius: '8px' }}>
            <Info size={16} color="var(--text-secondary)" />
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Records can be downloaded, viewed online (for supported file types), or deleted. 
              Make sure you have appropriate permissions before deleting records.
            </div>
          </div>
          
          {record.file_type && record.file_type.includes('pdf') && (
            <div style={{ marginTop: '24px' }}>
              <a 
                href={`/api/records/view/${record.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-color)', textDecoration: 'none' }}
              >
                <ExternalLink size={16} />
                <span>View PDF in Browser</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordDetails;