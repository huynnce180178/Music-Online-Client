import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Avatar, Spin, message } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function SearchResult() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search).get("keyword") || "";
    const { playSong } = useContext(PlayerContext) || {};
    const { t } = useTranslation();

    const [loading, setLoading] = useState(true);
    const [localTopResult, setLocalTopResult] = useState(null);
    const [localSongs, setLocalSongs] = useState([]);
    const [localFeaturing, setLocalFeaturing] = useState([]);
    const [startIdx, setStartIdx] = useState(0);
    const [visibleCount, setVisibleCount] = useState(() => {
        if (window.innerWidth < 576) return 1;
        if (window.innerWidth < 1024) return 2;
        return 4;
    });

    // Resize handler for carousel count
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 576) setVisibleCount(1);
            else if (window.innerWidth < 1024) setVisibleCount(2);
            else setVisibleCount(4);
            setStartIdx(0);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (!query.trim()) {
            setLocalTopResult(null);
            setLocalSongs([]);
            setLocalFeaturing([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        axios
            .get(`${BASE_API_URL}/api/v1/guest/fullTextSearch?keyword=${encodeURIComponent(query)}`)
            .then((res) => {
                const data = res.data?.data;
                if (!data) throw new Error("No data in response");
                const topType = data.topResult?.type;
                const top = data.topResult?.data;
                if (topType === "Song") {
                    setLocalTopResult({
                        type: "Song",
                        songId: top.id,
                        songName: top.title,
                        artistName: top.artistName,
                        fileUrl: top.fileUrl,
                        profile_pic_url: top.profilePicUrl,
                        duration: top.duration ? top.duration.slice(3) : "00:00",
                        views: top.views || 0,
                    });
                } else if (topType === "Artist") {
                    setLocalTopResult({
                        type: "Artist",
                        artistId: top.id,
                        artistName: top.firstName + (top.lastName ? " " + top.lastName : ""),
                        profile_pic_url: top.profileImage,
                        bio: top.bio,
                    });
                } else if (topType === "Album") {
                    setLocalTopResult({
                        type: "Album",
                        albumId: top.id,
                        albumName: top.titleAlbum,
                        coverUrl: top.coverImageUrl,
                        artistId: top.artistId,
                    });
                } else {
                    setLocalTopResult(null);
                }
                setLocalSongs(
                    (data.songList || []).map((s) => ({
                        songId: s.id,
                        songName: s.title,
                        artistName: s.artistName,
                        fileUrl: s.fileUrl,
                        profile_pic_url: s.profilePicUrl,
                        duration: s.duration ? s.duration.slice(3) : "00:00",
                        views: s.views || 0,
                    }))
                );
                setLocalFeaturing(
                    (data.albumList || []).map((album) => ({
                        albumId: album.id,
                        title: album.titleAlbum,
                        image: album.coverImageUrl || "/img/default-cover.png",
                    }))
                );
            })
            .catch((err) => {
                console.error("Search API error:", err);
                message.error("Failed to fetch search results.");
                setLocalTopResult(null);
                setLocalSongs([]);
                setLocalFeaturing([]);
            })
            .finally(() => setLoading(false));
    }, [query]);

    const handlePlaySong = (songId) => {
        const allSongIds = [localTopResult?.songId, ...localSongs.map((s) => s.songId)].filter(Boolean);
        if (playSong) {
            playSong(songId, allSongIds);
        } else {
            message.error("Song not found.");
        }
    };

    // === Responsive CSS only for this page ===
    // Bạn có thể chuyển vào file CSS module riêng nếu muốn
    const responsiveCSS = `
    @media (max-width: 1024px) {
      .search-flex-main { flex-direction: column !important; gap: 22px !important; }
      .search-top-result { max-width: 440px !important; margin: 0 auto 24px auto !important; }
      .search-songs-list { max-width: 98vw !important; margin: 0 auto; }
      .search-album-slider { padding: 0 12vw !important; }
    }
    @media (max-width: 600px) {
      .search-main-container { padding: 18px 3vw !important; }
      .search-flex-main { flex-direction: column !important; gap: 14px !important; }
      .search-top-result { max-width: 99vw !important; min-width: unset !important; height: 220px !important; }
      .search-songs-list { max-width: 99vw !important; }
      .search-songs-list .ant-avatar { width: 44px !important; height: 44px !important; min-width: 44px !important;}
      .search-songs-list div[style*="font-size: 16px"] { font-size: 13px !important; }
      .search-songs-list div[style*="font-size: 12px"] { font-size: 11px !important; }
      .search-album-slider {
    justify-content: center !important;
    display: flex !important;
    padding: 0 !important;
  }
      .search-album-card { height: 140px !important; }
      .search-album-card img { min-height: 140px !important; }
      .search-album-card div[style*="font-size: 16px"] { font-size: 12px !important; }
      .search-album-card div[style*="font-size: 12px"] { font-size: 10px !important; }
    }
    `;

    if (loading) {
        return (
            <div style={{ color: "#fff", padding: 40, textAlign: "center" }}>
                <Spin /> Loading...
            </div>
        );
    }

    if (!localTopResult) {
        return (
            <div
                style={{
                    color: "#fff",
                    padding: 40,
                    textAlign: "center",
                    minHeight: "calc(100vh - 150px)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "#181c2b",
                }}
            >
                <h2 style={{ color: "#3ed8ff", marginBottom: 16 }}>{t('search.noResultsFound')}</h2>
                <p style={{ color: "#8ca0c6" }}>
                    {t('search.pleaseTryAnotherKeywordOrCheckYourSpelling')}
                </p>
            </div>
        );
    }

    return (
        <div className="search-main-container" style={{ color: "#fff", background: "#181c2b", padding: "40px 60px" }}>
            <style>{responsiveCSS}</style>
            {/* Top result + Songs */}
            <div className="search-flex-main" style={{ display: "flex", gap: 40, marginBottom: 40, alignItems: "stretch" }}>
                {/* Top Result */}
                <div style={{ flex: 4 }}>
                    <h2 style={{ fontSize: 28, marginBottom: 25, color: "#3ed8ff" }}>{t('search.topResult')}</h2>
                    {localTopResult.type === "Song" ? (
                        <div
                            className="search-top-result"
                            onClick={() => handlePlaySong(localTopResult.songId)}
                            style={{
                                cursor: "pointer",
                                position: "relative",
                                borderRadius: 18,
                                overflow: "hidden",
                                background: "#23283e",
                                boxShadow: "0 4px 24px #3ed8ff22",
                                height: 300,
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "flex-end",
                                minWidth: 210,
                                maxWidth: 330,
                                transition: "transform 0.2s, box-shadow 0.2s",
                                margin: "0 auto",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        >
                            <img
                                src={localTopResult.profile_pic_url}
                                alt={localTopResult.songName}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    zIndex: 0,
                                }}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    top: 0,
                                    background: "linear-gradient(0deg, #181c2baa 0%, #181c2b11 100%)",
                                    zIndex: 1,
                                }}
                            />
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: 20,
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                    textShadow: "0 2px 8px #181f2a88",
                                    padding: "16px",
                                }}
                            >
                                {localTopResult.songName}
                                <div style={{ fontWeight: 400, fontSize: 13, color: "#8ca0c6", marginTop: 4 }}>
                                    {t('search.song')} · {localTopResult.artistName}
                                </div>
                            </div>
                        </div>
                    ) : localTopResult.type === "Artist" ? (
                        <div
                            className="search-top-result"
                            style={{
                                position: "relative",
                                borderRadius: 24,
                                overflow: "hidden",
                                width: "100%",
                                height: 320,
                                minHeight: 220,
                                maxWidth: 350,
                                margin: "0 auto",
                                background: "#23283e",
                                boxShadow: "0 8px 40px #1a225566",
                                cursor: "pointer",
                                transition: "transform .18s",
                            }}
                            onClick={() => navigate(`/artist/${localTopResult.artistId}`)}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        >
                            <img
                                src={localTopResult.profile_pic_url}
                                alt={localTopResult.artistName}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    zIndex: 0,
                                }}
                            />
                            {/* Overlay gradient ở phía dưới để dễ đọc text */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    height: 110,
                                    background: "linear-gradient(0deg, rgba(18,21,34,0.92) 85%, rgba(18,21,34,0.08) 100%)",
                                    zIndex: 1,
                                    pointerEvents: "none",
                                }}
                            />
                            {/* Info content: nằm dưới card */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 2,
                                    width: "100%",
                                    padding: "22px 10px 16px 10px",
                                    color: "#fff",
                                    textAlign: "center",
                                    pointerEvents: "none",
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif"
                                }}
                            >
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: 22,
                                    marginBottom: 7,
                                    textShadow: "0 3px 18px #181c2bcc, 0 1px 4px #23283eaa"
                                }}>
                                    {localTopResult.artistName}
                                </div>
                                <div style={{
                                    fontSize: 15,
                                    fontWeight: 400,
                                    maxWidth: 320,
                                    margin: "0 auto",
                                    lineHeight: 1.5,
                                    textShadow: "0 2px 8px #181c2b88"
                                }}>
                                    {localTopResult.bio}
                                </div>
                            </div>
                        </div>
                    ) : localTopResult.type === "Album" ? (
                        <div
                            className="search-top-result"
                            style={{
                                position: "relative",
                                borderRadius: 24,
                                overflow: "hidden",
                                width: "100%",
                                height: 320,
                                minHeight: 220,
                                maxWidth: 350,
                                margin: "0 auto",
                                background: "#23283e",
                                boxShadow: "0 8px 40px #1a225566",
                                cursor: "pointer",
                                transition: "transform .18s",
                            }}
                            onClick={() => navigate(`/album/${localTopResult.albumId}`)}
                            onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.02)")}
                            onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                        >
                            {/* Background album cover */}
                            <img
                                src={localTopResult.coverUrl}
                                alt={localTopResult.albumName}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    position: "absolute",
                                    left: 0,
                                    top: 0,
                                    zIndex: 0,
                                }}
                            />
                            {/* Info content: nằm dưới card */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 2,
                                    width: "100%",
                                    padding: "22px 10px 16px 10px",
                                    color: "#fff",
                                    textAlign: "center",
                                    pointerEvents: "none",
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif"
                                }}
                            >
                                <div style={{
                                    fontWeight: 700,
                                    fontSize: 22,
                                    marginBottom: 5,
                                    textShadow: "0 3px 18px #181c2bcc, 0 1px 4px #23283eaa"
                                }}>
                                    {localTopResult.albumName}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>

                {/* Songs */}
                <div style={{ flex: 6 }}>
                    <h2 style={{ fontSize: 28, marginBottom: 25, color: "#3ed8ff" }}>{t('search.songs')}</h2>
                    <div className="search-songs-list"
                        style={{
                            maxHeight: 300,
                            overflowY: "auto",
                            paddingRight: 8,
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                            maxWidth: 460,
                        }}>
                        <style>{`div.search-songs-list::-webkit-scrollbar { display: none; }`}</style>
                        {localSongs.slice(0, 5).map((song, index) => (
                            <div
                                key={index}
                                onClick={() => handlePlaySong(song.songId)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    marginBottom: 12,
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    transition: "background 0.3s",
                                    cursor: "pointer",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#232b3e")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                            >
                                <Avatar
                                    src={song.profile_pic_url}
                                    shape="square"
                                    size={56}
                                    style={{ marginRight: 12, borderRadius: 8, minWidth: 44 }}
                                />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, fontSize: 16 }}>{song.songName}</div>
                                    <div style={{ fontSize: 12, color: "#aaa" }}>{song.artistName}</div>
                                </div>
                                <div style={{ fontSize: 14, color: "#aaa" }}>{song.duration}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Featuring */}
            {localFeaturing.length > 0 && (
                <div style={{ position: "relative", marginTop: 40 }}>
                    <h2 style={{ fontSize: 28, marginBottom: 25, color: "#3ed8ff" }}>{t('search.featuring')}</h2>
                    <button
                        onClick={() => setStartIdx((idx) => Math.max(idx - visibleCount, 0))}
                        disabled={startIdx === 0}
                        style={{
                            position: "absolute",
                            left: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "rgba(0,0,0,0.7)",
                            border: "none",
                            color: "#fff",
                            borderRadius: "50%",
                            width: 38,
                            height: 38,
                            fontSize: 22,
                            zIndex: 2,
                            cursor: startIdx === 0 ? "not-allowed" : "pointer",
                            opacity: startIdx === 0 ? 0.4 : 1,
                        }}
                    >
                        &#60;
                    </button>
                    <button
                        onClick={() =>
                            setStartIdx((idx) =>
                                Math.min(idx + visibleCount, localFeaturing.length - visibleCount)
                            )
                        }
                        disabled={startIdx + visibleCount >= localFeaturing.length}
                        style={{
                            position: "absolute",
                            right: 0,
                            top: "50%",
                            transform: "translateY(-50%)",
                            background: "rgba(0,0,0,0.7)",
                            border: "none",
                            color: "#fff",
                            borderRadius: "50%",
                            width: 38,
                            height: 38,
                            fontSize: 22,
                            zIndex: 2,
                            cursor:
                                startIdx + visibleCount >= localFeaturing.length
                                    ? "not-allowed"
                                    : "pointer",
                            opacity: startIdx + visibleCount >= localFeaturing.length ? 0.4 : 1,
                        }}
                    >
                        &#62;
                    </button>
                    <div className="search-album-slider"
                        style={{
                            display: "flex",
                            gap: 20,
                            overflow: "hidden",
                            padding: "0 120px",
                        }}
                    >
                        {localFeaturing
                            .slice(startIdx, startIdx + visibleCount)
                            .map((item, index) => (
                                <div
                                    className="search-album-card"
                                    key={index}
                                    onClick={() => navigate(`/album/${item.albumId}`)}
                                    style={{
                                        flex: `0 0 calc(100% / ${visibleCount} - 20px)`,
                                        background: "transparent",
                                        borderRadius: 16,
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        cursor: "pointer",
                                        minWidth: 120,
                                        maxWidth: 240,
                                        height: 220,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                                        e.currentTarget.style.boxShadow =
                                            "0 6px 24px rgba(62,216,255,0.1)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = "";
                                        e.currentTarget.style.boxShadow = "";
                                    }}
                                >
                                    <div
                                        style={{
                                            position: "relative",
                                            borderRadius: 18,
                                            overflow: "hidden",
                                            background: "#23283e",
                                            boxShadow: "0 4px 24px #3ed8ff22",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-end",
                                        }}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.title}
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                minHeight: 160,
                                                objectFit: "cover",
                                                position: "absolute",
                                                left: 0,
                                                top: 0,
                                                zIndex: 0,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                top: 0,
                                                background:
                                                    "linear-gradient(0deg, #181c2baa 0%, #181c2b11 100%)",
                                                zIndex: 1,
                                            }}
                                        />
                                        <div
                                            style={{
                                                position: "relative",
                                                zIndex: 2,
                                                color: "#fff",
                                                fontWeight: 700,
                                                fontSize: 16,
                                                fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                textShadow: "0 2px 8px #181f2a88",
                                                padding: "12px",
                                            }}
                                        >
                                            {item.title}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
