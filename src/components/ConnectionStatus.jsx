import React, { useState, useEffect } from 'react';
import { Alert, Button, Space, Typography } from 'antd';
import { WifiOutlined, ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { testServerConnection } from '../utils/apiUtils';

const { Text } = Typography;

const ConnectionStatus = ({ onConnectionRestored }) => {
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [errorDetails, setErrorDetails] = useState('');

  const checkConnection = async () => {
    setConnectionStatus('checking');
    try {
      await testServerConnection();
      setConnectionStatus('connected');
      setErrorDetails('');
      if (onConnectionRestored) {
        onConnectionRestored();
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setErrorDetails(error.message);
    }
    setLastChecked(new Date());
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'disconnected':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <WifiOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getStatusMessage = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Server connection is working properly';
      case 'disconnected':
        return 'Unable to connect to the server';
      default:
        return 'Checking server connection...';
    }
  };

  const getTroubleshootingSteps = () => [
    'Check your internet connection',
    'Try refreshing the page',
    'Clear your browser cache',
    'Check if the server is under maintenance',
    'Contact support if the problem persists'
  ];

  if (connectionStatus === 'connected') {
    return null; // Don't show anything when connected
  }

  return (
    <Alert
      message={
        <Space>
          {getStatusIcon()}
          <Text strong>{getStatusMessage()}</Text>
        </Space>
      }
      description={
        <div>
          {connectionStatus === 'disconnected' && (
            <>
              <Text type="secondary">
                We're having trouble connecting to our servers. This might be due to:
              </Text>
              <ul style={{ marginTop: 8, marginBottom: 8 }}>
                {getTroubleshootingSteps().map((step, index) => (
                  <li key={index}>
                    <Text type="secondary">{step}</Text>
                  </li>
                ))}
              </ul>
              {errorDetails && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Error details: {errorDetails}
                </Text>
              )}
            </>
          )}
          <div style={{ marginTop: 8 }}>
            <Button 
              size="small" 
              onClick={checkConnection}
              loading={connectionStatus === 'checking'}
            >
              Retry Connection
            </Button>
            {lastChecked && (
              <Text type="secondary" style={{ marginLeft: 8, fontSize: '12px' }}>
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            )}
          </div>
        </div>
      }
      type={connectionStatus === 'disconnected' ? 'error' : 'warning'}
      showIcon={false}
      style={{ 
        margin: 16, 
        borderRadius: 8,
        border: connectionStatus === 'disconnected' ? '1px solid #ff4d4f' : '1px solid #faad14'
      }}
    />
  );
};

export default ConnectionStatus; 