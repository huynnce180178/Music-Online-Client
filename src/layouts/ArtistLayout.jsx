import {
    Layout,
    Menu,
    Avatar,
    Dropdown,
    Button,
    Typography,
    Badge,
    Drawer,
    Grid,
    Modal,
    Spin,
    List,
    Empty,
    Tooltip,
    Popconfirm,
} from "antd";
import {
    FiUser,
    FiMusic,
    FiDisc,
    FiLogOut,
    FiBell,
    FiMenu,
    FiVolume2,
    FiArrowLeft,
} from "react-icons/fi";
import { DeleteOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import ProfileDrawer from "../components/ProfileDrawer";
// Import các trang con quản lý bài hát
import { useTranslation } from "react-i18next";
import { GlobalOutlined } from "@ant-design/icons";
import BASE_API_URL from "../services/base.api.url";

const { Sider, Header, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

function NotificationDropdown() {
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unread, setUnread] = useState(0);

    // Ẩn scrollbar cho notification list
    useEffect(() => {
        const style = document.createElement("style");
        style.innerHTML = `
          .notification-list::-webkit-scrollbar { display: none !important; }
          .notification-list { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        `;
        document.head.appendChild(style);
        return () => document.head.removeChild(style);
    }, []);

    // Lấy thông báo & số lượng chưa đọc
    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const [res, unreadRes] = await Promise.all([
                axios.get(`${BASE_API_URL}/api/v1/user/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BASE_API_URL}/api/v1/user/notifications/count-unread`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            // Sort: unread lên trên, đã đọc xuống dưới, cùng trạng thái thì mới nhất lên trên
            const notifis = res.data.data || [];
            notifis.sort((a, b) => {
                if (a.read === b.read) return new Date(b.createdAt) - new Date(a.createdAt);
                return a.read ? 1 : -1;
            });
            setNotifications(notifis);
            setUnread(unreadRes.data.data || 0);
        } catch {
            setNotifications([]);
            setUnread(0);
        }
        setLoading(false);
    };

    useEffect(() => { fetchNotifications(); }, []);

    // Mark as read
    const handleMarkAsRead = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.put(`${BASE_API_URL}/api/v1/user/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications();
        } catch (err) { console.log(err); }
    };

    // Delete 1
    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/user/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications();
        } catch (err) { console.log(err); }
    };

    // Delete all
    const handleClearAll = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/user/notifications/clear`, { headers: { Authorization: `Bearer ${token}` } });
            fetchNotifications();
        } catch (err) { console.log(err); }
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
                        Notifications
                        {notifications.length > 0 && (
                            <Popconfirm
                                title="Clear all notifications?"
                                okText="Clear"
                                cancelText="Cancel"
                                onConfirm={handleClearAll}
                            >
                                <Button type="text" size="small" style={{ color: "#ff616f" }} icon={<DeleteOutlined />} />
                            </Popconfirm>
                        )}
                    </div>
                    <div style={{ margin: "2px 0 12px 24px", fontSize: 14, color: "#8ca0c6", fontWeight: 500 }}>
                        {unread > 0 ? `You have ${unread} unread` : "No new notifications"}
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
                            locale={{ emptyText: <Empty description="No notification" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
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
                                            <Tooltip title="Mark as read" key="mark">
                                                <Button
                                                    type="text"
                                                    icon={<CheckCircleOutlined style={{ color: "#3ed8ff", fontSize: 18 }} />}
                                                    size="small"
                                                    onClick={() => handleMarkAsRead(item.id)}
                                                    style={{ borderRadius: 12 }}
                                                />
                                            </Tooltip>
                                        ),
                                        <Tooltip title="Delete" key="delete">
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
                                                {item.title || "Notification"}
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
            <Badge count={unread} offset={[-6, 8]}>
                <Button
                    type="text"
                    icon={<FiBell color="#3ed8ff" size={24} />}
                    style={{ background: "#232b3e", borderRadius: "50%" }}
                />
            </Badge>
        </Dropdown>
    );
}

// --- ArtistLayout component ---
export default function ArtistLayout({ children }) {
    const location = useLocation();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const isTablet = screens.md && !screens.lg;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showProfile, setShowProfile] = useState(false);

    // State cho switch role
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roles, setRoles] = useState([]);

    const { t, i18n } = useTranslation();

    useEffect(() => {
        if (!isMobile) setDrawerOpen(false);
    }, [isMobile]);

    useEffect(() => {
        const roles = JSON.parse(localStorage.getItem("roles") || "[]");
        setRoles(roles);
        if (!roles.includes("ROLE_ARTIST")) {
            navigate("/");
        }
    }, [navigate]);

    const handleLogout = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch (err) { console.log(err); }
        localStorage.clear();
        navigate("/");
    };

    const handleSwitchRole = (role) => {
        setShowRoleModal(false);
        if (role === "ROLE_ADMIN") window.location.href = "/admin";
        else if (role === "ROLE_ARTIST") window.location.href = "/artist";
        else window.location.href = "/";
    };

    const userMenu = {
        items: [
            {
                key: "profile",
                icon: <FiUser />,
                label: <span onClick={() => setShowProfile(true)}>{t('header.profile')}</span>,
            },
            ...(roles.length > 1
                ? [{
                    key: "switch-role",
                    icon: <FiUser />,
                    label: <span onClick={() => setShowRoleModal(true)}>{t('header.switch_role')}</span>,
                }]
                : []),
            {
                key: "logout",
                icon: <FiLogOut />,
                label: <span onClick={handleLogout}>{t('header.logout')}</span>,
            },
        ],
    };

    const menuItems = [

        {
            label: t('sidebar.song'),
            key: "artist-song-management",
            icon: <FiMusic />,
            children: [
                { label: t('sidebar.all_songs'), key: "/artist/songs" },
                { label: t('sidebar.pending_songs'), key: "/artist/songs/pending" },
                { label: t('sidebar.rejected_songs'), key: "/artist/songs/rejected" },
                { label: t('sidebar.self_deleted_songs'), key: "/artist/songs/deleted" },
                { label: t('sidebar.deleted_by_admin_songs'), key: "/artist/songs/deleted-by-admin" },
            ],
        },
        {
            label: t('sidebar.album'),
            key: "artist-album-management",
            icon: <FiDisc />,
            children: [
                { label: t('sidebar.all_albums'), key: "/artist/albums" },
                { label: t('sidebar.pending_albums'), key: "/artist/albums/pending" },
                { label: t('sidebar.rejected_albums'), key: "/artist/albums/rejected" },
                { label: t('sidebar.deleted_albums'), key: "/artist/albums/deleted" },
                { label: t('sidebar.deleted_by_admin_albums'), key: "/artist/albums/deleted-by-admin" },
            ],
        },
        {
            key: "advertisements-management",
            icon: <FiVolume2 />,
            label: t('sidebar.advertisements_management'),
            children: [
                {
                    key: "/artist/advertisements/approved",
                    label: <Link to="/artist/advertisements/approved" style={{ textDecoration: "none" }}>{t('sidebar.my_advertisements')}</Link>,
                },
                {
                    key: "/artist/rejected",
                    label: <Link to="/artist/rejected" style={{ textDecoration: "none" }}>{t('sidebar.rejected_advertisements')}</Link>,
                },
            ],
        },
    ];

    const sidebarContent = (
        <>
            <div
                style={{
                    height: isMobile ? 48 : 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: isMobile ? 8 : 16,
                }}
            >
                <Avatar
                    size={isMobile ? 36 : 48}
                    style={{
                        background: "linear-gradient(135deg, #3ed8ff 60%, #38bdf8 100%)",
                        color: "#181d36",
                        fontWeight: "bold",
                        fontSize: isMobile ? 20 : 28,
                        cursor: "pointer"
                    }}
                    onClick={() => navigate("/")}
                >
                    AR
                </Avatar>
            </div>
            <Title
                level={isMobile ? 5 : 4}
                style={{
                    color: "#3ed8ff",
                    textAlign: "center",
                    marginBottom: isMobile ? 12 : 24,
                    fontWeight: 700,
                    letterSpacing: 1,
                    cursor: "pointer",
                    fontSize: isMobile ? 18 : undefined,
                }}
                onClick={() => navigate("/")}
            >
                {t('sidebar.artist_panel')}
            </Title>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[location.pathname]}
                style={{
                    background: "transparent",
                    fontWeight: 600,
                    fontSize: isMobile ? 14 : 16,
                }}
                onClick={({ key }) => {
                    if (key.startsWith("/artist")) navigate(key);
                    if (isMobile) setDrawerOpen(false);
                }}
                items={menuItems}
            />
            <style>{`
                .ant-menu-dark .ant-menu-item-selected,
                .ant-menu-dark .ant-menu-submenu-selected {
                    background: linear-gradient(90deg, #3ed8ff 60%, #1fa2ff 100%) !important;
                    color: #181c2b !important;
                    font-weight: 800 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 2px 12px #3ed8ff33;
                }
                .ant-menu-dark .ant-menu-item-selected a {
                    color: #181c2b !important;
                }
                @media (max-width: 768px) {
                    .ant-menu-dark .ant-menu-item,
                    .ant-menu-dark .ant-menu-submenu-title {
                        font-size: 14px !important;
                        padding: 0 12px !important;
                    }
                }
            `}</style>
        </>
    );

    return (
        <Layout style={{
            minHeight: "100vh",
            background: "#181c2b",
            overflow: "hidden",
        }}>
            {!isMobile && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    width={isTablet ? 160 : 220}
                    collapsedWidth={isTablet ? 60 : 80}
                    style={{
                        background: "#181c2b",
                        boxShadow: "4px 0 24px 0 #3ed8ff22",
                        borderRadius: "0 32px 32px 0",
                        position: "fixed",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        height: "100vh",
                        zIndex: 100,
                        padding: 0,
                        overflowY: "auto",
                        overflowX: "hidden",
                        transition: "width 0.3s",
                    }}
                >
                    {sidebarContent}
                </Sider>
            )}

            <Drawer
                placement="left"
                closable={false}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                styles={{
                    body: {
                        padding: 0,
                        background: "#181c2b",
                        overflowY: "auto",
                        overflowX: "hidden"
                    }
                }}
                width={isMobile ? 180 : 220}
            >
                {sidebarContent}
            </Drawer>

            <Layout
                style={{
                    marginLeft: !isMobile ? (collapsed ? (isTablet ? 60 : 80) : (isTablet ? 160 : 220)) : 0,
                    background: "#181c2b",
                    minHeight: "100vh",
                    transition: "margin-left 0.3s",
                    padding: 0,
                }}
            >
                <Header
                    style={{
                        background: "rgba(24,29,54,0.95)",
                        borderBottom: "1px solid #23284a",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: isMobile ? "0 12px" : isTablet ? "0 18px" : "0 32px",
                        height: isMobile ? 52 : 64,
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16 }}>
                        {isMobile && (
                            <Button
                                type="text"
                                icon={<FiMenu size={isMobile ? 18 : 22} />}
                                style={{ color: "#3ed8ff" }}
                                onClick={() => setDrawerOpen(true)}
                            />
                        )}
                        <Button
                            type="text"
                            icon={<FiArrowLeft size={isMobile ? 16 : 20} />}
                            onClick={() => navigate("/")}
                            style={{
                                color: "#3ed8ff",
                                fontWeight: 600,
                                fontSize: isMobile ? 13 : 16,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: "rgba(62,216,255,0.1)",
                                borderRadius: 20,
                                padding: isMobile ? "0 8px" : "0 16px",
                                height: isMobile ? 32 : 40,
                            }}
                        >
                            {!isMobile && t('sidebar.back_to_homepage')}
                        </Button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 6 : 12 }}>
                        {/* NÚT ĐỔI NGÔN NGỮ */}
                        <Dropdown
                            menu={{
                                items: [
                                    { key: 'vi', label: t('header.vi'), onClick: () => { i18n.changeLanguage('vi'); localStorage.setItem('i18nextLng', 'vi'); } },
                                    { key: 'en', label: t('header.en'), onClick: () => { i18n.changeLanguage('en'); localStorage.setItem('i18nextLng', 'en'); } },
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
                                    minWidth: isMobile ? 32 : 44,
                                    fontWeight: 500,
                                    fontSize: isMobile ? 13 : 15,
                                    padding: isMobile ? "0 6px" : "0 12px",
                                }}
                                aria-label={t('languages')}
                            >
                                {i18n.language === 'vi' ? t('header.vi') : t('header.en')}
                            </Button>
                        </Dropdown>
                        {/* THÔNG BÁO ARTIST */}
                        <NotificationDropdown />
                        {/* USER DROPDOWN */}
                        <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                            <Button
                                type="text"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: isMobile ? 6 : 10,
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: isMobile ? 13 : 16,
                                    background: "none",
                                    padding: isMobile ? "0 4px" : undefined,
                                }}
                            >
                                <Avatar
                                    size={isMobile ? 28 : 36}
                                    style={{
                                        background: "#3ed8ff",
                                        color: "#181d36",
                                        fontWeight: 700,
                                        fontSize: isMobile ? 15 : 20,
                                    }}
                                    icon={<FiUser />}
                                />
                                <span style={{ display: isMobile ? "none" : "inline" }}>
                                    {localStorage.getItem("userName") || "Artist"}
                                </span>
                            </Button>
                        </Dropdown>
                    </div>
                </Header>

                <Content
                    style={{
                        padding: isMobile ? 10 : isTablet ? 18 : 30,
                        background: "#101426",
                        minHeight: `calc(100vh - ${isMobile ? 52 : 64}px - 48px)`,
                        boxShadow: "0 4px 24px 0 rgba(62,216,255,0.08)",
                        borderRadius: isMobile ? 0 : 18,
                        transition: "padding 0.3s",
                    }}
                >
                    {children || <Outlet />}
                </Content>
                {/* Modal chọn role hiện đại, đồng bộ với admin và header */}
                <Modal
                    open={showRoleModal}
                    onCancel={() => setShowRoleModal(false)}
                    footer={null}
                    centered
                    title={
                        <span style={{
                            fontWeight: 800,
                            fontSize: isMobile ? 18 : 22,
                            color: "#3ed8ff",
                            letterSpacing: 0.5,
                            textAlign: "center",
                            display: "block"
                        }}>
                            {t('role.select_your_role')}
                        </span>
                    }
                    styles={{ body: { padding: isMobile ? "18px 8px" : "32px 24px" } }}
                >
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: isMobile ? 12 : 24,
                            justifyContent: "center",
                            alignItems: "center",
                            minHeight: isMobile ? 60 : 120,
                        }}
                    >
                        {roles.map(role => {
                            let icon, color, label;
                            switch (role) {
                                case "ROLE_ADMIN":
                                    icon = <FiUser size={isMobile ? 22 : 32} color="#ff416c" />;
                                    color = "linear-gradient(135deg, #ff416c 60%, #ff4b2b 100%)";
                                    label = t('role.admin');
                                    break;
                                case "ROLE_ARTIST":
                                    icon = <FiMusic size={isMobile ? 22 : 32} color="#3ed8ff" />;
                                    color = "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)";
                                    label = t('role.artist');
                                    break;
                                case "ROLE_USER":
                                    icon = <FiUser size={isMobile ? 22 : 32} color="#21A8C5" />;
                                    color = "linear-gradient(135deg, #21A8C5 60%, #39C6E5 100%)";
                                    label = t('role.user');
                                    break;
                                case "ROLE_PREMIUM":
                                    icon = <CheckCircleOutlined style={{ fontSize: isMobile ? 22 : 32, color: "#FFD700" }} />;
                                    color = "linear-gradient(135deg, #FFD700 60%, #CD9B1D 100%)";
                                    label = t('role.premium');
                                    break;
                                default:
                                    icon = <FiUser size={isMobile ? 22 : 32} color="#8ca0c6" />;
                                    color = "linear-gradient(135deg, #8ca0c6 60%, #232b3e 100%)";
                                    label = role.replace("ROLE_", "");
                            }
                            return (
                                <div
                                    key={role}
                                    style={{
                                        minWidth: isMobile ? 90 : 140,
                                        maxWidth: isMobile ? 120 : 180,
                                        background: color,
                                        borderRadius: 18,
                                        boxShadow: "0 4px 24px #3ed8ff22",
                                        padding: isMobile ? "12px 8px" : "24px 18px",
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "center",
                                        cursor: "pointer",
                                        transition: "transform 0.18s, box-shadow 0.18s, background 0.18s",
                                        fontWeight: 700,
                                        fontSize: isMobile ? 14 : 18,
                                        color: "#fff",
                                        position: "relative",
                                    }}
                                    onClick={() => handleSwitchRole(role)}
                                    onMouseOver={e => e.currentTarget.style.transform = "scale(1.06)"}
                                    onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    {icon}
                                    <span style={{
                                        marginTop: isMobile ? 8 : 14,
                                        fontWeight: 800,
                                        fontSize: isMobile ? 14 : 18,
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
                <ProfileDrawer open={showProfile} onClose={() => setShowProfile(false)} />
            </Layout>
        </Layout>
    );
}

ArtistLayout.propTypes = {
    children: PropTypes.node,
};
