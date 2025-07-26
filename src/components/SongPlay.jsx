import { useContext, useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

import { PlayerContext } from "../context/PlayerContext";
import SubscriptionModalPlan from "./SubscriptionModalPlan";
import SongDetail from "./SongDetail";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal, Select, message, Button, Form, Input, Switch, Upload } from "antd";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import BASE_API_URL from "../services/base.api.url";

function SongPlay({ sidebarWidth = 0 }) {
    const {
        currentSongId,
        isPlaying,
        setIsPlaying,
        audioRef,
        stopPlayer,
        playlist,
        setCurrentSongId,
        playType,
        contextId,
        adAudio,
        adPlaying,
        songCount,
        setSongCount,
        fetchAdAudio,
        handleAdEnded,
        liked,
        toggleWishlist,
        handleDownload,
        volume,
        setVolume,
    } = useContext(PlayerContext);

    const { t } = useTranslation();

    const [song, setSong] = useState(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [addToPlaylistModal, setAddToPlaylistModal] = useState(false);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [newPlaylistName, setNewPlaylistName] = useState("");
    const [creatingPlaylist, setCreatingPlaylist] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createForm] = Form.useForm();
    const adAudioRef = useRef(null);
    const [viewed, setViewed] = useState(false);

    const generatePlayUrl = useCallback(() => {
        switch (playType) {
            case "playlist": return `${BASE_API_URL}/api/v1/play/playlist/${contextId}/song/${currentSongId}`;
            case "genre": return `${BASE_API_URL}/api/v1/play/genre/${contextId}/song/${currentSongId}`;
            case "album": return `${BASE_API_URL}/api/v1/play/album/${contextId}/song/${currentSongId}`;
            case "wishlist": return `${BASE_API_URL}/api/v1/play/wishlist/${currentSongId}`;
            case "history": return `${BASE_API_URL}/api/v1/play/history/${currentSongId}`;
            default: return `${BASE_API_URL}/api/v1/play/song/${currentSongId}`;
        }
    }, [playType, contextId, currentSongId]);

    useEffect(() => {
        if (!currentSongId) return;

        const fetchSong = async () => {
            try {
                const url = generatePlayUrl();
                const token = localStorage.getItem("accessToken");

                const res = await axios.get(url, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setSong(res.data.data);
                setCurrentTime(0);
            } catch {
                toast.error(t("song_detail.download_song") || "Unable to download song", { autoClose: 2000 });
            }
        };

        fetchSong();
    }, [currentSongId, playType, contextId, generatePlayUrl, t]);

    useEffect(() => {
        if (!song || !audioRef.current) return;
        if (adPlaying) {
            audioRef.current.pause();
            audioRef.current.src = "";
            return;
        }

        const audio = audioRef.current;
        const currentSrc = audio.src.replace(window.location.origin, "");
        if (currentSrc !== song.fileUrl) {
            audio.src = song.fileUrl;
            setCurrentTime(0);
        }

        const tryPlay = () => {
            if (isPlaying) {
                audio.play().catch(() => {
                    toast.warn(t("song_detail.download_song") || "Cannot play music automatically", { autoClose: 2000 });
                });
            }
        };

        const onCanPlay = () => {
            tryPlay();
            audio.removeEventListener("canplaythrough", onCanPlay);
        };

        audio.addEventListener("canplaythrough", onCanPlay);
        return () => audio.removeEventListener("canplaythrough", onCanPlay);
    }, [song, isPlaying, audioRef, adPlaying, t]);

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {
                toast.error(t("song_detail.download_song") || "Cannot play song", { autoClose: 2000 });
            });
        }
        setIsPlaying(!isPlaying);
    };

    useEffect(() => {
        setViewed(false); // reset khi chuyển sang bài mới
    }, [song?.id]);

    function formatTime(secs) {
        if (!secs && secs !== 0) return "0:00";
        const min = Math.floor(secs / 60);
        const sec = Math.floor(secs % 60);
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    }

    const handleTimeUpdate = () => {
        setCurrentTime(audioRef.current.currentTime);
        if (song?.duration && !viewed) {
            const durationSec = song.duration.split(":").reduce((acc, val) => 60 * acc + +val, 0);
            if (audioRef.current.currentTime / durationSec > 0.8) {
                setViewed(true); // đánh dấu đã cộng view bài này
                axios.post(`${BASE_API_URL}/api/v1/play/song/${song.id}/update-views`, null, {
                    params: { playedDuration: audioRef.current.currentTime }
                }).catch(() => { });
            }
        }
    };

    const handleSeek = e => {
        const t = +e.target.value;
        audioRef.current.currentTime = t;
        setCurrentTime(t);
    };

    const handleVolume = e => {
        const v = +e.target.value;
        setVolume(v);
        if (audioRef.current) audioRef.current.volume = v;
    };

    const getNextSongId = () => {
        const index = playlist.indexOf(currentSongId);
        return index >= 0 && index < playlist.length - 1 ? playlist[index + 1] : null;
    };

    const getPrevSongId = () => {
        const index = playlist.indexOf(currentSongId);
        return index > 0 ? playlist[index - 1] : null;
    };

    const nextSong = () => {
        const nextId = getNextSongId();
        if (nextId) setCurrentSongId(nextId);
    };

    const prevSong = () => {
        const prevId = getPrevSongId();
        if (prevId) setCurrentSongId(prevId);
    };

    // Get roles from localStorage
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    const isPremium = roles.includes("ROLE_PREMIUM");

    // When next/prev or after every 3 songs, play an ad
    const handleSongChange = (type) => {
        if (isPremium) {
            type === "next" ? nextSong() : prevSong();
            return;
        }
        if ((songCount + 1) % 3 === 0) {
            fetchAdAudio();
        } else {
            setSongCount(c => c + 1);
            type === "next" ? nextSong() : prevSong();
        }
    };

    // When the song ends (auto next)
    const handleSongEnd = () => {
        if (isPremium) {
            const nextId = getNextSongId();
            if (nextId) {
                setCurrentSongId(nextId);
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
            }
            return;
        }
        if ((songCount + 1) % 3 === 0) {
            fetchAdAudio();
        } else {
            setSongCount(c => c + 1);
            const nextId = getNextSongId();
            if (nextId) {
                setCurrentSongId(nextId);
                setIsPlaying(true);
            } else {
                setIsPlaying(false);
            }
        }
    };

    useEffect(() => {
        if (addToPlaylistModal) {
            fetchUserPlaylists();
        }
    }, [addToPlaylistModal]);

    const fetchUserPlaylists = async () => {
        const token = localStorage.getItem("accessToken");
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/playlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserPlaylists(res.data.data || []);
        } catch {
            message.error(t("weekly_top_10.get_playlist_failed") || "Unable to load playlist!");
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) {
            message.warning("Nhập tên playlist!");
            return;
        }
        setCreatingPlaylist(true);
        try {
            const token = localStorage.getItem("accessToken");
            await axios.post(`${BASE_API_URL}/api/v1/user/playlist`, { name: newPlaylistName }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Tạo playlist thành công!");
            setNewPlaylistName("");
            await fetchUserPlaylists();
        } catch {
            message.error("Tạo playlist thất bại!");
        }
        setCreatingPlaylist(false);
    };

    const handleCreatePlaylistModal = () => {
        createForm.resetFields();
        setCreateModalOpen(true);
    };

    const handleCreatePlaylistSubmit = async () => {
        try {
            const values = await createForm.validateFields();
            setCreateLoading(true);
            const token = localStorage.getItem("accessToken");
            const formData = new FormData();
            formData.append("name", values.name);
            formData.append("description", values.description || "");
            formData.append("isPublic", values.isPublic ? "true" : "false");
            if (!values.image || !values.image[0]) {
                message.error("Vui lòng chọn ảnh!");
                setCreateLoading(false);
                return;
            }
            formData.append("imageUrl", values.image[0].originFileObj);
            await axios.post(`${BASE_API_URL}/api/v1/user/playlist/add`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            message.success("Tạo playlist thành công!");
            setCreateModalOpen(false);
            await fetchUserPlaylists();
        } catch (err) {
            message.error("Tạo playlist thất bại!");
        } finally {
            setCreateLoading(false);
        }
    };

    useEffect(() => {
        // Get songCount from localStorage on mount
        const count = Number(localStorage.getItem("songCount") || 0);
        setSongCount(count);
    }, [setSongCount]);

    useEffect(() => {
        // Save songCount to localStorage whenever it changes
        localStorage.setItem("songCount", songCount);
    }, [songCount]);

    if (!currentSongId || !song) return null;

    const durationSec = song?.duration ? song.duration.split(":").reduce((acc, t) => 60 * acc + +t, 0) : 0;

    return (
        <>
            <div className="songplay-root improved-player"
                style={{
                    background: 'rgba(24,28,43,0.85)',
                    backdropFilter: 'blur(12px)',
                    width: `calc(100vw - ${sidebarWidth}px)`,
                    minHeight: 90,
                    padding: window.innerWidth <= 768 ? '0 16px' : '0 32px',
                    position: 'fixed',
                    left: sidebarWidth,
                    bottom: 0,
                    zIndex: 1100,
                    boxShadow: '0 8px 32px #3ed8ff33',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: "hidden",
                    transition: "box-shadow 0.2s, background 0.2s"
                }}>
                {/* Thumbnail */}
                <div className="player-thumb">
                    <img src={song?.profilePicUrl} alt={song?.title}
                        style={{
                            width: window.innerWidth <= 768 ? 60 : 72, 
                            height: window.innerWidth <= 768 ? 60 : 72, 
                            borderRadius: window.innerWidth <= 768 ? 12 : 16,
                            objectFit: "cover", boxShadow: "0 2px 16px #29aaff44"
                        }} />
                </div>

                {/* Song Info */}
                <div className="player-info" style={{
                    flex: 1, padding: window.innerWidth <= 768 ? "0 16px 5px 12px" : "0 24px 5px 18px", overflow: "hidden"
                }}>
                    <div className="player-title" style={{
                        color: "#fff", fontWeight: 700, fontSize: window.innerWidth <= 768 ? 18 : 22,
                        textShadow: "0 1px 8px #0006", overflow: "hidden",
                        display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical"
                    }}>{song?.title}</div>
                    <div className="player-artist" style={{
                        color: "#8ca0c6", fontWeight: 400, fontSize: window.innerWidth <= 768 ? 13 : 15,
                        opacity: 0.95, marginTop: 2, whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis"
                    }}>{song?.artistName || song?.albumName}</div>
                </div>

                {/* Controls */}
                <div className="player-controls" style={{
                    flex: window.innerWidth <= 768 ? "0 0 140px" : "0 0 170px", 
                    display: 'flex', 
                    gap: window.innerWidth <= 768 ? 12 : 18, 
                    alignItems: "center"
                }}>
                    <button
                        className="player-btn"
                        onClick={() => !adPlaying && handleSongChange("prev")}
                        title={t("sidebar.song") || "Previous Song"}
                        disabled={adPlaying}
                        style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                        <span className="material-icons">skip_previous</span>
                    </button>
                    <button
                        className="player-btn main"
                        onClick={() => !adPlaying && handlePlayPause()}
                        title={isPlaying ? t("common.pause") || "Pause" : t("common.play") || "Play"}
                        disabled={adPlaying}
                        style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                        <span className="material-icons">{isPlaying ? "pause" : "play_arrow"}</span>
                    </button>
                    <button
                        className="player-btn"
                        onClick={() => !adPlaying && handleSongChange("next")}
                        title={t("sidebar.song") || "Next Song"}
                        disabled={adPlaying}
                        style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                    >
                        <span className="material-icons">skip_next</span>
                    </button>
                </div>

                {/* Progress */}
                <div className="player-progress-wrap" style={{
                    flex: window.innerWidth <= 768 ? "1 1 200px" : "2 2 320px", 
                    maxWidth: window.innerWidth <= 768 ? 200 : 340, 
                    padding: window.innerWidth <= 768 ? "0 12px" : "0 24px"
                }}>
                    <input
                        type="range"
                        min={0}
                        max={durationSec}
                        value={currentTime}
                        onChange={handleSeek}
                        className="player-progress"
                        style={{
                            width: "100%",
                            accentColor: "#3ed8ff",
                            background: `linear-gradient(90deg, #3ed8ff ${(currentTime / durationSec) * 100}%, #23283e ${(currentTime / durationSec) * 100}%)`,
                            height: 6, borderRadius: 4
                        }}
                    />
                    <div className="d-flex justify-content-between mt-1" style={{ color: "#8ca0c6", fontSize: window.innerWidth <= 768 ? 11 : 13 }}>
                        <span>{formatTime(currentTime)}</span>
                        <span>{song ? song.duration.substring(3) : "0:00"}</span>
                    </div>
                </div>

                {/* Right Controls */}
                <div className="player-actions" style={{
                    flex: window.innerWidth <= 768 ? "0 0 120px" : "0 0 160px", 
                    marginRight: window.innerWidth <= 768 ? '5px' : '10px', 
                    display: "flex", 
                    gap: window.innerWidth <= 768 ? 8 : 12, 
                    alignItems: "center"
                }}>
                    <span className="material-icons" style={{ fontSize: window.innerWidth <= 768 ? 16 : 19, color: "#8ca0c6" }}>volume_up</span>
                    <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolume}
                        style={{ width: window.innerWidth <= 768 ? 40 : 60, accentColor: "#3ed8ff" }} />
                    <button className={`player-btn like${liked ? " liked" : ""}`}
                        title={t("favorite") || "Favorite"}
                        onClick={toggleWishlist}
                    >
                        <span className="material-icons">{liked ? "favorite" : "favorite_border"}</span>
                    </button>
                    <button className="player-btn" title={t("song_detail.download_song") || "Download"} onClick={handleDownload}>
                        <span className="material-icons">file_download</span>
                    </button>
                    <button className="player-btn" title={t("song_detail.comments") || "Show Details"} onClick={() => setShowDetail(true)}>
                        <span className="material-icons">expand_less</span>
                    </button>
                    <button
                        className="player-btn"
                        title={t("song_detail.add_to_playlist") || "Add to Playlist"}
                        onClick={() => {
                            const token = localStorage.getItem("accessToken");
                            if (!token) {
                                toast.info(t("weekly_top_10.login_to_add_playlist") || "Please login to add songs to your playlist!", { autoClose: 2000 });
                                return;
                            }
                            fetchUserPlaylists();
                            setAddToPlaylistModal(true);
                            setSelectedPlaylistId(null);
                        }}
                    >
                        <span className="material-icons">add_box</span>
                    </button>
                    <button className="player-btn close" title={t("common.close") || "Close Player"} onClick={stopPlayer}>
                        <span className="material-icons">close</span>
                    </button>
                </div>

                <audio
                    ref={audioRef}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleSongEnd}
                    preload="auto"
                />

            </div>

            {/* Subscription Modal */}
            <SubscriptionModalPlan show={showModal} onClose={() => setShowModal(false)} />
            <ToastContainer />

            {/* Popup SongDetail */}
            {showDetail && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(16,20,38,0.98)",
                        zIndex: 2000,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        overflowY: "auto"
                    }}
                >
                    <SongDetail songId={song.id} onClose={() => setShowDetail(false)} />
                </div>
            )}

            {/* Add to Playlist Modal */}
            <Modal
                title={t("song_detail.add_to_playlist")}
                open={addToPlaylistModal}
                onOk={async () => {
                    if (!selectedPlaylistId) {
                        message.warning(t("weekly_top_10.select_playlist_warning"));
                        return;
                    }
                    try {
                        const token = localStorage.getItem("accessToken");
                        await axios.post(`${BASE_API_URL}/api/v1/user/playlist/add-song?playlistId=${selectedPlaylistId}&songId=${song.id}`, {}, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        message.success(t("weekly_top_10.added_to_playlist"));
                        setAddToPlaylistModal(false);
                    } catch {
                        message.error(t("weekly_top_10.add_to_playlist_failed"));
                    }
                }}
                onCancel={() => setAddToPlaylistModal(false)}
                okText={t("song_detail.add")}
                cancelText={t("weekly_top_10.cancel")}
            >
                <Select
                    style={{ width: "100%" }}
                    placeholder={t("song_detail.select_playlist")}
                    value={selectedPlaylistId}
                    onChange={setSelectedPlaylistId}
                >
                    {userPlaylists.map(pl => (
                        <Select.Option key={pl.id} value={pl.id}>
                            {pl.name}
                        </Select.Option>
                    ))}
                </Select>
                <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
                    <Button
                        type="primary"
                        onClick={handleCreatePlaylistModal}
                        style={{ borderRadius: 4, fontWeight: 600 }}
                    >
                        {t("playlist.create_new_playlist")}
                    </Button>
                </div>
            </Modal>

            {/* Modal tạo playlist mới */}
            <Modal
                title={t("playlist.create_new_playlist")}
                open={createModalOpen}
                onOk={handleCreatePlaylistSubmit}
                onCancel={() => setCreateModalOpen(false)}
                okText={t("song_detail.add")}
                cancelText={t("playlist.cancel")}
                confirmLoading={createLoading}
                destroyOnClose
            >
                <Form form={createForm} layout="vertical">
                    <Form.Item
                        name="name"
                        label={t("playlist.name")}
                        rules={[{ required: true, message: t("playlist.enter_name") }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label={t("playlist.description")}
                    >
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item
                        name="isPublic"
                        label={t("playlist.public")}
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                    <Form.Item
                        name="image"
                        label={t("playlist.image")}
                        valuePropName="fileList"
                        getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                        rules={[
                            {
                                required: true,
                                message: t("playlist.select_image"),
                            },
                        ]}
                    >
                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            accept="image/*"
                            listType="picture"
                        >
                            <Button>{t("playlist.select_image")}</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Ad audio player: only render if SongDetail is NOT open */}
            {adPlaying && adAudio && !showDetail ? (
                <div
                    className="songplay-root improved-player"
                    style={{
                        background: 'rgba(24,28,43,0.85)',
                        backdropFilter: 'blur(12px)',
                        width: `calc(100vw - ${sidebarWidth}px)`,
                        minHeight: 90,
                        padding: '0 32px',
                        position: 'fixed',
                        left: sidebarWidth,
                        bottom: 0,
                        zIndex: 2000,
                        boxShadow: '0 8px 32px #3ed8ff33',
                        display: 'flex',
                        alignItems: 'center',
                        overflow: "hidden",
                        transition: "box-shadow 0.2s, background 0.2s"
                    }}
                >
                    {/* Ad Thumbnail */}
                    <div className="player-thumb">
                        <img
                            src="/img/Music_in_advertising_Hero.jpg"
                            alt={t("song_detail.sponsored_audio_break")}
                            style={{
                                width: 72,
                                height: 72,
                                borderRadius: 16,
                                objectFit: "cover",
                                boxShadow: "0 2px 16px #29aaff44"
                            }}
                        />
                    </div>
                    {/* Ad Info */}
                    <div className="player-info" style={{
                        flex: 1, padding: "0 24px 5px 18px", overflow: "hidden"
                    }}>
                        <div className="player-title" style={{
                            color: "#fff", fontWeight: 700, fontSize: 22,
                            textShadow: "0 1px 8px #0006", overflow: "hidden",
                            display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical"
                        }}>
                            {t("song_detail.sponsored_audio_break")}
                        </div>
                        <div className="player-artist" style={{
                            color: "#8ca0c6", fontWeight: 400, fontSize: 15,
                            opacity: 0.95, marginTop: 2, whiteSpace: "nowrap",
                            overflow: "hidden", textOverflow: "ellipsis"
                        }}>
                            {t("song_detail.advertisement")}
                        </div>
                    </div>
                    {/* Ad Controls */}
                    <div className="player-controls" style={{
                        flex: "0 0 170px", display: 'flex', gap: 18, alignItems: "center"
                    }}>
                        <audio
                            ref={adAudioRef}
                            src={adAudio.mediaUrl}
                            autoPlay
                            onEnded={handleAdEnded}
                            controls={false}
                            style={{ width: 160, background: "transparent" }}
                        />
                    </div>
                    {/* Ad Actions */}
                    <div className="player-actions" style={{
                        flex: "0 0 160px", marginRight: '10px', display: "flex", gap: 12, alignItems: "center"
                    }}>
                        {adAudio.redirectUrl && (
                            <Button
                                style={{
                                    borderRadius: 24,
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)",
                                    color: "#23283e",
                                    border: "none",
                                    padding: "8px 22px",
                                    fontSize: 16,
                                    boxShadow: "0 2px 12px #3ed8ff33",
                                    transition: "background 0.18s, color 0.18s"
                                }}
                                onMouseOver={e => e.currentTarget.style.background = "#29aaff"}
                                onMouseOut={e => e.currentTarget.style.background = "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)"}
                                onClick={() => setShowModal(true)}
                            >
                                {t("song_detail.learn_more")}
                            </Button>
                        )}

                    </div>
                </div>
            ) : null}

            <style>{`
.improved-player {
    animation: fadeInUp 0.4s;
}

/* iPhone safe area support */
@supports (padding: max(0px)) {
    .improved-player {
        padding-bottom: max(0px, env(safe-area-inset-bottom));
    }
}

/* Ensure player doesn't get cut off on mobile */
@media (max-width: 768px) {
    .improved-player {
        min-height: 80px;
        padding-bottom: max(8px, env(safe-area-inset-bottom));
    }
}
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px);}
    to { opacity: 1; transform: translateY(0);}
}
.player-btn {
    background: none;
    border: none;
    color: #fff;
    font-size: 22px;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s, color 0.18s;
    box-shadow: none !important;
}

@media (max-width: 768px) {
    .player-btn {
        font-size: 18px;
        width: 32px;
        height: 32px;
    }
}
.player-btn:hover, .player-btn:focus {
    background: #3ed8ff33;
    color: #3ed8ff;
    outline: none;
    box-shadow: none !important;
}
.player-btn.main {
    background: linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%);
    color: #23283e;
    font-size: 28px;
    width: 48px;
    height: 48px;
    box-shadow: none !important;
}

@media (max-width: 768px) {
    .player-btn.main {
        font-size: 24px;
        width: 40px;
        height: 40px;
    }
}
.player-btn.like.liked {
    color: #ff416c;
    background: #fff1;
}
.player-btn.close {
    color: #fff9;
    font-size: 20px;
    margin-left: 8px;
}
.player-progress::-webkit-slider-thumb {
    background: #3ed8ff;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    box-shadow: none !important;
    border: none;
}
.player-progress {
    outline: none;
    border-radius: 4px;
    height: 6px;
    background: #23283e;
    transition: background 0.2s;
    box-shadow: none !important;
    border: none;
}
.player-thumb img {
    transition: box-shadow 0.2s, transform 0.2s;
    box-shadow: none !important;
}
.player-thumb img:hover {
    box-shadow: none !important;
    transform: scale(1.04);
}
`}</style>
        </>
    );
}

SongPlay.propTypes = {
    sidebarWidth: PropTypes.number
};

export default SongPlay;
