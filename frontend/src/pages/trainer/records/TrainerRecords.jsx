import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, Plus, Search, Filter, ChevronDown, ChevronUp, 
  Download, Calendar, Tag, FileIcon, User, Trash2,
  AlertTriangle, Eye
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';

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

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryFilterChange = (e) => {
    setFilterCategory(e.target.value);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getFileIcon = (filePath) => {
    if (!filePath) return <FileIcon size={20} />;
    
    const extension = filePath.split('.').pop().toLowerCase();
    
    switch(extension) {
      case 'pdf':
        return <FileText size={20} style={{ color: 'var(--danger-color)' }} />;
      case 'doc':
      case 'docx':
        return <FileText size={20} style={{ color: 'var(--primary-color)' }} />;
      case 'xls':
      case 'xlsx':
        return <FileText size={20} style={{ color: 'var(--success-color)' }} />;
      case 'ppt':
      case 'pptx':
        return <FileText size={20} style={{ color: 'var(--warning-color)' }} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <FileIcon size={20} style={{ color: 'var(--secondary-color)' }} />;
      default:
        return <FileText size={20} />;
    }
  };

  const toggleRecordSelection = (recordId) => {
    if (selectedRecords.includes(recordId)) {
      setSelectedRecords(selectedRecords.filter(id => id !== recordId));
    } else {
      setSelectedRecords([...selectedRecords, recordId]);
    }
  };

  const selectAllVisible = () => {
    const visibleRecords = getFilteredRecords().map(record => record.id);
    setSelectedRecords(visibleRecords);
  };

  const clearAllSelections = () => {
    setSelectedRecords([]);
  };

  useEffect(() => {
    setBulkActionVisible(selectedRecords.length > 0);
  }, [selectedRecords]);

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
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
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

  const getFilteredRecords = () => {
    return records.filter(record => {
      const searchMatch = record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.file_path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const categoryMatch = filterCategory === 'all' || record.category === filterCategory;
      
      return searchMatch && categoryMatch;
    }).sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'description') {
        comparison = (a.description || '').localeCompare(b.description || '');
      } else if (sortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (sortField === 'created_at') {
        comparison = new Date(a.created_at) - new Date(b.created_at);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={{ padding: 'var(--spacing-xl)', backgroundColor: 'var(--light-gray)', minHeight: '100vh' }}>
      {error && <AlertBanner message={error} type="error" />}
      
      {confirmDelete && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: 'rgba(0, 0, 0, 0.5)', 
          zIndex: 1000 
        }}>
          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: 'var(--radius-md)', 
            padding: 'var(--spacing-md)', 
            boxShadow: 'var(--shadow-lg)', 
            width: '400px', 
            textAlign: 'center' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
              <AlertTriangle size={24} color="var(--warning-color)" />
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
                Confirm Deletion
              </h3>
            </div>
            <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete {selectedRecords.length} selected record(s)?
            </p>
            <p style={{ marginBottom: 'var(--spacing-md)', color: 'var(--danger-color)', fontWeight: '500' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
              <button 
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer', 
                  opacity: deleting ? 0.7 : 1 
                }}
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button 
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: 'none', 
                  backgroundColor: 'var(--danger-color)', 
                  color: 'white', 
                  cursor: 'pointer', 
                  opacity: deleting ? 0.7 : 1 
                }}
                onClick={handleDeleteRecords}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Records'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: 'var(--spacing-md)' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <FileText size={24} color="var(--primary-color)" />
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>
            Training Records
          </h2>
        </div>
        <Link 
          to="/trainer/records/upload" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm) var(--spacing-md)', 
            borderRadius: 'var(--radius-sm)', 
            backgroundColor: 'var(--primary-color)', 
            color: 'white', 
            textDecoration: 'none', 
            fontSize: '14px' 
          }}
        >
          <Plus size={18} />
          <span>Upload Record</span>
        </Link>
      </div>
      
      <div style={{ 
        display: 'flex', 
        gap: 'var(--spacing-md)', 
        marginBottom: 'var(--spacing-md)' 
      }}>
        <div style={{ 
          flex: 1, 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-sm)', 
          border: '1px solid var(--medium-gray)' 
        }}>
          <Search size={18} style={{ position: 'absolute', left: 'var(--spacing-sm)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search records..." 
            value={searchQuery}
            onChange={handleSearchChange}
            style={{ 
              flex: 1, 
              padding: 'var(--spacing-sm) var(--spacing-sm) var(--spacing-sm) calc(var(--spacing-md) + 24px)', 
              border: 'none', 
              outline: 'none', 
              backgroundColor: 'transparent' 
            }}
          />
        </div>
        <button 
          onClick={toggleFilters} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 'var(--spacing-xs)', 
            padding: 'var(--spacing-sm) var(--spacing-md)', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--medium-gray)', 
            backgroundColor: 'white', 
            color: 'var(--text-primary)', 
            cursor: 'pointer' 
          }}
        >
          <Filter size={18} />
          <span>Filters</span>
          {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      
      {showFilters && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)', 
          marginBottom: 'var(--spacing-md)', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
            <label htmlFor="category-filter" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              Category:
            </label>
            <select 
              id="category-filter" 
              value={filterCategory}
              onChange={handleCategoryFilterChange}
              style={{ 
                flex: 1, 
                padding: 'var(--spacing-sm)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--medium-gray)', 
                outline: 'none', 
                backgroundColor: 'white' 
              }}
            >
              <option value="all">All Categories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      
      {bulkActionVisible && (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-md)', 
          marginBottom: 'var(--spacing-md)', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
              {selectedRecords.length} records selected
            </span>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button 
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: '1px solid var(--medium-gray)', 
                  backgroundColor: 'white', 
                  color: 'var(--text-primary)', 
                  cursor: 'pointer' 
                }}
                onClick={clearAllSelections}
              >
                Clear Selection
              </button>
              <button 
                style={{ 
                  padding: 'var(--spacing-sm) var(--spacing-md)', 
                  borderRadius: 'var(--radius-sm)', 
                  border: 'none', 
                  backgroundColor: 'var(--danger-color)', 
                  color: 'white', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 'var(--spacing-xs)' 
                }}
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={16} />
                <span>Delete Selected</span>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {getFilteredRecords().length > 0 ? (
        <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 100px', 
            gap: 'var(--spacing-md)', 
            padding: 'var(--spacing-sm)', 
            borderBottom: '1px solid var(--medium-gray)', 
            fontWeight: '600', 
            color: 'var(--text-primary)' 
          }}>
            <div>
              <input 
                type="checkbox" 
                checked={selectedRecords.length === getFilteredRecords().length && getFilteredRecords().length > 0}
                onChange={() => selectedRecords.length === getFilteredRecords().length ? clearAllSelections() : selectAllVisible()}
              />
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              onClick={() => handleSort('description')}
            >
              <span>Description</span>
              {sortField === 'description' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              onClick={() => handleSort('category')}
            >
              <span>Category</span>
              {sortField === 'category' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div 
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
              onClick={() => handleSort('created_at')}
            >
              <span>Date Added</span>
              {sortField === 'created_at' && (
                sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
              )}
            </div>
            <div>File</div>
            <div>Actions</div>
          </div>
          
          {getFilteredRecords().map(record => (
            <div 
              key={record.id} 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 100px', 
                gap: 'var(--spacing-md)', 
                padding: 'var(--spacing-sm)', 
                borderBottom: '1px solid var(--medium-gray)', 
                alignItems: 'center' 
              }}
            >
              <div>
                <input 
                  type="checkbox" 
                  checked={selectedRecords.includes(record.id)}
                  onChange={() => toggleRecordSelection(record.id)}
                />
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                {record.description || 'No description'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <Tag size={14} color="var(--text-secondary)" />
                <span>{record.category || 'Uncategorized'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                <Calendar size={16} color="var(--text-secondary)" />
                <span>{formatDate(record.created_at)}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                {getFileIcon(record.file_path)}
                <span style={{ color: 'var(--text-secondary)' }}>
                  {record.file_path ? record.file_path.split('/').pop() : 'No file'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <button 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--primary-color)' 
                  }}
                  onClick={() => handleDownloadRecord(record.id)}
                >
                  <Download size={16} />
                </button>
                <Link 
                  to={`/trainer/records/${record.id}`} 
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: 'var(--primary-color)' 
                  }}
                >
                  <Eye size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-md)', 
          padding: 'var(--spacing-xl)', 
          textAlign: 'center', 
          boxShadow: 'var(--shadow-sm)' 
        }}>
          <FileText size={48} color="var(--text-muted)" />
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', marginTop: 'var(--spacing-md)' }}>
            No records found
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)' }}>
            {searchQuery || filterCategory !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by uploading your first record'}
          </p>
          <Link 
            to="/trainer/records/upload" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 'var(--spacing-xs)', 
              padding: 'var(--spacing-sm) var(--spacing-md)', 
              borderRadius: 'var(--radius-sm)', 
              backgroundColor: 'var(--primary-color)', 
              color: 'white', 
              textDecoration: 'none', 
              fontSize: '14px' 
            }}
          >
            <Plus size={18} />
            <span>Upload Record</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default TrainerRecords;