import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { PlayerContext } from "../context/PlayerContext";
import { useTranslation } from 'react-i18next';
import { useParams } from "react-router-dom";
import BASE_API_URL from "../services/base.api.url";

function getInitialCount() {
    if (window.innerWidth < 576) return 1;
    if (window.innerWidth < 992) return 2;
    return 6;
}

export default function GenresList() {
    const [genres, setGenres] = useState([]);
    const [visibleCounts, setVisibleCounts] = useState({});
    const [startIdxs, setStartIdxs] = useState({});
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;
    const { t } = useTranslation();
    const { genreId } = useParams();

    function getBreakpoint() {
        if (window.innerWidth < 576) return "mobile";
        if (window.innerWidth < 992) return "tablet";
        return "desktop";
    }

    useEffect(() => {
        if (genreId) {
            // If genreId is provided, fetch specific genre
            axios.get(`${BASE_API_URL}/api/v1/guest/genre/${genreId}/songs`)
                .then(res => {
                    const genreData = res.data?.data || res.data;
                    if (genreData) {
                        setGenres([genreData]);
                    } else {
                        setGenres([]);
                    }
                })
                .catch(() => setGenres([]));
        } else {
            // Fetch all genres for genres-viewmore page
            axios.get(`${BASE_API_URL}/api/v1/guest/genre/genresViewMore?page=0&size=20&sortBy=id&sortDir=asc`)
                .then(res => setGenres(res.data))
                .catch(() => setGenres([]));
        }
    }, [genreId]);

    useEffect(() => {
        function handleResize() {
            setBreakpoint(getBreakpoint());
            setVisibleCounts({});
            setStartIdxs({});
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getCount = genreId => visibleCounts[genreId] || getInitialCount();
    const getStartIdx = genreId => startIdxs[genreId] || 0;

    const handlePrev = (genreId) => {
        setStartIdxs(idxObj => ({
            ...idxObj,
            [genreId]: Math.max((idxObj[genreId] || 0) - getInitialCount(), 0)
        }));
    };

    const handleNext = (genreId, songLen) => {
        setStartIdxs(idxObj => ({
            ...idxObj,
            [genreId]: Math.min((idxObj[genreId] || 0) + getInitialCount(), songLen - getCount(genreId))
        }));
    };

    const handleViewMore = (genreId, songLen) => {
        setVisibleCounts(counts => ({
            ...counts,
            [genreId]: Math.min(getCount(genreId) + getInitialCount(), songLen)
        }));
    };

    const handleSelectSong = (songId, allSongIds) => {
        playSong && playSong(songId, allSongIds);
    };

    return (
        <div style={{
            background: "#181c2b",
            padding: breakpoint === "mobile" ? "0 0 24px 0" : "0 0 48px 0",
            minHeight: breakpoint === "mobile" ? 200 : 360,
            width: "100%",
            overflow: "visible"
        }}>
            <div className="container-fluid" style={{ 
                maxWidth: 1550, 
                padding: breakpoint === "mobile" ? "0 16px" : "0 48px",
                width: "100%"
            }}>
                {genres.map((genre) => {
                    const visibleCount = getCount(genre.genreId);
                    const startIdx = getStartIdx(genre.genreId);
                    const songsToShow = genre.songs.slice(startIdx, startIdx + visibleCount);
                    const canPrev = startIdx > 0;
                    const canNext = startIdx + visibleCount < genre.songs.length;

                    return (
                        <div key={genre.genreId} className="mb-5" style={{ position: 'relative' }}>
                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-center mb-3 mt-2">
                                <span style={{
                                    color: "#3ed8ff",
                                    fontWeight: 700,
                                    fontSize: breakpoint === "mobile" ? 20 : 28,
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                    letterSpacing: 1,
                                }}>
                                    {t(`genres.${genre.genreName}`, genre.genreName)}
                                </span>
                                {visibleCount < genre.songs.length && (
                                    <a
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            handleViewMore(genre.genreId, genre.songs.length);
                                        }}
                                        style={{
                                            color: "#fff",
                                            fontSize: breakpoint === "mobile" ? 14 : 16,
                                            fontWeight: 400,
                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                            cursor: "pointer",
                                            textDecoration: "none",
                                            marginRight: 0,
                                        }}
                                    >
                                        {t('top_genres.view_more', 'View More')}
                                    </a>
                                )}
                            </div>

                            {/* Arrow Left - Hidden on mobile */}
                            {breakpoint !== "mobile" && (
                                <button
                                    onClick={() => handlePrev(genre.genreId)}
                                    disabled={!canPrev}
                                    style={{
                                        position: "absolute",
                                        left: -40,
                                        top: "50%",
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
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    aria-label="Previous"
                                >
                                    &#60;
                                </button>
                            )}

                            {/* Arrow Right - Hidden on mobile */}
                            {breakpoint !== "mobile" && (
                                <button
                                    onClick={() => handleNext(genre.genreId, genre.songs.length)}
                                    disabled={!canNext}
                                    style={{
                                        position: "absolute",
                                        right: -40,
                                        top: "50%",
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
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    aria-label="Next"
                                >
                                    &#62;
                                </button>
                            )}

                            {/* Song Card Row */}
                            <div className="d-flex flex-row flex-grow-1" style={{
                                gap: breakpoint === "mobile" ? "12px" : "30px",
                                overflow: breakpoint === "mobile" ? "auto" : "hidden",
                                minHeight: breakpoint === "mobile" ? 160 : 220,
                                flexWrap: breakpoint === "mobile" ? "nowrap" : "nowrap",
                                paddingBottom: breakpoint === "mobile" ? "8px" : "0",
                            }}>
                                {songsToShow.map((song, idx) => (
                                    <div
                                        key={song.id}
                                        style={{
                                            background: "transparent",
                                            borderRadius: breakpoint === "mobile" ? 12 : 18,
                                            transition: "transform 0.2s, box-shadow 0.2s",
                                            cursor: "pointer",
                                            width: breakpoint === "mobile" ? 140 : 180,
                                            height: breakpoint === "mobile" ? 160 : 200,
                                            boxShadow: "0 4px 24px #3ed8ff22",
                                            overflow: "hidden",
                                            position: "relative",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-end",
                                            flexShrink: 0,
                                        }}
                                        onClick={() => handleSelectSong(song.id, genre.songs.map(s => s.id))}
                                        onMouseEnter={e => {
                                            if (breakpoint !== "mobile") {
                                                e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                                                e.currentTarget.style.boxShadow = "0 6px 24px rgba(62,216,255,0.10)";
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (breakpoint !== "mobile") {
                                                e.currentTarget.style.transform = "";
                                                e.currentTarget.style.boxShadow = "0 4px 24px #3ed8ff22";
                                            }
                                        }}
                                    >
                                        <img
                                            src={song.profilePicUrl}
                                            alt={song.title}
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
                                        {/* Overlay */}
                                        <div style={{
                                            position: "absolute",
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            top: 0,
                                            background: "linear-gradient(0deg, #181c2baa 0%, #181c2b11 100%)",
                                            zIndex: 1,
                                        }} />
                                        {/* Song Info */}
                                        <div style={{
                                            position: "relative",
                                            zIndex: 2,
                                            color: "#fff",
                                            fontWeight: 700,
                                            fontSize: breakpoint === "mobile" ? 14 : 18,
                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                            textShadow: "0 2px 8px #181f2a88",
                                            padding: breakpoint === "mobile" ? "12px" : "18px",
                                            wordBreak: "break-word",
                                            minHeight: breakpoint === "mobile" ? 40 : 60,
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "flex-end",
                                        }}>
                                            <div style={{
                                                marginBottom: 3,
                                                display: breakpoint === "mobile" ? 'block' : '-webkit-box',
                                                WebkitLineClamp: breakpoint === "mobile" ? 1 : 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                fontSize: breakpoint === "mobile" ? 12 : 14,
                                                lineHeight: breakpoint === "mobile" ? 1.2 : 1.4,
                                            }}>{song.title}</div>
                                            <div style={{
                                                fontWeight: 400,
                                                fontSize: breakpoint === "mobile" ? 10 : 14,
                                                color: "#8ca0c6",
                                                marginTop: 2,
                                            }}>
                                                {genre.genreName}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
