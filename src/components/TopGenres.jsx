import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

// Phân loại breakpoint chi tiết hơn
function getBreakpoint() {
    const w = window.innerWidth;
    if (w < 400) return "xs"; // mobile siêu nhỏ
    if (w < 600) return "sm"; // mobile thường
    if (w < 800) return "md"; // mobile lớn/phablet
    if (w < 1024) return "tablet";
    if (w < 1440) return "desktop";
    return "xl";
}

const areaNames = [
    "big",      // tile lớn (Ballad)
    "small1",   // Sentimental
    "small2",   // V-Pop
    "small3",   // K-Pop
    "tall",     // Rap
    "small4",   // Pop
    "wide",     // HipHop
];

// Responsive grid template cho từng breakpoint
const gridTemplateAreas = (bp) => {
    if (bp === "xs" || bp === "sm")
        return `"big" "small1" "small2" "small3" "tall" "small4" "wide"`;
    if (bp === "md")
        return `"big small1" "small2 small3" "tall small4" "wide wide"`;
    if (bp === "tablet")
        return `"big big small1 small2" "wide wide small3 tall" "small4 small4 small4 tall"`;
    if (bp === "desktop")
        return `"big small1 small2 small3 tall"
                "big small4 wide wide tall"`;
    // xl
    return `"big small1 small2 small3 tall wide"
            "big small4 small4 small4 tall wide"`;
};

export default function TopGenres() {
    const { t } = useTranslation();
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const [genres, setGenres] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/Top10Genre`)
            .then(res => res.json())
            .then(data => {
                const mapped = data.slice(0, 7).map((genre) => ({
                    id: genre.genreId || genre.id,
                    name: genre.genreName,
                    image: genre.genreImage || "/img/default-cover.png",
                    totalViews: genre.totalViews,
                }));
                setGenres(mapped);
            })
            .catch(() => setGenres([]));
    }, []);

    useEffect(() => {
        const handleResize = () => setBreakpoint(getBreakpoint());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Thêm genre fill nếu thiếu
    const genresWithFill = [...genres];
    while (genresWithFill.length < 7) {
        genresWithFill.push({
            id: null,
            name: "",
            image: "/img/default-cover.png",
            totalViews: "",
            isFill: true,
        });
    }

    let gridTemplate = gridTemplateAreas(breakpoint);
    let colCount = 1, rowHeight = 110, gap = 14, borderRadius = 16, fontSizeTitle = 18, fontSizeGenre = 15, paddingMain = "16px 0 12px 0", paddingInner = "0 8px";
    if (breakpoint === "sm") {
        colCount = 1; rowHeight = 120; gap = 16; borderRadius = 18; fontSizeTitle = 20; fontSizeGenre = 16; paddingMain = "22px 0 18px 0"; paddingInner = "0 10px";
    } else if (breakpoint === "md") {
        colCount = 2; rowHeight = 140; gap = 18; borderRadius = 20; fontSizeTitle = 22; fontSizeGenre = 17; paddingMain = "28px 0 22px 0"; paddingInner = "0 18px";
    } else if (breakpoint === "tablet") {
        colCount = 4; rowHeight = 160; gap = 22; borderRadius = 22; fontSizeTitle = 24; fontSizeGenre = 18; paddingMain = "38px 0 30px 0"; paddingInner = "0 32px";
    } else if (breakpoint === "desktop") {
        colCount = 5; rowHeight = 210; gap = 28; borderRadius = 24; fontSizeTitle = 28; fontSizeGenre = 18; paddingMain = "48px 0 40px 0"; paddingInner = "0 40px";
    } else if (breakpoint === "xl") {
        colCount = 6; rowHeight = 230; gap = 32; borderRadius = 28; fontSizeTitle = 32; fontSizeGenre = 20; paddingMain = "60px 0 48px 0"; paddingInner = "0 60px";
    }

    return (
        <div style={{ width: "100%", background: "#181c2b", padding: paddingMain }}>
            <div style={{ maxWidth: 1550, margin: "0 auto", padding: paddingInner }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: gap,
                }}>
                    <span style={{
                        color: "#3ed8ff",
                        fontWeight: 700,
                        fontSize: fontSizeTitle,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        paddingBottom: 4,
                    }}>
                        {t('top_genres.title')}
                    </span>
                    <Link
                        to="/genres-viewmore"
                        style={{
                            color: "#fff",
                            fontSize: fontSizeGenre,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            fontWeight: 400,
                            cursor: "pointer",
                            textDecoration: "none",
                            marginRight: 8,
                        }}
                    >
                        {t('top_genres.view_more')}
                    </Link>
                </div>

                <div style={{
                    display: "grid",
                    gridTemplateAreas: gridTemplate,
                    gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                    gridAutoRows: rowHeight,
                    gap: gap,
                    width: "100%",
                    minHeight: rowHeight * (colCount === 1 ? 7 : 2.2),
                }}>
                    {genresWithFill.slice(0, 7).map((genre, idx) => {
                        let style = {
                            gridArea: areaNames[idx],
                            borderRadius: borderRadius,
                            overflow: "hidden",
                            position: "relative",
                            cursor: genre.isFill ? "default" : "pointer",
                            background: "#23283e",
                            boxShadow: "0 6px 26px #3ed8ff25",
                            transition: "transform 0.18s",
                            display: "flex",
                            alignItems: "flex-end",
                            minHeight: 0,
                        };
                        if (areaNames[idx] === "big") style.minHeight = rowHeight * (colCount === 1 ? 1 : 2) + gap;
                        if (areaNames[idx] === "tall") style.minHeight = rowHeight * (colCount === 1 ? 1 : 2) + gap;
                        if (areaNames[idx] === "wide") style.minWidth = "100%";
                        if (areaNames[idx].startsWith("small")) style.minHeight = rowHeight;

                        return (
                            <div
                                key={idx}
                                style={style}
                                tabIndex={genre.isFill ? -1 : 0}
                                onClick={() => {
                                    if (!genre.isFill && genre.id) {
                                        navigate(`/genres-viewmore?genreId=${genre.id}`);
                                    }
                                }}
                                onKeyDown={e => {
                                    if (!genre.isFill && genre.id && e.key === "Enter") {
                                        navigate(`/genres-viewmore?genreId=${genre.id}`);
                                    }
                                }}
                                onMouseOver={e => { if (!genre.isFill) e.currentTarget.style.transform = "scale(1.035)" }}
                                onMouseOut={e => { if (!genre.isFill) e.currentTarget.style.transform = "scale(1)" }}
                            >
                                <img
                                    src={genre.image}
                                    alt={genre.name}
                                    style={{
                                        width: "100%",
                                        height: "100%",
                                        objectFit: "cover",
                                        display: "block",
                                        filter: genre.isFill ? "grayscale(0.8) blur(2px)" : "brightness(1.11) contrast(1.08)",
                                        transition: "filter 0.2s",
                                        position: "absolute",
                                        left: 0, top: 0, zIndex: 0,
                                    }}
                                />
                                {/* Overlay, tên genre ... */}
                                <div style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    top: 0,
                                    background: "linear-gradient(0deg, #181c2b99 76%, #181c2b0d 98%)",
                                    zIndex: 1,
                                }} />
                                <div style={{
                                    position: "relative",
                                    zIndex: 2,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: areaNames[idx] === "big" ? fontSizeGenre + 4 : fontSizeGenre,
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                    textShadow: "0 2px 8px #181f2a99",
                                    padding: areaNames[idx] === "big" ? `0 0 ${gap * 2}px ${gap * 2}px` : `0 0 ${gap}px ${gap}px`,
                                    width: "100%",
                                    minHeight: 36,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-end"
                                }}>
                                    <div>
                                        {genre.name ? t(`genres.${genre.name}`, { defaultValue: genre.name }) : ''}
                                        <div style={{
                                            fontWeight: 400,
                                            fontSize: fontSizeGenre - 1,
                                            color: "#b9cbe8",
                                            marginTop: 5,
                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                        }}>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}