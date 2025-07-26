import React, { useState, useEffect } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function AlbumsByArtists() {
    const navigate = useNavigate();
    const { t } = useTranslation();

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
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const [startIdx, setStartIdx] = useState(0);

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/album/all`)
            .then(res => res.json())
            .then(data => {
                // Check if data is an array and has content
                if (Array.isArray(data) && data.length > 0) {
                    const mapped = data.map(album => ({
                        id: album.id,
                        title: album.title,
                        artist: album.artistName,
                        cover: album.coverUrl || "/img/default-cover.png",
                    }));
                    setAlbums(mapped);
                } else if (data && Array.isArray(data.data)) {
                    // Handle case where data is wrapped in a data property
                    const mapped = data.data.map(album => ({
                        id: album.id,
                        title: album.title,
                        artist: album.artistName,
                        cover: album.coverUrl || "/img/default-cover.png",
                    }));
                    setAlbums(mapped);
                } else {
                    console.warn("Albums by artists data is not in expected format:", data);
                    setAlbums([]);
                }
            })
            .catch(() => setAlbums([]));
    }, []);

    useEffect(() => {
        function handleResize() {
            const bp = getBreakpoint();
            setBreakpoint(bp);
            setVisibleCount(
                bp === "mobile" ? 1 : bp === "tablet" ? 2 : 6
            );
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
        <div style={{ width: "100%", background: "#181c2b", padding: "0 0 48px 0", display: "flex", justifyContent: "center" }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 48px", position: "relative" }}>
                <button
                    onClick={handlePrev}
                    disabled={!canPrev}
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
                        zIndex: 3,
                        cursor: canPrev ? "pointer" : "not-allowed",
                        opacity: canPrev ? 1 : 0.4,
                        display: visibleCount < albums.length ? "block" : "none",
                    }}
                    aria-label="Previous"
                >
                    &#60;
                </button>

                <button
                    onClick={handleNext}
                    disabled={!canNext}
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
                        zIndex: 3,
                        cursor: canNext ? "pointer" : "not-allowed",
                        opacity: canNext ? 1 : 0.4,
                        display: visibleCount < albums.length ? "block" : "none",
                    }}
                    aria-label="Next"
                >
                    &#62;
                </button>

                <div className="d-flex justify-content-between align-items-end mb-3 mt-2 flex-wrap">
                    <span
                        style={{
                            color: "#3ed8ff",
                            fontWeight: 700,
                            fontSize: 28,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            letterSpacing: 1,
                        }}
                    >
                        {t('albums_page.albums_by_artists')}
                    </span>
                    {showViewMore && (
                        <a
                            href="#"
                            onClick={e => {
                                e.preventDefault();
                                setVisibleCount(c => Math.min(c + 6, albums.length));
                            }}
                            style={{
                                color: "#fff",
                                fontSize: 16,
                                fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                fontWeight: 400,
                                cursor: "pointer",
                                textDecoration: "none",
                                marginRight: 8,
                            }}
                        >
                            {t('albums_page.view_more')}
                        </a>
                    )}
                </div>

                <div className="row g-4">
                    {albumsToShow.map((album, idx) => (
                        <div
                            className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
                            key={startIdx + idx}
                        >
                            <div
                                className="h-100"
                                onClick={() => navigate(`/album/${album.id}`)}
                                style={{
                                    background: "transparent",
                                    borderRadius: 16,
                                    transition: "transform 0.2s, box-shadow 0.2s",
                                    cursor: "pointer",
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
                                {/* <img
                                    src={album.cover}
                                    alt={album.title}
                                    className="w-100"
                                    style={{
                                        height: 175,
                                        objectFit: "cover",
                                        borderRadius: 16,
                                        marginBottom: 12,
                                        background: "#23283e",
                                        border: "none",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                                    }}
                                />
                                <div
                                    style={{
                                        color: "#fff",
                                        fontWeight: 700,
                                        fontSize: 15,
                                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                        marginBottom: 3,
                                        whiteSpace: "normal",
                                    }}
                                >
                                    {album.title}
                                </div>
                                <div
                                    style={{
                                        color: "#8ca0c6",
                                        fontWeight: 400,
                                        fontSize: 13,
                                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                    }}
                                >
                                    {album.artist}
                                </div> */}
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
                                        }}>
                                            {album.artist}
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