import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const TokenTest = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const [token, setToken] = useState(null);
  const [testResult, setTestResult] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    setToken(storedToken);
    console.log('TokenTest - stored token:', storedToken ? 'Present' : 'Missing');
    console.log('TokenTest - user:', user);
    console.log('TokenTest - isAuthenticated:', isAuthenticated);
  }, [user, isAuthenticated]);

  const testDashboardCall = async () => {
    try {
      setTestResult('Testing...');
      
      const token = localStorage.getItem('token');
      console.log('Making test call with token:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
      
      const response = await axios.get('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setTestResult(`SUCCESS: ${JSON.stringify(response.data.statistics)}`);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResult(`ERROR: ${error.message} - Status: ${error.response?.status} - Data: ${JSON.stringify(error.response?.data)}`);
    }
  };

  const testSimpleCall = async () => {
    try {
      setTestResult('Testing simple endpoint...');
      
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/dashboard-test', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      setTestResult(`SIMPLE SUCCESS: ${response.data.message}`);
    } catch (error) {
      console.error('Simple test failed:', error);
      setTestResult(`SIMPLE ERROR: ${error.message} - Status: ${error.response?.status}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>🔍 Token & Authentication Test</h2>
      
      <div style={{ background: '#f5f5f5', padding: '15px', margin: '10px 0', borderRadius: '5px' }}>
        <h3>Current Status:</h3>
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? `${user.email} (${user.role})` : 'None'}</p>
        <p><strong>Token Present:</strong> {token ? 'Yes' : 'No'}</p>
        {token && <p><strong>Token Preview:</strong> {token.substring(0, 30)}...</p>}
      </div>

      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={testDashboardCall}
          style={{
            padding: '10px 20px',
            margin: '5px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Dashboard Endpoint
        </button>
        
        <button 
          onClick={testSimpleCall}
          style={{
            padding: '10px 20px',
            margin: '5px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Simple Endpoint
        </button>
      </div>

      {testResult && (
        <div style={{
          background: testResult.includes('ERROR') ? '#f8d7da' : '#d4edda',
          color: testResult.includes('ERROR') ? '#721c24' : '#155724',
          padding: '15px',
          borderRadius: '5px',
          marginTop: '10px',
          wordBreak: 'break-all'
        }}>
          <h4>Test Result:</h4>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default TokenTest;