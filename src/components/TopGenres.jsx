import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

function getBreakpoint() {
    if (window.innerWidth < 600) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
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

const gridTemplateAreas = (breakpoint) => {
    if (breakpoint === "mobile")
        return `"big" "small1" "small2" "small3" "tall" "small4" "wide"`;
    if (breakpoint === "tablet")
        return `"big big small1 small2" "wide wide small3 tall" "small4 small4 small4 tall"`;
    return `"big small1 small2 small3 tall"
            "big small4 wide wide tall"`;
};

export default function TopGenres() {
    const { t } = useTranslation();
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const [genres, setGenres] = useState([]);

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/Top10Genre`)
            .then(res => res.json())
            .then(data => {
                // Đảm bảo 7 tile luôn được lấp đầy
                const mapped = data.slice(0, 7).map((genre, idx) => ({
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

    // Thêm genre giả nếu thiếu để grid luôn đầy đẹp
    const genresWithFill = [...genres];
    while (genresWithFill.length < 7) {
        genresWithFill.push({
            name: "",
            image: "/img/default-cover.png",
            totalViews: "",
            isFill: true,
        });
    }

    // Responsive grid size
    const gridTemplate = gridTemplateAreas(breakpoint);
    const colCount = breakpoint === "mobile" ? 1 : (breakpoint === "tablet" ? 4 : 5);
    const rowHeight = breakpoint === "mobile" ? 120 : (breakpoint === "tablet" ? 160 : 210);

    return (
        <div style={{
            width: "100%",
            background: "#181c2b",
            padding: breakpoint === "mobile" ? "28px 0 24px 0" : "48px 0 40px 0",
        }}>
            <div style={{
                maxWidth: 1550,
                margin: "0 auto",
                padding: breakpoint === "mobile" ? "0 8px" : "0 40px",
            }}>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 24,
                }}>
                    <span style={{
                        color: "#3ed8ff",
                        fontWeight: 700,
                        fontSize: breakpoint === "mobile" ? 20 : 28,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        paddingBottom: 4,
                    }}>
                        {t('top_genres.title')}
                    </span>
                    <Link
                        to="/genres-viewmore"
                        style={{
                            color: "#fff",
                            fontSize: 17,
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
                    gap: 28,
                    width: "100%",
                    minHeight: rowHeight * 2.2,
                }}>
                    {genresWithFill.slice(0, 7).map((genre, idx) => {
                        let style = {
                            gridArea: areaNames[idx],
                            borderRadius: 24,
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
                        // Kích thước đặc biệt cho từng tile
                        if (areaNames[idx] === "big") style.minHeight = rowHeight * 2 + 28;
                        if (areaNames[idx] === "tall") style.minHeight = rowHeight * 2 + 28;
                        if (areaNames[idx] === "wide") style.minWidth = "100%";
                        if (areaNames[idx].startsWith("small")) style.minHeight = rowHeight;

                        return (
                            <div
                                key={idx}
                                style={style}
                                onMouseOver={e => { if (!genre.isFill) e.currentTarget.style.transform = "scale(1.035)" }}
                                onMouseOut={e => { if (!genre.isFill) e.currentTarget.style.transform = "scale(1)" }}
                            >
                                {/* Ảnh */}
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
                                {/* Overlay làm sáng hơn mẫu trước! */}
                                <div style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    top: 0,
                                    background: "linear-gradient(0deg, #181c2b99 76%, #181c2b0d 98%)",
                                    zIndex: 1,
                                }} />
                                {/* Tên genre + sub */}
                                <div style={{
                                    position: "relative",
                                    zIndex: 2,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: areaNames[idx] === "big" ? 22 : 18,
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                    textShadow: "0 2px 8px #181f2a99",
                                    padding: areaNames[idx] === "big" ? "0 0 30px 30px" : "0 0 18px 18px",
                                    width: "100%",
                                    minHeight: 36,
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-end"
                                }}>
                                    <div>
                                        {t('genres.' + genre.name, genre.name)}
                                        <div style={{
                                            fontWeight: 400,
                                            fontSize: 15,
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
