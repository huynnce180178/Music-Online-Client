import { useEffect, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { Result, Button, Spin, Input, message } from "antd";
import axios from "axios";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function ActivateAccount() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [status, setStatus] = useState("loading");
    const [messageText, setMessageText] = useState("");
    const [email, setEmail] = useState("");
    const [resending, setResending] = useState(false);

    useEffect(() => {
        // Try to get token from query parameter first, then from path parameter
        let token = searchParams.get("token");
        
        // If no token in query params, try to extract from path
        if (!token) {
            const pathParts = location.pathname.split("/");
            token = pathParts[pathParts.length - 1];
        }
        
        if (!token) {
            setStatus("error");
            setMessageText("No activation token found.");
            return;
        }
        
        // Try both API formats
        const tryActivation = async () => {
            try {
                // First try with query parameter format
                await axios.get(`${BASE_API_URL}/api/v1/auth/activate?token=${token}`);
                setStatus("success");
                setMessageText("Your account has been activated successfully!");
            } catch (error) {
                try {
                    // If that fails, try with path parameter format
                    await axios.get(`${BASE_API_URL}/api/v1/auth/activate/${token}`);
                    setStatus("success");
                    setMessageText("Your account has been activated successfully!");
                } catch (secondError) {
                    setStatus("error");
                    setMessageText("Activation failed or token is invalid/expired.");
                }
            }
        };
        
        tryActivation();
    }, [searchParams, location.pathname]);

    const handleResend = async () => {
        if (!email) {
            message.error("Please enter your email!");
            return;
        }
        setResending(true);
        try {
            await axios.get(`${BASE_API_URL}/api/v1/auth/getTokenRefresh?email=${encodeURIComponent(email)}`);
            message.success("Activation email resent! Please check your inbox.");
        } catch {
            message.error("Failed to resend activation email.");
        }
        setResending(false);
    };

    if (status === "loading") return <Spin size="large" style={{ display: "block", margin: "100px auto" }} />;

    return (
        <Result
            status={status}
            title={status === "success" ? t('active_account.account_activated') : t('active_account.activation_failed')}
            subTitle={messageText}
            extra={
                status === "error" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
                        <Input
                            placeholder="Enter your email to resend activation"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            style={{ width: 260 }}
                        />
                        <Button type="primary" loading={resending} onClick={handleResend}>
                            {t('active_account.resend_activation_email')}
                        </Button>
                        <Button href="/" style={{ marginTop: 8 }}>
                            {t('active_account.go_to_login')}
                        </Button>
                    </div>
                ) : (
                    <Button type="primary" href="/">
                        {t('active_account.go_to_login')}
                    </Button>
                )
            }
        />
    );
}