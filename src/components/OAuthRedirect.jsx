import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function OAuthRedirect() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        // This component handles direct redirects from OAuth providers
        // It should immediately redirect to the main OAuth callback handler
        
        const provider = searchParams.get('provider') || 'google';
        const oauth2 = searchParams.get('oauth2');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        console.log('OAuthRedirect: Received parameters:', {
            provider,
            oauth2,
            error,
            errorDescription,
            allParams: Object.fromEntries(searchParams.entries())
        });
        
        // Construct the callback URL with all parameters
        const callbackUrl = new URL('/oauth/callback', window.location.origin);
        
        // Forward all search parameters
        searchParams.forEach((value, key) => {
            callbackUrl.searchParams.set(key, value);
        });
        
        // Ensure oauth2 parameter is set
        if (!callbackUrl.searchParams.has('oauth2')) {
            callbackUrl.searchParams.set('oauth2', 'true');
        }
        
        console.log('OAuthRedirect: Redirecting to:', callbackUrl.toString());
        
        // Redirect to the main OAuth callback handler
        navigate(callbackUrl.pathname + callbackUrl.search, { replace: true });
        
    }, [searchParams, navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '40px',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%'
            }}>
                <h2 style={{ 
                    color: '#333', 
                    marginBottom: '20px',
                    fontSize: '24px',
                    fontWeight: '600'
                }}>
                    Processing OAuth Redirect...
                </h2>
                
                <p style={{ 
                    color: '#666', 
                    fontSize: '16px'
                }}>
                    Please wait while we redirect you...
                </p>
            </div>
        </div>
    );
}
