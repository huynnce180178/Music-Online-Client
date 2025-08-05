import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function FeaturedAlbums() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Helper function to format views
    function formatViews(views) {
        if (views >= 1e9) return (views / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
        if (views >= 1e6) return (views / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (views >= 1e3) return (views / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
        return views?.toLocaleString() || "0";
    }

    function getInitialCount() {
        if (window.innerWidth < 576) return 1;
        if (window.innerWidth < 992) return 2;
        return 6;
    }

    function getBreakpoint() {
        if (window.innerWidth < 576) return "mobile";
        if (window.innerWidth < 992) return "tablet";
        return "desktop";
    }

    const [albums, setAlbums] = useState([]);
    const [visibleCount, setVisibleCount] = useState(getInitialCount());
    // Removed unused breakpoint state
    const [startIdx, setStartIdx] = useState(0);

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/ablum/featured`)
            .then(res => res.json())
            .then(data => {
                const mapped = data.map(album => ({
                    id: album.id,
                    title: album.title,
                    views: album.totalViews,
                    cover: album.coverUrl || "/img/default-cover.png",
                }));
                setAlbums(mapped);
            })
            .catch(() => setAlbums([]));
    }, []);

    useEffect(() => {
        function handleResize() {
            const bp = getBreakpoint();
            setVisibleCount(bp === "mobile" ? 1 : bp === "tablet" ? 2 : 6);
            setStartIdx(0);
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const canPrev = startIdx > 0;
    const canNext = startIdx + visibleCount < albums.length;

    function handlePrev() {
        if (canPrev) setStartIdx(idx => Math.max(idx - visibleCount, 0));
    }
    function handleNext() {
        if (canNext) setStartIdx(idx => Math.min(idx + visibleCount, albums.length - visibleCount));
    }

    const albumsToShow = albums.slice(startIdx, startIdx + visibleCount);
    const showViewMore = visibleCount < albums.length;

    return (
        <div style={{ width: "100%", background: "#181c2b", padding: "0 0 0 0", display: "flex", justifyContent: "center" }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 48px", position: "relative" }}>
                {/* Arrow trái */}
                <button onClick={handlePrev} disabled={!canPrev} style={{
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
                    display: visibleCount < albums.length ? "block" : "none",
                }} aria-label="Previous">&#60;</button>

                {/* Arrow phải */}
                <button onClick={handleNext} disabled={!canNext} style={{
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
                    display: visibleCount < albums.length ? "block" : "none",
                }} aria-label="Next">&#62;</button>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-end mb-3 mt-2 flex-wrap">
                    <span style={{
                        color: "#3ed8ff", fontWeight: 700, fontSize: 28,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif", letterSpacing: 1,
                    }}>{t('featured_albums.title')}</span>
                    {showViewMore && (
                        <a href="#" onClick={e => {
                            e.preventDefault();
                            setVisibleCount(c => Math.min(c + 6, albums.length));
                        }} style={{
                            color: "#fff", fontSize: 16, fontWeight: 400,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            cursor: "pointer", textDecoration: "none", marginRight: 8,
                        }}>{t('featured_albums.view_more')}</a>
                    )}
                </div>

                {/* Album Grid */}
                <div className="row g-4">
                    {albumsToShow.map((album, idx) => (
                        <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" key={startIdx + idx}>
                            <div className="h-100" onClick={() => navigate(`/album/${album.id}`)} style={{
                                background: "transparent", borderRadius: 16,
                                transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer"
                            }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = "translateY(-4px) scale(1.03)";
                                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(62,216,255,0.10)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = "";
                                    e.currentTarget.style.boxShadow = "";
                                }}>
                                <div
                                    key={album.id}
                                    style={{
                                        position: "relative",
                                        borderRadius: 18,
                                        overflow: "hidden",
                                        background: "#23283e",
                                        boxShadow: "0 4px 24px #3ed8ff22",
                                        height: 200,
                                        cursor: "pointer",
                                        transition: "transform 0.2s",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                    }}

                                    onMouseOver={e => e.currentTarget.style.transform = "scale(1.03)"}
                                    onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    {/* Background Image */}
                                    <img
                                        src={album.cover}
                                        alt={album.title}
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

                                    {/* Album Info */}
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
                                        {album.title}
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
                                                {formatViews(album.views)} {t('featured_artists.views')}
                                            </span>
                                        </div>
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
