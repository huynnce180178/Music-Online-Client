import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Thêm dòng này
import 'bootstrap/dist/css/bootstrap.min.css';
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

export default function NewReleases() {
    const bp = useBootstrapBreakpoint();
    const [startIdx, setStartIdx] = useState(0);
    const [newReleases, setNewReleases] = useState([]);
    const navigate = useNavigate(); // ✅ Thêm dòng này
    const { t } = useTranslation();

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/ablum/new-releases`)
            .then(res => res.json())
            .then(data => {
                // Check if data is an array and has content
                if (Array.isArray(data) && data.length > 0) {
                    const mapped = data.map(album => ({
                        id: album.id,
                        title: album.title,
                        cover: album.coverUrl,
                        artist: album.artistName,
                        time: album.createdAtStr,
                    }));
                    setNewReleases(mapped);
                } else if (data && Array.isArray(data.data)) {
                    // Handle case where data is wrapped in a data property
                    const mapped = data.data.map(album => ({
                        id: album.id,
                        title: album.title,
                        cover: album.coverUrl,
                        artist: album.artistName,
                        time: album.createdAtStr,
                    }));
                    setNewReleases(mapped);
                } else {
                    console.warn("New releases data is not in expected format:", data);
                    setNewReleases([]);
                }
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                setNewReleases([]);
            });
    }, []);

    // const showCount = bp === "mobile" ? 1 : bp === "tablet" ? 2 : newReleases.length;
    const showCount = bp === "mobile" ? 1 : bp === "tablet" ? 2 : 4;
    const lastIdx = newReleases.length - showCount;
    const canPrev = startIdx > 0;
    const canNext = startIdx < lastIdx;

    useEffect(() => { setStartIdx(0); }, [bp]);

    const albumsToShow = newReleases.slice(startIdx, startIdx + showCount);
    const containerClass = bp === "mobile" ? "container px-2" : bp === "tablet" ? "container px-3" : "container px-5";

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
                        {t('new_releases.title')}
                    </span>
                    {/* <a href="#" style={{
                        color: "#fff", fontSize: 16,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        fontWeight: 400, cursor: "pointer", textDecoration: "none", marginRight: 8,
                    }}>
                        View More
                    </a> */}
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
                        {(bp) && (
                            <button className="btn btn-link p-0 d-flex align-items-center justify-content-center"
                                style={{
                                    color: "#fff", fontSize: 32,
                                    marginRight: bp === "mobile" ? 4 : 12,
                                    marginTop: 18, zIndex: 5, minWidth: 48, minHeight: 48
                                }}
                                onClick={() => canPrev && setStartIdx(startIdx - 1)}
                                disabled={!canPrev}
                                tabIndex={-1}
                            >
                                <span style={{ opacity: canPrev ? 1 : 0.2 }}>&lt;</span>
                            </button>
                        )}

                        {/* Album items */}
                        <div className="d-flex flex-row flex-nowrap w-100 justify-content-between" style={{ gap: 0 }}>
                            {albumsToShow.map((item, idx) => {
                                const timelineIdx = startIdx + idx;
                                return (
                                    <div
                                        key={timelineIdx}
                                        onClick={() => navigate(`/album/${item.id}`)} // ✅ Điều hướng khi click
                                        className={`d-flex flex-column align-items-center ${bp === "mobile" ? "w-100" : ""}`}
                                        style={{
                                            width: bp === "mobile" ? "100%" : bp === "tablet" ? "48%" : "auto",
                                            maxWidth: bp === "desktop" ? 320 : "100%",
                                            margin: "0 3px",
                                            cursor: "pointer" // ✅ để báo hiệu click được
                                        }}
                                    >
                                        {/* Dot on timeline */}
                                        <div style={{
                                            width: 18, height: 18, borderRadius: "50%",
                                            background: "#181c2b",
                                            border: "3px solid #3ed8ff",
                                            marginBottom: 14, marginTop: 8,
                                        }} />
                                        {/* Album info */}
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
                                                    <span style={{
                                                        fontWeight: 400, fontSize: 15, color: "#fff", marginLeft: 7,
                                                    }}>
                                                    </span>
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
                        {(bp) && (
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
