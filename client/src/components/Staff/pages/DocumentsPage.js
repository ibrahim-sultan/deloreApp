import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DocumentUpload from '../DocumentUpload';
import '../StaffPages.css';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/documents/my-documents');
      setDocuments(res.data.documents || []);
      setError('');
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="staff-page">
        <h1 className="staff-page-title">My Documents</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">My Documents</h1>
      {error && <div className="alert alert-error">{error}</div>}
      <DocumentUpload documents={documents} onUpdate={load} />
    </div>
  );
};

export default DocumentsPage;
