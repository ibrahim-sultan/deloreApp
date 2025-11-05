import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [mounted, setMounted] = useState(false);
  
  // Debug: log when component mounts/unmounts
  useEffect(() => {
    console.log('DocumentManagement component mounted');
    setMounted(true);
    
    return () => {
      console.log('DocumentManagement component unmounted');
    };
  }, []);

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      console.log('Fetching admin documents...');
      
      const response = await axios.get('/api/admin/documents');
      console.log('Admin documents response:', response.data);
      
      const documents = response.data.documents || [];
      console.log('Setting documents:', documents.length, 'documents found');
      setAllDocuments(documents);
    } catch (error) {
      console.error('Error fetching admin documents:', error);
      console.error('Error response:', error.response);
      
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
      setLoading(false);
    }
  };

  const handleDownload = async (documentId, filename) => {
    try {
      const response = await axios.get(`/api/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download document');
    }
  };

  const handleDelete = async (documentId, documentTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`/api/documents/${documentId}`);
      
      // Remove the document from local state
      setAllDocuments(prevDocs => prevDocs.filter(doc => doc._id !== documentId));
      
      // Call onUpdate to refresh parent component data
      if (onUpdate) {
        onUpdate();
      }
      
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Delete document error:', error);
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
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

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
    return allDocuments.filter(doc => doc.uploadedBy._id === selectedStaff);
  };

  const getUniqueStaff = () => {
    const staffMap = new Map();
    allDocuments.forEach(doc => {
      if (doc.uploadedBy) {
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
          >
            <option value="all">All Staff ({allDocuments.length} documents)</option>
            {uniqueStaff.map(staff => (
              <option key={staff._id} value={staff._id}>
                {staff.name} ({allDocuments.filter(doc => doc.uploadedBy._id === staff._id).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

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
        {loading ? (
          <div className="loading">Loading documents...</div>
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
                        <strong>{doc.uploadedBy?.name}</strong>
                        <br />
                        <small>{doc.uploadedBy?.email}</small>
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
                        >
                          Download
                        </button>
                        <button
                          className="btn btn-small btn-danger"
                          onClick={() => handleDelete(doc._id, doc.title)}
                          style={{ marginLeft: '8px' }}
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
