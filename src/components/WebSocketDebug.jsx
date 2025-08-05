import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, Typography, Space, Button, Divider } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

export default function WebSocketDebug() {
    const [searchParams] = useSearchParams();
    const [debugInfo, setDebugInfo] = useState({});

    const collectDebugInfo = () => {
        const info = {
            url: window.location.href,
            pathname: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            params: {}
        };

        // Collect URL parameters
        searchParams.forEach((value, key) => {
            info.params[key] = value;
        });

        // Check localStorage
        try {
            info.localStorage = {
                accessToken: localStorage.getItem('accessToken') ? 'Present' : 'Not found',
                userName: localStorage.getItem('userName') ? 'Present' : 'Not found',
                userId: localStorage.getItem('userId') ? 'Present' : 'Not found',
                roles: localStorage.getItem('roles') ? 'Present' : 'Not found'
            };
        } catch (error) {
            info.localStorage = { error: error.message };
        }

        // Check sessionStorage
        try {
            info.sessionStorage = {
                accessToken: sessionStorage.getItem('accessToken') ? 'Present' : 'Not found',
                userName: sessionStorage.getItem('userName') ? 'Present' : 'Not found',
                userId: sessionStorage.getItem('userId') ? 'Present' : 'Not found',
                roles: sessionStorage.getItem('roles') ? 'Present' : 'Not found'
            };
        } catch (error) {
            info.sessionStorage = { error: error.message };
        }

        setDebugInfo(info);
    };

    useEffect(() => {
        collectDebugInfo();
    }, [searchParams]);

    return (
        <div style={{
            minHeight: '100vh',
            padding: '20px',
            background: '#f0f2f5'
        }}>
            <Card style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={2}>OAuth Callback Debug</Title>
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={collectDebugInfo}
                            type="primary"
                        >
                            Refresh
                        </Button>
                    </div>

                    <Divider />

                    <Card title="URL Information" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div>
                                <Text strong>Full URL:</Text>
                                <Paragraph copyable style={{ margin: 0 }}>
                                    {debugInfo.url}
                                </Paragraph>
                            </div>
                            <div>
                                <Text strong>Pathname:</Text>
                                <Text code>{debugInfo.pathname}</Text>
                            </div>
                            <div>
                                <Text strong>Search:</Text>
                                <Text code>{debugInfo.search}</Text>
                            </div>
                            <div>
                                <Text strong>Hash:</Text>
                                <Text code>{debugInfo.hash}</Text>
                            </div>
                            <div>
                                <Text strong>Timestamp:</Text>
                                <Text code>{debugInfo.timestamp}</Text>
                            </div>
                        </Space>
                    </Card>

                    <Card title="URL Parameters" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {Object.keys(debugInfo.params || {}).map(key => (
                                <div key={key}>
                                    <Text strong>{key}:</Text>
                                    <Text code>{debugInfo.params[key]}</Text>
                                </div>
                            ))}
                            {Object.keys(debugInfo.params || {}).length === 0 && (
                                <Text type="secondary">No URL parameters found</Text>
                            )}
                        </Space>
                    </Card>

                    <Card title="Local Storage" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {debugInfo.localStorage && Object.keys(debugInfo.localStorage).map(key => (
                                <div key={key}>
                                    <Text strong>{key}:</Text>
                                    <Text code>{debugInfo.localStorage[key]}</Text>
                                </div>
                            ))}
                        </Space>
                    </Card>

                    <Card title="Session Storage" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            {debugInfo.sessionStorage && Object.keys(debugInfo.sessionStorage).map(key => (
                                <div key={key}>
                                    <Text strong>{key}:</Text>
                                    <Text code>{debugInfo.sessionStorage[key]}</Text>
                                </div>
                            ))}
                        </Space>
                    </Card>

                    <Card title="User Agent" size="small">
                        <Paragraph copyable style={{ margin: 0 }}>
                            {debugInfo.userAgent}
                        </Paragraph>
                    </Card>
                </Space>
            </Card>
        </div>
    );
} 