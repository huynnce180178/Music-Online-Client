import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Result, Button, Spin, Input, message } from "antd";
import axios from "axios";
import { useTranslation } from 'react-i18next';

export default function ActivateAccount() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState("loading");
    const [messageText, setMessageText] = useState("");
    const [email, setEmail] = useState("");
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const token = searchParams.get("token");
        if (!token) {
            setStatus("error");
            setMessageText("No activation token found.");
            return;
        }
        axios.get(`/api/v1/auth/activate/${token}`)
            .then(() => {
                setStatus("success");
                setMessageText("Your account has been activated successfully!");
            })
            .catch(() => {
                setStatus("error");
                setMessageText("Activation failed or token is invalid/expired.");
            });
    }, [searchParams]);

    const handleResend = async () => {
        if (!email) {
            message.error("Please enter your email!");
            return;
        }
        setResending(true);
        try {
            await axios.get(`/api/v1/auth/getTokenRefresh?email=${encodeURIComponent(email)}`);
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