import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { PlayerContext } from "../context/PlayerContext";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

// Responsive: số lượng card theo breakpoint
function getInitialCount() {
    if (window.innerWidth < 600) return 1;
    if (window.innerWidth < 900) return 2;
    if (window.innerWidth < 1200) return 3;
    if (window.innerWidth < 1400) return 4;
    return 6;
}

export default function GenresList() {
    const [genres, setGenres] = useState([]);
    const [visibleCounts, setVisibleCounts] = useState({});
    const [startIdxs, setStartIdxs] = useState({});
    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;
    const { t } = useTranslation();

    useEffect(() => {
        axios.get(`${BASE_API_URL}/api/v1/guest/genre/genresViewMore?page=0&size=20&sortBy=id&sortDir=asc`)
            .then(res => setGenres(res.data))
            .catch(() => setGenres([]));
    }, []);

    useEffect(() => {
        function handleResize() {
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
        <div style={{ width: "100%", background: "#181c2b", padding: "0 0 48px 0", display: "flex", justifyContent: "center" }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 48px", position: "relative" }}>
                <style>
                    {`
                    .genre-header-title {
                        color: #3ed8ff;
                        font-weight: 700;
                        font-family: 'Quicksand', 'Montserrat', sans-serif;
                        letter-spacing: 1px;
                        font-size: 28px;
                        line-height: 1.2;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }
                    .genre-view-more-btn {
                        color: #fff;
                        font-size: 16px;
                        font-weight: 400;
                        font-family: 'Quicksand', 'Montserrat', sans-serif;
                        cursor: pointer;
                        text-decoration: none;
                        background: #3ed8ff;
                        border-radius: 18px;
                        padding: 6px 18px;
                        margin-left: 12px;
                        border: none;
                        transition: background 0.2s;
                        display: none;
                    }
                    .genre-view-more-btn:active {
                        background: #2bb8d6;
                    }
                    @media (max-width: 600px) {
                        .genre-header-title { font-size: 18px; }
                        .genre-view-more-btn { display: inline-block !important; }
                    }
                    `}
                </style>
                {genres.map((genre) => {
                    const visibleCount = getCount(genre.genreId);
                    const startIdx = getStartIdx(genre.genreId);
                    const songsToShow = genre.songs.slice(startIdx, startIdx + visibleCount);
                    const canPrev = startIdx > 0;
                    const canNext = startIdx + visibleCount < genre.songs.length;
                    const showViewMore = visibleCount < genre.songs.length;

                    return (
                        <div key={genre.genreId} className="mb-5" style={{ position: 'relative' }}>
                            {/* Arrow trái */}
                            <button
                                className="genre-arrow-btn"
                                onClick={() => handlePrev(genre.genreId)}
                                disabled={!canPrev}
                                style={{
                                    position: "absolute",
                                    left: "-40px",
                                    top: "60%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(0,0,0,0.7)",
                                    border: "none",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    width: 35,
                                    height: 35,
                                    fontSize: 20,
                                    zIndex: 3,
                                    cursor: canPrev ? "pointer" : "not-allowed",
                                    opacity: canPrev ? 1 : 0.4,
                                    display: visibleCount < genre.songs.length ? "block" : "none",
                                }}
                                aria-label="Previous"
                            >
                                &#60;
                            </button>
                            {/* Arrow phải */}
                            <button
                                className="genre-arrow-btn"
                                onClick={() => handleNext(genre.genreId, genre.songs.length)}
                                disabled={!canNext}
                                style={{
                                    position: "absolute",
                                    right: "-40px",
                                    top: "60%",
                                    transform: "translateY(-50%)",
                                    background: "rgba(0,0,0,0.7)",
                                    border: "none",
                                    color: "#fff",
                                    borderRadius: "50%",
                                    width: 35,
                                    height: 35,
                                    fontSize: 20,
                                    zIndex: 3,
                                    cursor: canNext ? "pointer" : "not-allowed",
                                    opacity: canNext ? 1 : 0.4,
                                    display: visibleCount < genre.songs.length ? "block" : "none",
                                }}
                                aria-label="Next"
                            >
                                &#62;
                            </button>
                            {/* Header */}
                            <div className="d-flex justify-content-between align-items-end mb-3 mt-2 flex-wrap">
                                <span className="genre-header-title">
                                    {t(`genres.${genre.genreName}`, genre.genreName)}
                                </span>
                                {showViewMore && (
                                    <button
                                        className="genre-view-more-btn"
                                        onClick={e => {
                                            e.preventDefault();
                                            handleViewMore(genre.genreId, genre.songs.length);
                                        }}
                                    >
                                        {t('top_genres.view_more', 'View More')}
                                    </button>
                                )}
                            </div>
                            {/* Song Card Grid */}
                            <div className="row g-4">
                                {songsToShow.map((song) => (
                                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" key={song.id}>
                                        <div
                                            className="h-100 genre-song-card"
                                            onClick={() => handleSelectSong(song.id, genre.songs.map(s => s.id))}
                                            style={{
                                                background: "transparent",
                                                borderRadius: 18,
                                                transition: "transform 0.2s, box-shadow 0.2s",
                                                cursor: "pointer",
                                                height: 200,
                                                boxShadow: "0 4px 24px #3ed8ff22",
                                                overflow: "hidden",
                                                position: "relative",
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "flex-end",
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                                                e.currentTarget.style.boxShadow = "0 6px 24px rgba(62,216,255,0.10)";
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.transform = "";
                                                e.currentTarget.style.boxShadow = "0 4px 24px #3ed8ff22";
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
                                                fontSize: 18,
                                                fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                                textShadow: "0 2px 8px #181f2a88",
                                                padding: "18px",
                                                wordBreak: "break-word",
                                                minHeight: 60,
                                                display: "flex",
                                                flexDirection: "column",
                                                justifyContent: "flex-end",
                                            }}>
                                                <div style={{
                                                    marginBottom: 3,
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 2,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                }}>{song.title}</div>
                                                <div style={{
                                                    fontWeight: 400,
                                                    fontSize: 14,
                                                    color: "#8ca0c6",
                                                    marginTop: 2,
                                                }}>
                                                    {genre.genreName}
                                                </div>
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
