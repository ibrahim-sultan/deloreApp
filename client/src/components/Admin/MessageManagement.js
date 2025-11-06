import React, { useState } from 'react';
import axios from 'axios';
import { formatDateTime } from '../../utils/datetime';

const MessageManagement = ({ staffMembers, onUpdate }) => {
  const [showMessageForm, setShowMessageForm] = useState(false);
  const [formData, setFormData] = useState({
    recipientId: '',
    subject: '',
    content: ''
  });
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [folder, setFolder] = useState('all'); // 'inbox' | 'sent' | 'all'

  React.useEffect(() => {
    fetchMessages(folder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folder]);

  const fetchMessages = async (which = 'all') => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/messages/inbox?folder=${encodeURIComponent(which)}`);
      setMessages(response.data.messages || []);
      setError('');
    } catch (error) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/messages/send', formData);
      setSuccess('Message sent successfully!');
      setFormData({
        recipientId: '',
        subject: '',
        content: ''
      });
      setShowMessageForm(false);
      fetchMessages(folder);
      onUpdate();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send message';
      setError(message);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => formatDateTime(dateString);

  const getSelectedStaffName = () => {
    const staff = staffMembers.find(s => s._id === formData.recipientId);
    return staff ? staff.name : '';
  };

  return (
    <div className="management-section">
      <div className="management-header">
        <h2 className="management-title">Message Management</h2>
        <div className="management-actions">
          <button
            className="btn btn-primary"
            onClick={() => setShowMessageForm(!showMessageForm)}
          >
            {showMessageForm ? 'Cancel' : 'Send Message to Staff'}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {showMessageForm && (
        <div className="form-modal-content" style={{ position: 'relative', marginBottom: '32px' }}>
          <div className="form-modal-header">
            <h3 className="form-modal-title">Send Message to Staff</h3>
            <button className="close-button" onClick={() => setShowMessageForm(false)}>
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="recipientId" className="form-label">Select Staff Member</label>
              <select
                id="recipientId"
                name="recipientId"
                value={formData.recipientId}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Choose a staff member...</option>
                {staffMembers.filter(staff => staff.isActive).map(staff => (
                  <option key={staff._id} value={staff._id}>
                    {staff.name} ({staff.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subject" className="form-label">Subject</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className="form-input"
                required
                placeholder="Enter message subject"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content" className="form-label">Message Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                className="form-input form-textarea"
                required
                placeholder="Enter your message..."
                rows="6"
              />
            </div>

            {formData.recipientId && (
              <div className="message-preview">
                <h4>Message Preview</h4>
                <div className="preview-card">
                  <div className="preview-header">
                    <strong>To:</strong> {getSelectedStaffName()}
                  </div>
                  <div className="preview-subject">
                    <strong>Subject:</strong> {formData.subject || 'No subject'}
                  </div>
                  <div className="preview-content">
                    {formData.content || 'No content'}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      )}

      <div className="messages-section">
        <div className="messages-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <h3 style={{ marginRight: 'auto' }}>Messages</h3>
          <div className="folder-switch" role="tablist" aria-label="Message folders">
            <button
              className={`btn btn-secondary ${folder === 'inbox' ? 'active' : ''}`}
              onClick={() => setFolder('inbox')}
              role="tab"
              aria-selected={folder === 'inbox'}
            >Inbox</button>
            <button
              className={`btn btn-secondary ${folder === 'sent' ? 'active' : ''}`}
              onClick={() => setFolder('sent')}
              role="tab"
              aria-selected={folder === 'sent'}
            >Sent</button>
            <button
              className={`btn btn-secondary ${folder === 'all' ? 'active' : ''}`}
              onClick={() => setFolder('all')}
              role="tab"
              aria-selected={folder === 'all'}
            >All</button>
          </div>
        </div>
        
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📧</div>
            <h3 className="empty-state-title">No Messages</h3>
            <p className="empty-state-text">No messages in this folder</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map(message => (
              <div key={message._id} className="message-item">
                <div className="message-header">
                  <h4 className="message-subject">{message.subject}</h4>
                  <span className="message-date">{formatDate(message.createdAt)}</span>
                </div>
                
                <div className="message-parties" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div className="message-sender"><strong>From:</strong> {message.sender?.name} ({message.sender?.email})</div>
                  <div className="message-recipient"><strong>To:</strong> {message.recipient?.name} ({message.recipient?.email})</div>
                </div>
                
                <div className="message-content-preview">
                  {message.content.length > 200 
                    ? `${message.content.substring(0, 200)}...` 
                    : message.content
                  }
                </div>
                
                <div className="message-status">
                  {message.isRead ? (
                    <span className="status-badge status-completed">
                      Read {message.readAt ? `on ${formatDate(message.readAt)}` : ''}
                    </span>
                  ) : (
                    <span className="status-badge status-pending">Unread</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Statistics */}
      {messages.length > 0 && (
        <div className="message-stats mt-4">
          <div className="card">
            <h3>Message Statistics</h3>
            <div className="summary-stats">
              <div className="summary-item">
                <span className="summary-label">Total:</span>
                <span className="summary-value">{messages.length}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Read:</span>
                <span className="summary-value">
                  {messages.filter(m => m.isRead).length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Unread:</span>
                <span className="summary-value">
                  {messages.filter(m => !m.isRead).length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Response Rate:</span>
                <span className="summary-value">
                  {messages.length > 0 
                    ? Math.round((messages.filter(m => m.isRead).length / messages.length) * 100)
                    : 0
                  }%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageManagement;
