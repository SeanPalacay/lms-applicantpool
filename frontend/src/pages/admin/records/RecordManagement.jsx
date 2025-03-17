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
      <div style={{ padding: '24px', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>Records Management</h1>
          <div style={{ height: '2px', backgroundColor: '#e2e8f0', width: '100%' }}></div>
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', color: '#64748b' }} />
              <input
                type="text"
                placeholder="Search records..."
                value={searchTerm}
                onChange={handleSearch}
                style={{
                  padding: '8px 16px 8px 40px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  width: '300px',
                  backgroundColor: 'white',
                  color: '#1e293b'
                }}
              />
              {searchTerm && (
                <button 
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    color: '#64748b' 
                  }}
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <button 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: filterOpen ? '#E3F2FD' : 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: '8px', 
                color: filterOpen ? '#1E88E5' : '#64748b', 
                cursor: 'pointer', 
                transition: 'background-color 0.15s ease, color 0.15s ease' 
              }}
              onClick={toggleFilter}
            >
              <Filter size={18} />
              <span>Filter</span>
            </button>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link 
              to="/admin/records/upload" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '8px 16px', 
                backgroundColor: '#1E88E5', 
                color: 'white', 
                borderRadius: '8px', 
                textDecoration: 'none', 
                fontSize: '14px', 
                fontWeight: '500' 
              }}
            >
              <Plus size={16} />
              Upload Record
            </Link>
            
            {selectedRecords.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px', 
                    backgroundColor: '#e2e8f0', 
                    color: '#1e293b', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    fontSize: '14px', 
                    fontWeight: '500' 
                  }}
                  onClick={toggleBulkActions}
                >
                  <SlidersHorizontal size={16} />
                  <span>Bulk Actions ({selectedRecords.length})</span>
                </button>
                
                {bulkActionOpen && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', 
                    marginTop: '8px', 
                    zIndex: 1000 
                  }}>
                    <button 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        width: '100%', 
                        border: 'none', 
                        backgroundColor: 'transparent', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        color: '#1e293b' 
                      }}
                      onClick={handleBulkDownload}
                    >
                      <Download size={16} />
                      <span>Download Selected</span>
                    </button>
                    <button 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 16px', 
                        width: '100%', 
                        border: 'none', 
                        backgroundColor: 'transparent', 
                        cursor: 'pointer', 
                        fontSize: '14px', 
                        color: '#e53935' 
                      }}
                      onClick={handleBulkDelete}
                    >
                      <Trash2 size={16} />
                      <span>Delete Selected</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {filterOpen && (
          <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Type</label>
                <select 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#1e293b', 
                    backgroundColor: 'white' 
                  }}
                  value={filters.record_type}
                  onChange={handleFilterChange}
                  name="record_type"
                >
                  {recordTypes.map((type, index) => (
                    <option key={index} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Category</label>
                <select 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#1e293b', 
                    backgroundColor: 'white' 
                  }}
                  value={filters.category}
                  onChange={handleFilterChange}
                  name="category"
                >
                  {categories.map((category, index) => (
                    <option key={index} value={category.value}>{category.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>User</label>
                <select 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#1e293b', 
                    backgroundColor: 'white' 
                  }}
                  value={filters.user_id}
                  onChange={handleFilterChange}
                  name="user_id"
                >
                  {users.map((user, index) => (
                    <option key={index} value={user.value}>{user.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Date From</label>
                <input 
                  type="date" 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#1e293b', 
                    backgroundColor: 'white' 
                  }}
                  value={filters.date_from}
                  onChange={handleFilterChange}
                  name="date_from"
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px', display: 'block' }}>Date To</label>
                <input 
                  type="date" 
                  style={{ 
                    width: '100%', 
                    padding: '8px', 
                    border: '1px solid #e2e8f0', 
                    borderRadius: '8px', 
                    fontSize: '14px', 
                    color: '#1e293b', 
                    backgroundColor: 'white' 
                  }}
                  value={filters.date_to}
                  onChange={handleFilterChange}
                  name="date_to"
                />
              </div>
              
              <button 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 16px', 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0', 
                  borderRadius: '8px', 
                  color: '#64748b', 
                  cursor: 'pointer', 
                  transition: 'background-color 0.15s ease, color 0.15s ease' 
                }}
                onClick={resetFilters}
              >
                <X size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        )}
        
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)' }}>
          {filteredRecords.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', width: '40px' }}>
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Description</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      <input 
                        type="checkbox" 
                        onChange={() => handleSelectRecord(record.id)}
                        checked={selectedRecords.includes(record.id)}
                      />
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      <Link 
                        to={`/admin/records/${record.id}`} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          color: '#1E88E5', 
                          textDecoration: 'none' 
                        }}
                      >
                        <FileText size={16} />
                        <span>{record.description || 'No description'}</span>
                      </Link>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        backgroundColor: getRecordTypeClass(record.record_type) === 'type-training' ? '#E3F2FD' : 
                                        getRecordTypeClass(record.record_type) === 'type-applicant' ? '#FFEBEE' : 
                                        getRecordTypeClass(record.record_type) === 'type-backup' ? '#F3E5F5' : '#e2e8f0', 
                        color: getRecordTypeClass(record.record_type) === 'type-training' ? '#1E88E5' : 
                              getRecordTypeClass(record.record_type) === 'type-applicant' ? '#E53935' : 
                              getRecordTypeClass(record.record_type) === 'type-backup' ? '#8E24AA' : '#1e293b'
                      }}>
                        {getRecordTypeLabel(record.record_type)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>{record.category || 'N/A'}</td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      {record.userName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ 
                            width: '24px', 
                            height: '24px', 
                            borderRadius: '50%', 
                            backgroundColor: '#E3F2FD', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            fontWeight: '600', 
                            color: '#1E88E5' 
                          }}>
                            {record.userName.charAt(0)}
                          </div>
                          <span>{record.userName}</span>
                        </div>
                      ) : (
                        'System'
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} />
                        <span>{formatDate(record.created_at)}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: '#1E88E5' 
                          }}
                          onClick={() => handleDownloadRecord(record.id, record.description)}
                          title="Download"
                        >
                          <Download size={16} />
                        </button>
                        <Link 
                          to={`/admin/records/${record.id}`} 
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer', 
                            color: '#1E88E5' 
                          }}
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
            <div style={{ textAlign: 'center', padding: '48px' }}>
              <FolderOpen size={48} style={{ color: '#64748b', marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>No Records Found</h3>
              <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>No records match your search criteria. Try adjusting your filters or upload new records.</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default RecordManagement;