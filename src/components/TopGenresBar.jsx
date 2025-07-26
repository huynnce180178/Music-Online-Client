import axios from "axios";
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

function getBreakpoint() {
    if (window.innerWidth < 600) return "mobile";
    if (window.innerWidth < 1024) return "tablet";
    return "desktop";
}

export default function TopGenres() {
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const [genres, setGenres] = useState([]);
    const navigate = useNavigate();
    const { t } = useTranslation();

    useEffect(() => {
        axios.get(`${BASE_API_URL}/api/v1/guest/genre/genresViewMore?page=0&size=1000&sortBy=id&sortDir=asc`)
            .then(res => setGenres(Array.isArray(res.data.data) ? res.data.data : []))
            .catch(() => setGenres([]));
    }, []);

    useEffect(() => {
        const handleResize = () => setBreakpoint(getBreakpoint());
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Responsive auto-fit settings
    let minWidth, maxWidth, genreHeight, padding;
    if (breakpoint === "mobile") {
        minWidth = 150;
        maxWidth = "1fr";
        genreHeight = 130;
        padding = "0 8px";
    } else if (breakpoint === "tablet") {
        minWidth = 190;
        maxWidth = 1;
        genreHeight = 170;
        padding = "0 32px";
    } else {
        minWidth = 210;
        maxWidth = 1;
        genreHeight = 200;
        padding = "0 70px";
    }

    return (
        <div
            style={{
                width: "100%",
                background: "#101426",
                padding: breakpoint === "mobile" ? "28px 0 24px 0" : "48px 0 40px 0",
                minHeight: "100vh",
            }}
        >
            <div
                style={{
                    maxWidth: 1440,
                    margin: "0 auto",
                    padding: padding,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 28,
                    }}
                >
                    <span
                        style={{
                            color: "#3ed8ff",
                            fontWeight: 700,
                            fontSize: breakpoint === "mobile" ? 20 : 28,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            paddingBottom: 4,
                        }}
                    >
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

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))`,
                        gap: 32,
                        width: "100%",
                        minHeight: genreHeight,
                    }}
                >
                    {genres.map((genre) => (
                        <div
                            key={genre.genreId}
                            style={{
                                position: "relative",
                                borderRadius: 22,
                                overflow: "hidden",
                                minHeight: genreHeight,
                                aspectRatio: "1 / 1", 
                                background: "#23283e",
                                boxShadow: "0 6px 22px #3ed8ff1c",
                                cursor: "pointer",
                                transition: "transform 0.15s, box-shadow 0.18s",
                                display: "flex",
                                alignItems: "flex-end",
                            }}
                            tabIndex={0}
                            onKeyDown={e => { if (e.key === "Enter") navigate(`/genres/${genre.genreId}/songs`); }}
                            onMouseOver={e => {
                                e.currentTarget.style.transform = "scale(1.03)";
                                e.currentTarget.style.boxShadow = "0 10px 28px #3ed8ff30";
                                e.currentTarget.querySelector("img").style.filter = "brightness(1.28) contrast(1.12)";
                            }}
                            onMouseOut={e => {
                                e.currentTarget.style.transform = "scale(1)";
                                e.currentTarget.style.boxShadow = "0 6px 22px #3ed8ff1c";
                                e.currentTarget.querySelector("img").style.filter = "brightness(1.18) contrast(1.07)";
                            }}
                        >
                            {/* Ảnh cover */}
                            <img
                                src={genre.genreImage}
                                alt={genre.genreName}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    filter: "brightness(1.18) contrast(1.07)", // Làm sáng và nét
                                    transition: "filter 0.22s",
                                    position: "absolute",
                                    left: 0, top: 0, zIndex: 0,
                                }}
                                draggable={false}
                            />
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    top: 0,
                                    background: "linear-gradient(0deg, #10142680 67%, #10142604 98%)",
                                    zIndex: 1,
                                }}
                            />
                            {/* Genre Name */}
                            <div
                                style={{
                                    position: "relative",
                                    zIndex: 2,
                                    color: "#fff",
                                    fontWeight: 700,
                                    fontSize: breakpoint === "mobile" ? 15 : 20,
                                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                    textShadow: "0 2px 14px #101426d2, 0 2px 14px #101426d2",
                                    padding: "0 0 18px 18px",
                                    width: "100%",
                                    minHeight: 30,
                                    letterSpacing: "0.5px",
                                    userSelect: "none",
                                }}
                            >
                                {t('genres.' + genre.genreName, genre.genreName)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
