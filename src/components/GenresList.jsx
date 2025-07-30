import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { PlayerContext } from "../context/PlayerContext";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";
import { useLocation, useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

// Responsive: số lượng card theo breakpoint
function getInitialCount() {
    if (window.innerWidth < 600) return 5;
    if (window.innerWidth < 900) return 2;
    if (window.innerWidth < 1200) return 3;
    if (window.innerWidth < 1400) return 4;
    return 6;
}

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function GenresList() {
    const [genres, setGenres] = useState([]);
    const [startIdxs, setStartIdxs] = useState({});
    const [visibleCounts, setVisibleCounts] = useState({});
    const [loading, setLoading] = useState(true);
    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;
    const { t } = useTranslation();
    const query = useQuery();
    const navigate = useNavigate();

    const genreId = query.get("genreId");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            if (genreId) {
                // Lấy danh sách tất cả genre (để lấy tên & ảnh genre)
                try {
                    const resGenres = await axios.get(`${BASE_API_URL}/api/v1/genres?page=0&size=1000&sortBy=id&sortDir=asc`);
                    const allGenres = Array.isArray(resGenres.data.data) ? resGenres.data.data : [];
                    const genre = allGenres.find(g => String(g.id) === String(genreId) || String(g.genreId) === String(genreId));
                    if (!genre) {
                        setGenres([]);
                        setLoading(false);
                        return;
                    }
                    const resSongs = await axios.get(`${BASE_API_URL}/api/v1/guest/genre/${genreId}/songs`);
                    setGenres([{ ...genre, songs: resSongs.data || [] }]);
                } catch {
                    setGenres([]);
                }
                setLoading(false);
            } else {
                // Lấy tất cả genres và bài hát của từng genre
                try {
                    const resGenres = await axios.get(`${BASE_API_URL}/api/v1/genres?page=0&size=1000&sortBy=id&sortDir=asc`);
                    const allGenres = Array.isArray(resGenres.data.data) ? resGenres.data.data : [];
                    const genresWithSongs = await Promise.all(
                        allGenres.map(async genre => {
                            try {
                                const resSongs = await axios.get(`${BASE_API_URL}/api/v1/guest/genre/${genre.id || genre.genreId}/songs`);
                                return { ...genre, songs: resSongs.data || [] };
                            } catch {
                                return { ...genre, songs: [] };
                            }
                        })
                    );
                    setGenres(genresWithSongs);
                } catch {
                    setGenres([]);
                }
                setLoading(false);
            }
        };
        fetchData();
        // eslint-disable-next-line
    }, [window.location.search]);

    useEffect(() => {
        function handleResize() {
            setStartIdxs({});
            setVisibleCounts({});
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getCount = (genreId, genreLen) =>
        visibleCounts[genreId] || Math.min(getInitialCount(), genreLen);

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
            [genreId]: Math.min((idxObj[genreId] || 0) + getInitialCount(), songLen - getCount(genreId, songLen))
        }));
    };

    const handleViewMore = (genreId, songLen) => {
        setVisibleCounts(counts => ({
            ...counts,
            [genreId]: Math.min(getCount(genreId, songLen) + getInitialCount(), songLen)
        }));
    };

    const handleSelectSong = (songId, allSongIds) => {
        playSong && playSong(songId, allSongIds);
    };

    if (loading) return <div style={{ color: "#fff", textAlign: "center" }}>Loading...</div>;

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
                    @media (max-width: 600px) {
                        .genre-header-title {
                            font-size: 21px !important;
                        }
                        .container-fluid {
                            padding-left: 5 !important;
                            padding-right:5 !important;
                        }
                        .genre-header-bar {
                            margin-left: 0 !important;
                            margin-right: 0 !important;
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                        }
                    }
                    `}
                </style>
                {genres.map((genre) => {
                    const genreIdVal = genre.id || genre.genreId;
                    const visibleCount = getCount(genreIdVal, (genre.songs || []).length);
                    const startIdx = getStartIdx(genreIdVal);
                    const songsToShow = (genre.songs || []).slice(startIdx, startIdx + visibleCount);
                    const canPrev = startIdx > 0;
                    const canNext = startIdx + visibleCount < (genre.songs || []).length;

                    // Responsive header layout: "Back" trái - Title giữa - "View More" phải
                    return (
                        <div id={`genre-${genreIdVal}`} key={genreIdVal} className="mb-5" style={{ position: 'relative' }}>
                            {/* Responsive Header */}
                            <div
                                className="genre-header-bar"
                                style={{
                                    position: "relative",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    minHeight: 48,
                                    marginBottom: 18,
                                    marginTop: 8,
                                    padding: window.innerWidth < 600 ? "0 0px" : "",
                                }}
                            >
                                {/* Back (chỉ hiện khi có genreId) */}
                                {genreId && (
                                    <button
                                        onClick={() => navigate("/genres")}
                                        style={{
                                            height: 42,
                                            width: 42,
                                            border: "none",
                                            background: "none",
                                            color: "#3ed8ff",
                                            fontSize: 26,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            cursor: "pointer",
                                            padding: 0,
                                            margin: 0,
                                            zIndex: 2,
                                        }}
                                        aria-label="Back"
                                    >
                                        <FiArrowLeft />
                                    </button>
                                )}

                                {/* Title luôn căn giữa, thu gọn 2 bên mobile */}
                                <span
                                    className="genre-header-title"
                                    style={{
                                        flex: "1 1 auto",
                                        textAlign: "left",
                                        fontSize: window.innerWidth < 600 ? 21 : 28,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                        lineHeight: "42px",
                                        margin: 0,
                                        padding: 0,
                                        minWidth: 0,
                                    }}
                                >
                                    {t(`genres.${genre.genreName}`, genre.genreName)}
                                </span>

                                {/* View More (nằm phải, chỉ hiện khi chưa xem hết) */}
                                {visibleCount < (genre.songs || []).length ? (
                                    <a
                                        href="#"
                                        onClick={e => {
                                            e.preventDefault();
                                            handleViewMore(genreIdVal, (genre.songs || []).length);
                                        }}
                                        style={{
                                            height: 42,
                                            minWidth: 42,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "flex-end",
                                            color: "#fff",
                                            fontSize: window.innerWidth < 600 ? 15 : 16,
                                            fontWeight: 400,
                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                            cursor: "pointer",
                                            textDecoration: "none",
                                            zIndex: 2,
                                            padding: 0,
                                            margin: 0,
                                            background: "none",
                                            border: "none",
                                        }}
                                    >
                                        {t('top_genres.view_more', 'View More')}
                                    </a>
                                ) : (
                                    // Nếu không có View More, giữ 1 box trống để title vẫn chính giữa
                                    <div style={{
                                        width: 42,
                                        minWidth: 42,
                                        height: 42,
                                        display: "flex"
                                    }} />
                                )}
                            </div>
                            {/* Arrow trái */}
                            <button
                                className="genre-arrow-btn"
                                onClick={() => handlePrev(genreIdVal)}
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
                                    display: visibleCount < (genre.songs || []).length ? "block" : "none",
                                }}
                                aria-label="Previous"
                            >
                                &#60;
                            </button>
                            {/* Arrow phải */}
                            <button
                                className="genre-arrow-btn"
                                onClick={() => handleNext(genreIdVal, (genre.songs || []).length)}
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
                                    display: visibleCount < (genre.songs || []).length ? "block" : "none",
                                }}
                                aria-label="Next"
                            >
                                &#62;
                            </button>
                            {/* Song Card Grid */}
                            <div className="row g-4">
                                {songsToShow.map((song) => (
                                    <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" key={song.id}>
                                        <div
                                            className="h-100 genre-song-card"
                                            onClick={() => handleSelectSong(song.id, (genre.songs || []).map(s => s.id))}
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
                                                padding: "10px",
                                                wordBreak: "break-word",
                                                minHeight: 120,
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
