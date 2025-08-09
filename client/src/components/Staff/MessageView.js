import React, { useState } from 'react';
import axios from 'axios';

const MessageView = ({ messages, onUpdate }) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [error, setError] = useState('');

  const handleMessageClick = async (message) => {
    try {
      // Mark message as read if it's unread
      if (!message.isRead) {
        await axios.put(`/api/messages/${message._id}/read`);
        onUpdate(); // Refresh to update unread count
      }
      
      // Get full message details
      const response = await axios.get(`/api/messages/${message._id}`);
      setSelectedMessage(response.data.message);
    } catch (error) {
      setError('Failed to load message details');
    }
  };

  const closeMessage = () => {
    setSelectedMessage(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="messages-section">
      <div className="section-header">
        <h2 className="section-title">Messages from Admin</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📧</div>
            <h3 className="empty-state-title">No Messages</h3>
            <p className="empty-state-text">Messages from admin will appear here</p>
          </div>
        ) : (
          messages.map(message => (
            <div
              key={message._id}
              className={`message-item ${!message.isRead ? 'unread' : ''}`}
              onClick={() => handleMessageClick(message)}
            >
              <div className="message-header">
                <h4 className="message-subject">{message.subject}</h4>
                <span className="message-date">{formatDate(message.createdAt)}</span>
              </div>
              <div className="message-sender">
                From: {message.sender?.name || 'Admin'}
              </div>
              <div className="message-preview">
                {message.content.substring(0, 150)}
                {message.content.length > 150 ? '...' : ''}
              </div>
              {!message.isRead && (
                <div className="unread-indicator">
                  <span className="status-badge status-pending">New</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="modal-overlay" onClick={closeMessage}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedMessage.subject}</h2>
              <button className="close-button" onClick={closeMessage}>
                ×
              </button>
            </div>
            
            <div className="message-details">
              <div className="message-meta">
                <p><strong>From:</strong> {selectedMessage.sender?.name}</p>
                <p><strong>Date:</strong> {formatDate(selectedMessage.createdAt)}</p>
                {selectedMessage.readAt && (
                  <p><strong>Read:</strong> {formatDate(selectedMessage.readAt)}</p>
                )}
              </div>
              
              <div className="message-content">
                <p>{selectedMessage.content}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageView;
