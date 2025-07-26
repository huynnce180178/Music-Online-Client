import { FaCreditCard, FaMusic } from "react-icons/fa";
import { useTranslation } from 'react-i18next';

export default function PaymentLayout({ children }) {
    const { t } = useTranslation();
    return (
        <div
            style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #141e30, #243b55)",
                padding: "40px 16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "100%",
                    backgroundColor: "#1b1f2f",
                    borderRadius: "20px",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexWrap: "wrap",
                    overflow: "hidden",
                }}
            >

                {/* Left - Image neatly fit */}
                <div
                    style={{
                        flex: "1 1 50%",
                        minWidth: 400,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src="/img/ListeningToMusic.png"
                        alt="Listening Music"
                        style={{
                            maxWidth: "100%",
                            height: "auto",
                            objectFit: "contain",
                        }}
                    />
                </div>

                {/* Right - Payment form */}
                <div
                    style={{
                        flex: "1 1 50%",
                        minWidth: "400px",
                        padding: "32px 40px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        color: "#fff",
                    }}
                >
                    {/* Header */}
                    <div style={{ textAlign: "center", marginBottom: 24 }}>
                        <h3 style={{ fontSize: 28, marginBottom: 8 }}>
                            <FaMusic style={{ marginRight: 8, color: "#3ed8ff" }} />
                            {t('payment.upgrade_title')}
                        </h3>
                        <p style={{ fontSize: 15, color: "#bbb" }}>
                            {t('payment.upgrade_desc')}
                        </p>
                    </div>

                    {/* Main content (injected from parent) */}
                    <div>{children}</div>

                    {/* Footer */}
                    <div
                        style={{
                            textAlign: "center",
                            marginTop: 32,
                            fontSize: 13,
                            color: "#aaa",
                        }}
                    >
                        <FaCreditCard style={{ marginBottom: -2 }} /> {t('payment.secure_payment')}
                    </div>
                </div>
            </div>
        </div>
    );
}
