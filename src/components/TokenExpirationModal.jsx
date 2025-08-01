import React, { useState, useEffect } from 'react';
import { Modal, Button, message } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { isTokenExpired } from '../utils/apiUtils';

const TokenExpirationModal = () => {
    const { t } = useTranslation();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    // Thời gian kiểm tra mỗi 1 tiếng
    const CHECK_INTERVAL = 60 * 60 * 1000; // 1 tiếng = 60 phút * 60 giây * 1000ms
    const WARNING_THRESHOLD = 10; // Hiển thị modal khi còn 10 giây

    const checkTokenExpiration = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) return;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Date.now() / 1000;
            const timeUntilExpiry = payload.exp - currentTime;

            console.log('Token expiration check:', {
                currentTime: new Date(currentTime * 1000).toLocaleString(),
                expiryTime: new Date(payload.exp * 1000).toLocaleString(),
                timeUntilExpiry: Math.floor(timeUntilExpiry) + ' seconds'
            });

            // Nếu token đã hết hạn, hiển thị modal ngay lập tức
            if (timeUntilExpiry <= 0) {
                console.log('Token expired, showing modal immediately');
                setTimeLeft(0);
                setIsModalVisible(true);
                return;
            }

            // Hiển thị modal khi còn 10 giây hoặc ít hơn
            if (timeUntilExpiry > 0 && timeUntilExpiry <= WARNING_THRESHOLD) {
                console.log('Token expiring soon, showing modal');
                setTimeLeft(Math.floor(timeUntilExpiry));
                setIsModalVisible(true);
            }
        } catch (error) {
            console.error('Error parsing token:', error);
        }
    };

    useEffect(() => {
        // Kiểm tra ngay lập tức khi component mount
        checkTokenExpiration();

        // Thiết lập interval để kiểm tra mỗi 1 tiếng
        const interval = setInterval(() => {
            console.log('Hourly token check triggered');
            checkTokenExpiration();
        }, CHECK_INTERVAL);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isModalVisible && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsModalVisible(false);
                        // Auto logout when time is up
                        localStorage.removeItem('accessToken');
                        localStorage.removeItem('userName');
                        localStorage.removeItem('roles');
                        localStorage.removeItem('userId');
                        localStorage.removeItem('avatarUrl');
                        localStorage.removeItem('songCount');
                        message.warning(t('api_token_expired'));
                        window.location.href = '/';
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [isModalVisible, timeLeft, t]);

    const handleExtendSession = () => {
        // Here you could implement a refresh token mechanism
        // For now, we'll just close the modal
        setIsModalVisible(false);
        message.info(t('token_modal_extend_message'));
    };

    const handleLogout = () => {
        setIsModalVisible(false);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('roles');
        localStorage.removeItem('userId');
        localStorage.removeItem('avatarUrl');
        localStorage.removeItem('songCount');
        message.info(t('token_modal_logout_message'));
        window.location.href = '/';
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    return (
        <Modal
            title={null}
            open={isModalVisible}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
            closable={false}
            maskClosable={false}
            centered
            bodyStyle={{
                padding: 32,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #fffbe6 0%, #ffe58f 100%)',
                boxShadow: '0 8px 32px rgba(255, 193, 7, 0.15)'
            }}
        >
            <div style={{ textAlign: 'center' }}>
                <ExclamationCircleOutlined style={{ fontSize: 48, color: '#faad14', marginBottom: 16 }} />
                <h2 style={{ fontSize: 24, fontWeight: 700, color: '#d48806', marginBottom: 8 }}>
                    {t('token_modal_title')}
                </h2>
                <div style={{ fontSize: 18, color: '#ad6800', marginBottom: 16 }}>
                    {t('token_modal_description')}{' '}
                    <strong style={{ color: '#fa541c', fontSize: 22 }}>
                        {formatTime(timeLeft)}
                    </strong>
                </div>
                <div style={{ fontSize: 16, color: '#ad6800', marginBottom: 24 }}>
                    {t('token_modal_extend_question')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
                    <Button
                        key="logout"
                        onClick={handleLogout}
                        style={{
                            minWidth: 100,
                            fontWeight: 600,
                            borderRadius: 8,
                            border: '1.5px solid #faad14',
                            color: '#faad14',
                            background: '#fffbe6'
                        }}
                    >
                        {t('token_modal_logout_button')}
                    </Button>
                    <Button
                        key="extend"
                        type="primary"
                        onClick={handleExtendSession}
                        style={{
                            minWidth: 100,
                            fontWeight: 600,
                            borderRadius: 8,
                            background: 'linear-gradient(90deg, #faad14 0%, #fa541c 100%)',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(250, 84, 28, 0.15)'
                        }}
                    >
                        {t('token_modal_extend_button')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default TokenExpirationModal; 