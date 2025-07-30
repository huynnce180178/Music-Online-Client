import React, { useState, useEffect } from 'react';
import { Button, Card, Space, Typography, Alert } from 'antd';
import { testWebSocketConnection, testSockJSConnection } from '../utils/websocketTest';
import BASE_API_URL from '../services/base.api.url';

const { Title, Text } = Typography;

const WebSocketDebug = () => {
    const [testResults, setTestResults] = useState({});
    const [isTesting, setIsTesting] = useState(false);

    const runTests = async () => {
        setIsTesting(true);
        const results = {};

        try {
            // Test WebSocket
            try {
                await testWebSocketConnection();
                results.websocket = { success: true, message: 'WebSocket connection successful' };
            } catch (error) {
                results.websocket = { success: false, message: error.message };
            }

            // Test SockJS
            try {
                await testSockJSConnection();
                results.sockjs = { success: true, message: 'SockJS connection successful' };
            } catch (error) {
                results.sockjs = { success: false, message: error.message };
            }

            // Test API endpoint
            try {
                const response = await fetch(`${BASE_API_URL}/api/v1/user/status`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                if (response.ok) {
                    results.api = { success: true, message: 'API endpoint accessible' };
                } else {
                    results.api = { success: false, message: `API returned ${response.status}` };
                }
            } catch (error) {
                results.api = { success: false, message: error.message };
            }

        } catch (error) {
            console.error('Test error:', error);
        }

        setTestResults(results);
        setIsTesting(false);
    };

    useEffect(() => {
        runTests();
    }, []);

    return (
        <Card title="WebSocket Debug" style={{ margin: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                    <Title level={4}>Connection Tests</Title>
                    <Text>Base URL: {BASE_API_URL}</Text>
                </div>

                <Button 
                    type="primary" 
                    onClick={runTests} 
                    loading={isTesting}
                >
                    Run Tests
                </Button>

                {Object.entries(testResults).map(([test, result]) => (
                    <Alert
                        key={test}
                        message={test.toUpperCase()}
                        description={result.message}
                        type={result.success ? 'success' : 'error'}
                        showIcon
                    />
                ))}

                <div>
                    <Title level={4}>Debug Information</Title>
                    <Text>User ID: {localStorage.getItem('userId') || 'Not set'}</Text><br />
                    <Text>Token: {localStorage.getItem('accessToken') ? 'Present' : 'Not set'}</Text><br />
                    <Text>Global: {typeof global !== 'undefined' ? 'Defined' : 'Undefined'}</Text><br />
                    <Text>Process: {typeof process !== 'undefined' ? 'Defined' : 'Undefined'}</Text>
                </div>
            </Space>
        </Card>
    );
};

export default WebSocketDebug; 