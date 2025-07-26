import { useState } from "react";
import { Form, Input, Button, Typography, Modal, Result } from "antd";
import axios from "axios";
import BASE_API_URL from "../services/base.api.url";

const { Title } = Typography;

export default function ResetPassword() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            await axios.patch(`${BASE_API_URL}/api/v1/auth/reset-password/${values.otp}`, null, {
                params: { newPassword: values.newPassword }
            });
            setSuccess(true);
        } catch (err) {
            Modal.error({
                title: "Error",
                content: err.response?.data?.data || "Failed to reset password.",
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "linear-gradient(135deg, #39C6E5 0%, #21A8C5 100%)",
            }}>
                <Result
                    status="success"
                    title="Password Reset Successfully!"
                    subTitle="You can now login with your new password."
                    extra={<Button type="primary" href="/" style={{ borderRadius: 24 }}>Go to Login</Button>}
                    style={{
                        background: "#fff",
                        borderRadius: 24,
                        boxShadow: "0 8px 32px rgba(33,168,197,0.13)",
                        padding: 32,
                        maxWidth: 400,
                        margin: "0 auto"
                    }}
                />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #39C6E5 0%, #21A8C5 100%)",
            padding: 0,
        }}>
            <div style={{
                padding: 32,
                background: "#fff",
                borderRadius: 24,
                boxShadow: "0 8px 32px rgba(33,168,197,0.13)",
                maxWidth: 400,
                width: "100%",
                margin: "0 auto",
            }}>
                <Title level={3} style={{ color: "#21A8C5", marginBottom: 24, textAlign: "center", fontWeight: 800 }}>
                    Reset Password
                </Title>
                <Form layout="vertical" onFinish={handleSubmit} style={{ width: "100%" }}>
                    <Form.Item
                        name="otp"
                        label="OTP Code"
                        rules={[
                            { required: true, message: "Please enter the OTP code sent to your email!" }
                        ]}
                    >
                        <Input placeholder="Enter OTP code" size="large" style={{ borderRadius: 18 }} />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[
                            { required: true, message: "Please enter your new password!" },
                            { min: 6, message: "Password must be at least 6 characters." }
                        ]}
                    >
                        <Input.Password placeholder="Enter new password" size="large" style={{ borderRadius: 18 }} />
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
                                fontSize: 18,
                                boxShadow: '0 2px 8px rgba(33,168,197,0.08)',
                            }}
                        >
                            Reset Password
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
}