import React, { useEffect, useState } from 'react';
import { Modal, Button, Typography, Space, Alert } from 'antd';
import { ExclamationCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

const UserBlockModal = ({ visible, notification, onClose }) => {
    const { t } = useTranslation();
    const [countdown, setCountdown] = useState(10);

    useEffect(() => {
        if (visible && notification?.requireLogout) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        handleLogout();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [visible, notification]);

    const handleLogout = () => {
        // Clear all local storage
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('roles');
        localStorage.removeItem('userId');
        localStorage.removeItem('avatarUrl');
        
        // Close modal
        onClose();
        
        // Navigate to home page using window.location
        window.location.href = '/';
    };

    const getModalContent = () => {
        if (!notification) return null;

        const isBlocked = notification.type === 'ACCOUNT_BLOCKED';
        const isUnblocked = notification.type === 'ACCOUNT_UNBLOCKED';

        return (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                    <div>
                        {isBlocked ? (
                            <ExclamationCircleOutlined 
                                style={{ 
                                    fontSize: 64, 
                                    color: '#ff4d4f',
                                    marginBottom: 16
                                }} 
                            />
                        ) : (
                            <ExclamationCircleOutlined 
                                style={{ 
                                    fontSize: 64, 
                                    color: '#52c41a',
                                    marginBottom: 16
                                }} 
                            />
                        )}
                    </div>

                    <div>
                        <Title level={3} style={{ 
                            color: isBlocked ? '#ff4d4f' : '#52c41a',
                            marginBottom: 8
                        }}>
                            {isBlocked ? t('userBlock.blocked_title') : t('userBlock.unblocked_title')}
                        </Title>
                        
                        <Text style={{ fontSize: 16, color: '#666' }}>
                            {notification.message}
                        </Text>
                    </div>

                    {isBlocked && (
                        <Alert
                            message={t('userBlock.logout_warning', { count: countdown })}
                            type="warning"
                            showIcon
                            style={{ marginTop: 16 }}
                        />
                    )}

                    {isUnblocked && (
                        <Alert
                            message={t('userBlock.unblocked_message')}
                            type="success"
                            showIcon
                            style={{ marginTop: 16 }}
                        />
                    )}
                </Space>
            </div>
        );
    };

    return (
        <Modal
            title={null}
            open={visible}
            onCancel={notification?.requireLogout ? undefined : onClose}
            footer={[
                notification?.requireLogout ? (
                    <Button
                        key="logout"
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        onClick={handleLogout}
                        style={{ marginLeft: 'auto' }}
                    >
                        {t('userBlock.logout_now')} ({countdown})
                    </Button>
                ) : (
                    <Button key="ok" type="primary" onClick={onClose}>
                        {t('userBlock.ok')}
                    </Button>
                )
            ]}
            closable={!notification?.requireLogout}
            maskClosable={!notification?.requireLogout}
            keyboard={!notification?.requireLogout}
            centered
            width={500}
        >
            {getModalContent()}
        </Modal>
    );
};

export default UserBlockModal;