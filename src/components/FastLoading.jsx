import { useEffect, useState } from 'react';
import { LoadingOutlined } from '@ant-design/icons';

export default function FastLoading() {
    const [dots, setDots] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.');
        }, 300);

        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%',
                margin: '20px'
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
                    Connecting{dots}
                </h2>
                
                <p style={{ 
                    color: '#666', 
                    fontSize: '16px'
                }}>
                    Please wait while we process your login...
                </p>
            </div>
        </div>
    );
}