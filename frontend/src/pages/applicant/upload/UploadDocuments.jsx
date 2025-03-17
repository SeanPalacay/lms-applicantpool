import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Upload, FileText, Trash2, Check, AlertTriangle, 
  RefreshCw, Eye, Download, ArrowLeft, File, X, Loader
} from 'lucide-react';
import applicantService from '../../../services/applicantService';

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
  
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
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
  
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };
  
  const handleFile = (file) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PDF or Word document.');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB.');
      return;
    }
    
    setSelectedFile(file);
    setFileDescription(file.name);
  };
  
  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFileDescription('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDescriptionChange = (e) => {
    setFileDescription(e.target.value);
  };
  
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
      
      const response = await applicantService.uploadDocument(formData, (percentCompleted) => {
        setUploadProgress(percentCompleted);
      });
      
      setDocuments([...documents, response]);
      clearSelectedFile();
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 5000);
      setUploading(false);
    } catch (err) {
      console.error('Error uploading document:', err);
      alert('Failed to upload document. Please try again.');
      setUploading(false);
    }
  };
  
  const deleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await applicantService.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document. Please try again.');
    }
  };
  
  const viewDocument = async (documentId) => {
    try {
      await applicantService.viewDocument(documentId);
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('Failed to view document. Please try again.');
    }
  };
  
  const downloadDocument = async (documentId, filename) => {
    try {
      await applicantService.downloadDocument(documentId);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
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
  
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Loader size={32} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>Loading documents...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--danger-color)', marginBottom: '16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Error</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{error}</p>
        <button 
          onClick={handleRetry} 
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <RefreshCw size={16} />
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '32px', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={24} /> Upload Documents
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Upload supporting documents for your applications</p>
        </div>
        
        <Link 
          to="/applicant/applications" 
          style={{ 
            padding: '8px 16px', 
            borderRadius: '4px', 
            backgroundColor: 'var(--medium-gray)', 
            color: 'var(--text-primary)', 
            textDecoration: 'none', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}
        >
          <ArrowLeft size={16} />
          Back to Applications
        </Link>
      </div>
      
      {uploadSuccess && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          padding: '12px', 
          backgroundColor: 'var(--success-color)', 
          color: 'white', 
          borderRadius: '4px', 
          marginBottom: '24px' 
        }}>
          <Check size={18} />
          <span>Document uploaded successfully!</span>
        </div>
      )}
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', marginBottom: '32px' }}>
        <div 
          style={{ 
            border: `2px dashed ${dragActive ? 'var(--primary-color)' : 'var(--medium-gray)'}`, 
            borderRadius: '8px', 
            padding: '24px', 
            backgroundColor: dragActive ? 'var(--primary-ultralight)' : 'white', 
            transition: 'all 0.3s ease' 
          }}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          {!selectedFile ? (
            <div style={{ textAlign: 'center' }}>
              <Upload size={48} style={{ color: dragActive ? 'var(--primary-color)' : 'var(--text-secondary)', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>Drag & Drop your file here</h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>or</p>
              <label 
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  cursor: 'pointer', 
                  display: 'inline-block' 
                }}
              >
                Browse Files
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept=".pdf,.doc,.docx" 
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </label>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '16px' }}>
                Acceptable file types: PDF, DOC, DOCX<br />
                Maximum file size: 5MB
              </p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                {getFileIcon(selectedFile.name)}
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: 'var(--text-primary)' }}>{selectedFile.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatFileSize(selectedFile.size)}</div>
                </div>
                <button 
                  onClick={clearSelectedFile}
                  style={{ 
                    marginLeft: 'auto', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--text-secondary)' 
                  }}
                >
                  <X size={16} />
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="description" style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Description</label>
                <input 
                  type="text" 
                  id="description" 
                  value={fileDescription}
                  onChange={handleDescriptionChange}
                  placeholder="Enter a description for this document"
                  style={{ 
                    width: '100%', 
                    padding: '8px 16px', 
                    borderRadius: '4px', 
                    border: '1px solid var(--medium-gray)', 
                    backgroundColor: 'white', 
                    fontSize: '14px', 
                    color: 'var(--text-primary)' 
                  }}
                  required
                />
              </div>
              
              <button 
                onClick={uploadDocument}
                disabled={uploading}
                style={{ 
                  width: '100%', 
                  padding: '12px 16px', 
                  borderRadius: '4px', 
                  backgroundColor: 'var(--primary-color)', 
                  color: 'white', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px' 
                }}
              >
                {uploading ? (
                  <>
                    <Loader size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
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
        
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Tips for Document Uploads</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Ensure all documents are clear and legible.</li>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Use descriptive names for your documents.</li>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Upload your most recent and relevant documents.</li>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Make sure any scanned documents are properly aligned.</li>
            <li style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>For resumes, use a professional format and ensure all information is up-to-date.</li>
          </ul>
        </div>
      </div>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '24px' }}>My Documents</h2>
        
        {documents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <FileText size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>No documents found</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>You haven't uploaded any documents yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {documents.map(document => (
              <div key={document.id} style={{ border: '1px solid var(--medium-gray)', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  {getFileIcon(document.file_path)}
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{document.description}</h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Uploaded: {formatDate(document.created_at)}</div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => viewDocument(document.id)}
                    style={{ 
                      padding: '8px', 
                      borderRadius: '4px', 
                      backgroundColor: 'var(--light-gray)', 
                      border: 'none', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <Eye size={16} color="var(--text-secondary)" />
                  </button>
                  
                  <button 
                    onClick={() => downloadDocument(document.id, document.description)}
                    style={{ 
                      padding: '8px', 
                      borderRadius: '4px', 
                      backgroundColor: 'var(--light-gray)', 
                      border: 'none', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <Download size={16} color="var(--text-secondary)" />
                  </button>
                  
                  <button 
                    onClick={() => deleteDocument(document.id)}
                    style={{ 
                      padding: '8px', 
                      borderRadius: '4px', 
                      backgroundColor: 'var(--light-gray)', 
                      border: 'none', 
                      cursor: 'pointer', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}
                  >
                    <Trash2 size={16} color="var(--danger-color)" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div style={{ marginTop: '32px', padding: '24px', backgroundColor: 'white', borderRadius: '8px', boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '16px' }}>Need Help?</h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          If you're having trouble uploading documents or have questions about required documentation, please contact our support team at <a href="mailto:support@example.com" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>support@example.com</a>.
        </p>
      </div>
    </div>
  );
};

export default UploadDocuments;