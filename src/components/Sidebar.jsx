import { useState, useEffect } from 'react';
import { Menu, Button } from "antd";
import {
    HomeOutlined,
    AppstoreOutlined,
    UserOutlined,
    CustomerServiceOutlined,
    CrownOutlined,
    DownloadOutlined,
    HeartOutlined,
    HistoryOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    UnorderedListOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from 'react-i18next';

export default function Sidebar({ collapsed, setCollapsed, visible, setVisible, isMobile }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    // Lấy roles từ localStorage với state để theo dõi thay đổi
    const [roles, setRoles] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("roles") || "[]");
        } catch {
            return [];
        }
    });
    
    const isUser = roles.includes("ROLE_USER");
    
    // Cập nhật roles khi localStorage thay đổi
    useEffect(() => {
        const updateRoles = () => {
            try {
                const newRoles = JSON.parse(localStorage.getItem("roles") || "[]");
                setRoles(newRoles);
            } catch (error) {
                console.error("Error parsing roles from localStorage:", error);
                setRoles([]);
            }
        };

        // Cập nhật roles ban đầu
        updateRoles();

        // Theo dõi thay đổi localStorage
        const handleStorageChange = (e) => {
            if (e.key === "roles") {
                updateRoles();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        
        // Custom event để theo dõi thay đổi trong cùng tab
        const handleRolesChange = () => {
            updateRoles();
        };
        
        window.addEventListener("rolesChanged", handleRolesChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("rolesChanged", handleRolesChange);
        };
    }, []);

    // Tạo menuItems động
    const menuItems = [
        { key: "Home", icon: <HomeOutlined />, label: t('sidebar.home') },
        { key: "albums", icon: <AppstoreOutlined />, label: t('sidebar.albums') },
        { key: "artists", icon: <UserOutlined />, label: t('sidebar.artists') },
        { key: "genres", icon: <CustomerServiceOutlined />, label: t('sidebar.genres') },
        { key: "top-tracks", icon: <CrownOutlined />, label: t('sidebar.top_tracks') },
        // Playlist luôn hiển thị
        { key: "playlists", icon: <UnorderedListOutlined />, label: t('sidebar.playlists') },
        { type: "divider" },
        // Các tab bên dưới chỉ hiển thị với ROLE_USER
        ...(isUser ? [
            { key: "downloads", icon: <DownloadOutlined />, label: t('sidebar.downloads') },
            { key: "favourites", icon: <HeartOutlined />, label: t('sidebar.favourites') },
            { key: "history", icon: <HistoryOutlined />, label: t('sidebar.history') },
        ] : []),
    ];

    // Map pathname to menu key
    const getMenuKey = (pathname) => {
        if (pathname === "/" || pathname === "/home") return "Home";
        if (pathname.startsWith("/albums")) return "albums";
        if (pathname.startsWith("/artists")) return "artists";
        if (pathname.startsWith("/genres")) return "genres";
        if (pathname.startsWith("/top-tracks")) return "top-tracks";
        if (pathname.startsWith("/playlists")) return "playlists"; // Thêm dòng này

        if (pathname.startsWith("/downloads")) return "downloads";
        if (pathname.startsWith("/favourites")) return "favourites";
        if (pathname.startsWith("/history")) return "history";
        return "";
    };

    const selectedKey = getMenuKey(location.pathname);

    // Overlay for mobile
    if (isMobile && visible) {
        document.body.style.overflow = "hidden";
    } else {
        document.body.style.overflow = "";
    }

    // Nếu mobile và chưa mở thì ẩn hoàn toàn
    if (isMobile && !visible) return null;

    return (
        <>
            {/* Overlay cho mobile */}
            {isMobile && visible && (
                <div
                    onClick={() => setVisible(false)}
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        width: "100vw",
                        height: "100vh",
                        background: "rgba(24,31,42,0.55)",
                        zIndex: 1000,
                        transition: "background 0.3s",
                    }}
                />
            )}
            <div
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: "100vh",
                    width: isMobile ? "40vw" : collapsed ? 80 : 200,
                    background: "rgba(24,31,42,0.98)",
                    zIndex: 1001,
                    transition: isMobile
                        ? "transform 0.3s cubic-bezier(.4,0,.2,1)"
                        : "width 0.3s cubic-bezier(.4,0,.2,1)",
                    transform: isMobile && !visible ? "translateX(-100%)" : "none",
                    boxShadow: "4px 0 24px 0 #3ed8ff22, 2px 0 8px rgba(0,0,0,0.10)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",

                }}
            >
                {/* CSS cho hiệu ứng hover và chọn */}
                <style>
                    {`
                    .sidebar-menu .ant-menu-item {
                        border-radius: 8px !important;
                        margin: 0 4px !important;
                        transition: background 0.18s, color 0.18s, transform 0.18s;
                    }
                    .sidebar-menu .ant-menu-item-selected {
                        background: linear-gradient(90deg, #3ed8ff 60%, #38bdf8 100%) !important;
                        color: #181f2a !important;
                        font-weight: 500;
                        box-shadow: 0 2px 12px #3ed8ff33;
                        transform: scale(1.04);
                    }
                    .sidebar-menu .ant-menu-item-selected .anticon {
                        color: #181f2a !important;
                    }
                    .sidebar-menu .ant-menu-item:not(.ant-menu-item-selected):hover {
                        background: #233554 !important;
                        color: #3ed8ff !important;
                        transform: scale(1.03);
                    }
                    .sidebar-menu .ant-menu-item:not(.ant-menu-item-selected):hover .anticon {
                        color: #3ed8ff !important;
                    }
                    .sidebar-menu .ant-menu-item:active {
                        background: #233554 !important;
                        color: #3ed8ff !important;
                    }
                    .sidebar-menu .ant-menu-item:active .anticon {
                        color: #3ed8ff !important;
                    }
                    .sidebar-logo {
                        animation: gradientMove 3s infinite alternate;
                        background: linear-gradient(120deg, #3ed8ff 60%, #38bdf8 100%);
                        background-size: 200% 200%;
                    }
                    @keyframes gradientMove {
                        0% { background-position: 0% 50%; }
                        100% { background-position: 100% 50%; }
                    }
                    .sidebar-logo:hover {
                        box-shadow: 0 0 32px #3ed8ffcc, 0 0 0 4px #38bdf855;
                        transition: box-shadow 0.2s;
                        transform: scale(1.08);
                    }
                    .sidebar-toggle-btn:hover {
                        background: linear-gradient(90deg, #3ed8ff 60%, #38bdf8 100%) !important;
                        color: #181f2a !important;
                        box-shadow: 0 2px 12px #3ed8ff44;
                    }
                    .sidebar-menu .anticon {
                        font-size: 22px !important;
                    }
                    .sidebar-brand-text:hover {
                        filter: brightness(1.2);
                        transform: scale(1.05);
                        transition: all 0.2s;
                    }
                    /* Responsive styles */
                    @media (max-width: 1200px) {
                        .sidebar-menu .ant-menu-item {
                            font-size: 15px !important;
                        }
                        .sidebar-logo {
                            width: 48px !important;
                            height: 48px !important;
                        }
                    }
                    @media (max-width: 900px) {
                        .sidebar-menu .ant-menu-item {
                            font-size: 14px !important;
                        }
                        .sidebar-logo {
                            width: 40px !important;
                            height: 40px !important;
                        }
                        .sidebar-brand-text {
                            font-size: 15px !important;
                        }
                    }
                    @media (max-width: 600px) {
                        .sidebar-menu .ant-menu-item {
                            font-size: 13px !important;
                            padding: 0 8px !important;
                        }
                        .sidebar-logo {
                            width: 32px !important;
                            height: 32px !important;
                        }
                        .sidebar-brand-text {
                            font-size: 12px !important;
                        }
                        .sidebar-toggle-btn {
                            width: 28px !important;
                            height: 28px !important;
                            font-size: 16px !important;
                            margin: 10px !important;
                        }
                        .sidebar-menu {
                            padding-top: 0 !important;
                        }
                        .sidebar-menu .ant-menu-item {
                            margin: 0 2px !important;
                        }
                        .sidebar-menu .anticon {
                            font-size: 18px !important;
                        }
                    }
                    @media (max-width: 400px) {
                        .sidebar-logo {
                            width: 22px !important;
                            height: 22px !important;
                        }
                        .sidebar-brand-text {
                            font-size: 10px !important;
                        }
                        .sidebar-toggle-btn {
                            width: 20px !important;
                            height: 20px !important;
                            font-size: 12px !important;
                        }
                    }
                    `}
                </style>
                {/* Logo và tiêu đề */}
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        padding: "32px 0 16px 0",
                    }}
                >
                    <div
                        className="sidebar-logo"
                        style={{
                            width: 56,
                            height: 56,
                            borderRadius: "50%",
                            background: "linear-gradient(120deg, #3ed8ff 60%, #38bdf8 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 8,
                            boxShadow: "0 0 24px #3ed8ff99",
                            cursor: "pointer",
                            transition: "box-shadow 0.2s, transform 0.2s",
                            animation: "logoPulse 1.5s infinite alternate",
                        }}
                        onClick={() => navigate("/")}
                        title="Go Home"
                    >
                        {/* Animated music bars SVG */}
                        <svg width="32" height="32" viewBox="0 0 32 32">
                            <rect x="4" y="10" width="4" height="12" rx="2" fill="#fff">
                                <animate attributeName="height" values="12;22;12" dur="1s" repeatCount="indefinite" />
                                <animate attributeName="y" values="10;4;10" dur="1s" repeatCount="indefinite" />
                            </rect>
                            <rect x="12" y="6" width="4" height="20" rx="2" fill="#fff" opacity="0.8">
                                <animate attributeName="height" values="20;10;20" dur="1s" repeatCount="indefinite" begin="0.2s" />
                                <animate attributeName="y" values="6;16;6" dur="1s" repeatCount="indefinite" begin="0.2s" />
                            </rect>
                            <rect x="20" y="12" width="4" height="14" rx="2" fill="#fff" opacity="0.6">
                                <animate attributeName="height" values="14;24;14" dur="1s" repeatCount="indefinite" begin="0.4s" />
                                <animate attributeName="y" values="12;2;12" dur="1s" repeatCount="indefinite" begin="0.4s" />
                            </rect>
                        </svg>
                    </div>
                    {!collapsed && (
                        <>
                            <div
                                className="sidebar-brand-text"
                                style={{
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    marginBottom: 8,
                                    letterSpacing: 1,
                                    background: "linear-gradient(90deg, #3ed8ff 60%, #38bdf8 100%)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    animation: "brandGradientMove 3s infinite alternate",
                                    backgroundSize: "200% 200%",
                                }}
                            >
                                Sound Sound
                            </div>
                            <div
                                style={{
                                    color: "#b3b9c9",
                                    fontSize: 12,
                                    fontWeight: 400,
                                    marginBottom: 8,
                                    textAlign: "center",
                                    maxWidth: 120,
                                    lineHeight: 1.3,
                                }}
                            >
                                Music connects emotions
                            </div>
                        </>
                    )}
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    inlineCollapsed={collapsed}
                    className="sidebar-menu"
                    style={{
                        background: "transparent",
                        borderRight: 0,
                        flex: 1,
                        fontSize: 16,
                        paddingTop: 8,
                    }}
                    onClick={({ key }) => {
                        if (key === "Home") navigate("/");
                        else if (key === "albums") navigate("/albums");
                        else if (key === "artists") navigate("/artists");
                        else if (key === "genres") navigate("/genres");
                        else if (key === "top-tracks") navigate("/top-tracks");
                        else if (key === "playlists") navigate("/playlists"); // Thêm dòng này
                        else if (key === "downloads") navigate("/downloads");
                        else if (key === "favourites") navigate("/favourites");
                        else if (key === "history") navigate("/history");
                        // Đóng sidebar nếu là mobile
                        if (isMobile && setVisible) setVisible(false);
                    }}
                />
                <Button
                    type="text"
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={
                        isMobile
                            ? () => setVisible(false)
                            : () => setCollapsed(!collapsed)
                    }
                    className="sidebar-toggle-btn"
                    style={{
                        margin: 20,
                        background: "#3ed8ff",
                        color: "#181f2a",
                        borderRadius: "50%",
                        boxShadow: "0 2px 8px #3ed8ff55",
                        width: 36,
                        height: 36,
                        alignSelf: "center",
                        marginTop: "auto",
                        fontSize: 20,
                        transition: "all 0.2s",
                    }}
                />
            </div>
            <style>
                {`
                @keyframes logoPulse {
                    0% { box-shadow: 0 0 24px #3ed8ff99; }
                    100% { box-shadow: 0 0 48px #3ed8ffcc; }
                }
                @keyframes brandGradientMove {
                    0% { background-position: 0% 50%; }
                    100% { background-position: 100% 50%; }
                }
                `}
            </style>
        </>
    );
}