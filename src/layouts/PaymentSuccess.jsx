import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Result, Button } from 'antd';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const location = useLocation();

    const paymentId = new URLSearchParams(location.search).get('paymentId');

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
                status="success"
                title={<span style={{ color: '#fff' }}>Payment Successful!</span>}
                subTitle={<span style={{ color: '#fff' }}>Transaction code: {paymentId}</span>}
                extra={[
                    <Button type="primary" key="home" onClick={() => navigate('/')}>
                        Go to Home Now
                    </Button>,
                ]}
                style={{ color: '#fff' }} // đề phòng, nhưng title & subTitle đã được set riêng
            />
        </div>
    );
}
