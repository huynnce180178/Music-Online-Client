import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import BASE_API_URL from "../services/base.api.url";
import { removeFacebookFragment, isOAuthCallback, getOAuthProvider, handleOAuthError, optimizeOAuthFlow } from '../utils/oauthUtils';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        removeFacebookFragment();
        
        const { storage } = optimizeOAuthFlow();

        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev < 90) return prev + 20;
                return prev;
            });
        }, 50);

        const handleOAuthCallback = async () => {
            try {
                // Check for OAuth errors first
                const oauthError = handleOAuthError(searchParams);
                if (oauthError) {
                    console.log('OAuth error detected:', oauthError);
                    setError(oauthError.description);
                    setStatus('error');
                    setProgress(100);
                    setTimeout(() => {
                        navigate('/', { replace: true });
                    }, 800);
                    return;
                }

                const provider = getOAuthProvider(searchParams);
                console.log('OAuth provider:', provider);
                console.log('Search params:', Object.fromEntries(searchParams.entries()));
                
                if (isOAuthCallback(searchParams)) {
                    console.log('Processing OAuth callback...');
                    
                    // Try different possible OAuth endpoints
                    let response = null;
                    let endpoint = null;
                    
                    const endpoints = [
                        `${BASE_API_URL}/oauth2/success.html`,
                        `${BASE_API_URL}/${provider}/oauth2-success`,
                        `${BASE_API_URL}/api/v1/auth/${provider}/callback`,
                        `${BASE_API_URL}/oauth2/callback/${provider}`,
                        `${BASE_API_URL}/api/v1/oauth2/${provider}/callback`,
                        `${BASE_API_URL}/api/v1/auth/oauth2/${provider}/callback`,
                        `${BASE_API_URL}/api/v1/oauth2/${provider}/success`
                    ];
                    
                    for (const ep of endpoints) {
                        try {
                            console.log(`Trying endpoint: ${ep}`);
                            response = await axios.get(ep, {
                                withCredentials: true,
                                timeout: 10000,
                                params: searchParams.toString() ? Object.fromEntries(searchParams.entries()) : {}
                            });
                            endpoint = ep;
                            console.log(`Success with endpoint: ${ep}`);
                            console.log('Response data:', response.data);
                            console.log('Response status:', response.status);
                            break;
                        } catch (error) {
                            console.log(`Failed with endpoint ${ep}:`, error.response?.status || error.message);
                            if (error.response?.data) {
                                console.log('Error response data:', error.response.data);
                            }
                            if (error.response?.status) {
                                console.log('Error response status:', error.response.status);
                            }
                        }
                    }
                    
                    if (!response) {
                        console.error('All OAuth endpoints failed for provider:', provider);
                        console.error('Tried endpoints:', endpoints);
                        throw new Error(`All OAuth endpoints failed for ${provider}`);
                    }

                    console.log('Backend response:', response.status, response.data);

                    // Check if backend returned an error status even with 200 HTTP status
                    if (response.data?.status === 'BAD_REQUEST' || response.data?.status === 'ERROR') {
                        console.error('Backend authentication failed:', response.data);
                        const errorMessage = response.data?.data || response.data?.message || 'OAuth2 authentication failed';
                        console.error('Error message:', errorMessage);
                        throw new Error(errorMessage);
                    }

                    if (response.status === 200 && response.data?.data) {
                        const data = response.data.data;
                        console.log('User data received:', data);
                        
                        if (typeof data === 'string' && (data.includes('authentication failed') || data.includes('OAuth2'))) {
                            console.error('Backend returned error message as data:', data);
                            throw new Error(data);
                        }
                        
                        // Check if response.data itself is an error string
                        if (typeof response.data === 'string' && response.data.includes('authentication failed')) {
                            console.error('Backend returned error string:', response.data);
                            throw new Error(response.data);
                        }
                        
                        if (data.accessToken) {
                            storage.set("accessToken", data.accessToken);
                            storage.set("userName", data.userName || data.name || "");
                            storage.set("roles", JSON.stringify(data.roles || []));
                            storage.set("userId", data.userId || "");
                            storage.set("email", data.email || "");
                            storage.set("profileImage", data.profileImage || "");
                            
                            if (data.facebookId) {
                                storage.set("facebookId", data.facebookId);
                            }
                            
                            if (data.needCompleteProfile) {
                                storage.set("needCompleteProfile", "true");
                            }

                            // Trigger storage event to notify WebSocketProvider
                            window.dispatchEvent(new StorageEvent('storage', {
                                key: 'userId',
                                newValue: data.userId || "",
                                oldValue: null
                            }));
                            
                            window.dispatchEvent(new StorageEvent('storage', {
                                key: 'accessToken',
                                newValue: data.accessToken,
                                oldValue: null
                            }));

                            // Also dispatch custom event for immediate notification
                            window.dispatchEvent(new CustomEvent('userLogin', {
                                detail: {
                                    userId: data.userId,
                                    accessToken: data.accessToken
                                }
                            }));
                            
                            console.log('OAuthCallback: Dispatched storage events and userLogin event');
                        }
                        
                        setProgress(100);
                        setStatus('success');
                        console.log('Setting status to success');
                        
                        setTimeout(() => {
                            navigate('/', { replace: true });
                        }, 500);
                    } else {
                        console.error('Invalid response from server:', response);
                        throw new Error('Invalid response from server');
                    }
                } else {
                    console.log('No OAuth parameters found, redirecting to home');
                    navigate('/', { replace: true });
                }
            } catch (err) {
                console.error('OAuth callback error:', err);
                console.error('Error details:', {
                    message: err.message,
                    response: err.response?.data,
                    status: err.response?.status,
                    code: err.code
                });
                
                let errorMessage = 'OAuth authentication failed';
                
                if (err.response?.status === 404) {
                    errorMessage = 'Profile completion required. Please complete your profile.';
                } else if (err.response?.status === 401) {
                    errorMessage = 'Authentication failed. Please try again.';
                } else if (err.code === 'ECONNABORTED') {
                    errorMessage = 'Connection timeout. Please check your internet connection.';
                } else if (err.response?.data?.message) {
                    errorMessage = err.response.data.message;
                } else if (err.message) {
                    errorMessage = err.message;
                }
                
                setError(errorMessage);
                setProgress(100);
                setStatus('error');
                
                setTimeout(() => {
                    navigate('/', { replace: true });
                }, 800);
            } finally {
                clearInterval(progressInterval);
            }
        };

        handleOAuthCallback();

        return () => clearInterval(progressInterval);
    }, [searchParams, navigate]);

    console.log('Current status:', status);

    if (status === 'loading') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '20px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <LoadingOutlined style={{ 
                        fontSize: '48px', 
                        color: '#667eea',
                        marginBottom: '20px'
                    }} />
                    
                    <h2 style={{ 
                        color: '#333', 
                        marginBottom: '20px',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        Processing Login
                    </h2>
                    
                    <p style={{ 
                        color: '#666', 
                        marginBottom: '30px',
                        fontSize: '16px'
                    }}>
                        Please wait while we authenticate your account...
                    </p>
                    
                    <Progress 
                        percent={progress} 
                        strokeColor={{
                            '0%': '#667eea',
                            '100%': '#764ba2',
                        }}
                        showInfo={false}
                        strokeWidth={8}
                        style={{ marginBottom: '20px' }}
                    />
                    
                    <div style={{ 
                        color: '#999', 
                        fontSize: '14px'
                    }}>
                        {progress < 30 && 'Connecting to server...'}
                        {progress >= 30 && progress < 60 && 'Authenticating...'}
                        {progress >= 60 && progress < 90 && 'Setting up your session...'}
                        {progress >= 90 && 'Almost done...'}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (status === 'error') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                padding: '20px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <CloseCircleOutlined style={{ 
                        fontSize: '48px', 
                        color: '#ff6b6b',
                        marginBottom: '20px'
                    }} />
                    
                    <h2 style={{ 
                        color: '#333', 
                        marginBottom: '20px',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        Login Failed
                    </h2>
                    
                    <p style={{ 
                        color: '#666', 
                        marginBottom: '30px',
                        fontSize: '16px',
                        lineHeight: '1.5'
                    }}>
                        {error}
                    </p>
                    
                    <Button 
                        type="primary" 
                        size="large"
                        onClick={() => navigate('/')}
                        style={{
                            borderRadius: '25px',
                            height: '48px',
                            fontSize: '16px',
                            fontWeight: '600',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                    >
                        Go to Home
                    </Button>
                </div>
            </div>
        );
    }

    // Success state
    if (status === 'success') {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                padding: '20px'
            }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '20px',
                    padding: '40px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    textAlign: 'center',
                    maxWidth: '400px',
                    width: '100%'
                }}>
                    <CheckCircleOutlined style={{ 
                        fontSize: '48px', 
                        color: '#52c41a',
                        marginBottom: '20px'
                    }} />
                    
                    <h2 style={{ 
                        color: '#333', 
                        marginBottom: '20px',
                        fontSize: '24px',
                        fontWeight: '600'
                    }}>
                        Login Successful!
                    </h2>
                    
                    <p style={{ 
                        color: '#666', 
                        marginBottom: '30px',
                        fontSize: '16px'
                    }}>
                        Redirecting to homepage...
                    </p>
                    
                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#f0f0f0',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'linear-gradient(90deg, #4facfe 0%, #00f2fe 100%)',
                            borderRadius: '2px',
                            animation: 'loading 0.5s ease-in-out infinite'
                        }} />
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    @keyframes loading {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
    }
`;
document.head.appendChild(style);