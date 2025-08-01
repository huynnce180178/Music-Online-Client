import { useState, useEffect } from "react";
import { Modal, Select, Button, Form, Input, Switch, Upload, message } from 'antd';
import { useTranslation } from 'react-i18next';
import axios from "axios";
import BASE_API_URL from "../services/base.api.url";

const AddToPlaylistModal = ({
    open,
    onClose,
    songId,
    onSuccess
}) => {
    const { t } = useTranslation();
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [playlistsLoading, setPlaylistsLoading] = useState(false);
    const [playlistsFetched, setPlaylistsFetched] = useState(false);
    const [newlyCreatedPlaylistId, setNewlyCreatedPlaylistId] = useState(null);
    const [createForm] = Form.useForm();

    useEffect(() => {
        if (open && songId) {
            console.log('Modal opened with songId:', songId);
            setIsClosing(false);
            setSelectedPlaylistId(null);
            setNewlyCreatedPlaylistId(null);

            const timer = setTimeout(() => {
                console.log('Checking if need to fetch playlists...');
                console.log('playlistsFetched:', playlistsFetched);
                console.log('userPlaylists.length:', userPlaylists.length);
                
                if (!playlistsFetched || userPlaylists.length === 0) {
                    console.log('Need to fetch playlists');
                    fetchUserPlaylists();
                } else {
                    console.log('Playlists already available, no need to fetch');
                    setPlaylistsLoading(false);
                }
            }, 100);

            return () => clearTimeout(timer);
        } else {
            setPlaylistsLoading(false);
        }
    }, [open, songId]);

    const fetchUserPlaylists = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.log('No token found');
            return;
        }

        if (playlistsLoading) {
            console.log('Already loading playlists, will continue...');
        }

        if (playlistsFetched && userPlaylists.length > 0) {
            console.log('Playlists already fetched, skipping');
            return;
        }

        console.log('Fetching playlists...');
        setPlaylistsLoading(true);
        
        const timeoutId = setTimeout(() => {
            console.log('Playlist fetch timeout, resetting loading state');
            setPlaylistsLoading(false);
        }, 10000);
        
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/playlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            clearTimeout(timeoutId);
            console.log('Playlists fetched successfully:', res.data);
            setUserPlaylists(res.data.data || []);
            setPlaylistsFetched(true);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Fetch playlists error:', error);
            showNotification('error', t("get_playlist_failed") || "Unable to load playlist!", "Please refresh and try again");
        } finally {
            setPlaylistsLoading(false);
        }
    };

    const showNotification = (type, title, subtitle) => {
        const configs = {
            error: {
                icon: '❌',
                bg: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#ff4757',
                shadowColor: 'rgba(255, 71, 87, 0.3)',
                textColor: '#ff6b6b'
            },
            success: {
                icon: '✅',
                bg: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#8b5cf6',
                shadowColor: 'rgba(139, 92, 246, 0.3)',
                textColor: '#8b5cf6'
            },
            info: {
                icon: 'ℹ️',
                bg: 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#3742fa',
                shadowColor: 'rgba(55, 66, 250, 0.3)',
                textColor: '#4ecdc4'
            },
            warning: {
                icon: '⚠️',
                bg: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
                notificationBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                borderColor: '#ff9800',
                shadowColor: 'rgba(255, 152, 0, 0.3)',
                textColor: '#ffa726'
            }
        };

        const config = configs[type];
        message[type]({
            content: (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: config.notificationBg, padding: '14px 18px', borderRadius: '12px', border: `2px solid ${config.borderColor}`, boxShadow: `0 8px 24px ${config.shadowColor}, 0 4px 12px rgba(0,0,0,0.3)`, backdropFilter: 'blur(15px)', minWidth: '280px', maxWidth: '400px', position: 'relative', overflow: 'hidden', animation: 'slideInRight 0.4s ease-out' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: `radial-gradient(circle at 30% 50%, ${config.borderColor} 0%, transparent 70%)`, opacity: 0.08, animation: 'pulse 3s ease-in-out infinite' }}></div>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: 'white', fontWeight: 'bold', boxShadow: `0 4px 12px ${config.shadowColor}`, position: 'relative', zIndex: 1, animation: 'bounce 0.6s ease-out' }}>
                        {config.icon}
                    </div>
                    <div style={{ position: 'relative', zIndex: 1, flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: config.textColor, fontFamily: '"Poppins", sans-serif', textShadow: '0 1px 2px rgba(0,0,0,0.4)', marginBottom: '2px', letterSpacing: '0.3px' }}>
                            {title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#b8b8b8', fontFamily: '"Poppins", sans-serif', opacity: 0.8, lineHeight: '1.3' }}>
                            {subtitle}
                        </div>
                    </div>
                </div>
            ),
            duration: type === 'error' ? 4 : 3,
            style: {
                background: 'none', boxShadow: 'none', border: 'none', padding: 0, margin: 0, zIndex: 10000,
            },
            className: 'custom-notification'
        });
    };

    const handleAddToPlaylist = async () => {
        if (!songId) {
            showNotification('error', t("song_not_found") || "Song not found!", "Please try again");
            return;
        }
        if (!selectedPlaylistId) {
            showNotification('warning', t("select_playlist_warning"), "Please select a playlist first");
            return;
        }

        const playlistIdToAdd = selectedPlaylistId;
        setIsClosing(true);
        setSelectedPlaylistId(null);
        onClose();

        if (onSuccess) {
            onSuccess();
        }

        setIsClosing(false);

        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${BASE_API_URL}/api/v1/user/playlist/add-song?playlistId=${playlistIdToAdd}&songId=${songId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showNotification('success', t("added_to_playlist"), "Song has been added to your playlist");
        } catch (error) {
            console.error('Add to playlist error:', error);
            showNotification('error', t("add_to_playlist_failed"), "Please try again later");
        }
    };

    const handleCreatePlaylistModal = () => {
        setCreateModalOpen(true);
    };

    const handleCreatePlaylistSubmit = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            showNotification('info', t('common.login_to_create_playlist'), "Please login to create playlists");
            return;
        }

        try {
            await createForm.validateFields();
        } catch (error) {
            showNotification('error', t('form_validation_error'), "Please check your input and try again");
            return;
        }

        setCreateLoading(true);
        try {
            const formData = new FormData();
            formData.append("name", createForm.getFieldValue("name"));
            formData.append("description", createForm.getFieldValue("description") || "");
            formData.append("isPublic", createForm.getFieldValue("isPublic") || false);
            if (createForm.getFieldValue("image")) {
                formData.append("imageUrl", createForm.getFieldValue("image")[0].originFileObj);
            }

            console.log('FormData contents:');
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await axios.post(`${BASE_API_URL}/api/v1/user/playlist/add`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data",
                },
            });
            
            if (response.data && response.data.data) {
                const newPlaylist = response.data.data;
                setUserPlaylists(prevPlaylists => [newPlaylist, ...prevPlaylists]);
                setSelectedPlaylistId(newPlaylist.id);
                setNewlyCreatedPlaylistId(newPlaylist.id); 
            }
            
            showNotification('success', t('playlist_created'), "Your new playlist has been created successfully");
            setCreateModalOpen(false);
            createForm.resetFields();

        } catch (error) {
            console.error('Create playlist error:', error);
            
            let errorMessage = "Please check your connection and try again";
            if (error.response) {
                console.log('Error response:', error.response.data);
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            }
            
            showNotification('error', t('create_playlist_failed'), errorMessage);
        } finally {
            setCreateLoading(false);
        }
    };

    return (
        <>
            {open && songId && !isClosing && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                        borderRadius: '20px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)',
                        border: '2px solid rgba(255, 255, 255, 0.2)', maxWidth: '400px', width: '95%', animation: 'slideUp 0.5s ease-out', position: 'relative', overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: '10%', left: '15%', width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%', animation: 'firefly1 4s ease-in-out infinite', boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)'
                        }}></div>
                        <div style={{
                            position: 'absolute', top: '20%', right: '20%', width: '2px', height: '2px', background: '#a855f7', borderRadius: '50%', animation: 'firefly2 3.5s ease-in-out infinite 0.5s', boxShadow: '0 0 4px rgba(168, 85, 247, 0.6)'
                        }}></div>
                        <div style={{
                            position: 'absolute', bottom: '30%', left: '25%', width: '4px', height: '4px', background: '#8b5cf6', borderRadius: '50%', animation: 'firefly3 5s ease-in-out infinite 1s', boxShadow: '0 0 8px rgba(139, 92, 246, 0.7)'
                        }}></div>
                        <div style={{
                            position: 'absolute', top: '40%', right: '10%', width: '2px', height: '2px', background: '#a855f7', borderRadius: '50%', animation: 'firefly4 3s ease-in-out infinite 1.5s', boxShadow: '0 0 5px rgba(168, 85, 247, 0.5)'
                        }}></div>
                        <div style={{
                            position: 'absolute', bottom: '20%', right: '30%', width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%', animation: 'firefly5 4.5s ease-in-out infinite 0.8s', boxShadow: '0 0 7px rgba(139, 92, 246, 0.6)'
                        }}></div>
                        <div style={{
                            position: 'absolute', top: '60%', left: '10%', width: '2px', height: '2px', background: '#a855f7', borderRadius: '50%', animation: 'firefly6 3.8s ease-in-out infinite 2s', boxShadow: '0 0 4px rgba(168, 85, 247, 0.4)'
                        }}></div>
                        <div style={{
                            position: 'absolute', bottom: '40%', left: '40%', width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%', animation: 'firefly7 4.2s ease-in-out infinite 1.2s', boxShadow: '0 0 6px rgba(139, 92, 246, 0.5)'
                        }}></div>
                        <div style={{
                            position: 'absolute', top: '15%', left: '50%', width: '2px', height: '2px', background: '#a855f7', borderRadius: '50%', animation: 'firefly8 3.3s ease-in-out infinite 0.3s', boxShadow: '0 0 5px rgba(168, 85, 247, 0.6)'
                        }}></div>

                        <button
                            className="modal-close-button"
                            onClick={onClose}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0, 0, 0, 0.5)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', zIndex: 1000, width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(139, 92, 246, 0.6)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'rgba(0, 0, 0, 0.5)'; }}
                        >✕</button>

                        <div className="modal-title" style={{ marginBottom: '24px', marginTop: '20px', fontSize: '24px', fontWeight: '800', color: '#ffffff', fontFamily: "'Quicksand', 'Montserrat', sans-serif", textShadow: '0 4px 8px rgba(0,0,0,0.5)', lineHeight: '1.2', position: 'relative', animation: 'pulse 3s ease-in-out infinite', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                            {t("add_to_playlist")}
                            <div style={{ position: 'absolute', top: '-10px', right: '-15px', width: '6px', height: '6px', background: '#8b5cf6', borderRadius: '50%', animation: 'float 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(139, 92, 246, 0.6)' }}></div>
                            <div style={{ position: 'absolute', bottom: '-5px', left: '-10px', width: '4px', height: '4px', background: '#a855f7', borderRadius: '50%', animation: 'float 1.8s ease-in-out infinite 0.5s', boxShadow: '0 0 6px rgba(168, 85, 247, 0.5)' }}></div>
                        </div>

                        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                            <label style={{ display: 'block', color: '#ffffff', fontSize: '16px', fontWeight: '700', marginBottom: '12px', fontFamily: "'Poppins', sans-serif" }}>
                                {t("select_playlist")}
                            </label>
                            <Select
                                style={{ width: "100%", borderRadius: '12px', border: '2px solid rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.1)', color: '#ffffff' }}
                                placeholder={playlistsLoading ? t("loading_playlists") || "Loading playlists..." : t("select_playlist")}
                                value={selectedPlaylistId}
                                onChange={setSelectedPlaylistId}
                                loading={playlistsLoading}
                                disabled={playlistsLoading}
                                dropdownStyle={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '2px solid rgba(139, 92, 246, 0.4)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)', zIndex: 10001 }}
                                getPopupContainer={(triggerNode) => triggerNode.parentNode}
                                notFoundContent={
                                    playlistsLoading ? (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#8b5cf6', fontSize: '14px' }}>
                                            <div style={{ width: '20px', height: '20px', border: '2px solid #8b5cf6', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 10px' }}></div>
                                            {t("loading_playlists") || "Loading playlists..."}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: '#8b5cf6', fontSize: '14px' }}>
                                            {t("no_playlists_found") || "No playlists found"}
                                        </div>
                                    )
                                }
                            >
                                {userPlaylists.map(pl => (
                                    <Select.Option 
                                        key={pl.id} 
                                        value={pl.id}
                                        style={{
                                            background: pl.id === newlyCreatedPlaylistId ? 'rgba(139, 92, 246, 0.4)' : 'transparent',
                                            fontWeight: pl.id === newlyCreatedPlaylistId ? '700' : 'normal',
                                            border: pl.id === newlyCreatedPlaylistId ? '1px solid rgba(139, 92, 246, 0.6)' : 'none',
                                            borderRadius: pl.id === newlyCreatedPlaylistId ? '8px' : '0'
                                        }}
                                    >
                                        {pl.name}
                                        {pl.id === newlyCreatedPlaylistId && (
                                            <span style={{ 
                                                marginLeft: '8px', 
                                                fontSize: '12px', 
                                                color: '#8b5cf6',
                                                fontWeight: '600'
                                            }}>
                                                ✨ New
                                            </span>
                                        )}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button
                                className="modal-button"
                                onClick={onClose}
                                style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)', border: '2px solid #666', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', minWidth: '120px' }}
                                onMouseEnter={(e) => { e.target.style.background = 'linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%)'; e.target.style.border = '2px solid #888'; e.target.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)'; e.target.style.border = '2px solid #666'; e.target.style.transform = 'translateY(0)'; }}
                            >
                                {t("cancel")}
                            </button>

                            <button
                                className="modal-button"
                                onClick={handleAddToPlaylist}
                                disabled={isClosing}
                                style={{ padding: '16px 32px', background: isClosing ? 'linear-gradient(135deg, #666 0%, #444 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: isClosing ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', minWidth: '120px', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)', opacity: isClosing ? 0.7 : 1 }}
                                onMouseEnter={(e) => { if (!isClosing) { e.target.style.transform = 'translateY(-2px) scale(1.05)'; e.target.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)'; } }}
                                onMouseLeave={(e) => { if (!isClosing) { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)'; } }}
                            >
                                {isClosing ? t("adding_to_playlist") || "Adding..." : t("add")}
                            </button>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <button
                                onClick={handleCreatePlaylistModal}
                                style={{ padding: '10px 16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)', border: '2px solid rgba(139, 92, 246, 0.4)', borderRadius: '12px', color: '#ffffff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                                onMouseEnter={(e) => { e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(168, 85, 247, 0.25) 100%)'; e.target.style.border = '2px solid rgba(139, 92, 246, 0.6)'; e.target.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(168, 85, 247, 0.15) 100%)'; e.target.style.border = '2px solid rgba(139, 92, 246, 0.4)'; e.target.style.transform = 'translateY(0)'; }}
                            >
                                <span style={{ fontSize: '16px' }}>➕</span>
                                {t("create_new_playlist")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {createModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0, 0, 0, 0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, animation: 'fadeIn 0.4s ease-out' }}>
                    <div style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', borderRadius: '20px', padding: '24px', textAlign: 'center', boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)', border: '2px solid rgba(255, 255, 255, 0.2)', maxWidth: '400px', width: '95%', animation: 'slideUp 0.5s ease-out', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '10%', left: '15%', width: '3px', height: '3px', background: '#8b5cf6', borderRadius: '50%', animation: 'firefly1 4s ease-in-out infinite', boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)' }}></div>
                        <div style={{ position: 'absolute', top: '20%', right: '20%', width: '2px', height: '2px', background: '#a855f7', borderRadius: '50%', animation: 'firefly2 3.5s ease-in-out infinite 0.5s', boxShadow: '0 0 4px rgba(168, 85, 247, 0.6)' }}></div>

                        <button
                            onClick={() => setCreateModalOpen(false)}
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0, 0, 0, 0.5)', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', zIndex: 1000, width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s ease' }}
                            onMouseEnter={(e) => { e.target.style.background = 'rgba(139, 92, 246, 0.6)'; }}
                            onMouseLeave={(e) => { e.target.style.background = 'rgba(0, 0, 0, 0.5)'; }}
                        >
                            ✕
                        </button>

                        <div style={{ marginBottom: '32px', marginTop: '20px', fontSize: '24px', fontWeight: '800', color: '#ffffff', fontFamily: "'Quicksand', 'Montserrat', sans-serif", textShadow: '0 4px 8px rgba(0,0,0,0.5)', lineHeight: '1.2', position: 'relative', animation: 'pulse 3s ease-in-out infinite', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>
                            {t("create_new_playlist")}
                        </div>

                        <Form form={createForm} layout="vertical" style={{ textAlign: 'left' }}>
                            <Form.Item
                                name="name"
                                label={<span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{t("playlist_name")}</span>}
                                rules={[{ required: true, message: t("enter_playlist_name") }]}
                            >
                                <Input
                                    style={{ borderRadius: '12px', border: '2px solid rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.1)', color: '#ffffff', fontSize: '16px', padding: '12px 16px' }}
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="description"
                                label={<span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{t("playlist_description")}</span>}
                            >
                                <Input.TextArea
                                    rows={3}
                                    style={{ borderRadius: '12px', border: '2px solid rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.1)', color: '#ffffff', fontSize: '16px', padding: '12px 16px' }}
                                    className="custom-input"
                                />
                            </Form.Item>

                            <Form.Item
                                name="isPublic"
                                label={<span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{t("playlist_public")}</span>}
                                valuePropName="checked"
                            >
                                <Switch style={{ backgroundColor: 'rgba(139, 92, 246, 0.3)' }} />
                            </Form.Item>

                            <Form.Item
                                name="image"
                                label={<span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>{t("playlist_image")}</span>}
                                valuePropName="fileList"
                                getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                                rules={[{ required: true, message: t("select_playlist_image") }]}
                            >
                                <Upload
                                    beforeUpload={() => false}
                                    maxCount={1}
                                    accept="image/*"
                                    listType="picture"
                                    style={{ borderRadius: '12px', border: '2px solid rgba(139, 92, 246, 0.4)', background: 'rgba(139, 92, 246, 0.1)', padding: '12px' }}
                                >
                                    <Button style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '600' }}>
                                        {t("select_playlist_image")}
                                    </Button>
                                </Upload>
                            </Form.Item>
                        </Form>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '24px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                style={{ padding: '16px 32px', background: 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)', border: '2px solid #666', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', minWidth: '120px' }}
                                onMouseEnter={(e) => { e.target.style.background = 'linear-gradient(135deg, #5a5a5a 0%, #3a3a3a 100%)'; e.target.style.border = '2px solid #888'; e.target.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={(e) => { e.target.style.background = 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)'; e.target.style.border = '2px solid #666'; e.target.style.transform = 'translateY(0)'; }}
                            >
                                {t("cancel")}
                            </button>

                            <button
                                onClick={handleCreatePlaylistSubmit}
                                disabled={createLoading}
                                style={{ padding: '16px 32px', background: createLoading ? 'linear-gradient(135deg, #666 0%, #444 100%)' : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '16px', fontWeight: '700', cursor: createLoading ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', minWidth: '120px', boxShadow: '0 8px 24px rgba(139, 92, 246, 0.3)', opacity: createLoading ? 0.7 : 1 }}
                                onMouseEnter={(e) => { if (!createLoading) { e.target.style.transform = 'translateY(-2px) scale(1.05)'; e.target.style.boxShadow = '0 12px 32px rgba(139, 92, 246, 0.4)'; } }}
                                onMouseLeave={(e) => { if (!createLoading) { e.target.style.transform = 'translateY(0) scale(1)'; e.target.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.3)'; } }}
                            >
                                {createLoading ? t("creating_playlist") || "Creating..." : t("add")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.9); } to { opacity: 1; transform: translateY(0) scale(1); } }
                @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
                @keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
                
                /* Purple Firefly animations */
                @keyframes firefly1 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    25% { transform: translate(20px, -30px) scale(1.2); opacity: 1; }
                    50% { transform: translate(40px, -20px) scale(0.8); opacity: 0.7; }
                    75% { transform: translate(30px, -40px) scale(1.1); opacity: 0.9; }
                }
                @keyframes firefly2 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    30% { transform: translate(-25px, -25px) scale(1.3); opacity: 1; }
                    60% { transform: translate(-40px, -15px) scale(0.9); opacity: 0.6; }
                    90% { transform: translate(-20px, -35px) scale(1.2); opacity: 0.8; }
                }
                @keyframes firefly3 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                    20% { transform: translate(30px, 20px) scale(1.4); opacity: 1; }
                    40% { transform: translate(50px, 10px) scale(0.7); opacity: 0.8; }
                    60% { transform: translate(35px, 30px) scale(1.1); opacity: 0.9; }
                    80% { transform: translate(45px, 5px) scale(0.9); opacity: 0.6; }
                }
                @keyframes firefly4 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    25% { transform: translate(-15px, -20px) scale(1.1); opacity: 1; }
                    50% { transform: translate(-30px, -10px) scale(0.8); opacity: 0.7; }
                    75% { transform: translate(-10px, -25px) scale(1.2); opacity: 0.9; }
                }
                @keyframes firefly5 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                    15% { transform: translate(25px, 15px) scale(1.3); opacity: 1; }
                    30% { transform: translate(40px, 5px) scale(0.9); opacity: 0.8; }
                    45% { transform: translate(30px, 20px) scale(1.1); opacity: 0.9; }
                    60% { transform: translate(45px, 10px) scale(0.8); opacity: 0.6; }
                    75% { transform: translate(35px, 25px) scale(1.2); opacity: 0.8; }
                    90% { transform: translate(50px, 0px) scale(0.9); opacity: 0.7; }
                }
                @keyframes firefly6 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
                    20% { transform: translate(-20px, -15px) scale(1.2); opacity: 1; }
                    40% { transform: translate(-35px, -5px) scale(0.8); opacity: 0.7; }
                    60% { transform: translate(-25px, -20px) scale(1.1); opacity: 0.9; }
                    80% { transform: translate(-40px, -10px) scale(0.9); opacity: 0.6; }
                }
                @keyframes firefly7 {
                    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
                    10% { transform: translate(15px, -25px) scale(1.4); opacity: 1; }
                    20% { transform: translate(30px, -15px) scale(0.7); opacity: 0.8; }
                    30% { transform: translate(20px, -30px) scale(1.1); opacity: 0.9; }
                    40% { transform: translate(35px, -10px) scale(0.8); opacity: 0.6; }
                    50% { transform: translate(25px, -25px) scale(1.2); opacity: 0.8; }
                    60% { transform: translate(40px, -5px) scale(0.9); opacity: 0.7; }
                    70% { transform: translate(30px, -20px) scale(1.1); opacity: 0.9; }
                    80% { transform: translate(45px, -15px) scale(0.8); opacity: 0.6; }
                    90% { transform: translate(35px, -25px) scale(1.3); opacity: 0.8; }
                }
                                 @keyframes firefly8 {
                     0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
                     12% { transform: translate(-10px, -20px) scale(1.1); opacity: 1; }
                     24% { transform: translate(-25px, -10px) scale(0.8); opacity: 0.7; }
                     36% { transform: translate(-15px, -25px) scale(1.2); opacity: 0.9; }
                     48% { transform: translate(-30px, -5px) scale(0.9); opacity: 0.6; }
                     60% { transform: translate(-20px, -20px) scale(1.1); opacity: 0.8; }
                     72% { transform: translate(-35px, -15px) scale(0.8); opacity: 0.7; }
                     84% { transform: translate(-25px, -25px) scale(1.2); opacity: 0.9; }
                     96% { transform: translate(-40px, -10px) scale(0.9); opacity: 0.6; }
                 }
                 
                 @keyframes spin {
                     from { transform: rotate(0deg); }
                     to { transform: rotate(360deg); }
                 }

                .ant-select-selector {
                    background: rgba(139, 92, 246, 0.1) !important; border: 2px solid rgba(139, 92, 246, 0.4) !important; border-radius: 12px !important; color: #fff !important;
                }
                .ant-select-focused .ant-select-selector {
                    border-color: #8b5cf6 !important; box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2) !important;
                }
                .ant-select-dropdown {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important; border: 2px solid rgba(139, 92, 246, 0.4) !important; border-radius: 12px !important; box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3) !important; z-index: 10001 !important; max-height: 200px !important; overflow-y: auto !important; position: absolute !important;
                }
                .ant-select-item,
                .ant-select-dropdown .ant-select-item {
                    color: #fff !important; background: transparent !important; padding: 8px 12px !important; border-radius: 8px !important; margin: 2px 8px !important;
                }
                .ant-select-item:hover,
                .ant-select-dropdown .ant-select-item:hover {
                    background: rgba(139, 92, 246, 0.2) !important; color: #fff !important;
                }
                .ant-select-item-option-selected,
                .ant-select-dropdown .ant-select-item-option-selected {
                    background: rgba(139, 92, 246, 0.3) !important; color: #fff !important; font-weight: 600 !important;
                }
                .ant-select-item-option-active,
                .ant-select-dropdown .ant-select-item-option-active {
                    background: rgba(139, 92, 246, 0.15) !important; color: #fff !important;
                }
                .ant-select-selection-item,
                .ant-select-selection-placeholder {
                    color: #ffffff !important;
                    font-weight: 500 !important;
                }
                .ant-select-selection-item { color: #ffffff !important; }

                .ant-switch-checked { background-color:rgb(202, 188, 234) !important; }

                .ant-upload-list { color: #fff !important; }
                .ant-upload-list-item {
                    background: rgba(139, 92, 246, 0.1) !important; border: 1px solid rgba(139, 92, 246, 0.4) !important; border-radius: 8px !important;
                }

                .custom-notification .ant-message-notice-content .ant-message-custom-content > span:first-child,
                .custom-notification .anticon,
                .custom-notification .ant-message-notice-content > span:first-child {
                    display: none !important;
                }
                .custom-notification .ant-message-notice,
                .custom-notification .ant-message-notice-content,
                .custom-notification .ant-message-custom-content {
                    background: none !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important;
                }

                .custom-input::placeholder,
                .custom-input::-webkit-input-placeholder,
                .custom-input:-moz-placeholder,
                .custom-input::-moz-placeholder {
                    color: #ffffff !important;
                    font-weight: 500 !important;
                }

                @media (max-width: 768px) {
                    .modal-container { max-width: 350px !important; padding: 20px !important; border-radius: 16px !important; }
                    .modal-title { font-size: 20px !important; margin-bottom: 20px !important; }
                    .modal-button { padding: 12px 24px !important; font-size: 14px !important; min-width: 100px !important; }
                    .modal-input { font-size: 14px !important; padding: 10px 14px !important; }
                }
                @media (max-width: 480px) {
                    .modal-container { max-width: 320px !important; padding: 16px !important; border-radius: 12px !important; width: 98% !important; }
                    .modal-title { font-size: 18px !important; margin-bottom: 16px !important; }
                    .modal-button { padding: 10px 20px !important; font-size: 13px !important; min-width: 90px !important; }
                    .modal-input { font-size: 13px !important; padding: 8px 12px !important; }
                    .modal-close-button { width: 28px !important; height: 28px !important; font-size: 16px !important; }
                }
            `}</style>
        </>
    );
};

export default AddToPlaylistModal; 