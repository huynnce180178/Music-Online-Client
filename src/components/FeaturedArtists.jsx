import { useState, useEffect } from "react";
import axios from "axios";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom"; // Thêm import này
import { toast, ToastContainer } from "react-toastify";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function FeaturedArtists() {
    const { t } = useTranslation();
    function getInitialCount() {
        if (window.innerWidth < 576) return 1;
        if (window.innerWidth < 992) return 2;
        return 6;
    }

    const [artists, setArtists] = useState([]);
    const [visibleCount, setVisibleCount] = useState(getInitialCount());
    const [startIdx, setStartIdx] = useState(0);
    const navigate = useNavigate(); // Khởi tạo navigate
    const isLoggedIn = !!localStorage.getItem('accessToken');

    useEffect(() => {
        axios.get(`${BASE_API_URL}/api/v1/guest/Top10Artist`)
            .then(res => setArtists(res.data))
            .catch(() => setArtists([]));
    }, []);

    useEffect(() => {
        function handleResize() {
            setVisibleCount(getInitialCount());
            setStartIdx(0);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const canPrev = startIdx > 0;
    const canNext = startIdx + visibleCount < artists.length;
    const showViewMore = visibleCount < artists.length;

    const handlePrev = () => {
        if (canPrev) setStartIdx(idx => Math.max(idx - visibleCount, 0));
    };
    const handleNext = () => {
        if (canNext) setStartIdx(idx => Math.min(idx + visibleCount, artists.length - visibleCount));
    };
    const handleViewMore = () => {
        setVisibleCount(c => Math.min(c + getInitialCount(), artists.length));
    };

    const artistsToShow = artists.slice(startIdx, startIdx + visibleCount);

    // Helper function to format views
    function formatViews(views) {
        if (views >= 1e9) return (views / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
        if (views >= 1e6) return (views / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (views >= 1e3) return (views / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
        return views?.toLocaleString() || "0";
    }

    return (
        <div style={{
            width: "100%",
            background: "#181c2b",
            padding: "0 0 48px 0",
            display: "flex",
            justifyContent: "center",
        }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 48px", position: "relative" }}>

                {/* Arrow Left */}
                <button onClick={handlePrev} disabled={!canPrev} style={{
                    marginTop: 30,
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
                    zIndex: 3,
                    cursor: canPrev ? "pointer" : "not-allowed",
                    opacity: canPrev ? 1 : 0.4,
                    display: visibleCount < artists.length ? "block" : "none",
                }} aria-label="Previous">&#60;</button>

                {/* Arrow Right */}
                <button onClick={handleNext} disabled={!canNext} style={{
                    marginTop: 30,
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
                    zIndex: 3,
                    cursor: canNext ? "pointer" : "not-allowed",
                    opacity: canNext ? 1 : 0.4,
                    display: visibleCount < artists.length ? "block" : "none",
                }} aria-label="Next">&#62;</button>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-end mb-3 mt-2 flex-wrap">
                    <span style={{
                        color: "#3ed8ff",
                        fontWeight: 700,
                        fontSize: 28,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        letterSpacing: 1,
                    }}>
                        {t('featured_artists.title')}
                    </span>
                    {showViewMore && (
                        <a href="#" onClick={(e) => {
                            e.preventDefault();
                            handleViewMore();
                        }} style={{
                            color: "#fff",
                            fontSize: 16,
                            fontWeight: 400,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            cursor: "pointer",
                            textDecoration: "none",
                            marginRight: 8,
                        }}>
                            {t('featured_artists.view_more')}
                        </a>
                    )}
                </div>

                {/* Artist Grid */}
                <div className="row g-4">
                    {artistsToShow.map((artist, idx) => (
                        <div
                            className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
                            key={startIdx + idx}
                        >
                            <div
                                className="h-100"
                                style={{
                                    background: "transparent",
                                    borderRadius: 16,
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    cursor: "pointer",
                                }}
                                onClick={() => {
                                    if (isLoggedIn) {
                                        navigate(`/artist/${artist.artistId}`);
                                    } else {
                                        toast.info(
                                            t('featured_artists.login_to_view_artist') || "Please login to view artist information!",
                                            { autoClose: 2000 }
                                        );
                                    }
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(62,216,255,0.10)";
                                }}
                                onMouseLeave={e => {
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
                                        height: 200,
                                        transition: "transform 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                    }}
                                >
                                    <img
                                        src={artist.profile_image || "/img/default-cover.png"}
                                        alt={`${artist.firstName} ${artist.lastName}`}
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
                                    <div style={{
                                        position: "absolute",
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        top: 0,
                                        background: "linear-gradient(0deg, #181c2baa 0%, #181c2b11 100%)",
                                        zIndex: 1,
                                    }} />
                                    <div style={{
                                        position: "relative",
                                        zIndex: 2,
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 16,
                                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                        textShadow: "0 2px 8px #181f2a88",
                                        padding: "16px",
                                    }}>
                                        {artist.firstName} {artist.lastName}
                                        <div style={{
                                            fontWeight: 400,
                                            fontSize: 13,
                                            color: "#8ca0c6",
                                            marginTop: 4,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 6
                                        }}>
                                            <span style={{
                                                padding: "2px 8px",
                                                fontWeight: 600,
                                                color: "#3ed8ff",
                                                fontSize: 13,
                                                letterSpacing: 0.2
                                            }}>
                                                {formatViews(artist.totalViews)} {t('featured_artists.views')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <ToastContainer />
            </div>
        </div>
    );
}

