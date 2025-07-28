import {
    Layout,
    Menu,
    Avatar,
    Dropdown,
    Button,
    Typography,
    message,
    Spin,
    Drawer,
    Grid,
    Modal,
} from "antd";
import {
    FiUser,
    FiMusic,
    FiDisc,
    FiUsers,
    FiTag,
    FiMessageCircle,
    FiTrendingUp,
    FiImage,
    FiHome,
    FiLogOut,
    FiMenu,
    FiVolume2,
    FiArrowLeft,
} from "react-icons/fi";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';
import { GlobalOutlined, CheckCircleOutlined } from "@ant-design/icons";
import BASE_API_URL from "../services/base.api.url";

const { Sider, Header, Content } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

export default function AdminLayout({ children }) {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [roles, setRoles] = useState([]);
    const [openKeys, setOpenKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Đừng tự động set openKeys khi chuyển route, chỉ set openKeys mặc định khi lần đầu vào trang
        // Nếu muốn mở đúng group khi load lần đầu, chỉ set openKeys nếu openKeys.length === 0
        if (openKeys.length === 0) {
            if (location.pathname.startsWith("/admin/songs")) {
                setOpenKeys(["song-management"]);
            } else if (location.pathname.startsWith("/admin/albums")) {
                setOpenKeys(["albums-management"]);
            } else if (location.pathname.startsWith("/admin/advertisements")) {
                setOpenKeys(["advertisement-management"]);
            } else if (location.pathname.startsWith("/admin/comments")) {
                setOpenKeys(["comments-management"]);
            }
        }
        // Không else setOpenKeys([]) để không đóng menu cha khi chọn menu con
    }, [location.pathname, openKeys.length]);

    useEffect(() => {
        if (!isMobile) setDrawerOpen(false);
    }, [isMobile]);

    useEffect(() => {
        setRoles(JSON.parse(localStorage.getItem("roles") || "[]"));
    }, []);

    useEffect(() => {
        const roles = JSON.parse(localStorage.getItem("roles") || "[]");
        setRoles(roles);
        if (!roles.includes("ROLE_ADMIN")) {
            message.error("You need to be logged in as an admin to access this page.");
            navigate("/");
        } else {
            setIsLoading(false);
        }
    }, [navigate]);

    // Logout
    const handleLogout = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            await fetch(`${BASE_API_URL}/api/v1/auth/logout`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        } catch (err) { console.log(err); }
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("roles");
        localStorage.removeItem("userId");
        localStorage.removeItem("avatarUrl");
        navigate("/");
    };

    const handleSwitchRole = (role) => {
        setShowRoleModal(false);
        if (role === "ROLE_ADMIN") navigate("/admin");
        else if (role === "ROLE_ARTIST") navigate("/artist");
        else navigate("/");
    };



    const userMenu = {
        items: [
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

    // Danh sách menu sidebar
    const menuItems = [
        { key: "/admin", label: t('sidebar.dashboard'), icon: <FiHome /> },
        { key: "/admin/users", label: t('sidebar.users'), icon: <FiUsers /> },
        {
            label: t('sidebar.song'),
            key: "song-management",
            icon: <FiMusic />,
            children: [
                { label: t('sidebar.all_songs'), key: "/admin/songs" },
                { label: t('sidebar.pending_songs'), key: "/admin/songs/pending" },
                { label: t('sidebar.deleted_by_artist_songs'), key: "/admin/songs/deleted-by-artist" },
                { label: t('sidebar.deleted_by_admin_songs'), key: "/admin/songs/deleted-by-admin" },
            ],
        },
        {
            label: t('sidebar.album'),
            key: "albums-management",
            icon: <FiDisc />,
            children: [
                { label: t('sidebar.all_albums'), key: "/admin/albums" },
                { label: t('sidebar.pending_albums'), key: "/admin/albums/pending" },
                { label: t('sidebar.rejected_albums'), key: "/admin/albums/rejected" },
                { label: t('sidebar.deleted_by_admin_albums'), key: "/admin/albums/deleted-by-admin" },
            ],
        },
        {
            label: t('sidebar.advertisement'),
            key: "advertisement-management",
            icon: <FiVolume2 />,
            children: [
                { label: t('sidebar.all_advertisements'), key: "/admin/advertisements" },
                { label: t('sidebar.pending_advertisements'), key: "/admin/advertisements/pending" },
            ],
        },
        {
            label: t('sidebar.comments'),
            key: "comments-management",
            icon: <FiMessageCircle />,
            children: [
                { label: t('sidebar.all_comments'), key: "/admin/comments" },
                { label: t('sidebar.pending_comments'), key: "/admin/comments/pending" },
                { label: t('sidebar.rejected_comments'), key: "/admin/comments/rejected" },
            ],
        },
        { key: "/admin/genres", label: t('sidebar.genres'), icon: <FiTag /> },
        { key: "/admin/upgrades", label: t('sidebar.upgrades'), icon: <FiTrendingUp /> },
        { key: "/admin/banners", label: t('sidebar.banners'), icon: <FiImage /> },
    ];

    // Helper: xác định selectedKeys cho Menu
    const getMenuSelectedKeys = () => {
        // Nếu là menu con, trả về path của item
        const subMenus = [
            { key: "song-management", paths: ["/admin/songs", "/admin/songs/pending", "/admin/songs/deleted-by-artist", "/admin/songs/deleted-by-admin"] },
            { key: "albums-management", paths: ["/admin/albums", "/admin/albums/pending", "/admin/albums/rejected", "/admin/albums/deleted-by-admin"] },
            { key: "advertisement-management", paths: ["/admin/advertisements", "/admin/advertisements/pending"] },
            { key: "comments-management", paths: ["/admin/comments", "/admin/comments/pending", "/admin/comments/rejected"] },
        ];
        for (const sub of subMenus) {
            if (sub.paths.includes(location.pathname)) return [location.pathname];
        }
        // Nếu là menu cha
        return [location.pathname];
    };

    const sidebarContent = (
        <>
            <div
                style={{
                    height: 64,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                }}
            >
                <Avatar
                    size={48}
                    style={{
                        background: "linear-gradient(135deg, #3ed8ff 60%, #38bdf8 100%)",
                        color: "#181d36",
                        fontWeight: "bold",
                        fontSize: 28,
                        cursor: "pointer"
                    }}
                    onClick={() => navigate("/")}
                >
                    A
                </Avatar>
            </div>
            <Title
                level={4}
                style={{
                    color: "#3ed8ff",
                    textAlign: "center",
                    marginBottom: 24,
                    fontWeight: 700,
                    letterSpacing: 1,
                    cursor: "pointer"
                }}
                onClick={() => navigate("/")}
            >
                {t('sidebar.admin_panel')}
            </Title>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={getMenuSelectedKeys()}
                openKeys={openKeys}
                items={menuItems}
                style={{
                    background: "transparent",
                    fontWeight: 600,
                    overflowY: "auto",
                    overflowX: "hidden",
                    maxHeight: "calc(100vh - 160px)",
                }}
                onClick={({ key }) => {
                    // Nếu là route, điều hướng
                    if (typeof key === "string" && key.startsWith("/admin")) navigate(key);
                    if (isMobile) setDrawerOpen(false);
                }}
                onOpenChange={setOpenKeys}
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
            `}</style>
        </>
    );

    if (isLoading) {
        return (
            <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                background: "#181c2b",
                color: "#3ed8ff"
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <Layout style={{ minHeight: "100vh", background: "#181c2b" }}>
            {!isMobile && (
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    width={220}
                    collapsedWidth={80}
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
                    }}
                >
                    {sidebarContent}
                </Sider>
            )}
            <Drawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                width={220}
                styles={{
                    body: {
                        padding: 0,
                        background: "#181d36",
                    },
                }}
            >
                {sidebarContent}
            </Drawer>
            <Layout
                style={{
                    marginLeft: !isMobile ? (collapsed ? 80 : 220) : 0,
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
                        padding: "0 32px",
                        height: 64,
                        position: "sticky",
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        {isMobile && (
                            <Button
                                type="text"
                                icon={<FiMenu size={22} />}
                                style={{ color: "#3ed8ff" }}
                                onClick={() => setDrawerOpen(true)}
                            />
                        )}
                        <Button
                            type="text"
                            icon={<FiArrowLeft size={20} />}
                            onClick={() => navigate("/")}
                            style={{
                                color: "#3ed8ff",
                                fontWeight: 600,
                                fontSize: 16,
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                background: "rgba(62,216,255,0.1)",
                                borderRadius: 20,
                                padding: "0 16px",
                                height: 40,
                            }}
                        >
                            {!isMobile && t('sidebar.back_to_homepage')}
                        </Button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                                    minWidth: 44,
                                    fontWeight: 500,
                                }}
                                aria-label={t('languages')}
                            >
                                {i18n.language === 'vi' ? t('header.vi') : t('header.en')}
                            </Button>
                        </Dropdown>
                        <Dropdown menu={userMenu} placement="bottomRight" trigger={["click"]}>
                            <Button
                                type="text"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 10,
                                    color: "#fff",
                                    fontWeight: 600,
                                    fontSize: 16,
                                    background: "none",
                                }}
                            >
                                <Avatar
                                    size={36}
                                    style={{
                                        background: "#3ed8ff",
                                        color: "#181d36",
                                        fontWeight: 700,
                                        fontSize: 20,
                                    }}
                                >
                                    {localStorage.getItem("userName")?.charAt(0)?.toUpperCase() || <FiUser />}
                                </Avatar>
                                <span>{localStorage.getItem("userName") || "Admin"}</span>
                            </Button>
                        </Dropdown>
                    </div>
                </Header>
                <Content
                    style={{
                        padding: isMobile ? "16px" : 30,
                        background: "#101426",
                        minHeight: "calc(100vh - 64px - 48px)",
                        boxShadow: "0 4px 24px 0 rgba(62,216,255,0.08)",
                    }}
                >
                    {children || <Outlet />}
                </Content>
                {/* Modal chọn role hiện đại, đồng bộ với artist và header */}
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
                    styles={{ body: { padding: "32px 24px" } }}
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
                                    icon = <FiUser size={32} color="#ff416c" />;
                                    color = "linear-gradient(135deg, #ff416c 60%, #ff4b2b 100%)";
                                    label = t('role.admin');
                                    break;
                                case "ROLE_ARTIST":
                                    icon = <FiMusic size={32} color="#3ed8ff" />;
                                    color = "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)";
                                    label = t('role.artist');
                                    break;
                                case "ROLE_USER":
                                    icon = <FiUser size={32} color="#21A8C5" />;
                                    color = "linear-gradient(135deg, #21A8C5 60%, #39C6E5 100%)";
                                    label = t('role.user');
                                    break;
                                case "ROLE_PREMIUM":
                                    icon = <CheckCircleOutlined style={{ fontSize: 32, color: "#FFD700" }} />;
                                    color = "linear-gradient(135deg, #FFD700 60%, #CD9B1D 100%)";
                                    label = t('role.premium');
                                    break;
                                default:
                                    icon = <FiUser size={32} color="#8ca0c6" />;
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
            </Layout>
        </Layout>
    );
}

AdminLayout.propTypes = {
    children: PropTypes.node,
};

