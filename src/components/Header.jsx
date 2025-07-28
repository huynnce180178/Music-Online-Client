import { Layout, Input, Button, Space, Dropdown, Avatar, Modal, Badge, List, Spin, Popconfirm, Tooltip, Empty, message } from "antd";
import { GlobalOutlined, UserOutlined, SearchOutlined, MenuOutlined, LogoutOutlined, BellOutlined, DeleteOutlined, CheckCircleOutlined, AudioOutlined } from "@ant-design/icons";
import { useEffect, useState, useContext, useRef } from "react";
import PropTypes from 'prop-types';
import ProfileDrawer from "../components/ProfileDrawer";
import axios from "axios";
import { PlayerContext } from "../context/PlayerContext";
import SubscriptionModalPlan from "./SubscriptionModalPlan";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

// ----- Notification Dropdown Component -----
function NotificationDropdown() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);
    const { t } = useTranslation();

    // Tối ưu style injection để tránh duplicate
    useEffect(() => {
        const styleId = 'notification-scrollbar-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
              .notification-list::-webkit-scrollbar { display: none !important; }
              .notification-list { scrollbar-width: none !important; -ms-overflow-style: none !important; }
            `;
            document.head.appendChild(style);
        }
        return () => {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle && document.head.contains(existingStyle)) {
                document.head.removeChild(existingStyle);
            }
        };
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                setNotifications([]);
                setUnread(0);
                return;
            }

            const [res, unreadRes] = await Promise.all([
                axios.get(`${BASE_API_URL}/api/v1/user/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_API_URL}/api/v1/user/notifications/count-unread`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const notifis = res.data.data || [];
            notifis.sort((a, b) => {
                if (a.read === b.read) return new Date(b.createdAt) - new Date(a.createdAt);
                return a.read ? 1 : -1;
            });
            setNotifications(notifis);
            setUnread(unreadRes.data.data || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setNotifications([]);
            setUnread(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleMarkAsRead = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                message.error('Authentication required');
                return;
            }
            await axios.put(`${BASE_API_URL}/api/v1/user/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
            message.error('Failed to mark as read');
        }
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                message.error('Authentication required');
                return;
            }
            await axios.delete(`${BASE_API_URL}/api/v1/user/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to delete notification:', error);
            message.error('Failed to delete notification');
        }
    };

    const handleClearAll = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) {
                message.error('Authentication required');
                return;
            }
            await axios.delete(`${BASE_API_URL}/api/v1/user/notifications/clear`, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to clear notifications:', error);
            message.error('Failed to clear all notifications');
        }
    };

    return (
        <Dropdown
            trigger={["click"]}
            placement="bottomRight"
            popupRender={() => (
                <div
                    style={{
                        width: 360,
                        background: "#232b3e",
                        borderRadius: 16,
                        boxShadow: "0 8px 28px #3ed8ff25",
                        color: "#fff",
                        padding: 0,
                        border: "1px solid #232b3e"
                    }}
                >
                    <div style={{
                        padding: "18px 24px 0 24px",
                        fontWeight: 800,
                        fontSize: 20,
                        color: "#3ed8ff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        letterSpacing: 0.5
                    }}>
                        {t('notification.title')}
                        {notifications.length > 0 && (
                            <Popconfirm
                                title={t('notification.clear_all_confirm')}
                                okText={t('notification.clear')}
                                cancelText={t('notification.cancel')}
                                onConfirm={handleClearAll}
                            >
                                <Button type="text" size="small" style={{ color: "#ff616f" }} icon={<DeleteOutlined />} />
                            </Popconfirm>
                        )}
                    </div>
                    <div style={{ margin: "2px 0 12px 24px", fontSize: 14, color: "#8ca0c6", fontWeight: 500 }}>
                        {unread > 0 ? t('notification.unread', { count: unread }) : t('notification.no_new')}
                    </div>
                    <Spin spinning={loading}>
                        <List
                            className="notification-list"
                            style={{
                                background: "none",
                                color: "#fff",
                                maxHeight: 370,
                                overflowY: "auto",
                                paddingRight: 2
                            }}
                            locale={{ emptyText: <Empty description={t('notification.empty')} image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
                            dataSource={notifications}
                            renderItem={item => (
                                <List.Item
                                    style={{
                                        background: item.read ? "#202549" : "#2d47be",
                                        margin: "0 16px 14px 16px",
                                        borderRadius: 14,
                                        borderLeft: item.read ? "4px solid transparent" : "4px solid #3ed8ff",
                                        boxShadow: item.read
                                            ? "none"
                                            : "0 2px 8px #2dbeff28",
                                        position: "relative",
                                        transition: "background .18s",
                                        padding: "20px 20px 12px 24px",
                                        minHeight: 60
                                    }}
                                    actions={[
                                        !item.read && (
                                            <Tooltip title={t('notification.mark_as_read')} key="mark">
                                                <Button
                                                    type="text"
                                                    icon={<CheckCircleOutlined style={{ color: "#3ed8ff", fontSize: 18 }} />}
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(item.id)}
                                                    style={{ borderRadius: 12 }}
                                                />
                                            </Tooltip>
                                        ),
                                        <Tooltip title={t('notification.delete')} key="delete">
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteOutlined />}
                                                size="small"
                                                style={{ borderRadius: 12 }}
                                                onClick={() => handleDelete(item.id)}
                                            />
                                        </Tooltip>
                                    ]}
                                >
                                    {/* Chấm xanh cho unread */}
                                    {!item.read && (
                                        <span
                                            style={{
                                                display: "inline-block",
                                                width: 10,
                                                height: 10,
                                                borderRadius: "50%",
                                                background: "#3ed8ff",
                                                position: "absolute",
                                                left: 10,
                                                top: 24,
                                                boxShadow: "0 0 8px #3ed8ff66"
                                            }}
                                        />
                                    )}
                                    <List.Item.Meta
                                        title={
                                            <span style={{
                                                color: "#fff",
                                                fontWeight: item.read ? 600 : 800,
                                                fontSize: 16,
                                                letterSpacing: 0.2,
                                                display: "block",
                                                marginBottom: 2
                                            }}>
                                                {item.title || t('notification.default_title')}
                                            </span>
                                        }
                                        description={
                                            <span style={{ color: "#c8e8ff", fontSize: 13, fontWeight: 400 }}>
                                                {item.content || item.message}
                                                <br />
                                                <span style={{ color: "#8fa5ca", fontSize: 11 }}>
                                                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ""}
                                                </span>
                                            </span>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Spin>
                </div>
            )}
        >
            <Badge count={unread} offset={[-6, 8]} size="default">
                <Button
                    type="text"
                    icon={<BellOutlined style={{ color: "#3ed8ff", fontSize: 24 }} />}
                    style={{ background: "#232b3e", borderRadius: "50%" }}
                    onClick={fetchNotifications}
                    aria-label={t('notification.title')}
                />
            </Badge>
        </Dropdown>
    );
}

// ----- Main Header Component -----
function Header({ setModalType, onMenuClick, onSearch }) {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 700);
    const [userName, setUserName] = useState(localStorage.getItem("userName"));
    const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("avatarUrl"));
    const [showProfile, setShowProfile] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const [showSpeechModal, setShowSpeechModal] = useState(false);
    const [speechLoading, setSpeechLoading] = useState(false);
    const [recording, setRecording] = useState(false);
    const [speechSupported] = useState(() => !!(window.SpeechRecognition || window.webkitSpeechRecognition));
    const recognitionRef = useRef(null);
    const [roles] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem("roles") || "[]");
        } catch {
            return [];
        }
    });
    const { resetSongCount } = useContext(PlayerContext) || {};
    const { t, i18n } = useTranslation();

    // Style injection với cleanup
    useEffect(() => {
        const styleId = 'header-custom-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement("style");
            style.id = styleId;
            style.innerHTML = `
              .custom-input input::placeholder { color: #fff; }
            `;
            document.head.appendChild(style);
        }

        const handleResize = () => setIsMobile(window.innerWidth < 700);
        window.addEventListener("resize", handleResize);

        return () => {
            const existingStyle = document.getElementById(styleId);
            if (existingStyle && document.head.contains(existingStyle)) {
                document.head.removeChild(existingStyle);
            }
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // Cleanup speech recognition khi unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []);

    // Đồng bộ hóa trạng thái đăng xuất giữa các tab
    useEffect(() => {
        const syncLogout = (e) => {
            if (e.key === "accessToken" && !e.newValue) {
                window.location.href = "/";
            }
        };
        window.addEventListener("storage", syncLogout);
        return () => window.removeEventListener("storage", syncLogout);
    }, []);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchValue.trim()) {
                onSearch(searchValue);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [searchValue, onSearch]);

    // Hàm logout với error handling
    const handleLogout = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        }

        // Clear localStorage regardless of API success
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("roles");
        localStorage.removeItem("userId");
        localStorage.removeItem("avatarUrl");
        localStorage.removeItem("songCount");
        if (resetSongCount) {
            resetSongCount();
        }
        setUserName(null);
        setAvatarUrl(null);
        window.location.href = "/";
    };

    // Dropdown menu cho user
    const hasOnlyUserOrPremium =
        Array.isArray(roles) &&
        roles.length > 0 &&
        roles.every(role => role === "ROLE_USER" || role === "ROLE_PREMIUM");

    const userMenu = {
        items: [
            { key: "profile", label: t('header.profile'), icon: <UserOutlined />, onClick: () => setShowProfile(true) },
            // Chỉ hiển thị nút switch-role nếu user có nhiều role và không chỉ là user/premium
            ...(
                roles.length > 1 && !hasOnlyUserOrPremium
                    ? [{ key: "switch-role", label: t('header.switch_role'), icon: <GlobalOutlined />, onClick: () => setShowRoleModal(true) }]
                    : []
            ),
            { key: "logout", label: t('header.logout'), icon: <LogoutOutlined />, onClick: handleLogout }
        ]
    };

    // Hàm chuyển role
    const handleSwitchRole = (role) => {
        setShowRoleModal(false);
        if (role === "ROLE_ADMIN") window.location.href = "/admin";
        else if (role === "ROLE_ARTIST") window.location.href = "/artist";
        else window.location.href = "/";
    };

    // Speech recognition functions
    const startSpeechRecognition = () => {
        if (!speechSupported) {
            message.error("Your browser does not support speech recognition.");
            return;
        }
        setRecording(true);
        setSpeechLoading(true);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "vi-VN";
        recognition.interimResults = true;
        recognition.continuous = false;
        recognitionRef.current = recognition;

        let finalTranscript = "";

        recognition.onresult = (event) => {
            let interimTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript + " ";
                } else {
                    interimTranscript += transcript;
                }
            }
            setSearchValue((finalTranscript + interimTranscript).trim());
        };

        recognition.onend = () => {
            setRecording(false);
            setSpeechLoading(false);
            setShowSpeechModal(false);
            if (searchValue.trim()) onSearch(searchValue.trim());
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setRecording(false);
            setSpeechLoading(false);
            setShowSpeechModal(false);
            message.error("Speech recognition error!");
        };

        recognition.start();
    };

    const stopSpeechRecognition = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    return (
        <>
            <Layout.Header
                style={{
                    background: "#181f2a",
                    padding: isMobile ? "0 12px" : "0 40px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    height: isMobile ? 56 : 72,
                    zIndex: 10,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        width: "100%",
                        justifyContent: "space-between",
                        gap: isMobile ? 8 : 32,
                    }}
                >
                    {/* Menu button for mobile */}
                    {isMobile && (
                        <Button
                            icon={<MenuOutlined />}
                            style={{
                                borderRadius: "50%",
                                background: "#232b3e",
                                color: "#fff",
                                border: "none",
                                fontSize: 22,
                                minWidth: 40,
                                minHeight: 40,
                                marginRight: 8,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                            onClick={onMenuClick}
                            aria-label="Menu"
                        />
                    )}

                    {/* Search input */}
                    <Input
                        allowClear
                        placeholder={t('search.placeholder')}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onPressEnter={() => onSearch(searchValue)}
                        suffix={
                            <Space>
                                <SearchOutlined style={{ cursor: "pointer" }} onClick={() => onSearch(searchValue)} />
                                <AudioOutlined
                                    style={{ cursor: "pointer", color: "#3ed8ff", fontSize: 20 }}
                                    onClick={() => {
                                        setShowSpeechModal(true);
                                        if (!recording && speechSupported) {
                                            startSpeechRecognition();
                                        }
                                    }}
                                />
                            </Space>
                        }
                        style={{
                            width: isMobile ? 160 : 320,
                            borderRadius: 24,
                            background: "#232b3e",
                            color: "#fff",
                            fontSize: isMobile ? 13 : 16
                        }}
                        className="custom-input"
                        aria-label="Search"
                    />

                    {/* Speech Modal */}
                    <Modal
                        open={showSpeechModal}
                        onCancel={() => {
                            setShowSpeechModal(false);
                            setRecording(false);
                            stopSpeechRecognition();
                        }}
                        footer={null}
                        centered
                        title="Search by Voice"
                    >
                        <div style={{ textAlign: "center", marginBottom: 16 }}>
                            <b>Speak and your text will appear in the search box</b>
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16 }}>
                            {recording && (
                                <Button
                                    type="danger"
                                    icon={<AudioOutlined />}
                                    onClick={stopSpeechRecognition}
                                    disabled={speechLoading}
                                >
                                    Stop Recording
                                </Button>
                            )}
                        </div>
                        <div style={{ textAlign: "center", marginTop: 8, minHeight: 32, fontSize: 18, color: "#3ed8ff", fontWeight: 700 }}>
                            {searchValue}
                        </div>
                        {speechLoading && (
                            <div style={{ textAlign: "center", marginTop: 16 }}>
                                <Spin /> Listening...
                            </div>
                        )}
                        {!speechSupported && (
                            <div style={{ color: "red", textAlign: "center", marginTop: 12 }}>
                                Your browser does not support speech recognition.
                            </div>
                        )}
                    </Modal>

                    {/* Right side buttons */}
                    <Space size={isMobile ? 4 : 16}>
                        {/* Nút chuyển đổi ngôn ngữ */}
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'vi', label: t('header.vi'), onClick: () => i18n.changeLanguage('vi') },
                                    { key: 'en', label: t('header.en'), onClick: () => i18n.changeLanguage('en') },
                                ],
                            }}
                            placement="bottomRight"
                        >
                            <Button
                                icon={<GlobalOutlined />}
                                style={{
                                    borderRadius: 20,
                                    background: '#232b3e',
                                    color: '#fff',
                                    border: 'none',
                                    minWidth: isMobile ? 36 : 44,
                                    fontWeight: 500,
                                }}
                                aria-label={t('header.languages')}
                            >
                                {!isMobile && (i18n.language === 'vi' ? t('header.vi') : t('header.en'))}
                            </Button>
                        </Dropdown>
                        {/* Premium button styles */}
                        <style>
                            {`
                            .gold-premium-btn {
                                transition: 
                                    transform 0.22s cubic-bezier(.4,2,.3,1), 
                                    box-shadow 0.22s, 
                                    background 0.22s;
                                box-shadow: 0 0 12px #FFD70088;
                                position: relative;
                                overflow: hidden;
                            }
                            .gold-premium-btn::after {
                                content: "";
                                position: absolute;
                                left: -60%;
                                top: 0;
                                width: 220%;
                                height: 100%;
                                background: linear-gradient(120deg, transparent 60%, #fff8 100%);
                                opacity: 0.3;
                                transform: skewX(-24deg);
                                transition: left 0.5s;
                                pointer-events: none;
                            }
                            .gold-premium-btn:hover {
                                transform: scale(1.09) rotate(-1deg);
                                box-shadow: 0 0 40px #FFD700cc, 0 0 12px #CD9B1D99;
                                filter: brightness(1.12);
                                background: linear-gradient(90deg, #FFD700 60%, #CD9B1D 100%);
                            }
                            .gold-premium-btn:hover::after {
                                left: 100%;
                            }
                            `}
                        </style>

                        {/* Premium button - only show if not premium */}
                        {userName && Array.isArray(roles) && !roles.includes("ROLE_PREMIUM") && (
                            <Tooltip title={t('header.upgrade_now')}>
                                <Button
                                    type="primary"
                                    className="gold-premium-btn"
                                    style={{
                                        background: "linear-gradient(90deg, #FFD700 60%, #CD9B1D 100%)",
                                        color: "#181d36",
                                        border: "none",
                                        borderRadius: 20,
                                        fontWeight: 700,
                                        boxShadow: "0 0 12px #FFD70088",
                                        padding: isMobile ? 0 : "0 18px",
                                        minWidth: isMobile ? 36 : 110,
                                        position: "relative",
                                        overflow: "hidden",
                                    }}
                                    onClick={() => setShowSubscriptionModal(true)}
                                >
                                    {!isMobile && "GO PREMIUM"}
                                    {isMobile && <span style={{ fontWeight: 700 }}>★</span>}
                                </Button>
                            </Tooltip>
                        )}

                        {/* Notification bell */}
                        {userName && <NotificationDropdown />}

                        {/* User menu or login/register */}
                        {userName ? (
                            <Dropdown menu={userMenu} placement="bottomRight">
                                <Button
                                    style={{
                                        borderRadius: 20,
                                        background: "#232b3e",
                                        color: "#fff",
                                        border: "none",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: isMobile ? 0 : "0 16px",
                                        minWidth: isMobile ? 36 : 80,
                                    }}
                                >
                                    <Avatar
                                        icon={<UserOutlined />}
                                        src={avatarUrl || undefined}
                                        style={{ background: "#3ed8ff", color: "#181d36" }}
                                    />
                                    {!isMobile && userName}
                                </Button>
                            </Dropdown>
                        ) : (
                            <>
                                {!isMobile && (
                                    <Button
                                        ghost
                                        style={{
                                            borderRadius: 20,
                                            borderColor: "#3ed8ff",
                                            color: "#3ed8ff",
                                            fontWeight: 500,
                                        }}
                                        onClick={() => setModalType("register")}
                                    >
                                        {t('header.register')}
                                    </Button>
                                )}
                                <Button
                                    type="primary"
                                    icon={<UserOutlined />}
                                    style={{
                                        borderRadius: 20,
                                        background: "linear-gradient(90deg, #3ed8ff 60%, #1a2235 100%)",
                                        border: "none",
                                        fontWeight: 500,
                                        padding: isMobile ? 0 : "0 16px",
                                        minWidth: isMobile ? 36 : 80,
                                    }}
                                    onClick={() => setModalType("login")}
                                >
                                    {!isMobile && t('header.login')}
                                </Button>
                            </>
                        )}
                    </Space>
                </div>
            </Layout.Header>

            {/* Modals and Drawers */}
            <ProfileDrawer open={showProfile} onClose={() => setShowProfile(false)} />

            <Modal
                open={showRoleModal}
                onCancel={() => setShowRoleModal(false)}
                footer={null}
                centered
                title={
                    <span style={{
                        fontWeight: 800,
                        fontSize: 22,
                        color: "#3ed8ff",
                        letterSpacing: 0.5,
                        textAlign: "center",
                        display: "block"
                    }}>
                        {t('role.select_your_role')}
                    </span>
                }
                style={{ padding: "32px 24px" }}
            >
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 24,
                        justifyContent: "center",
                        alignItems: "center",
                        minHeight: 120,
                    }}
                >
                    {roles.map(role => {
                        let icon, color, label;
                        switch (role) {
                            case "ROLE_ADMIN":
                                icon = <UserOutlined style={{ fontSize: 32, color: "#ff416c" }} />;
                                color = "linear-gradient(135deg, #ff416c 60%, #ff4b2b 100%)";
                                label = t('role.admin');
                                break;
                            case "ROLE_ARTIST":
                                icon = <AudioOutlined style={{ fontSize: 32, color: "#3ed8ff" }} />;
                                color = "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)";
                                label = t('role.artist');
                                break;
                            case "ROLE_USER":
                                icon = <UserOutlined style={{ fontSize: 32, color: "#21A8C5" }} />;
                                color = "linear-gradient(135deg, #21A8C5 60%, #39C6E5 100%)";
                                label = t('role.user');
                                break;
                            case "ROLE_PREMIUM":
                                icon = <CheckCircleOutlined style={{ fontSize: 32, color: "#FFD700" }} />;
                                color = "linear-gradient(135deg, #FFD700 60%, #CD9B1D 100%)";
                                label = t('role.premium');
                                break;
                            default:
                                icon = <UserOutlined style={{ fontSize: 32, color: "#8ca0c6" }} />;
                                color = "linear-gradient(135deg, #8ca0c6 60%, #232b3e 100%)";
                                label = role.replace("ROLE_", "");
                        }
                        return (
                            <div
                                key={role}
                                style={{
                                    minWidth: 140,
                                    maxWidth: 180,
                                    background: color,
                                    borderRadius: 18,
                                    boxShadow: "0 4px 24px #3ed8ff22",
                                    padding: "24px 18px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    cursor: "pointer",
                                    transition: "transform 0.18s, box-shadow 0.18s, background 0.18s",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    color: "#fff",
                                    position: "relative",
                                }}
                                onClick={() => handleSwitchRole(role)}
                                onMouseOver={e => e.currentTarget.style.transform = "scale(1.06)"}
                                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                            >
                                {icon}
                                <span style={{
                                    marginTop: 14,
                                    fontWeight: 800,
                                    fontSize: 18,
                                    letterSpacing: 0.5,
                                    textShadow: "0 2px 8px #181f2a88"
                                }}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            <SubscriptionModalPlan
                show={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />
        </>
    );
}

// PropTypes validation
Header.propTypes = {
    setModalType: PropTypes.func.isRequired,
    onMenuClick: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
};

export default Header;