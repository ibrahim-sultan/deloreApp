import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { formatDate } from '../../utils/datetime';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('DocumentManagement Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-error">
          <h3>Something went wrong with the document management.</h3>
          <p>Error: {this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const DocumentManagement = ({ documentsByStaff = [], onUpdate }) => {
  const [allDocuments, setAllDocuments] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [newTemplate, setNewTemplate] = useState({ title: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [mounted, setMounted] = useState(false);
  
  // Refs to track component mount state and prevent memory leaks
  const isMounted = useRef(true);
  
  // Debug: log when component mounts/unmounts
  useEffect(() => {
    console.log('DocumentManagement component mounted');
    setMounted(true);
    isMounted.current = true;
    
    return () => {
      console.log('DocumentManagement component unmounted');
      isMounted.current = false;
    };
  }, []);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchAllDocuments = useCallback(async () => {
    if (!isMounted.current) return;
    
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      console.log('Fetching admin documents...');
      
      const response = await axios.get('/api/admin/documents');
      console.log('Admin documents response:', response.data);
      
      if (!isMounted.current) return; // Prevent state updates if unmounted
      
      const documents = response.data.documents || [];
      console.log('Setting documents:', documents.length, 'documents found');
      setAllDocuments(documents);
    } catch (error) {
      console.error('Error fetching admin documents:', error);
      console.error('Error response:', error.response);
      
      if (!isMounted.current) return; // Prevent state updates if unmounted
      
      let errorMessage = 'Failed to load documents';
      if (error.response?.status === 401) {
        errorMessage = 'Unauthorized. Please login again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setError(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await axios.get('/api/admin/document-templates');
      setTemplates(res.data.templates || []);
    } catch (e) {
      console.error('Failed to load templates', e);
    }
  }, []);

  const addTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.title.trim()) return;
    try {
      await axios.post('/api/admin/document-templates', newTemplate);
      setNewTemplate({ title: '', description: '' });
      fetchTemplates();
    } catch (e) {
      console.error('Failed to create template', e);
    }
  };

  const deleteTemplate = async (id) => {
    if (!window.confirm('Delete this template?')) return;
    try {
      await axios.delete(`/api/admin/document-templates/${id}`);
      fetchTemplates();
    } catch (e) {
      console.error('Failed to delete template', e);
    }
  };

  // Fetch documents when component mounts
  useEffect(() => {
    fetchAllDocuments();
    fetchTemplates();
  }, [fetchAllDocuments, fetchTemplates]);

  const handleDownload = async (documentId, filename) => {
    try {
      setLoading(true);
      console.log('Attempting to download document:', documentId, filename);
      
      // Use admin-specific download route
      const response = await axios.get(`/api/admin/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      // Check if component is still mounted before continuing
      if (!isMounted.current) return;
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setError('');
      console.log('Document downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      console.error('Download error response:', error.response);
      if (isMounted.current) {
        const errorMessage = error.response?.data?.message || 'Failed to download document';
        setError(errorMessage);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (documentId, documentTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to delete document:', documentId, documentTitle);
      
      // Use admin-specific delete route
      const response = await axios.delete(`/api/admin/documents/${documentId}`);
      
      // Check if component is still mounted before continuing
      if (!isMounted.current) return;
      
      console.log('Document deleted successfully:', response.data);
      
      // Remove the document from local state
      setAllDocuments(prevDocs => prevDocs.filter(doc => doc._id !== documentId));
      
      // Call onUpdate to refresh parent component data
      if (onUpdate) {
        onUpdate();
      }
      
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Delete document error:', error);
      console.error('Delete error response:', error.response);
      
      if (!isMounted.current) return;
      
      let errorMessage = 'Failed to delete document';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this document';
      } else if (error.response?.status === 404) {
        errorMessage = 'Document not found';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleBulkDeleteExpired = async () => {
    const expiredCount = allDocuments.filter(doc => getExpiryStatus(doc.expiryDate).status === 'expired').length;
    
    if (expiredCount === 0) {
      setError('No expired documents found');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all ${expiredCount} expired documents? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('Attempting to bulk delete expired documents');
      
      const response = await axios.delete('/api/admin/documents/expired/bulk');
      
      if (!isMounted.current) return;
      
      console.log('Bulk delete successful:', response.data);
      
      // Refresh the document list
      await fetchAllDocuments();
      
      // Call onUpdate to refresh parent component data
      if (onUpdate) {
        onUpdate();
      }
      
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Bulk delete error:', error);
      console.error('Bulk delete error response:', error.response);
      
      if (!isMounted.current) return;
      
      let errorMessage = 'Failed to delete expired documents';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  // use shared formatDate from utils/datetime

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', class: 'status-cancelled' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-soon', text: `${daysUntilExpiry} days left`, class: 'status-pending' };
    } else {
      return { status: 'valid', text: `${daysUntilExpiry} days left`, class: 'status-completed' };
    }
  };

  const getFilteredDocuments = () => {
    if (selectedStaff === 'all') {
      return allDocuments;
    }
    return allDocuments.filter(doc => doc.uploadedBy && doc.uploadedBy._id === selectedStaff);
  };

  const getUniqueStaff = () => {
    const staffMap = new Map();
    allDocuments.forEach(doc => {
      if (doc.uploadedBy && doc.uploadedBy._id) {
        staffMap.set(doc.uploadedBy._id, doc.uploadedBy);
      }
    });
    return Array.from(staffMap.values());
  };

  const filteredDocuments = getFilteredDocuments();
  const uniqueStaff = getUniqueStaff();

  return (
    <div className="management-section">
      <div className="management-header">
        <h2 className="management-title">Document Management</h2>
        <div className="management-actions">
          <select
            value={selectedStaff}
            onChange={(e) => setSelectedStaff(e.target.value)}
            className="form-input"
            style={{ width: 'auto' }}
            disabled={loading}
          >
            <option value="all">All Staff ({allDocuments.length} documents)</option>
            {uniqueStaff.map(staff => (
              <option key={staff._id} value={staff._id}>
                {staff.name} ({allDocuments.filter(doc => doc.uploadedBy && doc.uploadedBy._id === staff._id).length})
              </option>
            ))}
          </select>
          <button 
            onClick={() => fetchAllDocuments()} 
            className="btn btn-small btn-primary" 
            disabled={loading}
            style={{ marginLeft: '10px' }}
          >
            Refresh
          </button>
          {allDocuments.filter(doc => getExpiryStatus(doc.expiryDate).status === 'expired').length > 0 && (
            <button 
              onClick={handleBulkDeleteExpired}
              className="btn btn-small btn-danger" 
              disabled={loading}
              style={{ marginLeft: '10px' }}
              title="Delete all expired documents"
            >
              Delete Expired ({allDocuments.filter(doc => getExpiryStatus(doc.expiryDate).status === 'expired').length})
            </button>
          )}
        </div>
      </div>

      {/* Required Document Templates */}
      <div className="templates-card" style={{ marginBottom: '16px' }}>
        <h3>Required Document Templates</h3>
        <form onSubmit={addTemplate} className="template-form" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <input
            value={newTemplate.title}
            onChange={(e)=>setNewTemplate({ ...newTemplate, title: e.target.value })}
            placeholder="Title (e.g., ID, Police Check)"
            required
          />
          <input
            value={newTemplate.description}
            onChange={(e)=>setNewTemplate({ ...newTemplate, description: e.target.value })}
            placeholder="Description (optional)"
          />
          <button className="btn btn-small btn-primary" type="submit">Add</button>
        </form>
        <ul className="template-list" style={{ marginTop: '8px' }}>
          {templates.length === 0 ? (
            <li>No templates yet</li>
          ) : templates.map(t => (
            <li key={t._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span><strong>{t.title}</strong>{t.description ? ` – ${t.description}` : ''}</span>
              <button className="btn btn-small btn-danger" onClick={()=>deleteTemplate(t._id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>

      {/* Document Statistics */}
      <div className="document-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{allDocuments.length}</div>
            <div className="stat-label">Total Documents</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {allDocuments.filter(doc => getExpiryStatus(doc.expiryDate).status === 'expired').length}
            </div>
            <div className="stat-label">Expired</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {allDocuments.filter(doc => getExpiryStatus(doc.expiryDate).status === 'expiring-soon').length}
            </div>
            <div className="stat-label">Expiring Soon</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{uniqueStaff.length}</div>
            <div className="stat-label">Active Staff</div>
          </div>
        </div>
      </div>

      {/* Documents Table */}
      <div className="documents-table-container">
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading documents...</p>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3 className="empty-state-title">No Documents Found</h3>
            <p className="empty-state-text">
              {selectedStaff === 'all' 
                ? 'No documents have been uploaded yet'
                : 'This staff member has not uploaded any documents'
              }
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Staff Member</th>
                <th>File Size</th>
                <th>Upload Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(doc => {
                const expiryInfo = getExpiryStatus(doc.expiryDate);
                return (
                  <tr key={doc._id}>
                    <td>
                      <div>
                        <strong>{doc.title}</strong>
                        <br />
                        <small>{doc.originalName}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{doc.uploadedBy?.name || 'Unknown User'}</strong>
                        <br />
                        <small>{doc.uploadedBy?.email || 'No email'}</small>
                      </div>
                    </td>
                    <td>{formatFileSize(doc.fileSize)}</td>
                    <td>{formatDate(doc.createdAt)}</td>
                    <td>{formatDate(doc.expiryDate)}</td>
                    <td>
                      <span className={`status-badge ${expiryInfo.class}`}>
                        {expiryInfo.text}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-small btn-primary"
                          onClick={() => handleDownload(doc._id, doc.originalName)}
                          disabled={loading}
                        >
                          Download
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(doc._id, doc.title)}
                          style={{ marginLeft: '8px' }}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Staff Document Summary */}
      {documentsByStaff.length > 0 && (
        <div className="staff-document-summary mt-4">
          <h3>Documents by Staff Member</h3>
          <div className="staff-summary-grid">
            {documentsByStaff.map(staff => (
              <div key={staff._id} className="staff-summary-card">
                <div className="staff-summary-header">
                  <h4>{staff.staffName}</h4>
                  <span className="document-count">{staff.documentCount} documents</span>
                </div>
                <div className="recent-documents">
                  {staff.documents.slice(0, 3).map(doc => (
                    <div key={doc.id} className="recent-doc-item">
                      <span className="doc-title">{doc.title}</span>
                      <span className="doc-date">{formatDate(doc.uploadedAt)}</span>
                    </div>
                  ))}
                  {staff.documents.length > 3 && (
                    <div className="more-docs">
                      +{staff.documents.length - 3} more documents
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Wrap the component with ErrorBoundary
const DocumentManagementWithErrorBoundary = (props) => (
  <ErrorBoundary>
    <DocumentManagement {...props} />
  </ErrorBoundary>
);

export default DocumentManagementWithErrorBoundary;
