import { useState, useEffect } from 'react';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, Row, Col, Modal } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import 'antd/dist/reset.css';
import ForgetPassword from './ForgetPassword'; // Import component quên mật khẩu
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const { Title, Text } = Typography;

// Responsive hook
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}

export default function Login({ onClose, onSwitchToRegister }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [showForgot, setShowForgot] = useState(false); // Thêm state để điều khiển modal
    const isMobile = useIsMobile();

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_API_URL}/api/v1/auth/login`, {
                username: values.email,
                password: values.password,
            });
            const data = res.data;
            // Debug: log the full response from backend (for Google login)
            console.log('Login response:', data);
            if (data && data.data && data.data.accessToken) {
                localStorage.setItem("accessToken", data.data.accessToken);
                localStorage.setItem("userName", data.data.userName || data.data.email || "");
                // Google OAuth: prefer data.data.fullName, then data.data.name (not given_name), fallback to userName
                let fullName = data.data.fullName || data.data.name || data.data.userName || data.data.email || "";
                if (typeof fullName === "string") fullName = fullName.trim();
                localStorage.setItem("fullName", fullName);
                localStorage.setItem("roles", JSON.stringify(data.data.roles));
                localStorage.setItem("userId", data.data.userId);
                // Lưu avatarUrl cho header
                localStorage.setItem("avatarUrl", data.data.avatarUrl || data.data.profileImage || "");
                onClose();
                window.location.href = "/";
            } else {
                Modal.error({ title: "Login failed", content: data.data || "Login failed" });
            }
        } catch (err) {
            Modal.error({ title: "Error", content: err.response?.data?.data || "Server connection error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.75)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? 0 : 8,
            }}
        >
            <div
                style={{
                    background: 'white',
                    borderRadius: 32,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                    maxWidth: 950,
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Close button */}
                <Button
                    type="text"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        zIndex: 2,
                        fontSize: 20,
                        background: 'rgba(0,0,0,0.04)',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    aria-label="Close"
                    icon={<span style={{ fontSize: 24, color: '#999' }}>&times;</span>}
                />
                <Row style={{ minHeight: 500, width: '100%' }}>
                    {/* Image Section - only render on desktop/tablet */}
                    {!isMobile && (
                        <Col
                            md={12}
                            style={{
                                background: 'linear-gradient(135deg, #39C6E5 0%, #21A8C5 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <img
                                src="/img/headphones1.png"
                                alt="icon"
                                style={{ width: 300, height: 300, objectFit: 'contain' }}
                            />
                        </Col>
                    )}
                    {/* Form Section */}
                    <Col
                        xs={24}
                        md={isMobile ? 24 : 12}
                        style={{
                            padding: isMobile ? '24px 4vw' : '32px 5vw',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            minWidth: 0,
                            minHeight: 420,
                            width: '100%',
                        }}
                    >
                        <Title level={2} style={{
                            textAlign: 'center',
                            marginBottom: 32,
                            color: '#21A8C5',
                            fontWeight: 800,
                            fontSize: isMobile ? 22 : 28,
                        }}>
                            {t('login')}
                        </Title>
                        <Form
                            name="login"
                            layout="vertical"
                            onFinish={handleSubmit}
                            initialValues={{ remember: false }}
                            requiredMark={false}
                            style={{ width: '100%' }}
                        >
                            <Form.Item
                                name="email"
                                label={t('email')}
                                rules={[
                                    { required: true, message: t('please_enter_email') },
                                    { type: 'email', message: t('invalid_email') }
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder={t('enter_email')}
                                    size="large"
                                    autoComplete="email"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                label={t('password')}
                                rules={[{ required: true, message: t('please_enter_password') }]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder={t('enter_password')}
                                    size="large"
                                    autoComplete="current-password"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>

                                <Col>
                                    <span
                                        style={{ color: '#21A8C5', fontWeight: 500, cursor: 'pointer' }}
                                        onClick={() => setShowForgot(true)}
                                    >
                                        {t('forgot_password')}
                                    </span>
                                </Col>
                            </Row>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    block
                                    size="large"
                                    loading={loading}
                                    style={{
                                        borderRadius: 24,
                                        fontWeight: 700,
                                        background: 'linear-gradient(90deg, #39C6E5 0%, #21A8C5 100%)',
                                        border: 'none',
                                        fontSize: 18,
                                        boxShadow: '0 2px 8px rgba(33,168,197,0.08)',
                                    }}
                                >
                                    {t('login')}
                                </Button>
                            </Form.Item>
                            {/* New buttons for social login */}
                            <Form.Item>
                                <Button
                                    block
                                    size="large"
                                    icon={
                                        <img
                                            src="https://upload.wikimedia.org/wikipedia/commons/4/4a/Logo_2013_Google.png"
                                            alt="Google"
                                            style={{ width: 50, marginRight: 8 }}
                                        />
                                    }
                                    style={{
                                        marginTop: 12,
                                        borderRadius: 24,
                                        fontWeight: 600,
                                        fontSize: 18,
                                        border: '1px solid #21A8C5',
                                        color: '#000',
                                        boxShadow: '0 2px 8px rgba(33,168,197,0.08)',
                                    }}
                                    onClick={() => window.location.href = `${BASE_API_URL}/oauth2/authorization/google`}
                                >
                                    Login with Google
                                </Button>
                            </Form.Item>
                        </Form>
                        <div style={{ textAlign: 'center', marginTop: 24 }}>
                            <Text style={{ fontSize: 16 }}>
                                {t('no_account')}{' '}
                                <span
                                    style={{
                                        color: '#21A8C5',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        textDecoration: 'underline',
                                    }}
                                    onClick={onSwitchToRegister}
                                >
                                    {t('register_here')}
                                </span>
                            </Text>
                        </div>
                    </Col>
                </Row>
                {/* Modal quên mật khẩu */}
                {showForgot && (
                    <Modal
                        open={showForgot}
                        onCancel={() => setShowForgot(false)}
                        footer={null}
                        centered
                        width={400}
                    >
                        <ForgetPassword
                            onBackToLogin={() => setShowForgot(false)}
                            onShowReset={() => {
                                setShowForgot(false);
                                // Chuyển hướng sang trang ResetPassword
                                window.location.href = "/auth/forgot-password";
                            }}
                        />
                    </Modal>
                )}
            </div>
        </div>
    );
}

Login.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSwitchToRegister: PropTypes.func.isRequired,
};