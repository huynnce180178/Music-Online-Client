import { FaCreditCard, FaMusic } from "react-icons/fa";
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

export default function PaymentLayout({ children }) {
    const { t } = useTranslation();

    useEffect(() => {
        const style = document.createElement("style");
        style.textContent = `
        /* Mobile: Hide image, fix dropdown item overflow */
        @media (max-width: 600px) {
            .payment-layout-wrapper {
                flex-direction: column !important;
            }

            .payment-layout-wrapper .payment-image {
                display: none !important;
            }

            .payment-layout-wrapper .payment-content {
                min-width: 100% !important;
                padding: 24px 20px !important;
            }

            .payment-content select {
                width: 100%;
                font-size: 14px;
                padding: 8px 10px;
                border-radius: 6px;
                border: none;
                background-color: #fff;
                color: #000;
                box-sizing: border-box;
                appearance: none;
                outline: none;
                line-height: 1.2;
            }

            .payment-content select option {
                font-size: 14px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                width: 100%;
            }
        }

        @media (min-width: 601px) and (max-width: 1024px) {
            .payment-layout-wrapper {
                flex-direction: column !important;
                min-height: 100vh !important;
                padding: 32px 0 !important;
                align-items: center !important; /* Căn giữa ảnh theo chiều ngang */
            }

            .payment-layout-wrapper .payment-image {
                order: -1;
                width: 60%;
                display: flex !important;
                justify-content: center;
                align-items: center;
                margin-bottom: -100px; /* Giảm khoảng cách với modal */
            }

            .payment-layout-wrapper .payment-image img {
                max-width: 28%;
                height: auto;
                object-fit: contain;
            }

            .payment-layout-wrapper .payment-content {
                width: 90% !important;
                max-width: 100% !important;
                padding: 40px 32px !important;
                margin: 0 auto !important;
            }
        }
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
                className="payment-layout-wrapper"
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
                {/* Left - Image */}
                <div
                    className="payment-image"
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

                {/* Right - Content */}
                <div
                    className="payment-content"
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

                    {/* Injected children */}
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
