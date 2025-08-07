import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button, Progress } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import axios from 'axios';
import BASE_API_URL from "../services/base.api.url";
import { isOAuthCallback, getOAuthProvider, handleOAuthError, optimizeOAuthFlow } from '../utils/oauthUtils';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    useEffect(() => {
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
                
                let response;
                
                if (isOAuthCallback(searchParams)) {
                    console.log('Processing OAuth callback...');
                    
                    // Check for accessToken in URL parameters (from redirect)
                    const accessTokenFromUrl = searchParams.get('accessToken');
                    const emailFromUrl = searchParams.get('email');
                    const userIdFromUrl = searchParams.get('userId');
                    const userNameFromUrl = searchParams.get('userName');
                    const needCompleteProfileFromUrl = searchParams.get('needCompleteProfile');
                    
                    console.log('URL Parameters check:', {
                        accessToken: accessTokenFromUrl ? 'Found' : 'Missing',
                        email: emailFromUrl || 'Missing',
                        userId: userIdFromUrl || 'Missing',
                        userName: userNameFromUrl || 'Missing',
                        provider: provider
                    });
                    
                    if (accessTokenFromUrl) {
                        console.log('Found accessToken in URL, verifying with backend...');
                        
                        // Call verify token endpoint
                        const verifyData = {
                            accessToken: accessTokenFromUrl,
                            provider: provider,
                            email: emailFromUrl ? decodeURIComponent(emailFromUrl) : 'unknown@temp.com'
                        };
                        
                        console.log('DEBUG: Final verifyData being sent:', JSON.stringify(verifyData, null, 2));
                        
                        response = await axios.post(`${BASE_API_URL}/api/v1/oauth2/verify-token`, verifyData, {
                            timeout: 5000,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        });

                        console.log('Token verification response:', response.status, response.data);
                    } else {
                        // Fallback: gọi endpoint cũ nếu không có token trong URL
                        console.log('No token in URL, trying legacy endpoint...');
                        response = await axios.get(`${BASE_API_URL}/${provider}/oauth2-success`, {
                            withCredentials: true,
                            timeout: 5000 
                        });

                        console.log('Backend response:', response.status, response.data);
                    }

                    // Kiểm tra response - phải check lỗi TRƯỚC khi check data
                    if (response.data?.status === 'BAD_REQUEST' || response.data?.code === 400) {
                        // Backend trả về lỗi BAD_REQUEST
                        console.error('Backend authentication failed:', response.data);
                        let errorMsg = response.data?.data || response.data?.message || 'OAuth2 authentication failed';
                        throw new Error(errorMsg);
                    } else if (response.status === 200 && response.data?.data && typeof response.data.data === 'object') {
                        const data = response.data.data;
                        console.log('User data received:', data);
                        
                        if (data.accessToken) {
                            storage.set("accessToken", data.accessToken);
                            storage.set("userName", data.userName || data.name || "");
                            storage.set("roles", JSON.stringify(data.roles || []));
                            storage.set("userId", data.userId || "");
                            storage.set("email", data.email || "");
                            storage.set("profileImage", data.profileImage || "");
                            
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
                        console.error('Response data type:', typeof response.data?.data);
                        console.error('Full response structure:', JSON.stringify(response.data, null, 2));
                        
                        let errorMsg = 'Invalid response from server';
                        if (typeof response.data?.data === 'string') {
                            errorMsg = response.data.data;
                        } else if (response.data?.message) {
                            errorMsg = response.data.message;
                        }
                        
                        throw new Error(errorMsg);
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
