import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MessageView from '../MessageView';
import './StaffPages.css';

const MessagesPage = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const response = await axios.get('/api/messages/inbox');
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleDataUpdate = () => {
    fetchMessages();
  };

  if (loading) {
    return (
      <div className="staff-page">
        <h1 className="staff-page-title">Messages</h1>
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="staff-page">
      <h1 className="staff-page-title">Messages</h1>
      
      {error && <div className="alert alert-error" style={{ marginBottom: '20px' }}>{error}</div>}
      
      <div className="staff-messages-content">
        <MessageView messages={messages} onUpdate={handleDataUpdate} />
      </div>
    </div>
  );
};

export default MessagesPage;

