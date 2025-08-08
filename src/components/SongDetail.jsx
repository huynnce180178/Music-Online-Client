import { useEffect, useState, useContext, useCallback } from "react";
import { Tabs, Spin, message, Avatar, Button } from "antd";
import axios from "axios";
import PropTypes from "prop-types";
import { PlayerContext } from "../context/PlayerContext";
import CommentTab from "./CommentTab";
import AddToPlaylistModal from "./AddToPlaylistModal";
import { useNavigate } from "react-router-dom"; // Thêm import này
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function SongDetail({ songId, onClose }) {
    const { t } = useTranslation();
    const [song, setSong] = useState(null);
    const [artist, setArtist] = useState(null);
    const [album, setAlbum] = useState(null);
    const [lyrics, setLyrics] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [viewed, setViewed] = useState(false);
    const [addToPlaylistModal, setAddToPlaylistModal] = useState({ open: false, songId: null });
    const [pendingNextSong, setPendingNextSong] = useState(false);
    const [pendingAutoNextSong, setPendingAutoNextSong] = useState(false);


    const {
        adPlaying,
        adAudio,
        handleAdEnded,
        currentSongId,
        isPlaying,
        setIsPlaying,
        audioRef,
        playlist,
        setCurrentSongId,
        volume,
        liked,
        toggleWishlist,
        checkLiked,
        handlePlayPause: contextHandlePlayPause,
        handleDownload: contextHandleDownload,
        handleVolume: contextHandleVolume,
        songCount,
        setSongCount,
        fetchAdAudio
    } = useContext(PlayerContext);

    const navigate = useNavigate(); // Thêm hook này
    const [pulsePhase, setPulsePhase] = useState(0);

    // Animate waveform nếu đang play
    useEffect(() => {
        if (!isPlaying) return;
        let raf;
        const animate = () => {
            setPulsePhase(p => p + 0.13); // Tăng tốc độ ở đây
            raf = requestAnimationFrame(animate);
        };
        animate();
        return () => raf && cancelAnimationFrame(raf);
    }, [isPlaying]);

    // Luôn đồng bộ liked khi songId thay đổi (mỗi khi mở chi tiết bài mới)
    useEffect(() => {
        if (songId) checkLiked(songId);
    }, [songId, checkLiked]);

    // Fetch song details
    useEffect(() => {
        if (!songId) return;
        setLoading(true);
        axios.get(`${BASE_API_URL}/api/v1/guest/${songId}/details`)
            .then(res => {
                const data = res.data;
                setSong(data.song);
                setArtist(data.artist);
                setAlbum(data.album);
                setViewed(false);
            })
            .catch(() => {
                message.error("Song not found or an error occurred.");
                setSong(null);
            })
            .finally(() => setLoading(false));
    }, [songId]);

    // Fetch lyrics
    useEffect(() => {
        if (!songId) {
            setLyrics("");
            return;
        }
        axios.get(`${BASE_API_URL}/api/v1/song/lyric/${songId}`)
            .then(res => setLyrics(res.data?.data || "No lyrics available."))
            .catch(() => setLyrics("No lyrics available."));
    }, [songId]);

    // Check Premium
    const roles = JSON.parse(localStorage.getItem("roles") || "[]");
    const isPremium = roles.includes("ROLE_PREMIUM");
    const isArtist = roles.includes("ROLE_ARTIST"); // Thêm dòng này

    // Next/Prev helpers
    const getNextSongId = useCallback(() => {
        if (!playlist || !currentSongId) return null;
        const index = playlist.indexOf(currentSongId);
        return index >= 0 && index < playlist.length - 1 ? playlist[index + 1] : null;
    }, [playlist, currentSongId]);

    const getPrevSongId = useCallback(() => {
        if (!playlist || !currentSongId) return null;
        const index = playlist.indexOf(currentSongId);
        return index > 0 ? playlist[index - 1] : null;
    }, [playlist, currentSongId]);

    const nextSong = useCallback(() => {
        const nextId = getNextSongId();
        if (nextId) setCurrentSongId(nextId);
    }, [getNextSongId, setCurrentSongId]);

    const prevSong = useCallback(() => {
        const prevId = getPrevSongId();
        if (prevId) setCurrentSongId(prevId);
    }, [getPrevSongId, setCurrentSongId]);

    // Logic next/prev/auto-next với quảng cáo
    const handleSongChange = useCallback((type) => {
        if (adPlaying) {
            message.info("Please listen to the entire ad before proceeding.!");
            return;
        }
        if (isPremium || isArtist) { // Thêm isArtist vào điều kiện
            type === "next" ? nextSong() : prevSong();
            return;
        }
        if ((songCount + 1) % 3 === 0) {
            if (type === "next") setPendingNextSong(true);
            if (type === "prev") setPendingNextSong(false);
            fetchAdAudio();
        } else {
            setSongCount(c => c + 1);
            type === "next" ? nextSong() : prevSong();
        }
    }, [adPlaying, isPremium, isArtist, songCount, setSongCount, fetchAdAudio, nextSong, prevSong]);

    const handleSongEnd = useCallback(() => {
        if (adPlaying) return;
        if (isPremium || isArtist) { // Thêm isArtist vào điều kiện
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
            setPendingAutoNextSong(true);
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
    }, [adPlaying, isPremium, isArtist, songCount, setSongCount, fetchAdAudio, getNextSongId, setCurrentSongId, setIsPlaying]);

    useEffect(() => {
        if (!adPlaying && pendingNextSong) {
            setPendingNextSong(false);
            nextSong();
            setIsPlaying(true);
        }
        if (!adPlaying && pendingAutoNextSong) {
            setPendingAutoNextSong(false);
            nextSong();
            setIsPlaying(true);
        }
    }, [adPlaying, pendingNextSong, pendingAutoNextSong, nextSong, setIsPlaying]);

    // ✅ Setup audio event listeners
    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;

        const handleTimeUpdate = () => {
            if (adPlaying) return;

            setCurrentTime(audio.currentTime);

            if (song?.duration && !viewed) {
                const durationSec = song.duration.split(":").reduce((acc, val) => 60 * acc + +val, 0);
                if (audio.currentTime / durationSec > 0.8) {
                    setViewed(true);
                    axios.post(`${BASE_API_URL}/api/v1/play/song/${song.id}/update-views`, null, {
                        params: { playedDuration: audio.currentTime }
                    }).catch(() => { });
                }
            }
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('ended', handleSongEnd);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('ended', handleSongEnd);
        };
    }, [audioRef, adPlaying, song, viewed, handleSongEnd]);

    // Safe functions
    const safePlayPause = useCallback(() => {
        if (adPlaying) {
            message.info("Please listen to the entire ad before proceeding.!");
            return;
        }
        contextHandlePlayPause();
    }, [adPlaying, contextHandlePlayPause]);

    const safeNextSong = useCallback(() => {
        handleSongChange("next");
    }, [handleSongChange]);

    const safePrevSong = useCallback(() => {
        handleSongChange("prev");
    }, [handleSongChange]);

    const safeDownload = useCallback(() => {
        if (adPlaying) {
            message.info("Please listen to the entire ad before downloading.!");
            return;
        }
        contextHandleDownload();
    }, [adPlaying, contextHandleDownload]);

    const safeToggleWishlist = useCallback(() => {
        if (adPlaying) {
            message.info("Please listen to the entire ad before proceeding.!");
            return;
        }
        toggleWishlist(songId);
    }, [adPlaying, toggleWishlist, songId]);

    const handleSeek = useCallback((e) => {
        if (adPlaying) {
            message.info("Please listen to the entire ad before proceeding.!");
            return;
        }
        if (audioRef.current) {
            const newTime = +e.target.value;
            audioRef.current.currentTime = newTime;
            setCurrentTime(newTime);
        }
    }, [audioRef, adPlaying]);

    const handleVolumeChange = useCallback((value) => {
        if (adPlaying) {
            message.info("Please listen to the entire ad before proceeding.!");
            return;
        }
        contextHandleVolume(value);
    }, [adPlaying, contextHandleVolume]);

    const formatTime = useCallback((secs) => {
        if (!secs && secs !== 0) return "0:00";
        const min = Math.floor(secs / 60);
        const sec = Math.floor(secs % 60);
        return `${min}:${sec < 10 ? "0" : ""}${sec}`;
    }, []);

    if (loading) return <Spin style={{ margin: 40 }} />;
    if (!song) return <div style={{ padding: 40 }}>Song not found.</div>;

    const durationSec = song?.duration ? song.duration.split(":").reduce((acc, t) => 60 * acc + +t, 0) : 0;
    const currentUser = localStorage.getItem("userName");

    return (
        <>
            <AddToPlaylistModal
                open={addToPlaylistModal.open}
                onClose={() => setAddToPlaylistModal({ open: false, songId: null })}
                songId={addToPlaylistModal.songId}
            />
            <style>{`
/* ==== Base Styles ==== */
.song-detail-container {
    animation: fadeInUp 0.4s ease-out;
    background: #181818;
    min-height: 100vh;
    width: 100%;
    position: relative;
    overflow: hidden;
}
.song-detail-content {
    display: flex;
    flex: 1;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
    padding: 48px 32px 0 32px;
    gap: 48px;
    min-height: calc(100vh - 48px);
    overflow: hidden;
    flex-direction: row;
}
.song-detail-left {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
}
.song-detail-right {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    height: 100vh;
    overflow: hidden;
}
.player-img {
    border-radius: 50% !important;
    width: 350px !important;
    height: 350px !important;
    box-shadow: 0 12px 48px rgba(0,0,0,0.6);
    position: relative;
    background: #23283e;
    object-fit: cover;
    animation: spin-disc 12s linear infinite;
    animation-play-state: paused;
}
.player-img::after {
    content: "";
    position: absolute;
    left: 50%; top: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: radial-gradient(#fff 60%, #3ed8ff 80%, transparent 100%);
    border: 3px solid #3ed8ff77;
    z-index: 2;
    pointer-events: none;
}
.player-img.spinning {
    animation-play-state: running;   /* Khi play thì xoay */
}
.song-title {
    color: #fff;
    font-weight: 700;
    font-size: 36px;
    margin-bottom: 10px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.6);
    line-height: 1.1;
    text-align: center;
}
.song-meta {
    color: #fff;
    opacity: 0.85;
    font-size: 16px;
    margin-bottom: 4px;
}
.player-controls {
    display: flex;
    align-items: center;
    gap: 18px;
    margin-bottom: 16px;
}
.song-progress {
    width: 100%;
    max-width: 340px;
    margin-bottom: 4px;
    margin-top: 2px;
}
.progress-bar {
    width: 100%;
    height: 6px;
    border-radius: 4px;
    background: #23283e;
    outline: none;
    border: none;
    appearance: none;
    cursor: pointer;
}
.progress-bar::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3ed8ff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(62, 216, 255, 0.3);
}
.progress-bar::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3ed8ff;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(62, 216, 255, 0.3);
}
.progress-bar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.progress-bar:disabled::-webkit-slider-thumb {
    cursor: not-allowed;
}
.progress-time {
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #8ca0c6;
    font-size: 13px;
    margin-top: 2px;
    width: 100%;
    padding: 0 4px;
    font-variant-numeric: tabular-nums;
}
.lyrics-scroll {
    -ms-overflow-style: none;
    scrollbar-width: none;
    color: #fff;
    white-space: pre-line;
    font-size: 18px;
    font-family: inherit;
    line-height: 1.6;
    padding: 0 20px 12px 20px;
    text-align: center;
    min-height: 150px;
    max-height: calc(100vh - 210px);
    overflow-y: auto;
}
.lyrics-scroll::-webkit-scrollbar {
    display: none;
}
.tabs-lyrics-comments .ant-tabs-nav {
    font-size: 18px;
}
    .artist-link {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    cursor: pointer;
}

.artist-link .artist-name {
    font-size: 18px;
    color: #fff; /* Đảm bảo chữ trắng cho desktop */
    margin-left: 10px;
    font-weight: 600;
    transition: color 0.2s ease;
}

.artist-link .artist-name:hover {
    color: #3ed8ff;
}
.player-btn {
    background: rgba(255,255,255,0.1);
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 18px;
    outline: none;
    box-shadow: none;
}
.player-btn:hover {
    background: rgba(255,255,255,0.2);
    transform: scale(1.05);
    color: #fff;
}
.player-btn:focus {
    background: rgba(255,255,255,0.2);
    color: #fff;
    outline: none;
    box-shadow: none;
}
.player-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}
.player-btn.main {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%);
    font-size: 24px;
    color: #23283e;
}
.player-btn.main:hover {
    background: linear-gradient(135deg, #29aaff 60%, #1890ff 100%);
    color: #23283e;
}
.player-btn.like.liked {
    color: #ff4757;
    background: rgba(255, 71, 87, 0.1);
}
.player-btn.like.liked:hover {
    color: #ff4757;
    background: rgba(255, 71, 87, 0.2);
}
.volume-slider {
    width: 70px;
    height: 4px;
    border-radius: 2px;
    background: #23283e;
    outline: none;
    border: none;
    appearance: none;
    cursor: pointer;
    accent-color: #3ed8ff;
}
.volume-slider:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
.player-img-wrapper {
  position: relative;
  width: 370px;
  height: 370px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.waveform-svg {
  position: absolute;
  left: 0; top: 0;
  width: 370px; height: 370px;
  pointer-events: none;
  z-index: 1;
}

@keyframes spin-disc {
    100% { transform: rotate(360deg);}
}

/* ==== Responsive tablet (max-width: 1100px) ==== */
@media (max-width: 1100px) {
    .song-detail-content {
        flex-direction: column !important;
        gap: 30px !important;
        padding: 34px 5vw 0 5vw !important;
        max-width: 99vw !important;
    }
    .player-img {
        width: 210px !important;
        height: 210px !important;
        margin-bottom: 26px !important;
    }
    .song-title {
        font-size: 45px !important;
        margin-bottom: 18px !important;
    }
    .song-meta {
        font-size: 22px !important;
        margin-bottom: 8px !important;
    }
    .player-controls {
        gap: 28px !important;
        margin-bottom: 22px !important;
    }
    .player-btn,
    .player-btn.main {
        width: 58px !important;
        height: 58px !important;
        font-size: 27px !important;
    }
    .player-btn.main {
        width: 68px !important;
        height: 68px !important;
        font-size: 34px !important;
    }
    .volume-slider {
        width: 120px !important;
        height: 6px !important;
    }
    .artist-link .artist-name {
        font-size: 23px !important;
        color: #fff !important;
    }
    .song-progress {
        max-width: 500px !important;
        margin-bottom: 9px !important;
        margin-top: 9px !important;
    }
    .progress-bar {
        height: 10px !important;
        border-radius: 6px !important;
    }
    .progress-bar::-webkit-slider-thumb,
    .progress-bar::-moz-range-thumb {
        width: 22px !important;
        height: 22px !important;
    }
    .progress-time {
        font-size: 18px !important;
        padding: 0 9px !important;
    }
    .lyrics-scroll {
        font-size: 22px !important;
        padding: 0 8vw 16px 8vw !important;
        min-height: 160px !important;
        max-height: 520px !important;
    }
    .tabs-lyrics-comments .ant-tabs-nav {
        font-size: 22px !important;
    }
}
/* ==== Responsive mobile (max-width: 600px) ==== */
@media (max-width: 600px) {
    .song-title {
        font-size: 18px !important;
        margin-bottom: 2px !important;
    }
    .artist-link .artist-name {
        font-size: 23px !important;
        color: #fff !important;
    }
    .volume-container {
        display: none !important;
    }
    .player-controls {
        margin-top: 8px !important;
    }
    .tabs-lyrics-comments {
        margin-top: 6px !important;
    }
    .song-meta {
        font-size: 13px !important;
        margin-bottom: 2px !important;
    }
    .player-img {
        width: 70px !important;
        height: 70px !important;
        margin-bottom: 2px !important;
    }
    .song-progress {
        max-width: 70vw !important;
        margin: 6px 0 !important;
    }
    .song-meta-hide-on-mobile,
    .hide-on-mobile {
        display: none !important;
    }
    .lyrics-scroll {
        font-size: 15px !important;
        min-height: 110px !important;
        max-height: 400px !important;
        border-radius: 8px !important;
        padding: 0 10px 10px 10px !important;
        text-align: center !important;
        background: rgba(44,68,106,0.12);
        box-shadow: 0 2px 12px 0 rgba(62,216,255,0.04);
        word-break: break-word !important;
        overflow-wrap: break-word !important;
        box-sizing: border-box !important;
        max-width: 100% !important;
    }
    .player-img-wrapper, .waveform-svg {
        width: 110px !important;
        height: 110px !important;
    }
    .comment-input-container {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100% !important;
        padding: 0 2vw !important;
        margin: 0 auto 8px auto !important;
    }
    .comment-input-container textarea,
    .comment-input-container input {
        font-size: 14px !important;
        padding: 6px 10px !important;
        border-radius: 6px !important;
    }
    .comment-input-container button,
    .ant-btn-primary {
        font-size: 13px !important;
        padding: 7px 18px !important;
        border-radius: 6px !important;
    }
    .comment-tab-container,
    .comment-item {
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
    }
    .comment-item .email,
    .comment-item .content {
        font-size: 13px !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
    }
}

/* ==== Tabs hiển thị đúng cho desktop/tablet/mobile ==== */
@media (min-width: 1101px) {
    .mobile-tabs { display: none !important; }
    .desktop-tabs { display: block !important; }
    .song-detail-content { flex-direction: row !important; }
}
@media (max-width: 1100px) {
    .desktop-tabs { display: none !important; }
    .mobile-tabs { display: block !important; }
    .song-detail-content { flex-direction: column !important; }
}

/* Animation */
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px);}
    to { opacity: 1; transform: translateY(0);}
}
`}</style>

            <div className="song-detail-container"
                style={{
                    width: "100%",
                    background: "#181818",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    minHeight: "100vh",
                    overflow: "hidden"
                }}>
                <div style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 0,
                    background: song?.profilePicUrl ? `url(${song.profilePicUrl}) center/cover no-repeat` : "#181818",
                    filter: "blur(60px) brightness(0.4)",
                    opacity: 0.7,
                    pointerEvents: "none",
                    transition: "background 0.5s"
                }} />

                <Button
                    onClick={onClose}
                    type="text"
                    shape="circle"
                    size="large"
                    style={{
                        position: "fixed",
                        top: 32,
                        right: 48,
                        color: "#fff",
                        background: "rgba(0,0,0,0.5)",
                        fontSize: 20,
                        zIndex: 10,
                        cursor: "pointer",
                        border: "none",
                        outline: "none",
                        boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
                    }}
                    icon={<i className="bi bi-x-lg"></i>}
                    aria-label="Close"
                />

                <div className="song-detail-content">
                    <div className="song-detail-left">
                        <div className="player-img-wrapper">
                            <svg className="waveform-svg" viewBox="0 0 400 400" width="370" height="370">
                                <circle
                                    cx="200"
                                    cy="200"
                                    r="175"
                                    fill="none"
                                    stroke="#23283e"
                                    strokeWidth="6"
                                />
                                {
                                    Array.from({ length: 48 }).map((_, i) => {
                                        const angle = (i / 48) * 2 * Math.PI;
                                        const radius = 175;
                                        const pulse =
                                            18 +
                                            (isPlaying
                                                ? Math.abs(Math.sin(pulsePhase + i * 0.26)) * 24
                                                : 0);
                                        const x1 = 200 + Math.cos(angle) * radius;
                                        const y1 = 200 + Math.sin(angle) * radius;
                                        const x2 = 200 + Math.cos(angle) * (radius + pulse);
                                        const y2 = 200 + Math.sin(angle) * (radius + pulse);
                                        return (
                                            <line
                                                key={i}
                                                x1={x1}
                                                y1={y1}
                                                x2={x2}
                                                y2={y2}
                                                stroke="#3ed8ff"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                style={{
                                                    transition: "all 0.18s cubic-bezier(.55,.01,.55,1.01)"
                                                }}
                                            />
                                        );
                                    })
                                }
                            </svg>
                            <img
                                className={`player-img${isPlaying ? " spinning" : " paused"}`}
                                src={song?.profilePicUrl}
                                alt={song?.title}
                                draggable={false}
                                style={{
                                    zIndex: 2,
                                    position: "relative",
                                    background: "#181818"
                                }}
                            />
                        </div>
                        <h1 className="song-title">{song?.title}</h1>

                        {artist && (
                            <div
                                className="artist-link"
                                onClick={() => {
                                    const token = localStorage.getItem("accessToken");
                                    if (token) {
                                        if (onClose) onClose();
                                        navigate(`/artist/${artist.id || artist.artistId}`);
                                    } else {
                                        message.info("Please login to view artist profile!");
                                    }
                                }}
                                title={t("go_to_artist_profile")}
                            >
                                <Avatar
                                    src={
                                        artist.profilePicUrl ||
                                        artist.profileImage ||
                                        artist.profile_image ||
                                        "/img/default-cover.png"
                                    }
                                    size={40}
                                />
                                <span className="artist-name">
                                    {(artist.firstName && artist.lastName)
                                        ? `${artist.firstName} ${artist.lastName}`
                                        : artist.artistName || ""}
                                </span>
                            </div>
                        )}

                        <div className="song-meta hide-on-mobile">
                            <b>{t('song_detail.album')}:</b> {album ? album.titleAlbum : song?.albumName || "—"}
                        </div>
                        <div className="song-meta song-meta-hide-on-mobile">
                            <b>{t('song_detail.views')}:</b> {song?.views?.toLocaleString()}
                        </div>
                        <div className="song-meta song-meta-hide-on-mobile" style={{ marginBottom: 24 }}>
                            <b>{t('song_detail.duration')}:</b> {song?.duration}
                        </div>

                        <div className="player-controls">
                            {/* ... Các nút điều khiển ... */}
                            <button
                                className="player-btn"
                                onClick={safePrevSong}
                                disabled={adPlaying}
                                title="Previous Song"
                                style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                                <i className="bi bi-skip-backward-fill"></i>
                            </button>
                            <button
                                className="player-btn main"
                                onClick={safePlayPause}
                                disabled={adPlaying}
                                title={isPlaying ? "Pause" : "Play"}
                                style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                                <i className={isPlaying ? "bi bi-pause-fill" : "bi bi-play-fill"}></i>
                            </button>
                            <button
                                className="player-btn"
                                onClick={safeNextSong}
                                disabled={adPlaying}
                                title="Next Song"
                                style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                                <i className="bi bi-skip-forward-fill"></i>
                            </button>
                            <button
                                className={`player-btn like${liked ? " liked" : ""}`}
                                onClick={safeToggleWishlist}
                                disabled={adPlaying}
                                title={liked ? "Remove from Favorites" : "Add to Favorites"}
                                style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                                <i className={liked ? "bi bi-heart-fill" : "bi bi-heart"}></i>
                            </button>
                            <button
                                className="player-btn"
                                onClick={safeDownload}
                                disabled={adPlaying}
                                title={t('song_detail.download_song')}
                                style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                                <i className="bi bi-download"></i>
                            </button>
                            <button
                                className="player-btn"
                                onClick={() => {
                                    const token = localStorage.getItem("accessToken");
                                    if (!token) {
                                        message.info(t("weekly_top_10.login_to_add_playlist") || "Please login to add songs to your playlist!");
                                        return;
                                    }
                                    setAddToPlaylistModal({ open: true, songId: songId });
                                }}
                                disabled={adPlaying}
                                title={t('song_detail.add_to_playlist') || "Add to Playlist"}
                                style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                            >
                                <i className="bi bi-plus-square"></i>
                            </button>
                            <div className="volume-container">
                                <i className="bi bi-volume-up volume-icon"></i>
                                <input
                                    type="range"
                                    min={0}
                                    max={1}
                                    step={0.01}
                                    value={volume}
                                    onChange={e => handleVolumeChange(+e.target.value)}
                                    className="volume-slider"
                                    disabled={adPlaying}
                                    title="Volume"
                                    style={adPlaying ? { opacity: 0.5, pointerEvents: "none" } : {}}
                                />
                            </div>
                        </div>

                        <div className="song-progress">
                            <input
                                type="range"
                                min={0}
                                max={durationSec}
                                value={currentTime}
                                onChange={handleSeek}
                                className="progress-bar"
                                style={{
                                    background: `linear-gradient(90deg, #3ed8ff ${(currentTime / durationSec) * 100}%, #23283e ${(currentTime / durationSec) * 100}%)`,
                                    ...(adPlaying && { opacity: 0.5, pointerEvents: "none" })
                                }}
                                disabled={adPlaying}
                                title="Seek"
                            />
                            <div className="progress-time">
                                <span className="time-current">{formatTime(currentTime)}</span>
                                <span className="time-total">{song?.duration}</span>
                            </div>
                        </div>

                        {/* Tabs chỉ hiện trên mobile/tablet */}
                        <div className="mobile-tabs">
                            <Tabs
                                defaultActiveKey="lyrics"
                                centered
                                className="tabs-lyrics-comments"
                                items={[
                                    {
                                        key: "lyrics",
                                        label: <span style={{ color: "#29aaff", fontWeight: 700 }}>{t('song_detail.lyrics')}</span>,
                                        children: <div className="lyrics-scroll">{lyrics}</div>
                                    },
                                    {
                                        key: "comments",
                                        label: <span style={{ color: "#29aaff", fontWeight: 700 }}>{t('song_detail.comments')}</span>,
                                        children: (
                                            <div
                                                style={{
                                                    flex: 1,
                                                    minHeight: 0,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    height: "calc(70vh - 200px)" // Giảm 240px nếu muốn tăng vùng comment
                                                }}
                                            >
                                                <CommentTab songId={songId} currentUser={currentUser} />
                                            </div>
                                        )
                                    }
                                ]}
                                tabBarStyle={{
                                    background: "transparent",
                                    color: "#29aaff",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    borderBottom: "1.5px solid #333",
                                    marginBottom: 18,
                                    textShadow: "0 2px 8px rgba(41, 170, 255, 0.3)"
                                }}
                                style={{ width: "100%", marginTop: 8 }}
                            />
                        </div>
                    </div>

                    {/* Cột phải chỉ hiện Tabs trên desktop */}
                    <div className="song-detail-right" style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        height: "90%",   // hoặc "100%" nếu cha là flex/full
                        minHeight: 0,
                        overflow: "hidden"
                    }}>
                        <div className="desktop-tabs" style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
                            <Tabs
                                defaultActiveKey="lyrics"
                                centered
                                className="tabs-lyrics-comments"
                                items={[
                                    {
                                        key: "lyrics",
                                        label: <span style={{ color: "#29aaff", fontWeight: 700 }}>{t('song_detail.lyrics')}</span>,
                                        children: <div className="lyrics-scroll">{lyrics}</div>
                                    },
                                    {
                                        key: "comments",
                                        label: <span style={{ color: "#29aaff", fontWeight: 700 }}>{t('song_detail.comments')}</span>,
                                        children: (
                                            <div style={{
                                                flex: 1,
                                                minHeight: 0,
                                                display: "flex",
                                                flexDirection: "column",
                                                height: "100%",
                                                maxHeight: "calc(100vh - 200px)"
                                            }}>
                                                <CommentTab songId={songId} currentUser={currentUser} />
                                            </div>
                                        )
                                    }
                                ]}
                                tabBarStyle={{
                                    background: "transparent",
                                    color: "#29aaff",
                                    fontWeight: 700,
                                    fontSize: 18,
                                    borderBottom: "1.5px solid #333",
                                    marginBottom: 18,
                                    textShadow: "0 2px 8px rgba(41, 170, 255, 0.3)"
                                }}
                                style={{ width: "100%", marginTop: 8, height: "100%", minHeight: 0 }} // ép Tabs 100% height
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ✅ Quảng cáo overlay */}
            {adPlaying && adAudio && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        background: "rgba(24,28,43,0.98)",
                        zIndex: 5000,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        animation: "fadeInUp 0.4s ease-out",
                        backdropFilter: "blur(8px)"
                    }}
                >
                    <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 32,
                        width: "100%",
                        maxWidth: 480,
                        margin: "0 auto",
                        background: "rgba(24,28,43,0.98)",
                        borderRadius: 32,
                        boxShadow: "0 8px 32px rgba(62, 216, 255, 0.2)",
                        padding: "48px 32px",
                        border: "1px solid rgba(62, 216, 255, 0.1)"
                    }}>
                        <img
                            src="/img/Music_in_advertising_Hero.jpg"
                            alt="Sponsored Audio Break"
                            style={{
                                width: 260,
                                height: 260,
                                borderRadius: 24,
                                objectFit: "cover",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                                marginBottom: 16
                            }}
                        />
                        <h1 style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 32,
                            marginBottom: 8,
                            textAlign: "center",
                            textShadow: "0 2px 12px rgba(0,0,0,0.6)"
                        }}>
                            Sponsored Audio Break
                        </h1>
                        <p style={{
                            color: "#8ca0c6",
                            fontSize: 16,
                            textAlign: "center",
                            marginBottom: 16
                        }}>
                            Please wait while the ad is playing...
                        </p>
                        {adAudio.redirectUrl && (
                            <Button
                                style={{
                                    borderRadius: 24,
                                    fontWeight: 700,
                                    background: "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)",
                                    color: "#23283e",
                                    border: "none",
                                    padding: "12px 32px",
                                    fontSize: 20,
                                    boxShadow: "0 2px 12px rgba(62, 216, 255, 0.2)",
                                    transition: "all 0.3s ease",
                                    cursor: "pointer"
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.background = "linear-gradient(135deg, #29aaff 60%, #1890ff 100%)";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.background = "linear-gradient(135deg, #3ed8ff 60%, #1fa2ff 100%)";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}
                                onClick={() => window.open(adAudio.redirectUrl, "_blank")}
                            >
                                Learn More
                            </Button>
                        )}
                    </div>
                    <audio
                        src={adAudio.mediaUrl}
                        autoPlay
                        onEnded={handleAdEnded}
                        controls={false}
                        style={{ display: "none" }}
                    />
                </div>
            )}
        </>
    );
}

SongDetail.propTypes = {
    songId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    onClose: PropTypes.func.isRequired
};