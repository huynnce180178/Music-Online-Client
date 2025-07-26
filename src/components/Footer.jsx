import { Layout, Row, Col, Button, Input, Space, message } from "antd";
import {
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    FacebookFilled,
    TwitterSquareFilled,
    LinkedinFilled,
    InstagramFilled,
    AndroidOutlined,
    AppleOutlined,
    WindowsOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';

export default function Footer() {
    const { t } = useTranslation();
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const [email, setEmail] = useState("");

    function getBreakpoint() {
        if (window.innerWidth < 600) return "mobile";
        if (window.innerWidth < 1024) return "tablet";
        return "desktop";
    }

    useEffect(() => {
        function handleResize() {
            setBreakpoint(getBreakpoint());
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Responsive style
    const style = {
        footer: {
            background: `linear-gradient(135deg, #181f2a 60%, #233554 100%), url('/img/footer.png') center/cover no-repeat`,
            color: "#fff",
            padding: breakpoint === "mobile"
                ? "32px 0 16px 0"
                : breakpoint === "tablet"
                    ? "48px 0 24px 0"
                    : "72px 0 36px 0",
            width: "100%",
            minHeight: breakpoint === "mobile"
                ? 260
                : breakpoint === "tablet"
                    ? 340
                    : 440,
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
            fontSize: breakpoint === "mobile" ? 14 : 16,
            paddingLeft:
                breakpoint === "mobile"
                    ? 0
                    : (window.innerWidth < 1024
                        ? 40
                        : 20),
        },
        col: {
            marginBottom: breakpoint === "mobile" ? 20 : 0,
            textAlign: breakpoint === "mobile" ? "center" : "left",
        },
        logo: {
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #3ed8ff 60%, #38bdf8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 32,
            color: "#fff",
            marginRight: 14,
            boxShadow: "0 2px 12px rgba(30,40,80,0.16)",
            margin: breakpoint === "mobile" ? "0 auto 10px auto" : "0 14px 0 0",
        },
        brand: {
            fontSize: breakpoint === "mobile" ? 20 : 26,
            fontWeight: 800,
            color: "#fff",
            letterSpacing: 1,
        },
        slogan: {
            color: "#b3b9c9",
            fontSize: breakpoint === "mobile" ? 14 : 16,
            lineHeight: 1.7,
            marginTop: 6,
            fontWeight: 500,
        },
        social: {
            marginTop: 20,
            justifyContent: breakpoint === "mobile" ? "center" : "flex-start",
            width: "100%",
            gap: 12,
        },
        h3: {
            color: "#3ed8ff",
            fontWeight: 700,
            marginBottom: 16,
            fontSize: breakpoint === "mobile" ? 17 : 22,
            letterSpacing: 0.5,
        },
        desc: {
            color: "#b3b9c9",
            fontSize: breakpoint === "mobile" ? 14 : 16,
            marginBottom: 16,
        },
        btn: {
            background: "#232b3e",
            color: "#3ed8ff",
            borderRadius: 16,
            border: "none",
            fontWeight: 500,
            width: breakpoint === "mobile" ? "100%" : 180,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 8,
            fontSize: breakpoint === "mobile" ? 15 : 17,
            justifyContent: "center",
            transition: "background 0.2s, color 0.2s",
            height: breakpoint === "mobile" ? 44 : 48,
            padding: breakpoint === "mobile" ? "0 16px" : "0 20px"
        },
        input: {
            marginBottom: 10,
            borderRadius: 16,
            background: "#232b3e",
            color: "#fff",
            border: "none",
            height: 42,
            fontSize: breakpoint === "mobile" ? 14 : 16,
            width: "100%",
        },
        signupBtn: {
            borderRadius: 20,
            background: "linear-gradient(90deg, #3ed8ff 60%, #1a2235 100%)",
            border: "none",
            fontWeight: 600,
            width: breakpoint === "mobile" ? "100%" : 160,
            height: 42,
            fontSize: breakpoint === "mobile" ? 16 : 19,
            marginTop: 8,
            boxShadow: "0 2px 8px rgba(30,40,80,0.12)",
            color: "#fff",
            transition: "background 0.2s",
        },
        contact: {
            color: "#b3b9c9",
            fontSize: breakpoint === "mobile" ? 14 : 16,
        },
        copyright: {
            borderTop: "1px solid #2a3346",
            marginTop: breakpoint === "mobile" ? 28 : 56,
            paddingTop: breakpoint === "mobile" ? 14 : 28,
            textAlign: "center",
            color: "#b3b9c9",
            fontSize: breakpoint === "mobile" ? 14 : 16,
            letterSpacing: 0.2,
        },
        link: {
            color: "#fff",
            display: "block",
            marginBottom: 10,
            fontWeight: 500,
            fontSize: breakpoint === "mobile" ? 15 : 17,
            textDecoration: "none",
            transition: "color 0.2s",
        },
    };

    // Thêm hiệu ứng hover cho icon mạng xã hội
    const socialIconStyle = {
        fontSize: 28,
        color: "#3ed8ff",
        transition: "transform 0.2s, color 0.2s",
        cursor: "pointer",
    };

    // Thêm animation khi xuất hiện
    const fadeInStyle = {
        animation: "footerFadeIn 0.8s ease",
    };

    // Email subscribe handler
    function handleSubscribe() {
        if (!email || !/\S+@\S+\.\S+/.test(email)) {
            message.error(t('footer.email_invalid'));
            return;
        }
        message.success(t('footer.email_success'));
        setEmail("");
    }

    return (
        <Layout.Footer className="footer" style={{ ...style.footer, ...fadeInStyle }}>
            <style>
                {`
                @keyframes footerFadeIn {
                    from { opacity: 0; transform: translateY(40px);}
                    to { opacity: 1; transform: translateY(0);}
                }
                .footer-social-icon:hover {
                    color: #fff !important;
                    transform: scale(1.18) rotate(-8deg);
                    filter: drop-shadow(0 2px 8px #3ed8ff88);
                }
                .footer-link:hover {
                    color: #3ed8ff !important;
                    text-decoration: underline;
                }
                .footer-btn:hover {
                    background: #3ed8ff !important;
                    color: #181f2a !important;
                }
                .footer-signup-btn:hover {
                    background: linear-gradient(90deg, #38bdf8 60%, #3ed8ff 100%) !important;
                }
                `}
            </style>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                <Row
                    gutter={[breakpoint === "mobile" ? 0 : 32, 32]}
                    align="top"
                    justify="space-between"
                >
                    {/* Logo & Slogan */}
                    <Col xs={24} md={6} style={style.col}>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            flexDirection: breakpoint === "mobile" ? "column" : "row",
                            marginBottom: 14,
                        }}>
                            <div style={style.logo}>
                                {/* SVG logo chuyên nghiệp */}
                                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                    <circle cx="18" cy="18" r="18" fill="#3ed8ff" />
                                    <path d="M12 24V12L24 14V26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="14" cy="24" r="2" fill="#fff" />
                                    <circle cx="22" cy="26" r="2" fill="#fff" />
                                </svg>
                            </div>
                            <span style={style.brand}>Sound Sound</span>
                        </div>
                        <div style={style.slogan}>
                            {t('footer.music_connects')}
                        </div>
                        <Space style={style.social}>
                            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                                <FacebookFilled className="footer-social-icon" style={socialIconStyle} />
                            </a>
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                                <TwitterSquareFilled className="footer-social-icon" style={socialIconStyle} />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                                <LinkedinFilled className="footer-social-icon" style={socialIconStyle} />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                                <InstagramFilled className="footer-social-icon" style={socialIconStyle} />
                            </a>
                        </Space>
                    </Col>

                    {/* Download App */}
                    <Col xs={24} md={6} style={style.col}>
                        <h3 style={style.h3}>{t('footer.download_app')}</h3>
                        <div style={style.desc}>{t('footer.get_best')}</div>
                        <Space direction="vertical" size={12} style={{ width: "100%" }}>
                            <Button className="footer-btn" style={style.btn} icon={<AndroidOutlined style={{ fontSize: 20 }} />}>
                                Google Play
                            </Button>
                            <Button className="footer-btn" style={style.btn} icon={<AppleOutlined style={{ fontSize: 20 }} />}>
                                App Store
                            </Button>
                            <Button className="footer-btn" style={style.btn} icon={<WindowsOutlined style={{ fontSize: 20 }} />}>
                                Windows Store
                            </Button>
                        </Space>
                    </Col>

                    {/* Subscribe Email */}
                    <Col xs={24} md={6} style={style.col}>
                        <h3 style={style.h3}>{t('footer.subscribe')}</h3>
                        <div style={style.desc}>{t('footer.subscribe_desc')}</div>
                        <Input
                            style={style.input}
                            placeholder={t('footer.email_placeholder')}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            type="email"
                        />
                        <Button
                            className="footer-signup-btn"
                            style={style.signupBtn}
                            onClick={handleSubscribe}
                        >
                            {t('footer.signup')}
                        </Button>
                    </Col>

                    {/* Contact */}
                    <Col xs={24} md={6} style={style.col}>
                        <h3 style={style.h3}>{t('footer.contact_us')}</h3>
                        <Space direction="vertical" size={10} style={style.contact}>
                            <div>
                                <PhoneOutlined style={{ color: "#3ed8ff", marginRight: 8 }} />
                                <span>028 2253 8004</span>
                            </div>
                            <div>
                                <MailOutlined style={{ color: "#3ed8ff", marginRight: 8 }} />
                                <span>apimusiconline@gmail.com</span>
                            </div>
                            <div>
                                <EnvironmentOutlined style={{ color: "#3ed8ff", marginRight: 8 }} />
                                <span>24C Đ. Phan Đăng Lưu, Phường 6, Bình Thạnh, Hồ Chí Minh, Việt Nam</span>
                            </div>
                        </Space>
                    </Col>
                </Row>
                <div style={style.copyright}>
                    {t('footer.copyright')}
                </div>
            </div>
        </Layout.Footer>
    );
}