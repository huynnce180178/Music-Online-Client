import { useState, useEffect } from 'react';
import { UserOutlined, MailOutlined, LockOutlined, FileImageOutlined } from '@ant-design/icons';
import { Button, Form, Input, Typography, Row, Col, Upload, Modal } from 'antd';
import PropTypes from 'prop-types';
import axios from 'axios';
import BASE_API_URL from "../services/base.api.url";
import { useTranslation } from 'react-i18next';

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

export default function Register(props) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState([]);
    const isMobile = useIsMobile();

    const [form] = Form.useForm();

    const handleUploadChange = ({ fileList }) => {
        setFileList(fileList.slice(-1)); // keep only 1 file
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append("firstName", values.firstName);
            formData.append("lastName", values.lastName);
            formData.append("email", values.email);
            formData.append("password", values.password);
            formData.append("bio", values.bio || "");
            if (fileList[0]?.originFileObj) {
                formData.append("profilePic", fileList[0].originFileObj);
            }

            const res = await axios.post(`${BASE_API_URL}/api/v1/auth/register`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            if (res.status === 201 || res.data.code === 201) {
                Modal.success({
                    title: "Registration successful!",
                    content: "Please check your email to activate your account.",
                    onOk: props.onSwitchToLogin,
                });
            } else {
                Modal.error({ title: "Registration failed", content: res.data.data || "Registration failed!" });
            }
        } catch (err) {
            Modal.error({ title: "Error", content: err.response?.data?.data || "Server connection error!" });
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
                    maxWidth: 900,
                    width: '100%',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                {/* Close button */}
                <Button
                    type="text"
                    onClick={props.onClose}
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
                <Row style={{ minHeight: 420, width: '100%' }}>
                    {/* Image Section - hidden on mobile */}
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
                                style={{
                                    width: 300,
                                    height: 300,
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 4px 24px rgba(33,168,197,0.18))',
                                }}
                            />
                        </Col>
                    )}
                    {/* Form Section */}
                    <Col
                        xs={24}
                        md={12}
                        style={{
                            padding: isMobile ? '12px 2vw' : '18px 3vw',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            minWidth: 0,
                            minHeight: 340,
                            width: '100%',
                        }}
                    >
                        <Title
                            level={2}
                            style={{
                                textAlign: 'center',
                                color: '#21A8C5',
                                fontWeight: 800,
                                marginBottom: 16,
                                fontSize: isMobile ? 20 : 24,
                            }}
                        >
                            {t('register')}
                        </Title>
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            autoComplete="on"
                            requiredMark={false}
                        >
                            <Form.Item
                                name="firstName"
                                label={t('first_name')}
                                rules={[
                                    { required: true, message: t('please_enter_first_name') },
                                    { min: 2, message: t('first_name_min_length') },
                                    { max: 32, message: t('first_name_max_length') },
                                    { pattern: /^[A-Za-zÀ-ỹ\s'-]+$/, message: t('first_name_invalid') }
                                ]}
                                style={{ marginBottom: 5 }}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder={t('first_name')}
                                    size="large"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="lastName"
                                label={t('last_name')}
                                rules={[
                                    { required: true, message: t('please_enter_last_name') },
                                    { min: 2, message: t('last_name_min_length') },
                                    { max: 32, message: t('last_name_max_length') },
                                    { pattern: /^[A-Za-zÀ-ỹ\s'-]+$/, message: t('last_name_invalid') }
                                ]}
                                style={{ marginBottom: 5 }}
                            >
                                <Input
                                    prefix={<UserOutlined />}
                                    placeholder={t('last_name')}
                                    size="large"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label={t('email')}
                                rules={[
                                    { required: true, message: t('please_enter_email') },
                                    {
                                        pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
                                        message: t('invalid_email')
                                    },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve();
                                            if (/^@/.test(value) || /^[0-9]/.test(value) || /@[0-9]+\./.test(value)) {
                                                return Promise.reject(new Error(t('invalid_email')));
                                            }
                                            return Promise.resolve();
                                        }
                                    }
                                ]}
                                style={{ marginBottom: 5 }}
                            >
                                <Input
                                    prefix={<MailOutlined />}
                                    placeholder={t('enter_email')}
                                    size="large"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="password"
                                label={t('password')}
                                rules={[
                                    { required: true, message: t('please_enter_password') },
                                    { min: 8, message: t('password_min_length') },
                                    { max: 32, message: t('password_max_length') },
                                    { pattern: /[A-Z]/, message: t('password_uppercase') },
                                    { pattern: /[a-z]/, message: t('password_lowercase') },
                                    { pattern: /[0-9]/, message: t('password_number') },
                                    { pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, message: t('password_special') }
                                ]}
                                style={{ marginBottom: 5 }}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder={t('enter_password')}
                                    size="large"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="confirm"
                                label={t('profile.confirm_password')}
                                dependencies={['password']}
                                hasFeedback
                                rules={[
                                    { required: true, message: t('profile.confirm_password_required') },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error(t('profile.passwords_do_not_match')));
                                        },
                                    }),
                                ]}
                                style={{ marginBottom: 5 }}
                            >
                                <Input.Password
                                    prefix={<LockOutlined />}
                                    placeholder={t('profile.confirm_password')}
                                    size="large"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="bio"
                                label={t('profile.bio')}
                                rules={[
                                    { required: true, message: t('profile.bio_placeholder') },
                                    { min: 10, message: t('bio_min_length') },
                                    { max: 200, message: t('bio_max_length') }
                                ]}
                                style={{ marginBottom: 5 }}
                            >
                                <Input
                                    placeholder={t('profile.bio_placeholder')}
                                    size="large"
                                    style={{ borderRadius: 24 }}
                                />
                            </Form.Item>
                            <Form.Item
                                name="profilePic"
                                label={t('profile.avatar')}
                                valuePropName="fileList"
                                getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                                rules={[
                                    {
                                        required: true,
                                        message: t('please_upload_profile_picture'),
                                        validator: (_, value) => {
                                            if (value && value.length > 0) {
                                                const file = value[0];
                                                const isImage = file.type && file.type.startsWith('image/');
                                                const isSizeOk = file.size < 2 * 1024 * 1024;
                                                if (!isImage) return Promise.reject(new Error(t('avatar_only_image')));
                                                if (!isSizeOk) return Promise.reject(new Error(t('avatar_max_size')));
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error(t('please_upload_profile_picture')));
                                        }
                                    }
                                ]}
                                style={{ marginBottom: 10 }}
                            >
                                <Upload
                                    beforeUpload={() => false}
                                    fileList={fileList}
                                    onChange={handleUploadChange}
                                    accept="image/*"
                                    maxCount={1}
                                    listType="picture"
                                >
                                    <Button icon={<FileImageOutlined />}>{t('choose_image')}</Button>
                                </Upload>
                            </Form.Item>
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
                                        fontSize: 16,
                                        boxShadow: '0 2px 8px rgba(33,168,197,0.08)',
                                    }}
                                >
                                    {loading ? t('common.registering') : t('register_now')}
                                </Button>
                            </Form.Item>
                        </Form>
                        <div style={{ textAlign: 'center', marginTop: 10, color: "#21A8C5", fontSize: 14 }}>
                            {t('already_have_account')}{' '}
                            <span
                                style={{
                                    color: '#21A8C5',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                }}
                                onClick={props.onSwitchToLogin}
                            >
                                {t('login_here')}
                            </span>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}

Register.propTypes = {
    onClose: PropTypes.func.isRequired,
    onSwitchToLogin: PropTypes.func.isRequired,
};
