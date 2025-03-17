import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Plus, Search, Filter, ChevronDown, ChevronUp, 
  Download, Calendar, Tag, FileIcon, User, Trash2,
  AlertTriangle, Eye
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import './styles/TrainerRecords.css';

/**
 * TrainerRecords Component
 * Manages training records and documentation
 */
const TrainerRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [categories, setCategories] = useState([]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [bulkActionVisible, setBulkActionVisible] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

  // Fetch records on component mount
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      setError('');
      
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('You are not logged in. Please log in to access this page.');
          setLoading(false);
          return;
        }

        // Fetch records
        const recordsResponse = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/records.php`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!recordsResponse.ok) {
          if (recordsResponse.status === 401) {
            localStorage.removeItem('authToken');
            throw new Error('Authentication failed. Please login again.');
          }
          const errorText = await recordsResponse.text();
          throw new Error(`HTTP error: ${recordsResponse.status} - ${errorText}`);
        }

        const recordsData = await recordsResponse.json();
        setRecords(recordsData);
        
        // Extract unique categories
        const uniqueCategories = [...new Set(recordsData.map(record => record.category))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Error fetching records:', err);
        setError('Failed to load records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [API_BASE_URL]);

  // Handle search query change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e) => {
    setFilterCategory(e.target.value);
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get file type icon
  const getFileIcon = (filePath) => {
    if (!filePath) return <FileIcon size={20} />;
    
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText size={20} className="file-pdf" />;
      case 'doc':
      case 'docx':
        return <FileText size={20} className="file-word" />;
      case 'xls':
      case 'xlsx':
        return <FileText size={20} className="file-excel" />;
      case 'ppt':
      case 'pptx':
        return <FileText size={20} className="file-powerpoint" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileIcon size={20} className="file-image" />;
      default:
        return <FileText size={20} />;
    }
  };

  // Toggle record selection
  const toggleRecordSelection = (recordId) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId));
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
    }
  };

  // Select all visible records
  const selectAllVisible = () => {
    const visibleRecords = getFilteredRecords().map(record => record.id);
    setSelectedRecords(visibleRecords);
  };

  // Clear all record selections
  const clearAllSelections = () => {
    setSelectedRecords([]);
  };

  // Show bulk action panel
  useEffect(() => {
    setBulkActionVisible(selectedRecords.length > 0);
  }, [selectedRecords]);

  // Handle record deletion
  const handleDeleteRecords = async () => {
    if (selectedRecords.length === 0) return;
    
    setDeleting(true);
    
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        setDeleting(false);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/delete_records.php`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          record_ids: selectedRecords
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      // Update records list
      setRecords(records.filter(record => !selectedRecords.includes(record.id)));
      setSelectedRecords([]);
      setConfirmDelete(false);
    } catch (err) {
      console.error('Error deleting records:', err);
      setError('Failed to delete records. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Download record
  const handleDownloadRecord = async (recordId) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('You are not logged in. Please log in to access this page.');
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/lms-forbes/backend/api/trainer/download_record.php?recordId=${recordId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication failed. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`HTTP error: ${response.status} - ${errorText}`);
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from Content-Disposition header or use fallback
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'download';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading record:', err);
      setError('Failed to download record. Please try again.');
    }
  };

  // Filter and sort records
  const getFilteredRecords = () => {
    return records.filter(record => {
      // Search filter
      const searchMatch = record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.file_path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const categoryMatch = filterCategory === 'all' || record.category === filterCategory;
      
      return searchMatch && categoryMatch;
    }).sort((a, b) => {
      // Sorting logic
      let comparison = 0;
      
      if (sortField === 'description') {
        comparison = (a.description || '').localeCompare(b.description || '');
      } else if (sortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="trainer-records-container">
      {error && <AlertBanner message={error} type="error" />}
      
      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="confirm-delete-modal">
          <div className="modal-content">
            <div className="modal-header">
              <AlertTriangle size={24} className="warning-icon" />
              <h3>Confirm Deletion</h3>
            </div>
            <p>Are you sure you want to delete {selectedRecords.length} selected record(s)?</p>
            <p className="delete-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteRecords}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Records'}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => !deleting && setConfirmDelete(false)}></div>
        </div>
      )}
      
      {/* Header with action buttons */}
      <div className="records-header">
        <div className="header-title">
          <FileText size={24} className="header-icon" />
          <h2>Training Records</h2>
        </div>
        <div className="header-actions">
          <Link to="/trainer/records/upload" className="btn-create">
            <Plus size={18} />
            <span>Upload Record</span>
          </Link>
        </div>
      </div>
      
      {/* Search and filter bar */}
      <div className="search-filter-bar">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search records..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        
        <button onClick={toggleFilters} className="btn-toggle-filters">
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label htmlFor="category-filter">Category:</label>
            <select 
              id="category-filter" 
              value={filterCategory}
              onChange={handleCategoryFilterChange}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {/* Bulk actions panel */}
      {bulkActionVisible && (
        <div className="bulk-actions-panel">
          <div className="selection-info">
            <span>{selectedRecords.length} records selected</span>
            <div className="selection-actions">
              <button className="btn-clear-selection" onClick={clearAllSelections}>
                Clear Selection
              </button>
              <button className="btn-delete-selected" onClick={() => setConfirmDelete(true)}>
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Records List */}
      {getFilteredRecords().length > 0 ? (
        <div className="records-list">
          {/* Table header */}
          <div className="records-table-header">
            <div className="checkbox-col">
              <input 
                type="checkbox" 
                checked={selectedRecords.length === getFilteredRecords().length && getFilteredRecords().length > 0}
                onChange={() => selectedRecords.length === getFilteredRecords().length ? clearAllSelections() : selectAllVisible()}
              />
            </div>
            <div 
              className={`record-header description-col ${sortField === 'description' ? 'sorted' : ''}`}
              onClick={() => handleSort('description')}
            >
              <span>Description</span>
              {sortField === 'description' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`record-header category-col ${sortField === 'category' ? 'sorted' : ''}`}
              onClick={() => handleSort('category')}
            >
              <span>Category</span>
              {sortField === 'category' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              className={`record-header date-col ${sortField === 'created_at' ? 'sorted' : ''}`}
              onClick={() => handleSort('created_at')}
            >
              <span>Date Added</span>
              {sortField === 'created_at' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div className="record-header file-col">
              <span>File</span>
            </div>
            <div className="record-header actions-col">
              <span>Actions</span>
            </div>
          </div>
          
          {/* Table rows */}
          {getFilteredRecords().map(record => (
            <div key={record.id} className="record-item">
              <div className="checkbox-col">
                <input 
                  type="checkbox" 
                  checked={selectedRecords.includes(record.id)}
                  onChange={() => toggleRecordSelection(record.id)}
                />
              </div>
              <div className="record-col description-col">
                <span className="record-description">{record.description || 'No description'}</span>
              </div>
              <div className="record-col category-col">
                <div className="category-badge">
                  <Tag size={14} />
                  <span>{record.category || 'Uncategorized'}</span>
                </div>
              </div>
              <div className="record-col date-col">
                <Calendar size={16} className="col-icon" />
                <span>{formatDate(record.created_at)}</span>
              </div>
              <div className="record-col file-col">
                <div className="file-info">
                  {getFileIcon(record.file_path)}
                  <span className="file-name">
                    {record.file_path ? record.file_path.split('/').pop() : 'No file'}
                  </span>
                </div>
              </div>
              <div className="record-col actions-col">
                <div className="record-actions">
                  <button 
                    className="btn-view"
                    onClick={() => handleDownloadRecord(record.id)}
                  >
                    <Download size={16} />
                  </button>
                  <Link 
                    to={`/trainer/records/${record.id}`} 
                    className="btn-details"
                  >
                    <Eye size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-records-message">
          <FileText size={48} />
          <h3>No records found</h3>
          <p>
            {searchQuery || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by uploading your first record'}
          </p>
          <Link to="/trainer/records/upload" className="btn-create-large">
            <Plus size={18} />
            Upload Record
          </Link>
        </div>
      )}
    </div>
  );
};

export default TrainerRecords;