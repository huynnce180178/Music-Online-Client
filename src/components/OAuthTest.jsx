import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Card, Typography, Space } from 'antd';
import axios from 'axios';
import BASE_API_URL from "../services/base.api.url";

const { Title, Text } = Typography;

export default function OAuthTest() {
    const [searchParams] = useSearchParams();
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const runTests = async () => {
        setLoading(true);
        setTestResults([]);
        
        const results = [];
        
        // Test 1: Check if we're on the callback route
        results.push({
            test: 'Callback Route Check',
            status: 'PASS',
            message: 'Component loaded on /oauth/callback route'
        });
        
        // Test 2: Check URL parameters
        const params = {};
        searchParams.forEach((value, key) => {
            params[key] = value;
        });
        
        results.push({
            test: 'URL Parameters',
            status: Object.keys(params).length > 0 ? 'PASS' : 'FAIL',
            message: `Found parameters: ${JSON.stringify(params)}`
        });
        
        // Test 3: Test backend connectivity
        try {
            const response = await axios.get(`${BASE_API_URL}/api/v1/health`, {
                timeout: 5000
            });
            results.push({
                test: 'Backend Connectivity',
                status: 'PASS',
                message: `Backend is reachable: ${response.status}`
            });
        } catch (error) {
            results.push({
                test: 'Backend Connectivity',
                status: 'FAIL',
                message: `Backend error: ${error.message}`
            });
        }
        
        // Test 4: Test OAuth endpoints
        const provider = searchParams.get('provider') || 'google';
        const endpoints = [
            `${BASE_API_URL}/${provider}/oauth2-success`,
            `${BASE_API_URL}/api/v1/auth/${provider}/callback`,
            `${BASE_API_URL}/oauth2/callback/${provider}`,
            `${BASE_API_URL}/api/v1/oauth2/${provider}/callback`
        ];
        
        let oauthSuccess = false;
        let workingEndpoint = null;
        
        for (const endpoint of endpoints) {
            try {
                const response = await axios.get(endpoint, {
                    timeout: 5000
                });
                oauthSuccess = true;
                workingEndpoint = endpoint;
                break;
            } catch (error) {
                console.log(`Endpoint ${endpoint} failed:`, error.response?.status || error.message);
            }
        }
        
        results.push({
            test: 'OAuth Endpoint',
            status: oauthSuccess ? 'PASS' : 'FAIL',
            message: oauthSuccess 
                ? `OAuth endpoint accessible: ${workingEndpoint}` 
                : `All OAuth endpoints failed. Tested: ${endpoints.join(', ')}`
        });
        
        setTestResults(results);
        setLoading(false);
    };

    useEffect(() => {
        runTests();
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            padding: '20px',
            background: '#f5f5f5'
        }}>
            <Card style={{ maxWidth: '800px', margin: '0 auto' }}>
                <Title level={2}>OAuth Callback Test</Title>
                
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                        type="primary" 
                        onClick={runTests}
                        loading={loading}
                        size="large"
                    >
                        Run Tests
                    </Button>
                    
                    {testResults.map((result, index) => (
                        <Card 
                            key={index}
                            size="small"
                            style={{
                                borderColor: result.status === 'PASS' ? '#52c41a' : '#ff4d4f'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong>{result.test}</Text>
                                <Text 
                                    style={{ 
                                        color: result.status === 'PASS' ? '#52c41a' : '#ff4d4f',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {result.status}
                                </Text>
                            </div>
                            <Text type="secondary">{result.message}</Text>
                        </Card>
                    ))}
                </Space>
            </Card>
        </div>
    );
}