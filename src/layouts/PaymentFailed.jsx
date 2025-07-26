import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';

export default function PaymentFail() {
    const navigate = useNavigate();
    const location = useLocation();

    const message = new URLSearchParams(location.search).get('message') || 'Payment failed due to unknown error.';

    useEffect(() => {
        const timer = setTimeout(() => navigate('/'), 5000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#181c2b',
        }}>
            <Result
                status="error"
                title={<span style={{ color: '#fff' }}>Payment Failed</span>}
                subTitle={<span style={{ color: '#fff' }}>{message}</span>}
                extra={[
                    <Button type="primary" key="home" onClick={() => navigate('/')}>
                        Go to Home Now
                    </Button>,
                ]}
                style={{ color: '#fff' }}
            />
        </div>
    );
}
