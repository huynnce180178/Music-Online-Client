import { Layout, Row, Col, Button, Space } from "antd";
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
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const [breakpoint, setBreakpoint] = useState(getBreakpoint());

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

  const style = {
    footer: {
      background: `linear-gradient(135deg, #181f2a 60%, #233554 100%), url('/img/footer.png') center/cover no-repeat`,
      color: "#fff",
      padding:
        breakpoint === "mobile"
          ? "32px 0 16px 0"
          : breakpoint === "tablet"
          ? "48px 0 24px 0"
          : "72px 0 36px 0",
      width: "100%",
      minHeight:
        breakpoint === "mobile" ? 260 : breakpoint === "tablet" ? 340 : 440,
      fontSize: breakpoint === "mobile" ? 14 : 16,
    },
    col: {
      marginBottom: breakpoint === "mobile" ? 20 : 0,
      textAlign: breakpoint === "mobile" ? "center" : "center", // canh giữa
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
      justifyContent: "center",
      gap: 12,
    },
    h3: {
      color: "#3ed8ff",
      fontWeight: 700,
      marginBottom: 16,
      fontSize: breakpoint === "mobile" ? 17 : 22,
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
      width: breakpoint === "mobile" ? "70%" : 180,
      display: "flex",
      alignItems: "center",
      gap: 8,
      justifyContent: "center",
      margin: "0 auto 8px auto",
    },
    contact: {
      color: "#b3b9c9",
      fontSize: breakpoint === "mobile" ? 14 : 16,
      display: "inline-block",
      textAlign: "left",
    },
    copyright: {
      borderTop: "1px solid #2a3346",
      marginTop: breakpoint === "mobile" ? 28 : 56,
      paddingTop: breakpoint === "mobile" ? 14 : 28,
      textAlign: "center",
      color: "#b3b9c9",
      fontSize: breakpoint === "mobile" ? 14 : 16,
    },
  };

  const socialIconStyle = {
    fontSize: 28,
    color: "#3ed8ff",
    transition: "transform 0.2s, color 0.2s",
    cursor: "pointer",
  };

  return (
    <Layout.Footer style={style.footer}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <Row gutter={[32, 32]} justify="center">
          {/* Logo & Slogan */}
          <Col xs={24} md={8} style={style.col}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={style.logo}>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="18" fill="#3ed8ff" />
                  <path
                    d="M12 24V12L24 14V26"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx="14" cy="24" r="2" fill="#fff" />
                  <circle cx="22" cy="26" r="2" fill="#fff" />
                </svg>
              </div>
              <span style={style.brand}>Melozy</span>
              <div style={style.slogan}>{t("footer.music_connects")}</div>
              <Space style={style.social}>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                  <FacebookFilled style={socialIconStyle} />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                  <TwitterSquareFilled style={socialIconStyle} />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                  <LinkedinFilled style={socialIconStyle} />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                  <InstagramFilled style={socialIconStyle} />
                </a>
              </Space>
            </div>
          </Col>

          {/* Download App */}
          <Col xs={24} md={8} style={style.col}>
            <h3 style={style.h3}>{t("footer.download_app")}</h3>
            <div style={style.desc}>{t("footer.get_best")}</div>
            <Button style={style.btn} icon={<AndroidOutlined style={{ fontSize: 20 }} />}>
              Google Play
            </Button>
            <Button style={style.btn} icon={<AppleOutlined style={{ fontSize: 20 }} />}>
              App Store
            </Button>
            <Button style={style.btn} icon={<WindowsOutlined style={{ fontSize: 20 }} />}>
              Windows Store
            </Button>
          </Col>

          {/* Contact */}
          <Col xs={24} md={8} style={style.col}>
            <h3 style={style.h3}>{t("footer.contact_us")}</h3>
            <div style={style.contact}>
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
                <span>24C Đ. Phan Đăng Lưu, P6, Bình Thạnh, HCM</span>
              </div>
            </div>
          </Col>
        </Row>

        <div style={style.copyright}>{t("footer.copyright")}</div>
      </div>
    </Layout.Footer>
  );
}
