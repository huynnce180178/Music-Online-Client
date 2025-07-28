import { useEffect, useState, useContext, useCallback } from "react";
import { Tabs, Spin, message, Avatar, Button } from "antd";
import axios from "axios";
import PropTypes from "prop-types";
import { PlayerContext } from "../context/PlayerContext";
import CommentTab from "./CommentTab";
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
            message.info("Vui lòng nghe hết quảng cáo trước khi thao tác!");
            return;
        }
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
    }, [adPlaying, isPremium, songCount, setSongCount, fetchAdAudio, nextSong, prevSong]);

    const handleSongEnd = useCallback(() => {
        if (adPlaying) return;
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
    }, [adPlaying, isPremium, songCount, setSongCount, fetchAdAudio, getNextSongId, setCurrentSongId, setIsPlaying]);

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
            message.info("Vui lòng nghe hết quảng cáo trước khi thao tác!");
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
            message.info("Vui lòng nghe hết quảng cáo trước khi tải xuống!");
            return;
        }
        contextHandleDownload();
    }, [adPlaying, contextHandleDownload]);

    const safeToggleWishlist = useCallback(() => {
        if (adPlaying) {
            message.info("Vui lòng nghe hết quảng cáo trước khi thao tác!");
            return;
        }
        toggleWishlist(songId);
    }, [adPlaying, toggleWishlist, songId]);

    const handleSeek = useCallback((e) => {
        if (adPlaying) {
            message.info("Vui lòng nghe hết quảng cáo trước khi thao tác!");
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
            message.info("Vui lòng nghe hết quảng cáo trước khi thao tác!");
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
            <style>{`
                .lyrics-scroll::-webkit-scrollbar {
                    display: none;
                }
                .lyrics-scroll {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
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
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .song-detail-container {
                    animation: fadeInUp 0.4s ease-out;
                }
            `}</style>

            <div className="song-detail-container"
                style={{
                    width: "100%",
                    background: "#181818",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    minHeight: "100vh", // Đảm bảo chiều cao tối thiểu
                    overflow: "hidden"  // Ngăn cuộn dọc không cần thiết ở container chính
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

                <div style={{
                    display: "flex",
                    flex: 1,
                    zIndex: 1,
                    maxWidth: 1200,
                    margin: "0 auto",
                    width: "100%",
                    padding: "48px 32px 0 32px",
                    gap: 48,
                    minHeight: "calc(100vh - 48px)", // Đảm bảo chiều cao tối thiểu cho flex
                    overflow: "hidden" // Ngăn cuộn dọc ở vùng flex chính
                }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <img
                            src={song?.profilePicUrl}
                            alt={song?.title}
                            style={{
                                width: 330,
                                height: 330,
                                borderRadius: 20,
                                objectFit: "cover",
                                boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
                                marginBottom: 32,
                                transition: "transform 0.3s, box-shadow 0.3s"
                            }}
                        />
                        <h1 style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 36,
                            marginBottom: 10,
                            textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                            lineHeight: 1.1,
                            textAlign: "center"
                        }}>
                            {song?.title}
                        </h1>

                        {artist && (
                            <div
                                style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, cursor: "pointer" }}
                                onClick={() => {
                                    const token = localStorage.getItem("accessToken");
                                    if (token) {
                                        if (onClose) onClose(); // Đóng modal detail trước
                                        // Điều hướng sang trang profile nghệ sĩ
                                        navigate(`/artist/${artist.id || artist.artistId}`);
                                    } else {
                                        message.info("Please login to view artist profile!");
                                    }
                                }}
                                title="Go to artist profile"
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
                                <span style={{ color: "#fff", fontWeight: 500, fontSize: 18, textDecoration: "underline" }}>
                                    {(artist.firstName && artist.lastName)
                                        ? `${artist.firstName} ${artist.lastName}`
                                        : artist.artistName || ""}
                                </span>
                            </div>
                        )}

                        <div style={{ color: "#fff", opacity: 0.85, marginBottom: 4, fontSize: 16 }}>
                            <b>{t('song_detail.album')}:</b> {album ? album.titleAlbum : song?.albumName || "—"}
                        </div>
                        <div style={{ color: "#fff", opacity: 0.85, marginBottom: 4, fontSize: 16 }}>
                            <b>{t('song_detail.views')}:</b> {song?.views?.toLocaleString()}
                        </div>
                        <div style={{ color: "#fff", opacity: 0.85, fontSize: 16, marginBottom: 24 }}>
                            <b>{t('song_detail.duration')}:</b> {song?.duration}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
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
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <i className="bi bi-volume-up" style={{ fontSize: 20, color: "#8ca0c6" }}></i>
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

                        <div style={{ width: "100%", maxWidth: 340 }}>
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
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                color: "#8ca0c6",
                                fontSize: 13,
                                marginTop: 4
                            }}>
                                <span>{formatTime(currentTime)}</span>
                                <span>{song?.duration}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        flex: 1,
                        minWidth: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-start",
                        height: "100vh",
                        overflow: "hidden" // Ngăn cuộn dọc ở vùng phải
                    }}>
                        <Tabs
                            defaultActiveKey="lyrics"
                            centered
                            items={[
                                {
                                    key: "lyrics",
                                    label: <span style={{ color: "#29aaff", fontWeight: 700 }}>{t('song_detail.lyrics')}</span>,
                                    children: (
                                        <div className="lyrics-scroll" style={{
                                            color: "#fff",
                                            whiteSpace: "pre-line",
                                            fontSize: 18,
                                            fontFamily: "inherit",
                                            height: "calc(100vh - 160px)",
                                            overflowY: "auto",
                                            paddingRight: "8px",
                                            lineHeight: 1.6
                                        }}>
                                            {lyrics}
                                        </div>
                                    )
                                },
                                {
                                    key: "comments",
                                    label: <span style={{ color: "#29aaff", fontWeight: 700 }}>{t('song_detail.comments')}</span>,
                                    children: (
                                        <div className="lyrics-scroll" style={{
                                            height: "calc(100vh - 150px)",
                                            overflowY: "auto",
                                            paddingRight: "8px"
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
                                marginBottom: 24,
                                textShadow: "0 2px 8px rgba(41, 170, 255, 0.3)"
                            }}
                            style={{ height: "100%" }}
                            className="song-detail-tabs"
                        />
                    </div>
                </div>
            </div>

            {/* ✅ Quảng cáo overlay - Chỉ hiển thị "Learn More" button */}
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

                        {/* ✅ Chỉ hiển thị Learn More button nếu có redirectUrl */}
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

                    {/* Hidden audio element for ad */}
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