// src/pages/admin/records/RecordManagement.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FolderOpen, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  User, 
  FileText,
  X,
  Plus,
  Trash2,
  SlidersHorizontal
} from 'lucide-react';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import AlertBanner from '../../../components/shared/AlertBanner';
import adminService from '../../../services/adminService';
import './styles/RecordManagement.css';

const RecordManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(location.state?.message || null);
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    record_type: '',
    category: '',
    date_from: '',
    date_to: '',
    user_id: ''
  });
  const [recordTypes, setRecordTypes] = useState([
    { value: '', label: 'All Types' },
    { value: 'training', label: 'Training' },
    { value: 'applicant', label: 'Applicant' },
    { value: 'backup', label: 'Backup' },
    { value: 'other', label: 'Other' }
  ]);
  const [categories, setCategories] = useState([
    { value: '', label: 'All Categories' },
    { value: 'certificates', label: 'Certificates' },
    { value: 'evaluations', label: 'Evaluations' },
    { value: 'guides', label: 'Guides' }
  ]);
  const [users, setUsers] = useState([
    { value: '', label: 'All Users' }
  ]);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);

  useEffect(() => {
    const fetchRecords = async () => {
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
        
        // Fetch records data
        const data = await adminService.getRecords();
        setRecords(data.records);
        setFilteredRecords(data.records);
        
        // Fetch users for filter - Using getUserList instead of getUsers
        const usersData = await adminService.getUserList();
        const userOptions = [
          { value: '', label: 'All Users' },
          ...usersData.map(user => ({
            value: user.id,
            label: user.full_name
          }))
        ];
        setUsers(userOptions);
        
        // Fetch categories for filter
        const categoriesData = await adminService.getRecordCategories();
        if (categoriesData && categoriesData.length > 0) {
          const categoryOptions = [
            { value: '', label: 'All Categories' },
            ...categoriesData.map(category => ({
                value: category.value,
                label: category.label
              }))
            ];
            setCategories(categoryOptions);
          }
        } catch (err) {
          console.error('Error fetching records:', err);
          setError('Failed to load records. Please try again.');
        } finally {
          setLoading(false);
        }
      };
  
      fetchRecords();
      
      // Clear location state after using it
      if (location.state?.message) {
        window.history.replaceState({}, document.title);
      }
    }, [navigate, location.state]);
  
    useEffect(() => {
      // Apply filters and search
      let results = records;
      
      // Apply search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        results = results.filter(record => 
          (record.description && record.description.toLowerCase().includes(term)) ||
          (record.file_path && record.file_path.toLowerCase().includes(term)) ||
          (record.category && record.category.toLowerCase().includes(term)) ||
          (record.userName && record.userName.toLowerCase().includes(term))
        );
      }
      
      // Apply filters
      if (filters.record_type) {
        results = results.filter(record => record.record_type === filters.record_type);
      }
      
      if (filters.category) {
        results = results.filter(record => record.category === filters.category);
      }
      
      if (filters.user_id) {
        results = results.filter(record => record.user_id === parseInt(filters.user_id));
      }
      
      if (filters.date_from) {
        const fromDate = new Date(filters.date_from);
        results = results.filter(record => new Date(record.created_at) >= fromDate);
      }
      
      if (filters.date_to) {
        const toDate = new Date(filters.date_to);
        toDate.setHours(23, 59, 59); // Set to end of day
        results = results.filter(record => new Date(record.created_at) <= toDate);
      }
      
      setFilteredRecords(results);
    }, [records, searchTerm, filters]);
  
    const handleSearch = (e) => {
      setSearchTerm(e.target.value);
    };
  
    const handleFilterChange = (e) => {
      const { name, value } = e.target;
      setFilters({
        ...filters,
        [name]: value
      });
    };
  
    const toggleFilter = () => {
      setFilterOpen(!filterOpen);
    };
  
    const resetFilters = () => {
      setFilters({
        record_type: '',
        category: '',
        date_from: '',
        date_to: '',
        user_id: ''
      });
      setSearchTerm('');
    };
  
    const handleDownloadRecord = async (recordId, recordName) => {
      try {
        await adminService.downloadRecord(recordId);
        // Browser will handle the download
      } catch (err) {
        console.error('Error downloading record:', err);
        setError('Failed to download record. Please try again.');
      }
    };
  
    const handleSelectRecord = (recordId) => {
      if (selectedRecords.includes(recordId)) {
        setSelectedRecords(selectedRecords.filter(id => id !== recordId));
      } else {
        setSelectedRecords([...selectedRecords, recordId]);
      }
    };
  
    const handleSelectAll = (e) => {
      if (e.target.checked) {
        setSelectedRecords(filteredRecords.map(record => record.id));
      } else {
        setSelectedRecords([]);
      }
    };
  
    const toggleBulkActions = () => {
      setBulkActionOpen(!bulkActionOpen);
    };
  
    const handleBulkDownload = async () => {
      if (selectedRecords.length === 0) return;
      
      try {
        await adminService.downloadMultipleRecords(selectedRecords);
        // Browser will handle the download
      } catch (err) {
        console.error('Error downloading records:', err);
        setError('Failed to download selected records. Please try again.');
      }
    };
  
    const handleBulkDelete = async () => {
      if (selectedRecords.length === 0) return;
      
      if (!window.confirm(`Are you sure you want to delete ${selectedRecords.length} selected records?`)) {
        return;
      }
      
      try {
        await adminService.deleteMultipleRecords(selectedRecords);
        // Remove deleted records from state
        const updatedRecords = records.filter(record => !selectedRecords.includes(record.id));
        setRecords(updatedRecords);
        setFilteredRecords(updatedRecords);
        setSelectedRecords([]);
        setSuccess(`Successfully deleted ${selectedRecords.length} records.`);
      } catch (err) {
        console.error('Error deleting records:', err);
        setError('Failed to delete selected records. Please try again.');
      }
    };
  
    const formatDate = (dateString) => {
      if (!dateString) return 'N/A';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };
  
    const getRecordTypeLabel = (type) => {
      const recordType = recordTypes.find(t => t.value === type);
      return recordType ? recordType.label : type;
    };
  
    const getRecordTypeClass = (type) => {
      switch(type) {
        case 'training': return 'type-training';
        case 'applicant': return 'type-applicant';
        case 'backup': return 'type-backup';
        default: return 'type-other';
      }
    };
  
    if (loading) {
      return <LoadingSpinner />;
    }
  
    return (
      <div className="record-management-container">
        <div className="section-header">
          <h1>Records Management</h1>
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
        
        <div className="records-actions">
          <div className="search-container">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
              {searchTerm && (
                <button 
                  className="clear-search" 
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <button 
              className={`filter-toggle ${filterOpen ? 'active' : ''}`} 
              onClick={toggleFilter}
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
          
          <div className="button-container">
            <Link to="/admin/records/upload" className="action-button primary">
              <Plus size={16} className="icon-inline" /> Upload Record
            </Link>
            
            {selectedRecords.length > 0 && (
              <div className="bulk-actions">
                <button 
                  className="action-button secondary"
                  onClick={toggleBulkActions}
                >
                  <SlidersHorizontal size={16} className="icon-inline" />
                  <span>Bulk Actions ({selectedRecords.length})</span>
                </button>
                
                {bulkActionOpen && (
                  <div className="bulk-actions-menu">
                    <button onClick={handleBulkDownload}>
                      <Download size={16} className="icon-inline" />
                      <span>Download Selected</span>
                    </button>
                    <button onClick={handleBulkDelete} className="delete-action">
                      <Trash2 size={16} className="icon-inline" />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {filterOpen && (
          <div className="filter-panel">
            <div className="filter-form">
              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="record_type">Type</label>
                  <select 
                    id="record_type" 
                    name="record_type" 
                    value={filters.record_type}
                    onChange={handleFilterChange}
                  >
                    {recordTypes.map((type, index) => (
                      <option key={index} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="category">Category</label>
                  <select 
                    id="category" 
                    name="category" 
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    {categories.map((category, index) => (
                      <option key={index} value={category.value}>{category.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="user_id">User</label>
                  <select 
                    id="user_id" 
                    name="user_id" 
                    value={filters.user_id}
                    onChange={handleFilterChange}
                  >
                    {users.map((user, index) => (
                      <option key={index} value={user.value}>{user.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="filter-row">
                <div className="filter-group">
                  <label htmlFor="date_from">Date From</label>
                  <input 
                    type="date" 
                    id="date_from" 
                    name="date_from" 
                    value={filters.date_from}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="filter-group">
                  <label htmlFor="date_to">Date To</label>
                  <input 
                    type="date" 
                    id="date_to" 
                    name="date_to" 
                    value={filters.date_to}
                    onChange={handleFilterChange}
                  />
                </div>
                
                <div className="filter-actions">
                  <button className="reset-filters" onClick={resetFilters}>
                    <X size={14} className="icon-inline" />
                    <span>Reset Filters</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="records-table-container">
          {filteredRecords.length > 0 ? (
            <table className="records-table">
              <thead>
                <tr>
                  <th className="checkbox-column">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                    />
                  </th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>User</th>
                  <th>Date</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="checkbox-column">
                      <input 
                        type="checkbox" 
                        onChange={() => handleSelectRecord(record.id)}
                        checked={selectedRecords.includes(record.id)}
                      />
                    </td>
                    <td>
                      <Link to={`/admin/records/${record.id}`} className="record-description">
                        <FileText size={16} className="icon-inline" />
                        <span>{record.description || 'No description'}</span>
                      </Link>
                    </td>
                    <td>
                      <span className={`record-type-badge ${getRecordTypeClass(record.record_type)}`}>
                        {getRecordTypeLabel(record.record_type)}
                      </span>
                    </td>
                    <td>{record.category || 'N/A'}</td>
                    <td>
                      {record.userName ? (
                        <div className="user-info">
                          <span className="user-avatar">{record.userName.charAt(0)}</span>
                          <span>{record.userName}</span>
                        </div>
                      ) : (
                        'System'
                      )}
                    </td>
                    <td>
                      <div className="date-info">
                        <Calendar size={14} className="icon-inline" />
                        <span>{formatDate(record.created_at)}</span>
                      </div>
                    </td>
                    <td className="actions-column">
                      <div className="record-actions">
                        <button 
                          className="action-icon" 
                          onClick={() => handleDownloadRecord(record.id, record.description)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <Link 
                          to={`/admin/records/${record.id}`} 
                          className="action-icon"
                          title="View details"
                        >
                          <FileText size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="no-records">
              <FolderOpen size={48} className="no-records-icon" />
              <h3>No Records Found</h3>
              <p>No records match your search criteria. Try adjusting your filters or upload new records.</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default RecordManagement;