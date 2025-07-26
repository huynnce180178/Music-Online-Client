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
                >
                {/* Thumbnail */}
                <div className="player-thumb" onClick={() => setShowDetail(true)} style={{ cursor: 'pointer' }}>
                    <img src={song?.profilePicUrl} alt={song?.title}
                        className="player-thumb-img" />
                </div>

                {/* Song Info */}
                <div className="player-info">
                    <div className="player-title">{song?.title}</div>
                    <div className="player-artist">{song?.artistName || song?.albumName}</div>
                </div>

                {/* Controls */}
                <div className="player-controls">
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

                {/* Progress - Only show on large screens */}
                {window.innerWidth > 1200 && (
                    <div className="player-progress-wrap">
                        <input
                            type="range"
                            min={0}
                            max={durationSec}
                            value={currentTime}
                            onChange={handleSeek}
                            className="player-progress"
                        />
                        <div className="player-time">
                            <span>{formatTime(currentTime)}</span>
                            <span>{song ? song.duration.substring(3) : "0:00"}</span>
                        </div>
                    </div>
                )}

                {}
                <div className="player-actions">
                    <span className="material-icons player-volume-icon">volume_up</span>
                    <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolume}
                        className="player-volume" />
                    <button className="player-btn" title={t("song_detail.comments") || "Show Details"} onClick={() => setShowDetail(true)}>
                        <span className="material-icons">expand_less</span>
                    </button>
                    {}
                    {window.innerWidth > 1200 && (
                        <>
                            <button className={`player-btn like${liked ? " liked" : ""}`}
                                title={t("favorite") || "Favorite"}
                                onClick={toggleWishlist}
                            >
                                <span className="material-icons">{liked ? "favorite" : "favorite_border"}</span>
                            </button>
                            <button className="player-btn" title={t("song_detail.download_song") || "Download"} onClick={handleDownload}>
                                <span className="material-icons">file_download</span>
                            </button>
                        </>
                    )}
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
.songplay-root.improved-player {
    background: rgba(24,28,43,0.85);
    backdrop-filter: blur(12px);
    width: 100vw;
    min-height: 90px;
    padding: 0 32px;
    position: fixed;
    left: 0;
    bottom: 0;
    z-index: 1100;
    box-shadow: 0 8px 32px #3ed8ff33;
    display: flex;
    align-items: center;
    overflow: hidden;
    transition: box-shadow 0.2s, background 0.2s;
}
.player-thumb-img {
    width: 72px;
    height: 72px;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 2px 16px #29aaff44;
}
.player-info {
    flex: 1;
    padding: 0 24px 5px 18px;
    overflow: hidden;
}
.player-title {
    color: #fff;
    font-weight: 700;
    font-size: 22px;
    text-shadow: 0 1px 8px #0006;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
}
.player-artist {
    color: #8ca0c6;
    font-weight: 400;
    font-size: 15px;
    opacity: 0.95;
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.player-controls {
    flex: 0 0 170px;
    display: flex;
    gap: 18px;
    align-items: center;
}
.player-progress-wrap {
    flex: 2 2 320px;
    max-width: 340px;
    padding: 0 24px;
}
.player-progress {
    width: 100%;
    accent-color: #3ed8ff;
    background: linear-gradient(90deg, #3ed8ff 0%, #23283e 0%);
    height: 6px;
    border-radius: 4px;
    outline: none;
    border: none;
}
.player-time {
    display: flex;
    justify-content: space-between;
    color: #8ca0c6;
    font-size: 13px;
    margin-top: 4px;
}
.player-actions {
    flex: 0 0 160px;
    margin-right: 10px;
    display: flex;
    gap: 12px;
    align-items: center;
}
.player-volume-icon {
    font-size: 19px;
    color: #8ca0c6;
}
.player-volume {
    width: 60px;
    accent-color: #3ed8ff;
}
.player-btn {
    background: rgba(255,255,255,0.12);
    border: none;
    border-radius: 50%;
    color: #fff;
    font-size: 22px;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    box-shadow: none;
    outline: none;
    margin: 0 2px;
}
.player-btn:hover, .player-btn:focus {
    background: rgba(62,216,255,0.18);
    color: #3ed8ff;
    outline: none;
    box-shadow: 0 2px 8px #3ed8ff33;
}
.player-btn:active {
    background: rgba(62,216,255,0.28);
    color: #3ed8ff;
}
.player-btn.main {
    background: linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%);
    color: #23283e;
    font-size: 28px;
    width: 56px;
    height: 56px;
    box-shadow: 0 2px 12px #3ed8ff33;
    border: none;
}
.player-btn.main:hover, .player-btn.main:focus {
    background: linear-gradient(135deg, #29aaff 60%, #1890ff 100%);
    color: #23283e;
    box-shadow: 0 4px 16px #3ed8ff44;
}
.player-btn.like.liked {
    color: #ff416c;
    background: rgba(255,65,108,0.15);
}
.player-btn.close {
    color: #fff9;
    font-size: 20px;
    margin-left: 8px;
    background: rgba(255,255,255,0.10);
}
.player-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
}
@media (max-width: 1024px) {
    .player-btn { width: 40px; height: 40px; font-size: 18px; }
    .player-btn.main { width: 48px; height: 48px; font-size: 22px; }
    .player-thumb-img {
        width: 60px;
        height: 60px;
        border-radius: 12px;
    }
    .player-title {
        font-size: 18px;
    }
    .player-artist {
        font-size: 13px;
    }
    .player-controls {
        gap: 12px;
    }
    .player-progress-wrap {
        max-width: 280px;
        padding: 0 12px;
    }
    .player-time {
        font-size: 11px;
    }
    .player-actions {
        gap: 8px;
    }
    .player-volume {
        width: 40px;
    }
}
@media (max-width: 768px) {
    .songplay-root.improved-player {
        min-height: 70px;
        padding: 0 8px;
    }
    .player-btn { width: 32px; height: 32px; font-size: 15px; }
    .player-btn.main { width: 40px; height: 40px; font-size: 18px; }
    .player-thumb-img {
        width: 40px;
        height: 40px;
        border-radius: 8px;
    }
    .player-info {
        padding: 0 8px 5px 8px;
    }
    .player-title {
        font-size: 14px;
    }
    .player-artist {
        font-size: 11px;
    }
    .player-controls {
        flex: 0 0 80px;
        gap: 8px;
    }
    .player-progress-wrap {
        max-width: 160px;
        padding: 0 4px;
    }
    .player-time {
        font-size: 10px;
    }
    .player-actions {
        flex: 0 0 80px;
        margin-right: 5px;
        gap: 6px;
    }
    .player-volume-icon {
        font-size: 14px;
    }
    .player-volume {
        width: 28px;
    }
}
@media (max-width: 480px) {
    .songplay-root.improved-player {
        min-height: 56px;
        padding: 0 2px;
    }
    .player-btn { width: 28px; height: 28px; font-size: 12px; }
    .player-btn.main { width: 32px; height: 32px; font-size: 14px; }
    .player-thumb-img {
        width: 28px;
        height: 28px;
        border-radius: 6px;
    }
    .player-title {
        font-size: 10px;
    }
    .player-artist {
        font-size: 8px;
    }
    .player-controls {
        gap: 4px;
    }
    .player-progress-wrap {
        max-width: 80px;
        padding: 0 2px;
    }
    .player-time {
        font-size: 8px;
    }
    .player-actions {
        gap: 2px;
    }
    .player-volume-icon {
        font-size: 10px;
    }
    .player-volume {
        width: 16px;
    }
}
`}</style>
        </>
    );
}

SongPlay.propTypes = {
    sidebarWidth: PropTypes.number
};

export default SongPlay;
