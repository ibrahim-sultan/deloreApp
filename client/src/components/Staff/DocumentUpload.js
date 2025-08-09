import React, { useState } from 'react';
import axios from 'axios';

const DocumentUpload = ({ documents, onUpdate }) => {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setError('');
    setSuccess('');

    if (!selectedFile) {
      setError('Please select a file to upload');
      setUploading(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append('document', selectedFile);
    uploadData.append('title', formData.title);
    uploadData.append('expiryDate', formData.expiryDate);

    try {
      await axios.post('/api/documents/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess('Document uploaded successfully!');
      setFormData({ title: '', expiryDate: '' });
      setSelectedFile(null);
      setShowUploadForm(false);
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upload document';
      setError(message);
    } finally {
      setUploading(false);
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
      setError('Failed to download document');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`/api/documents/${documentId}`);
      setSuccess('Document deleted successfully!');
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete document';
      setError(message);
    }
  };

  const getExpiryStatus = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', text: 'Expired', class: 'expired' };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'expiring-soon', text: `Expires in ${daysUntilExpiry} days`, class: 'expiring-soon' };
    } else {
      return { status: 'valid', text: `Expires in ${daysUntilExpiry} days`, class: 'valid' };
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-section">
      <div className="section-header">
        <h2 className="section-title">Document Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowUploadForm(!showUploadForm)}
        >
          {showUploadForm ? 'Cancel' : 'Upload Document'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showUploadForm && (
        <form onSubmit={handleSubmit} className="upload-form">
          <h3>Upload New Document</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title" className="form-label">Document Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="Enter document title"
              />
            </div>

            <div className="form-group">
              <label htmlFor="expiryDate" className="form-label">Expiry Date</label>
              <input
                type="datetime-local"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-group file-upload-section">
            <label htmlFor="document" className="form-label">Select Document</label>
            <input
              type="file"
              id="document"
              onChange={handleFileChange}
              className="form-input"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
              required
            />
            {selectedFile && (
              <div className="file-info">
                <span>{selectedFile.name}</span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      )}

      <div className="documents-list">
        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📄</div>
            <h3 className="empty-state-title">No Documents Yet</h3>
            <p className="empty-state-text">Upload your first document to get started</p>
          </div>
        ) : (
          documents.map(doc => {
            const expiryInfo = getExpiryStatus(doc.expiryDate);
            return (
              <div key={doc._id} className="document-item">
                <div className="document-info">
                  <h4>{doc.title}</h4>
                  <p>Original: {doc.originalName}</p>
                  <p>Uploaded: {new Date(doc.uploadedAt || doc.createdAt).toLocaleDateString()}</p>
                </div>
                
                <div className="document-meta">
                  <div className="action-buttons">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => handleDownload(doc._id, doc.originalName)}
                    >
                      Download
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(doc._id)}
                    >
                      Delete
                    </button>
                  </div>
                  <div className="document-size">{formatFileSize(doc.fileSize)}</div>
                  <div className={`expiry-date ${expiryInfo.class}`}>
                    {expiryInfo.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
