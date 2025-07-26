import React, { useState, useEffect, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { PlayerContext } from "../context/PlayerContext"; // ✅ Thêm context
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

function useBootstrapBreakpoint() {
    const getBp = () => {
        if (window.innerWidth < 576) return "mobile";
        if (window.innerWidth < 992) return "tablet";
        return "desktop";
    };
    const [bp, setBp] = useState(getBp());
    useEffect(() => {
        const handleResize = () => setBp(getBp());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);
    return bp;
}

export default function TrendingTracks() {
    const { t } = useTranslation();
    const bp = useBootstrapBreakpoint();
    const [startIdx, setStartIdx] = useState(0);
    const [newReleases, setNewReleases] = useState([]);
    const playerCtx = useContext(PlayerContext) || {}; // ✅ Sử dụng context
    const { playSong } = playerCtx; // ✅ Lấy playSong từ context

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/TopSongsInMonth`)
            .then(res => res.json())
            .then(data => {
                // Check if data is an array and has content
                if (Array.isArray(data) && data.length > 0) {
                    const mapped = data.map(track => ({
                        id: track.id || track.songId,
                        title: track.title,
                        cover: track.profilePicUrl,
                        artist: track.artistName,
                    }));
                    setNewReleases(mapped);
                } else if (data && Array.isArray(data.data)) {
                    // Handle case where data is wrapped in a data property
                    const mapped = data.data.map(track => ({
                        id: track.id || track.songId,
                        title: track.title,
                        cover: track.profilePicUrl,
                        artist: track.artistName,
                    }));
                    setNewReleases(mapped);
                } else {
                    console.warn("Trending tracks data is not in expected format:", data);
                    setNewReleases([]);
                }
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                setNewReleases([]);
            });
    }, []);

    const showCount = bp === "mobile" ? 1 : bp === "tablet" ? 2 : 4;
    const lastIdx = newReleases.length - showCount;
    const canPrev = startIdx > 0;
    const canNext = startIdx < lastIdx;

    useEffect(() => { setStartIdx(0); }, [bp]);

    const albumsToShow = newReleases.slice(startIdx, startIdx + showCount);
    const containerClass = bp === "mobile" ? "container px-2" : bp === "tablet" ? "container px-3" : "container px-5";

    const handlePlaySong = (songId) => {
        const allSongIds = newReleases.map(song => song.id);
        playSong?.(songId, allSongIds);
    };

    return (
        <div className="w-100" style={{ background: "#181c2b", padding: "0 0 48px 0" }}>
            <div className={containerClass} style={{ maxWidth: 1550, margin: "0 auto" }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{
                        color: "#3ed8ff", fontWeight: 700, fontSize: 28,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        lineHeight: "34px"
                    }}>
                        {t('trending_tracks.title')}
                    </span>
                </div>

                {/* Timeline & Slider */}
                <div style={{ position: "relative", width: "100%", minHeight: 70 }}>
                    <div style={{
                        position: "absolute", top: 16, left: 0, right: 0,
                        height: 2, background: "linear-gradient(90deg, #31395a 10%, #23283e 90%)", zIndex: 0
                    }} />

                    <div className="d-flex align-items-start justify-content-between flex-nowrap"
                        style={{ position: "relative", zIndex: 2, minHeight: 80 }}>

                        {/* Prev button */}
                        <button className="btn btn-link p-0 d-flex align-items-center justify-content-center"
                            style={{
                                color: "#fff", fontSize: 32,
                                marginRight: bp === "mobile" ? 4 : 12,
                                marginTop: 18, zIndex: 5, minWidth: 40
                            }}
                            onClick={() => canPrev && setStartIdx(startIdx - 1)}
                            disabled={!canPrev}
                            tabIndex={-1}
                        >
                            <span style={{ opacity: canPrev ? 1 : 0.2 }}>&#60;</span>
                        </button>

                        {/* Track items */}
                        <div className="d-flex flex-row flex-nowrap w-100 justify-content-between" style={{ gap: 0 }}>
                            {albumsToShow.map((item, idx) => {
                                const timelineIdx = startIdx + idx;
                                return (
                                    <div
                                        key={timelineIdx}
                                        onClick={() => handlePlaySong(item.id)} // ✅ Click để phát bài hát
                                        className={`d-flex flex-column align-items-center ${bp === "mobile" ? "w-100" : ""}`}
                                        style={{
                                            width: bp === "mobile" ? "100%" : bp === "tablet" ? "48%" : "auto",
                                            maxWidth: bp === "desktop" ? 320 : "100%",
                                            margin: "0 3px",
                                            cursor: "pointer"
                                        }}
                                    >
                                        {/* Dot on timeline */}
                                        <div style={{
                                            width: 18, height: 18, borderRadius: "50%",
                                            background: "#181c2b",
                                            border: "3px solid #3ed8ff",
                                            marginBottom: 14, marginTop: 8,
                                        }} />

                                        {/* Track info */}
                                        <div className="d-flex align-items-center w-100" style={{ minWidth: 0 }}>
                                            <img
                                                src={item.cover}
                                                alt={item.title}
                                                style={{
                                                    width: 50, height: 50, borderRadius: 10,
                                                    objectFit: "cover", background: "#23283e",
                                                    marginRight: 13,
                                                }}
                                            />
                                            <div style={{ textAlign: "left", minWidth: 0 }}>
                                                <div style={{
                                                    color: "#fff", fontWeight: 600, fontSize: 17,
                                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                    marginBottom: 1, whiteSpace: "nowrap",
                                                    overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200
                                                }}>
                                                    {item.title}
                                                </div>
                                                <div style={{
                                                    color: "#8ca0c6", fontSize: 14,
                                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120
                                                }}>
                                                    {item.artist}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Next button */}
                        <button className="btn btn-link p-0 d-flex align-items-center justify-content-center"
                            style={{
                                color: "#fff", fontSize: 32,
                                marginLeft: bp === "mobile" ? 4 : 12,
                                marginTop: 18, zIndex: 5, minWidth: 40
                            }}
                            onClick={() => canNext && setStartIdx(startIdx + 1)}
                            disabled={!canNext}
                            tabIndex={-1}
                        >
                            <span style={{ opacity: canNext ? 1 : 0.2 }}>&#62;</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
