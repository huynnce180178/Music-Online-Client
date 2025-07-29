import { useState } from 'react';
import { Button, Card, Space, Input, Select } from 'antd';

const { Option } = Select;

export default function OAuthTest() {
    const [provider, setProvider] = useState('facebook');
    const [error, setError] = useState('');
    const [code, setCode] = useState('test_code_123');
    const [state, setState] = useState('test_state_456');

    const simulateOAuthCallback = (includeError = false) => {
        const params = new URLSearchParams();
        
        if (includeError) {
            params.set('error', 'access_denied');
            params.set('error_description', 'User denied the request');
        } else {
            params.set('code', code);
            params.set('state', state);
            params.set('oauth2', 'true');
        }
        
        params.set('provider', provider);
        
        const callbackUrl = `/oauth/callback?${params.toString()}`;
        window.location.href = callbackUrl;
    };

    const simulateFacebookFragment = () => {
        const params = new URLSearchParams();
        params.set('code', code);
        params.set('state', state);
        params.set('oauth2', 'true');
        params.set('provider', provider);
        
        const callbackUrl = `/oauth/callback?${params.toString()}#_=_`;
        window.location.href = callbackUrl;
    };

    return (
        <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
            <Card title="OAuth Callback Test" style={{ marginTop: 24 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <label>Provider:</label>
                        <Select 
                            value={provider} 
                            onChange={setProvider}
                            style={{ width: '100%', marginTop: 8 }}
                        >
                            <Option value="facebook">Facebook</Option>
                            <Option value="google">Google</Option>
                        </Select>
                    </div>
                    
                    <div>
                        <label>Code:</label>
                        <Input 
                            value={code} 
                            onChange={(e) => setCode(e.target.value)}
                            style={{ marginTop: 8 }}
                        />
                    </div>
                    
                    <div>
                        <label>State:</label>
                        <Input 
                            value={state} 
                            onChange={(e) => setState(e.target.value)}
                            style={{ marginTop: 8 }}
                        />
                    </div>
                    
                    <div>
                        <label>Error (optional):</label>
                        <Input 
                            value={error} 
                            onChange={(e) => setError(e.target.value)}
                            placeholder="Leave empty for success scenario"
                            style={{ marginTop: 8 }}
                        />
                    </div>
                    
                    <Space>
                        <Button 
                            type="primary" 
                            onClick={() => simulateOAuthCallback(false)}
                        >
                            Test Success Callback
                        </Button>
                        
                        <Button 
                            danger 
                            onClick={() => simulateOAuthCallback(true)}
                        >
                            Test Error Callback
                        </Button>
                        
                        <Button 
                            onClick={simulateFacebookFragment}
                        >
                            Test Facebook #_=_ Fragment
                        </Button>
                    </Space>
                </Space>
            </Card>
        </div>
    );
}