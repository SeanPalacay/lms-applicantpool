// src/pages/admin/records/details/RecordDetails.jsx
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
import '../styles/RecordDetails.css';

const RecordDetails = () => {
const { recordId } = useParams();
const navigate = useNavigate();
const [loading, setLoading] = useState(true); // Fixed: removed extra comma
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
      // Check if token exists
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setLoading(false);
        setTimeout(() => navigate('/login'), 2000);
        return;
      }
      
      // Fetch record data
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
    // Browser will handle the download
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
    
    // Redirect after short delay
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
    return <FileText size={48} className="file-icon pdf" />;
} else if (fileType.includes('word') || fileType.includes('doc')) {
    return <FileText size={48} className="file-icon doc" />;
} else if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('xls')) {
    return <FileText size={48} className="file-icon xls" />;
} else if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) {
    return <FileText size={48} className="file-icon img" />;
} else {
    return <FileText size={48} className="file-icon" />;
}
};

if (loading) {
return <LoadingSpinner />;
}

return (
<div className="record-details-container">
    <div className="section-header">
    <h1>Record Details</h1>
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
    
    <div className="back-link" onClick={goBack}>
    <ArrowLeft size={16} className="icon-inline" />
    <span>Back to Records</span>
    </div>
    
    <div className="record-content">
    <div className="record-card">
        <div className="card-header gradient-indigo">
        <div className="header-icon">
            <FileText size={20} />
        </div>
        <div className="header-content">
            <h3>Record Information</h3>
        </div>
        </div>
        
        <div className="card-content">
        <div className="record-header">
            <div className="record-title-section">
            <h2>{record.description}</h2>
            <span className={`record-type-badge ${getRecordTypeClass(record.record_type)}`}>
                {getRecordTypeLabel(record.record_type)}
            </span>
            </div>
            
            <div className="record-actions">
            {deleteConfirm ? (
                <div className="delete-confirmation">
                <span>Confirm deletion?</span>
                <button className="confirm-yes" onClick={handleDelete}>Yes</button>
                <button className="confirm-no" onClick={cancelDelete}>No</button>
                </div>
            ) : (
                <>
                <button className="action-button primary" onClick={handleDownload}>
                    <Download size={16} className="icon-inline" /> Download
                </button>
                <button className="action-button danger" onClick={handleDelete}>
                    <Trash2 size={16} className="icon-inline" /> Delete
                </button>
                </>
            )}
            </div>
        </div>
        
        <div className="file-preview">
            <div className="file-icon-container">
            {getFileIcon()}
            </div>
            <div className="file-info">
            <div className="file-path">
                <span className="path-label">File Path:</span>
                <span className="path-value">{record.file_path}</span>
            </div>
            
            <div className="file-meta">
                <div className="meta-item">
                <span className="meta-label">File Type:</span>
                <span className="meta-value">{record.file_type || 'Unknown'}</span>
                </div>
                <div className="meta-item">
                <span className="meta-label">File Size:</span>
                <span className="meta-value">{formatFileSize(record.file_size)}</span>
                </div>
            </div>
            </div>
        </div>
        
        <div className="record-details">
            <div className="details-group">
            <div className="detail-item">
                <div className="detail-icon">
                <Tag size={16} />
                </div>
                <div className="detail-content">
                <div className="detail-label">Category</div>
                <div className="detail-value">{record.category || 'Not categorized'}</div>
                </div>
            </div>
            
            <div className="detail-item">
                <div className="detail-icon">
                <Calendar size={16} />
                </div>
                <div className="detail-content">
                <div className="detail-label">Date Uploaded</div>
                <div className="detail-value">{formatDate(record.created_at)}</div>
                </div>
            </div>
            </div>
            
            <div className="details-group">
            <div className="detail-item">
                <div className="detail-icon">
                <User size={16} />
                </div>
                <div className="detail-content">
                <div className="detail-label">Associated User</div>
                <div className="detail-value">
                    {record.userName ? (
                    <div className="user-info">
                        <span className="user-avatar">{record.userName.charAt(0)}</span>
                        <span className="user-name">{record.userName}</span>
                        <span className="user-role">{record.userRole}</span>
                    </div>
                    ) : (
                    'System Record (No Associated User)'
                    )}
                </div>
                </div>
            </div>
            </div>
        </div>
        
        <div className="record-note">
            <div className="note-icon">
            <Info size={16} />
            </div>
            <div className="note-text">
            Records can be downloaded, viewed online (for supported file types), or deleted. 
            Make sure you have appropriate permissions before deleting records.
            </div>
        </div>
        
        {record.file_type && record.file_type.includes('pdf') && (
            <div className="view-online">
            <a 
                href={`/api/records/view/${record.id}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="online-view-link"
            >
                {/* <ExternalLink size={16} className="icon-inline" />
                <span>View PDF in Browser</span> */}
            </a>
            </div>
        )}
        </div>
    </div>
    </div>
</div>
);
};

export default RecordDetails;
