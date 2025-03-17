import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Trash2, Check, AlertTriangle, 
  RefreshCw, Eye, Download, ArrowLeft, File, X, Loader
} from 'lucide-react';
import applicantService from '../../../services/applicantService'; // Import the service
import './styles/UploadDocuments.css';

const UploadDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const fileInputRef = useRef(null);
  
  // Fetch existing documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        
        // Use applicantService instead of axios
        const data = await applicantService.getUserDocuments();
        
        setDocuments(data || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents. Please try again later.');
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);
  
  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  // Process selected file
  const handleFile = (file) => {
    // Validate file type (PDF, DOC, DOCX)
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document.');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.');
      return;
    }
    
    setSelectedFile(file);
    setFileDescription(file.name);
  };
  
  // Clear selected file
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Handle description change
  const handleDescriptionChange = (e) => {
    setFileDescription(e.target.value);
  };
  
  // Upload document
  const uploadDocument = async () => {
    if (!selectedFile || !fileDescription.trim()) {
      alert('Please select a file and provide a description.');
      return;
    }
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('record_type', 'applicant');
      formData.append('category', 'evaluations');
      formData.append('description', fileDescription);
      
      // Use the service for upload
      const response = await applicantService.uploadDocument(formData, (percentCompleted) => {
        setUploadProgress(percentCompleted);
      });
      
      // Add the new document to the list
      setDocuments([...documents, response]);
      
      // Clear selected file
      clearSelectedFile();
      
      // Show success message
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
      
      setUploading(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document. Please try again.');
      setUploading(false);
    }
  };
  
  // Delete document
  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      // Use the service to delete
      await applicantService.deleteDocument(documentId);
      
      // Remove document from list
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. Please try again.');
    }
  };
  
  // View document
  const viewDocument = async (documentId) => {
    try {
      // Use the service to view
      await applicantService.viewDocument(documentId);
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('Failed to view document. Please try again.');
    }
  };
  
  // Download document
  const downloadDocument = async (documentId, filename) => {
    try {
      // Use the service to download
      await applicantService.downloadDocument(documentId);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  // Get file extension icon
  const getFileIcon = (filename) => {
    if (!filename) return <File size={24} />;
    
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText size={24} />;
      case 'doc':
      case 'docx':
        return <FileText size={24} />;
      default:
        return <File size={24} />;
    }
  };
  
  // Handle retry
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    // Re-fetch data on next render cycle
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  if (loading) {
    return (
      <div className="documents-loading">
        <div className="spinner"></div>
        <p>Loading documents...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="documents-error">
        <AlertTriangle size={48} className="error-icon" />
        <h2>Error</h2>
        <p>{error}</p>
        <button 
          onClick={handleRetry} 
          className="btn-primary retry-btn"
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="upload-documents-container">
      <div className="documents-header">
        <div className="header-title">
          <h1><Upload size={24} /> Upload Documents</h1>
          <p>Upload supporting documents for your applications</p>
        </div>
        
        <Link to="/applicant/applications" className="btn-secondary back-link">
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
      </div>
      
      {uploadSuccess && (
        <div className="success-message">
          <Check size={18} />
          <span>Document uploaded successfully!</span>
        </div>
      )}
      
      <div className="upload-section">
        <div 
          className={`dropzone ${dragActive ? 'active' : ''} ${selectedFile ? 'has-file' : ''}`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <div className="dropzone-content">
              <Upload size={48} className="upload-icon" />
              <h3>Drag & Drop your file here</h3>
              <p>or</p>
              <label className="btn-primary browse-btn">
                Browse Files
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
              <p className="file-requirements">
                Acceptable file types: PDF, DOC, DOCX<br />
                Maximum file size: 5MB
              </p>
            </div>
          ) : (
            <div className="selected-file">
              <div className="file-preview">
                {getFileIcon(selectedFile.name)}
                <div className="file-info">
                  <div className="file-name">{selectedFile.name}</div>
                  <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                </div>
                <button 
                  className="btn-icon remove-file" 
                  onClick={clearSelectedFile}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="file-description">
                <label htmlFor="description">Description</label>
                <input 
                  type="text" 
                  id="description" 
                  value={fileDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Enter a description for this document"
                  required
                />
              </div>
              
              <button 
                className="btn-primary upload-btn"
                onClick={uploadDocument}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader size={16} className="spinner-icon" />
                    Uploading... ({uploadProgress}%)
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Upload Document
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        <div className="upload-tips">
          <h3>Tips for Document Uploads</h3>
          <ul>
            <li>Ensure all documents are clear and legible.</li>
            <li>Use descriptive names for your documents.</li>
            <li>Upload your most recent and relevant documents.</li>
            <li>Make sure any scanned documents are properly aligned.</li>
            <li>For resumes, use a professional format and ensure all information is up-to-date.</li>
          </ul>
        </div>
      </div>
      
      <div className="documents-section">
        <h2>My Documents</h2>
        
        {documents.length === 0 ? (
          <div className="no-documents">
            <FileText size={48} className="no-data-icon" />
            <h3>No documents found</h3>
            <p>You haven't uploaded any documents yet.</p>
          </div>
        ) : (
          <div className="documents-list">
            {documents.map(document => (
              <div key={document.id} className="document-card">
                <div className="document-icon">
                  {getFileIcon(document.file_path)}
                </div>
                
                <div className="document-details">
                  <h3 className="document-name">{document.description}</h3>
                  <div className="document-meta">
                    <span className="document-date">Uploaded: {formatDate(document.created_at)}</span>
                  </div>
                </div>
                
                <div className="document-actions">
                  <button 
                    className="btn-icon view-btn"
                    onClick={() => viewDocument(document.id)}
                    title="View Document"
                  >
                    <Eye size={16} />
                  </button>
                  
                  <button 
                    className="btn-icon download-btn"
                    onClick={() => downloadDocument(document.id, document.description)}
                    title="Download Document"
                  >
                    <Download size={16} />
                  </button>
                  
                  <button 
                    className="btn-icon delete-btn"
                    onClick={() => deleteDocument(document.id)}
                    title="Delete Document"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="documents-help">
        <h3>Need Help?</h3>
        <p>If you're having trouble uploading documents or have questions about required documentation, please contact our support team at <a href="mailto:support@example.com">support@example.com</a>.</p>
      </div>
    </div>
  );
};

export default UploadDocuments;