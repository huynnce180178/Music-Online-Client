import React, { useState, useEffect, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { PlayerContext } from "../context/PlayerContext";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function TopTracksOAT() {
    const { t } = useTranslation();

    function getInitialCount() {
        if (window.innerWidth < 576) return 1;
        if (window.innerWidth < 992) return 2;
        return 6;
    }

    const [songs, setSongs] = useState([]);
    const [visibleCount, setVisibleCount] = useState(getInitialCount());
    const [startIdx, setStartIdx] = useState(0);

    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/TopSongs`)
            .then(res => res.json())
            .then(data => {
                // Check if data is an array and has content
                if (Array.isArray(data) && data.length > 0) {
                    const mapped = data.map(song => ({
                        id: song.songId || song.id,
                        title: song.title,
                        cover: song.profilePicUrl,
                        artist: song.artistName,
                    }));
                    setSongs(mapped);
                } else if (data && Array.isArray(data.data)) {
                    // Handle case where data is wrapped in a data property
                    const mapped = data.data.map(song => ({
                        id: song.songId || song.id,
                        title: song.title,
                        cover: song.profilePicUrl,
                        artist: song.artistName,
                    }));
                    setSongs(mapped);
                } else {
                    console.warn("Top tracks data is not in expected format:", data);
                    setSongs([]);
                }
            })
            .catch(() => setSongs([]));
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setVisibleCount(getInitialCount());
            setStartIdx(0);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const canPrev = startIdx > 0;
    const canNext = startIdx + visibleCount < songs.length;

    const handlePrev = () => {
        if (canPrev) setStartIdx(idx => Math.max(idx - getInitialCount(), 0));
    };

    const handleNext = () => {
        if (canNext) setStartIdx(idx => Math.min(idx + getInitialCount(), songs.length - visibleCount));
    };

    const handleViewMore = () => {
        setVisibleCount(c => Math.min(c + getInitialCount(), songs.length));
    };

    const handleSelectSong = (songId) => {
        const allSongIds = songs.map(s => s.id);
        playSong?.(songId, allSongIds);
    };

    const songsToShow = songs.slice(startIdx, startIdx + visibleCount);

    return (
        <div style={{ width: "100%", background: "#181c2b", padding: "0 0 24px", display: "flex", justifyContent: "center" }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 48px", position: "relative" }}>

                {/* Arrows */}
                <button onClick={handlePrev} disabled={!canPrev}
                    style={{
                        marginTop: 30,
                        position: "absolute",
                        left: 0, top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.7)",
                        border: "none",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 38,
                        height: 38,
                        fontSize: 22,
                        zIndex: 3,
                        cursor: canPrev ? "pointer" : "not-allowed",
                        opacity: canPrev ? 1 : 0.4,
                    }}
                    aria-label="Previous">&#60;</button>

                <button onClick={handleNext} disabled={!canNext}
                    style={{
                        marginTop: 30,
                        position: "absolute",
                        right: 0, top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(0,0,0,0.7)",
                        border: "none",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 38,
                        height: 38,
                        fontSize: 22,
                        zIndex: 3,
                        cursor: canNext ? "pointer" : "not-allowed",
                        opacity: canNext ? 1 : 0.4,
                    }}
                    aria-label="Next">&#62;</button>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-end mb-3 mt-2 flex-wrap">
                    <span style={{
                        color: "#3ed8ff", fontWeight: 700, fontSize: 28,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif", letterSpacing: 1
                    }}>
                        {t('top_tracks_oat.title')}
                    </span>
                    {visibleCount < songs.length && (
                        <a href="#" onClick={e => { e.preventDefault(); handleViewMore(); }} style={{
                            color: "#fff", fontSize: 16,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            fontWeight: 400, cursor: "pointer", textDecoration: "none", marginRight: 8,
                        }}>
                            {t('top_tracks_oat.view_more')}
                        </a>
                    )}
                </div>

                {/* Song Cards */}
                <div className="row g-4">
                    {songsToShow.map((song, idx) => (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" key={startIdx + idx}>
                            <div onClick={() => handleSelectSong(song.id)} style={{
                                position: "relative", borderRadius: 18, overflow: "hidden",
                                background: "#23283e", boxShadow: "0 4px 24px #3ed8ff22",
                                height: 200, cursor: "pointer", transition: "transform 0.2s",
                                display: "flex", flexDirection: "column", justifyContent: "flex-end",
                            }}
                                onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                            >
                                <img src={song.cover} alt={song.title} style={{
                                    width: "100%", height: "100%", objectFit: "cover",
                                    position: "absolute", left: 0, top: 0, zIndex: 0,
                                }} />
                                <div style={{
                                    position: "absolute", left: 0, right: 0, bottom: 0, top: 0,
                                    background: "linear-gradient(0deg, #181c2baa 0%, #181c2b11 100%)", zIndex: 1,
                                }} />
                                <div style={{
                                    position: "relative", zIndex: 2, color: "#fff",
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif", padding: 16,
                                }}>
                                    <div style={{
                                        fontWeight: 500, fontSize: 16, textShadow: "0 2px 8px #181f2a88",
                                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "normal",
                                        minHeight: 48, marginBottom: 6,
                                    }}>
                                        {song.title}
                                    </div>
                                    <div style={{
                                        fontWeight: 400, fontSize: 13, color: "#8ca0c6"
                                    }}>
                                        {song.artist}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
