import { useEffect, useState, useCallback, useMemo } from "react";
import { Button, Modal, Form, Input, Switch, message, Popconfirm, Upload, Tooltip, Dropdown, Menu, Tabs } from "antd";
import { UploadOutlined, EditOutlined, DeleteOutlined, PlusOutlined, PlayCircleFilled, MoreOutlined, PlusCircleOutlined } from "@ant-design/icons";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

const PLAYLIST_API = `${BASE_API_URL}/api/v1/user/playlist`;

export default function PlaylistPage() {
    const { t } = useTranslation();
    const [playlists, setPlaylists] = useState([]);
    const [publicPlaylists, setPublicPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form] = Form.useForm();
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [songsDrawerOpen, setSongsDrawerOpen] = useState(false);
    const [songsInPlaylist] = useState([]);
    const [selectedPlaylist] = useState(null);
    const [ageGroupPlaylist, setAgeGroupPlaylist] = useState(null);
    const [shareCodeModal, setShareCodeModal] = useState({ open: false, code: "", loading: false });
    const [dropdownOpenId, setDropdownOpenId] = useState(null); // Thêm state này
    const [sharedPlaylists, setSharedPlaylists] = useState([]);
    const [shareCodeInput, setShareCodeInput] = useState("");
    const [shareCodeLoading, setShareCodeLoading] = useState(false);
    const [showShareInput, setShowShareInput] = useState(false);
    // Thêm state này để điều khiển modal nhập code
    const [shareInputModalOpen, setShareInputModalOpen] = useState(false);

    const navigate = useNavigate();

    const token = useMemo(() => localStorage.getItem("accessToken"), []);
    const roles = useMemo(() => JSON.parse(localStorage.getItem("roles") || "[]"), []);
    const isUser = useMemo(() => roles.includes("ROLE_USER"), [roles]);

    // Fetch playlists
    const fetchPlaylists = useCallback(async (showError = false) => {
        setLoading(true);
        try {
            const { data } = await axios.get(PLAYLIST_API, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPlaylists(data.data || []);
        } catch {
            if (showError) message.error("Failed to load playlists!");
        } finally {
            setLoading(false);
        }
    }, [token]);

    // Fetch public playlists
    const fetchPublicPlaylists = useCallback(async () => {
        try {
            const { data } = await axios.get(`${BASE_API_URL}/api/v1/guest/public/playlists`);
            setPublicPlaylists(data.data || []);
        } catch {
            message.error("Failed to load public playlists!");
        }
    }, []);

    const fetchAgeGroupPlaylist = useCallback(async () => {
        try {
            const { data } = await axios.get(`${BASE_API_URL}/api/v1/user/playlist/age-group`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAgeGroupPlaylist(data.data || null);
        } catch {
        }
    }, [token]);

    // Fetch shared playlists
    const fetchSharedPlaylists = useCallback(async () => {
        try {
            const { data } = await axios.get(`${BASE_API_URL}/api/v1/user/playlist/received-shares`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSharedPlaylists(data.data || []);
        } catch {
            message.error("Failed to load shared playlists!");
        }
    }, [token]);

    // Effect: fetch playlists on mount & interval
    useEffect(() => {
        if (!isUser) return;
        fetchPlaylists(true);
        const interval = setInterval(() => fetchPlaylists(false), 5000);
        const onFocus = () => fetchPlaylists(false);
        window.addEventListener("focus", onFocus);
        return () => {
            clearInterval(interval);
            window.removeEventListener("focus", onFocus);
        };
    }, [isUser, fetchPlaylists]);

    useEffect(() => {
        fetchPublicPlaylists();
    }, [fetchPublicPlaylists]);

    // Tab change handler
    const [activeTab, setActiveTab] = useState(isUser ? "my" : "public");
    useEffect(() => {
        if (activeTab === "age-group") {
            fetchAgeGroupPlaylist();
        }
    }, [activeTab, fetchAgeGroupPlaylist]);

    // Add playlist
    const openAddModal = useCallback(() => {
        setEditing(null);
        form.resetFields();
        setImageFile(null);
        setPreviewUrl("");
        setModalOpen(true);
    }, [form, setImageFile, setPreviewUrl]);

    // Edit playlist
    const openEditModal = useCallback((playlist) => {
        setEditing(playlist);
        form.setFieldsValue({
            name: playlist.name,
            description: playlist.description,
            isPublic: playlist.isPublic,
        });
        setPreviewUrl(playlist.imageUrl || "");
        setImageFile(null);
        setModalOpen(true);
    }, [form, setImageFile, setPreviewUrl]);

    // Delete playlist
    const handleDelete = useCallback(async (id) => {
        console.log("Deleting playlist id:", id);
        setLoading(true);
        try {
            await axios.delete(`${PLAYLIST_API}/delete/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Deleted playlist!");
            fetchPlaylists();
        } catch (err) {
            console.error(err);
            message.error("Delete failed!");
        } finally {
            setLoading(false);
        }
    }, [token, fetchPlaylists]);

    // Save (add/edit) playlist
    const handleModalOk = useCallback(async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("description", values.description || "");
            formData.append("isPublic", values.isPublic ? "true" : "false");

            if (editing) {
                // Nếu có chọn ảnh mới thì mới append
                if (values.image && values.image[0]) {
                    formData.append("imageUrl", values.image[0].originFileObj);
                }
                await axios.put(`${PLAYLIST_API}/update/${editing.id}`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                message.success("Playlist updated!");
            } else {
                if (!values.image || !values.image[0]) {
                    message.error("Please select an image!");
                    setLoading(false);
                    return;
                }
                formData.append("imageUrl", values.image[0].originFileObj);
                await axios.post(`${PLAYLIST_API}/add`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                });
                message.success("Playlist created!");
            }
            setModalOpen(false);
            fetchPlaylists();
        } catch (err) {
            if (err.response && err.response.data) {
                message.error(err.response.data.message || "Save failed!");
            } else {
                message.error("Save failed!");
            }
        } finally {
            setLoading(false);
        }
    }, [form, editing, token, fetchPlaylists]);

    // Set public/private
    const handleSetPublic = useCallback(async (playlist, isPublic) => {
        setLoading(true);
        try {
            await axios.put(`${PLAYLIST_API}/set-public/${playlist.id}?isPublic=${isPublic}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Updated public status!");
            fetchPlaylists();
        } catch {
            message.error("Update failed!");
        } finally {
            setLoading(false);
        }
    }, [token, fetchPlaylists]);

    // Hàm lấy mã chia sẻ playlist
    const handleGenerateShareCode = useCallback(async (playlistId) => {
        setShareCodeModal({ open: true, code: "", loading: true });
        setDropdownOpenId(null); // Đóng dropdown khi mở modal
        try {
            const { data } = await axios.get(`${BASE_API_URL}/api/v1/user/playlist/share-code`, {
                params: { playlistId },
                headers: { Authorization: `Bearer ${token}` }
            });
            setShareCodeModal({ open: true, code: data.data, loading: false });
        } catch (err) {
            setShareCodeModal({ open: false, code: "", loading: false });
            message.error("Failed to generate share code!");
        }
    }, [token]);

    // Nhận playlist qua mã share
    const handleReceiveShare = useCallback(async () => {
        if (!shareCodeInput.trim()) {
            message.error("Please enter a share code!");
            return;
        }
        setShareCodeLoading(true);
        try {
            await axios.post(`${BASE_API_URL}/api/v1/user/playlist/receive-share`, null, {
                params: { shareCode: shareCodeInput.trim() },
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Received shared playlist!");
            setShareCodeInput("");
            setShowShareInput(false);
            fetchSharedPlaylists();
        } catch (err) {
            message.error(err?.response?.data?.message || "Failed to receive playlist!");
        } finally {
            setShareCodeLoading(false);
        }
    }, [shareCodeInput, token, fetchSharedPlaylists]);

    // Load shared playlists khi vào tab my
    useEffect(() => {
        if (isUser && activeTab === "my") {
            fetchSharedPlaylists();
        }
    }, [isUser, activeTab, fetchSharedPlaylists]);

    return (
        <div style={{ width: "100%", background: "#181c2b", minHeight: "100vh", paddingBottom: 64 }}>
            {/* Header */}
            <div style={{
                maxWidth: 1400, margin: "0 auto", padding: "40px 24px 16px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
                <span style={{
                    color: "#3ed8ff", fontWeight: 800, fontSize: 36,
                    fontFamily: "'Quicksand', 'Montserrat', sans-serif", letterSpacing: 1,
                }}>{t('playlist.playlists')}</span>
            </div>
            {/* Tabs: Cá nhân & Cộng đồng */}
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                tabBarStyle={{
                    background: "#181c2b",
                    borderBottom: "1px solid #3ed8ff33",
                    marginBottom: 24,
                    paddingLeft: 24,
                }}
                items={[
                    ...(isUser ? [{
                        key: "my",
                        label: t('playlist.my_playlists'),
                        children: (
                            <div className="container py-4">
                                {/* Nút nhập code chia sẻ */}
                                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                                    <Button
                                        icon={<PlusCircleOutlined />}
                                        type="primary"
                                        style={{
                                            background: "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)",
                                            fontWeight: 700,
                                            border: "none",
                                            borderRadius: 8,
                                            fontSize: 16,
                                            boxShadow: "0 2px 12px #3ed8ff55",
                                        }}
                                        onClick={() => setShareInputModalOpen(true)}
                                    >
                                        {t('playlist.add_shared_playlist')}
                                    </Button>
                                </div>
                                {/* Xóa form nhập code inline, thay bằng modal phía dưới */}
                                {/* Danh sách playlist cá nhân */}
                                <div className="row justify-content-center g-3">
                                    {playlists.length === 0 && sharedPlaylists.length === 0 ? (
                                        <div style={{ color: "#8ca0c6", textAlign: "center", width: "100%", marginTop: 32 }}>
                                            {t('playlist.no_playlists')}
                                        </div>
                                    ) : (
                                        <>
                                            {playlists.map((playlist) => (
                                                <div key={playlist.id} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex ">
                                                    <div
                                                        className={`playlist-card${!playlist.isPublic ? " playlist-card-private" : ""}`}
                                                        style={{
                                                            width: 300,
                                                            height: 300,
                                                            aspectRatio: "1/1",
                                                            background: "#23283e",
                                                            borderRadius: 24,
                                                            boxShadow: "0 8px 32px #3ed8ff33",
                                                            position: "relative",
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            transition: "box-shadow 0.2s, transform 0.2s"
                                                        }}
                                                        onClick={() => navigate(`/playlist/${playlist.id}/songs`)}
                                                    >
                                                        {/* Playlist Image */}
                                                        <img
                                                            src={playlist.imageUrl || "/img/default-cover.png"}
                                                            alt={playlist.name}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                borderRadius: 24,
                                                                transition: "filter 0.2s"
                                                            }}
                                                            className="playlist-img"
                                                        />
                                                        {/* Overlay */}
                                                        <div style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            background: "linear-gradient(0deg, #181c2bcc 10%, #181c2b00 100%)",
                                                            zIndex: 1,
                                                            pointerEvents: "none"
                                                        }} />
                                                        {/* Play button on hover */}
                                                        <Button
                                                            shape="circle"
                                                            icon={<PlayCircleFilled style={{ fontSize: 40 }} />}
                                                            size="large"
                                                            style={{
                                                                position: "absolute",
                                                                left: "50%",
                                                                top: "50%",
                                                                transform: "translate(-50%, -50%)",
                                                                background: "#fff",
                                                                color: "#23242b",
                                                                border: "none",
                                                                boxShadow: "0 2px 8px #0003",
                                                                opacity: 0,
                                                                transition: "opacity 0.2s"
                                                            }}
                                                            className="playlist-play-btn"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                navigate(`/playlist/${playlist.id}/songs`);
                                                            }}
                                                        />
                                                        {/* Playlist Info */}
                                                        <div style={{
                                                            position: "absolute",
                                                            left: 0,
                                                            bottom: 0,
                                                            width: "100%",
                                                            zIndex: 2,
                                                            color: "#fff",
                                                            fontWeight: 700,
                                                            fontSize: 18,
                                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                            textShadow: "0 2px 8px #181f2a88",
                                                            padding: "20px 18px 16px 18px",
                                                            background: "linear-gradient(0deg, #181c2bcc 80%, #181c2b00 100%)"
                                                        }}>
                                                            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{playlist.name}</div>
                                                            <div style={{
                                                                fontWeight: 400,
                                                                fontSize: 14,
                                                                color: "#8ca0c6",
                                                                marginBottom: 6,
                                                                minHeight: 32,
                                                                maxHeight: 32,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis"
                                                            }}>
                                                                {playlist.description}
                                                            </div>
                                                            <div style={{ fontSize: 15, color: "#3ed8ff", fontWeight: 600 }}>
                                                                {playlist.songs?.length || 0} {t('playlist.songs', { count: playlist.songs?.length || 0 })}
                                                            </div>
                                                        </div>
                                                        {/* Action Buttons: Dropdown dấu 3 chấm */}
                                                        <div style={{
                                                            position: "absolute",
                                                            top: 14,
                                                            right: 14,
                                                            zIndex: 3,
                                                            display: "flex",
                                                            gap: 10,
                                                        }}>
                                                            <Dropdown
                                                                trigger={["click"]}
                                                                open={dropdownOpenId === playlist.id}
                                                                onOpenChange={open => setDropdownOpenId(open ? playlist.id : null)}
                                                                overlay={
                                                                    <Menu>
                                                                        <Menu.Item
                                                                            key="edit"
                                                                            disabled={shareCodeModal.open}
                                                                            onClick={e => {
                                                                                e.domEvent.stopPropagation();
                                                                                openEditModal(playlist);
                                                                            }}
                                                                        >
                                                                            <EditOutlined /> {t('playlist.edit')}
                                                                        </Menu.Item>
                                                                        <Menu.Item key="delete" disabled={shareCodeModal.open}>
                                                                            <Popconfirm
                                                                                title={t('playlist.delete_confirm')}
                                                                                onConfirm={e => {
                                                                                    if (e && e.stopPropagation) e.stopPropagation();
                                                                                    handleDelete(playlist.id);
                                                                                }}
                                                                                okText={t('playlist.delete')}
                                                                                cancelText={t('playlist.cancel')}
                                                                            >
                                                                                <span
                                                                                    style={{ color: "#ff416c", display: "flex", alignItems: "center" }}
                                                                                    onClick={e => {
                                                                                        if (e && e.stopPropagation) e.stopPropagation();
                                                                                    }}
                                                                                >
                                                                                    <DeleteOutlined style={{ marginRight: 8 }} /> {t('playlist.delete')}
                                                                                </span>
                                                                            </Popconfirm>
                                                                        </Menu.Item>
                                                                        <Menu.Item key="public" disabled={shareCodeModal.open}>
                                                                            <span
                                                                                style={{ display: "flex", alignItems: "center" }}
                                                                                onClick={e => {
                                                                                    if (e && e.stopPropagation) e.stopPropagation();
                                                                                }}
                                                                            >
                                                                                <Switch
                                                                                    checked={playlist.isPublic}
                                                                                    size="small"
                                                                                    onChange={checked => handleSetPublic(playlist, checked)}
                                                                                    style={{ background: playlist.isPublic ? "#3ed8ff" : "#888" }}
                                                                                    onClick={e => {
                                                                                        if (e && e.stopPropagation) e.stopPropagation();
                                                                                    }}
                                                                                    disabled={shareCodeModal.open}
                                                                                />
                                                                                <span style={{ marginLeft: 8 }}>{playlist.isPublic ? t('playlist.public') : t('playlist.private')}</span>
                                                                            </span>
                                                                        </Menu.Item>
                                                                        <Menu.Item key="share" disabled={shareCodeModal.open}>
                                                                            <span
                                                                                style={{ display: "flex", alignItems: "center" }}
                                                                                onClick={e => {
                                                                                    if (e && e.stopPropagation) e.stopPropagation();
                                                                                    handleGenerateShareCode(playlist.id);
                                                                                }}
                                                                            >
                                                                                <span style={{ color: "#3ed8ff", marginRight: 8 }}>
                                                                                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M15 12a3 3 0 0 0-2.83 2H8a4 4 0 1 1 0-8h4a4 4 0 1 1 0 8h-.17A3 3 0 1 0 15 12Z" stroke="#3ed8ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                                                                </span>
                                                                                {t('playlist.generate_share_code')}
                                                                            </span>
                                                                        </Menu.Item>
                                                                    </Menu>
                                                                }
                                                                placement="bottomRight"
                                                            >
                                                                <Button
                                                                    shape="circle"
                                                                    icon={<MoreOutlined />}
                                                                    size="middle"
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        setDropdownOpenId(playlist.id);
                                                                    }}
                                                                    style={{
                                                                        border: "none",
                                                                        background: "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)",
                                                                        color: "#23242e",
                                                                        boxShadow: "0 2px 12px #3ed8ff55",
                                                                        fontWeight: 700,
                                                                        transition: "background 0.2s, color 0.2s"
                                                                    }}
                                                                    className="playlist-action-btn"
                                                                    disabled={shareCodeModal.open}
                                                                />
                                                            </Dropdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Hiển thị playlist được chia sẻ */}
                                            {sharedPlaylists.map((playlist) => (
                                                <div key={playlist.id} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex ">
                                                    <div
                                                        className="playlist-card"
                                                        style={{
                                                            width: 300,
                                                            height: 300,
                                                            aspectRatio: "1/1",
                                                            background: "#23283e",
                                                            borderRadius: 24,
                                                            boxShadow: "0 8px 32px #3ed8ff33",
                                                            position: "relative",
                                                            overflow: "hidden",
                                                            cursor: "pointer",
                                                            transition: "box-shadow 0.2s, transform 0.2s"
                                                        }}
                                                        onClick={() => navigate(`/playlist/${playlist.id}/songs`)}
                                                    >
                                                        <img
                                                            src={playlist.imageUrl || "/img/default-cover.png"}
                                                            alt={playlist.name}
                                                            style={{
                                                                width: "100%",
                                                                height: "100%",
                                                                objectFit: "cover",
                                                                borderRadius: 24,
                                                                transition: "filter 0.2s"
                                                            }}
                                                            className="playlist-img"
                                                        />
                                                        <div style={{
                                                            position: "absolute",
                                                            inset: 0,
                                                            background: "linear-gradient(0deg, #181c2bcc 10%, #181c2b00 100%)",
                                                            zIndex: 1,
                                                            pointerEvents: "none"
                                                        }} />
                                                        <Button
                                                            shape="circle"
                                                            icon={<PlayCircleFilled style={{ fontSize: 40 }} />}
                                                            size="large"
                                                            style={{
                                                                position: "absolute",
                                                                left: "50%",
                                                                top: "50%",
                                                                transform: "translate(-50%, -50%)",
                                                                background: "#fff",
                                                                color: "#23242b",
                                                                border: "none",
                                                                boxShadow: "0 2px 8px #0003",
                                                                opacity: 0,
                                                                transition: "opacity 0.2s"
                                                            }}
                                                            className="playlist-play-btn"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                navigate(`/playlist/${playlist.id}/songs`);
                                                            }}
                                                        />
                                                        <div style={{
                                                            position: "absolute",
                                                            left: 0,
                                                            bottom: 0,
                                                            width: "100%",
                                                            zIndex: 2,
                                                            color: "#fff",
                                                            fontWeight: 700,
                                                            fontSize: 18,
                                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                            textShadow: "0 2px 8px #181f2a88",
                                                            padding: "20px 18px 16px 18px",
                                                            background: "linear-gradient(0deg, #181c2bcc 80%, #181c2b00 100%)"
                                                        }}>
                                                            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{playlist.name}</div>
                                                            <div style={{
                                                                fontWeight: 400,
                                                                fontSize: 14,
                                                                color: "#8ca0c6",
                                                                marginBottom: 6,
                                                                minHeight: 32,
                                                                maxHeight: 32,
                                                                overflow: "hidden",
                                                                textOverflow: "ellipsis"
                                                            }}>
                                                                {playlist.description}
                                                            </div>
                                                            <div style={{ fontSize: 15, color: "#3ed8ff", fontWeight: 600 }}>
                                                                {playlist.songs?.length || 0} {t('playlist.songs', { count: playlist.songs?.length || 0 })}
                                                            </div>
                                                        </div>
                                                        {/* Không có action dropdown cho playlist được share */}
                                                    </div>
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )
                    }] : []),
                    {
                        key: "public",
                        label: t('playlist.community_playlists'),
                        children: (
                            <div className="container py-4">
                                <div className="row justify-content-center g-3">
                                    {publicPlaylists.map((playlist) => (
                                        <div key={playlist.id} className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex ">
                                            <div
                                                className="playlist-card"
                                                style={{
                                                    width: 300,
                                                    height: 300,
                                                    aspectRatio: "1/1",
                                                    background: "#23283e",
                                                    borderRadius: 24,
                                                    boxShadow: "0 8px 32px #3ed8ff33",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                    cursor: "pointer",
                                                    transition: "box-shadow 0.2s, transform 0.2s"
                                                }}
                                                onClick={() => navigate(`/playlist/${playlist.id}/songs`)}
                                            >
                                                {/* Playlist Image */}
                                                <img
                                                    src={playlist.imageUrl || "/img/default-cover.png"}
                                                    alt={playlist.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        borderRadius: 24,
                                                        transition: "filter 0.2s"
                                                    }}
                                                    className="playlist-img"
                                                />
                                                {/* Overlay */}
                                                <div style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background: "linear-gradient(0deg, #181c2bcc 10%, #181c2b00 100%)",
                                                    zIndex: 1,
                                                    pointerEvents: "none"
                                                }} />
                                                {/* Play button on hover */}
                                                <Button
                                                    shape="circle"
                                                    icon={<PlayCircleFilled style={{ fontSize: 40 }} />}
                                                    size="large"
                                                    style={{
                                                        position: "absolute",
                                                        left: "50%",
                                                        top: "50%",
                                                        transform: "translate(-50%, -50%)",
                                                        background: "#fff",
                                                        color: "#23242b",
                                                        border: "none",
                                                        boxShadow: "0 2px 8px #0003",
                                                        opacity: 0,
                                                        transition: "opacity 0.2s"
                                                    }}
                                                    className="playlist-play-btn"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        navigate(`/playlist/${playlist.id}/songs`);
                                                    }}
                                                />
                                                {/* Playlist Info */}
                                                <div style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    bottom: 0,
                                                    width: "100%",
                                                    zIndex: 2,
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: 18,
                                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                    textShadow: "0 2px 8px #181f2a88",
                                                    padding: "20px 18px 16px 18px",
                                                    background: "linear-gradient(0deg, #181c2bcc 80%, #181c2b00 100%)"
                                                }}>
                                                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{playlist.name}</div>
                                                    <div style={{
                                                        fontWeight: 400,
                                                        fontSize: 14,
                                                        color: "#8ca0c6",
                                                        minHeight: 32,
                                                        maxHeight: 32,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis"
                                                    }}>
                                                        {playlist.description}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    },
                    ...(isUser ? [{
                        key: "age-group",
                        label: t('playlist.age_group_playlist'),
                        children: (
                            <div className="container py-4">
                                {ageGroupPlaylist ? (
                                    <div className="row justify-content-center g-3">
                                        <div className="col-12 col-sm-6 col-md-4 col-lg-3 d-flex ">
                                            <div
                                                className="playlist-card"
                                                style={{
                                                    width: 300,
                                                    height: 300,
                                                    aspectRatio: "1/1",
                                                    background: "#23283e",
                                                    borderRadius: 24,
                                                    boxShadow: "0 8px 32px #3ed8ff33",
                                                    position: "relative",
                                                    overflow: "hidden",
                                                    cursor: "pointer",
                                                    transition: "box-shadow 0.2s, transform 0.2s"
                                                }}
                                                onClick={() => navigate(`/playlist/${ageGroupPlaylist.id}/songs`)}
                                            >
                                                <img
                                                    src={ageGroupPlaylist.imageUrl || "/img/default-cover.png"}
                                                    alt={ageGroupPlaylist.name}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                        borderRadius: 24,
                                                        transition: "filter 0.2s"
                                                    }}
                                                    className="playlist-img"
                                                />
                                                <div style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    background: "linear-gradient(0deg, #181c2bcc 10%, #181c2b00 100%)",
                                                    zIndex: 1,
                                                    pointerEvents: "none"
                                                }} />
                                                <Button
                                                    shape="circle"
                                                    icon={<PlayCircleFilled style={{ fontSize: 40 }} />}
                                                    size="large"
                                                    style={{
                                                        position: "absolute",
                                                        left: "50%",
                                                        top: "50%",
                                                        transform: "translate(-50%, -50%)",
                                                        background: "#fff",
                                                        color: "#23242b",
                                                        border: "none",
                                                        boxShadow: "0 2px 8px #0003",
                                                        opacity: 0,
                                                        transition: "opacity 0.2s"
                                                    }}
                                                    className="playlist-play-btn"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        navigate(`/playlist/${ageGroupPlaylist.id}/songs`);
                                                    }}
                                                />
                                                <div style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    bottom: 0,
                                                    width: "100%",
                                                    zIndex: 2,
                                                    color: "#fff",
                                                    fontWeight: 700,
                                                    fontSize: 18,
                                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                    textShadow: "0 2px 8px #181f2a88",
                                                    padding: "20px 18px 16px 18px",
                                                    background: "linear-gradient(0deg, #181c2bcc 80%, #181c2b00 100%)"
                                                }}>
                                                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 2 }}>{ageGroupPlaylist.name}</div>
                                                    <div style={{
                                                        fontWeight: 400,
                                                        fontSize: 14,
                                                        color: "#8ca0c6",
                                                        marginBottom: 6,
                                                        minHeight: 32,
                                                        maxHeight: 32,
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis"
                                                    }}>
                                                        {ageGroupPlaylist.description}
                                                    </div>
                                                    <div style={{ fontSize: 15, color: "#3ed8ff", fontWeight: 600 }}>
                                                        {ageGroupPlaylist.songs?.length || 0} {t('playlist.songs', { count: ageGroupPlaylist.songs?.length || 0 })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", color: "#8ca0c6", padding: "40px 0" }}>
                                        {t('playlist.no_age_group_playlist') + " "}
                                        <Button
                                            type="link"
                                            onClick={openAddModal}
                                            style={{ padding: 0, color: "#3ed8ff", fontWeight: 600 }}
                                        >
                                            {t('playlist.create_one_now')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )
                    }] : []),
                ]}
            />
            {/* Floating Add Playlist Button chỉ hiện khi là ROLE_USER */}
            {isUser && (
                <Tooltip title={t('playlist.create_new_playlist')} placement="left">
                    <Button
                        type="primary"
                        shape="circle"
                        icon={<PlusOutlined style={{ fontSize: 32 }} />}
                        size="large"
                        style={{
                            position: "fixed",
                            right: 50,
                            bottom: 50,
                            width: 68,
                            height: 68,
                            boxShadow: "0 12px 32px #3ed8ff55, 0 0 0 8px #3ed8ff22",
                            background: "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)",
                            border: "none",
                            zIndex: 1000,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "transform 0.2s, box-shadow 0.2s"
                        }}
                        onClick={openAddModal}
                        className="add-playlist-fab"
                        aria-label={t('playlist.add_playlist')}
                    />
                </Tooltip>
            )}
            {/* Modal giữ nguyên logic */}
            <Modal
                title={editing ? t('playlist.edit_playlist') : t('playlist.add_playlist')}
                open={modalOpen}
                onOk={handleModalOk}
                onCancel={() => setModalOpen(false)}
                okText={t('playlist.save')}
                cancelText={t('playlist.cancel')}
                confirmLoading={loading}
                destroyOnClose
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t('playlist.name')}
                        rules={[{ required: true, message: t('playlist.enter_name') }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t('playlist.description')}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="isPublic"
                        label={t('playlist.public')}
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label={t('playlist.image')}
                        valuePropName="fileList"
                        getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                        rules={[
                            {
                                required: !editing,
                                message: t('playlist.select_image'),
                            },
                        ]}
                    >
                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button icon={<UploadOutlined />}>{t('playlist.select_image')}</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
            {/* Modal nhập code chia sẻ playlist */}
            <Modal
                title={
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontWeight: 700,
                        fontSize: 22,
                        color: "#3ed8ff",
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif"
                    }}>
                        <PlusCircleOutlined style={{ color: "#3ed8ff", fontSize: 24 }} />
                        {t('playlist.receive_by_code')}
                    </div>
                }
                open={shareInputModalOpen}
                onCancel={() => {
                    setShareInputModalOpen(false);
                    setShareCodeInput("");
                }}
                footer={null}
                centered
                styles={{
                    body: {
                        background: "#ffffff",
                        borderRadius: 16,
                        padding: 32,
                        textAlign: "center"
                    }
                }}
            >
                <div style={{
                    color: "#8ca0c6",
                    fontSize: 15,
                    marginBottom: 18
                }}>
                    {t('playlist.receive_by_code_desc')}
                </div>
                <Input.Group compact>
                    <Input
                        style={{ width: "calc(100% - 120px)", fontSize: 16, borderRadius: 8 }}
                        placeholder={t('playlist.enter_share_code')}
                        value={shareCodeInput}
                        onChange={e => setShareCodeInput(e.target.value)}
                        onPressEnter={handleReceiveShare}
                        disabled={shareCodeLoading}
                    />
                    <Button
                        type="primary"
                        loading={shareCodeLoading}
                        onClick={async () => {
                            await handleReceiveShare();
                            if (!shareCodeLoading) {
                                setShareInputModalOpen(false);
                            }
                        }}
                        style={{ marginTop: 10, background: "#3ed8ff", width: 120, fontWeight: 700, fontSize: 16, borderRadius: 8, marginLeft: 8 }}
                    >
                        {t('playlist.receive')}
                    </Button>
                </Input.Group>
            </Modal>
            {/* Modal hiển thị mã chia sẻ playlist */}
            <Modal
                title={t('playlist.share_code_title')}
                open={shareCodeModal.open}
                onCancel={() => setShareCodeModal({ open: false, code: "", loading: false })}
                footer={null}
                centered
            >
                {shareCodeModal.loading ? (
                    <div style={{ textAlign: "center", padding: 24 }}>{t('playlist.generating_share_code')}</div>
                ) : (
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: "#3ed8ff",
                            letterSpacing: 2,
                            marginBottom: 16,
                            wordBreak: "break-all"
                        }}>
                            {shareCodeModal.code}
                        </div>
                        <Button
                            type="primary"
                            onClick={() => {
                                navigator.clipboard.writeText(shareCodeModal.code);
                                message.success(t('playlist.copied'));
                            }}
                            style={{ background: "#3ed8ff", border: "none", fontWeight: 600 }}
                        >
                            {t('playlist.copy_code')}
                        </Button>
                        <div style={{ marginTop: 12, color: "#8ca0c6" }}>
                            {t('playlist.share_code_desc')}
                        </div>
                    </div>
                )}
            </Modal>
            {/* Hiệu ứng hover cho card và play button */}
            <style>{`
                .playlist-card:hover {
                    box-shadow: 0 16px 48px #3ed8ff55;
                    transform: translateY(-6px) scale(1.04);
                }
                .playlist-card:hover .playlist-play-btn {
                    opacity: 1 !important;
                }
                .playlist-card:hover .playlist-img {
                    filter: none;
                }
                .playlist-card-private {
                    opacity: 0.6;
                    filter: grayscale(0.3) brightness(0.85);
                    box-shadow: 0 4px 16px #23283e55;
                    border: 2px dashed #8ca0c6;
                }
                .playlist-card-private .playlist-play-btn {
                    opacity: 0.5 !important;
                }
                .playlist-action-btn:hover, .playlist-action-btn:focus {
                    background: linear-gradient(135deg, #1fa2ff 60%, #3ed8ff 100%) !important;
                    color: #fff !important;
                    box-shadow: 0 4px 16px #3ed8ff99;
                }
                .ant-tabs-nav {
                    background: #181c2b !important;
                    border-bottom: 1px solid #3ed8ff33 !important;
                    padding-left: 24px !important;
                }
                .ant-tabs-tab {
                    font-family: 'Quicksand', 'Montserrat', sans-serif !important;
                    font-weight: 800 !important;
                    font-size: 20px !important;
                    letter-spacing: 1px !important;
                    color: #8ca0c6 !important;
                    transition: color 0.2s;
                }
                .ant-tabs-tab-active,
                .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #3ed8ff !important;
                    text-shadow: 0 2px 8px #3ed8ff22;
                }
                .ant-tabs-tab-btn {
                    color: inherit !important;
                }
                .ant-tabs-ink-bar {
                    background: linear-gradient(90deg, #3ed8ff 60%, #1fa2ff 100%) !important;
                    height: 3px !important;
                    border-radius: 2px;
                }
                .playlist-tab-label {
                    font-family: 'Quicksand', 'Montserrat', sans-serif !important;
                    font-weight: 800 !important;
                    fontSize: 20px !important;
                    letter-spacing: 1px !important;
                    color: #8ca0c6 !important;
                    transition: color 0.2s;
                }
                .ant-tabs-tab-active .playlist-tab-label {
                    color: #3ed8ff !important;
                    text-shadow: 0 2px 8px #3ed8ff22;
                }

                /* Responsive styles */
                @media (max-width: 1200px) {
                    .playlist-card {
                        width: 240px !important;
                        height: 240px !important;
                        border-radius: 18px !important;
                    }
                    .playlist-card .playlist-play-btn {
                        display: none !important;
                    }
                }
                @media (max-width: 900px) {
                    .playlist-card {
                        width: 180px !important;
                        height: 180px !important;
                        border-radius: 14px !important;
                    }
                    .playlist-card .playlist-play-btn {
                        font-size: 28px !important;
                        display: none !important;
                    }
                    .ant-tabs-tab {
                        font-size: 16px !important;
                    }
                }
                @media (max-width: 600px) {
                    .playlist-card {
                        width: 98vw !important;
                        max-width: 340px !important;
                        height: 120px !important;
                        min-height: 100px !important;
                        border-radius: 10px !important;
                        margin: 0 auto 16px auto !important;
                        flex-direction: row !important;
                        display: flex !important;
                        align-items: center !important;
                    }
                    .playlist-card img.playlist-img {
                        width: 100px !important;
                        height: 100px !important;
                        border-radius: 10px !important;
                        margin: 10px !important;
                        object-fit: cover !important;
                    }
                    .playlist-card .playlist-play-btn {
                        display: none !important;
                    }
                    .playlist-card > div[style*="position: absolute"][style*="bottom: 0"] {
                        position: static !important;
                        background: none !important;
                        padding: 10px 10px 10px 0 !important;
                        font-size: 15px !important;
                        text-align: left !important;
                        box-shadow: none !important;
                    }
                    .playlist-card .playlist-action-btn {
                        top: 10px !important;
                        right: 10px !important;
                        font-size: 18px !important;
                    }
                    .playlist-card .playlist-img {
                        margin: 0 !important;
                    }
                    .add-playlist-fab {
                        right: 16px !important;
                        bottom: 16px !important;
                        width: 48px !important;
                        height: 48px !important;
                        font-size: 20px !important;
                    }
                    .ant-tabs-tab {
                        font-size: 13px !important;
                        padding: 0 8px !important;
                    }
                    .ant-tabs-nav {
                        padding-left: 8px !important;
                    }
                }
                @media (max-width: 400px) {
                    .playlist-card {
                        width: 98vw !important;
                        max-width: 98vw !important;
                        height: 90px !important;
                        min-height: 80px !important;
                    }
                    .playlist-card img.playlist-img {
                        width: 60px !important;
                        height: 60px !important;
                        border-radius: 8px !important;
                    }
                    .playlist-card > div[style*="position: absolute"][style*="bottom: 0"] {
                        font-size: 12px !important;
                        padding: 6px 6px 6px 0 !important;
                    }
                }
            `}</style>
        </div>
    );
}