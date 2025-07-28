import { useState, useEffect } from "react";
import { Form, Input, Button, Typography, Modal } from "antd";
import axios from "axios";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const { Title } = Typography;

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

export default function ForgetPassword({ onBackToLogin, onShowReset }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const isMobile = useIsMobile();

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const res = await axios.post(`${BASE_API_URL}/api/v1/auth/forgot-password`, null, {
                params: { email: values.email }
            });
            if (res.status === 200) {
                onShowReset();
            } else {
                Modal.error({
                    title: t('forgot_password.error'),
                    content: res.data?.data || t('forgot_password.failed_send_email'),
                });
            }
        } catch (err) {
            Modal.error({
                title: t('forgot_password.error'),
                content: err.response?.data?.data || t('forgot_password.failed_send_email'),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: isMobile ? 280 : 320,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: isMobile ? "16px" : 24,
            background: "#fff",
            borderRadius: isMobile ? 12 : 16,
            boxShadow: "0 4px 24px rgba(33,168,197,0.08)",
            maxWidth: isMobile ? "90vw" : 400,
            margin: isMobile ? "20px auto" : "40px auto"
        }}>
            <Title level={isMobile ? 4 : 3} style={{ 
                color: "#21A8C5", 
                marginBottom: isMobile ? 16 : 24,
                fontSize: isMobile ? 20 : 24
            }}>{t('forgot_password.title')}</Title>
            <Form layout="vertical" onFinish={handleSubmit} style={{ width: "100%" }}>
                <Form.Item
                    name="email"
                    label={t('forgot_password.email')}
                    rules={[
                        { required: true, message: t('forgot_password.please_enter_email') },
                        { type: "email", message: t('forgot_password.invalid_email') }
                    ]}
                >
                    <Input placeholder={t('forgot_password.enter_email')} size="large" />
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        loading={loading}
                        style={{
                            borderRadius: 24,
                            fontWeight: 700,
                            background: 'linear-gradient(90deg, #39C6E5 0%, #21A8C5 100%)',
                            border: 'none',
                            fontSize: isMobile ? 16 : 18,
                            height: isMobile ? 44 : 48,
                        }}
                    >
                        {t('forgot_password.send_reset_email')}
                    </Button>
                </Form.Item>
                <Button type="link" block onClick={onBackToLogin}>
                    {t('forgot_password.back_to_login')}
                </Button>
            </Form>
        </div>
    );
}

ForgetPassword.propTypes = {
    onBackToLogin: PropTypes.func,
    onShowReset: PropTypes.func,
};

