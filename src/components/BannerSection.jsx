import { FaHeadphonesAlt, FaFireAlt, FaMusic } from "react-icons/fa";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom"; // Thêm dòng này
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BASE_API_URL from "../services/base.api.url";

const style = {
    section: {
        width: "100%",
        minHeight: 500,
        background: "linear-gradient(90deg,#181c2b 60%,#232c3b 100%)",
        display: "flex",
        alignItems: "center",
        padding: "0 0 32px 0",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
    },
    overlay: {
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        background: "linear-gradient(90deg, #181c2bcc 60%, #232c3b00 100%)",
        zIndex: 1,
        pointerEvents: "none",
    },
    imageWrap: {
        flex: "0 0 500px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 400,
        marginLeft: 32,
        position: "relative",
        zIndex: 2,
    },
    img: {
        width: 600,
        height: 350,
        objectFit: "cover",
        borderRadius: 20,
        boxShadow: "0 8px 32px #0008",
        background: "#23283e",
        transition: "transform 0.3s",
    },
    content: {
        flex: 1,
        padding: "0 32px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        minHeight: 400,
        position: "relative",
        zIndex: 2,
        boxSizing: "border-box",
    },
    tagline: {
        color: "#3ed8ff",
        fontWeight: 700,
        fontSize: 18,
        marginBottom: 10,
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
    },
    fireIcon: {
        color: "#3ed8ff",
        fontSize: 18,
        marginRight: 6,
    },
    title: {
        color: "#fff",
        fontWeight: 900,
        fontSize: 36,
        marginBottom: 14,
        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
        lineHeight: 1.1,
    },
    highlight: {
        color: "#3ed8ff",
    },
    desc: {
        color: "#b3b9c9",
        fontWeight: 400,
        fontSize: 16,
        marginBottom: 18,
        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
        maxWidth: 700,
    },
    info: {
        display: "flex",
        gap: 24,
        marginBottom: 20,
    },
    infoItem: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: "#fff",
        fontWeight: 700,
        fontSize: 16,
        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
    },
    infoIcon: {
        color: "#3ed8ff",
        fontSize: 16,
        marginRight: 6,
    },
    actions: {
        display: "flex",
        gap: 16,
        marginBottom: 8,
        flexWrap: "wrap",
    },
    btn: {
        fontWeight: 700,
        fontSize: 16,
        padding: "8px 24px",
        borderRadius: 12,
        border: "none",
        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
        transition: "all 0.2s",
        cursor: "pointer",
    },
    btnPrimary: {
        background: "#3ed8ff",
        color: "#181f2a",
        boxShadow: "0 2px 8px #3ed8ff44",
    },
    btnOutline: {
        background: "#232c3b",
        color: "#3ed8ff",
        border: "2px solid #3ed8ff",
    },
    navDots: {
        display: "flex",
        gap: 10,
        marginTop: 12,
        alignItems: "center",
        justifyContent: "flex-start",
    },
    navDot: {
        width: 12,
        height: 12,
        borderRadius: "50%",
        border: "none",
        background: "#b3b9c9",
        opacity: 0.5,
        cursor: "pointer",
        transition: "all 0.2s",
        outline: "none",
    },
    navDotActive: {
        background: "#3ed8ff",
        opacity: 1,
        width: 16,
        height: 16,
        boxShadow: "0 0 0 3px #3ed8ff33",
    },
    // Responsive
    sectionMobile: {
        flexDirection: "column",
        minHeight: 0,
        padding: "0 0 16px 0",
    },
    imageWrapMobile: {
        marginLeft: 0,
        marginTop: 16,
        marginBottom: 8,
        height: 180,
        flex: "0 0 180px",
    },
    imgMobile: {
        width: 350,
        height: 180,
        borderRadius: 12,
    },
    contentMobile: {
        padding: "0 10px",
        minHeight: 0,
        alignItems: "center",
        textAlign: "center",
    },
    titleMobile: {
        fontSize: 20,
        marginBottom: 8,
    },
    descMobile: {
        fontSize: 13,
        marginBottom: 10,
        maxWidth: 320,
    },
    infoMobile: {
        gap: 10,
        fontSize: 12,
        marginBottom: 10,
    },
    btnMobile: {
        fontSize: 13,
        padding: "6px 14px",
        borderRadius: 8,
    },
    navDotsMobile: {
        gap: 6,
        marginTop: 8,
    },
    // Tablet responsive
    sectionTablet: {
        flexDirection: "column",
        minHeight: 0,
        padding: "0 0 24px 0",
    },
    imageWrapTablet: {
        marginLeft: 0,
        marginTop: 24,
        marginBottom: 12,
        height: 260,
        flex: "0 0 260px",
    },
    imgTablet: {
        width: 320,
        height: 200,
        borderRadius: 16,
    },
    contentTablet: {
        padding: "0 24px",
        minHeight: 0,
        alignItems: "center",
        textAlign: "center",
    },
    titleTablet: {
        fontSize: 26,
        marginBottom: 10,
    },
    descTablet: {
        fontSize: 15,
        marginBottom: 14,
        maxWidth: 480,
    },
    infoTablet: {
        gap: 16,
        fontSize: 14,
        marginBottom: 14,
    },
    btnTablet: {
        fontSize: 15,
        padding: "7px 18px",
        borderRadius: 10,
    },
    navDotsTablet: {
        gap: 8,
        marginTop: 10,
    }
};

export default function BannerSection() {
    const { t } = useTranslation();
    const [breakpoint, setBreakpoint] = useState(getBreakpoint());
    const [banners, setBanners] = useState([]);
    const [current, setCurrent] = useState(0);
    const [loading, setLoading] = useState(true);
    const fadeRef = useRef();
    const navigate = useNavigate();

    function isLoggedIn() {
        // Sửa lại để kiểm tra đúng key token bạn dùng
        return !!(localStorage.getItem('accessToken') || localStorage.getItem('token'));
    }

    function getBreakpoint() {
        if (window.innerWidth < 600) return "mobile";
        if (window.innerWidth < 1024) return "tablet";
        return "desktop";
    }

    useEffect(() => {
        function handleResize() {
            setBreakpoint(getBreakpoint());
        }
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch 3 banners
    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch(`${BASE_API_URL}/api/v1/banner/1`).then(res => res.json()),
            fetch(`${BASE_API_URL}/api/v1/banner/2`).then(res => res.json()),
            fetch(`${BASE_API_URL}/api/v1/banner/3`).then(res => res.json()),
        ]).then(data => {
            setBanners(data);
            setLoading(false);
        });
    }, []);

    // Auto slide
    useEffect(() => {
        if (banners.length < 2) return;
        const timer = setInterval(() => {
            setCurrent(c => (c + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [banners]);

    // Fade effect
    useEffect(() => {
        if (fadeRef.current) {
            fadeRef.current.style.opacity = 0;
            setTimeout(() => {
                if (fadeRef.current) fadeRef.current.style.opacity = 1;
            }, 100);
        }
    }, [current]);

    const defaultContents = [
        {
            tagline: t('banner.trending_albums'),
            title: <>{t('banner.this_month')} <br /><span style={style.highlight}>{t('banner.record_breaking')}</span></>,
            desc: t('banner.experience'),
            listens: `1M+ ${t('banner.listens')}`,
            albums: `10+ ${t('banner.albums')}`
        },
        {
            tagline: t('banner.hot_releases'),
            title: <>{t('banner.summer_hits')}</>,
            desc: t('banner.feel_energy'),
            listens: `500K+ ${t('banner.listens')}`,
            albums: `5+ ${t('banner.albums')}`
        },
        {
            tagline: t('banner.editors_pick'),
            title: <>{t('banner.discover_gems')}</>,
            desc: t('banner.uncover_gems'),
            listens: `300K+ ${t('banner.listens')}`,
            albums: `8+ ${t('banner.albums')}`
        }
    ];

    const content = {
        tagline: banners[current]?.tagline || defaultContents[current % defaultContents.length].tagline,
        title: banners[current]?.title
            ? <>{banners[current].title}</>
            : defaultContents[current % defaultContents.length].title,
        desc: banners[current]?.desc || defaultContents[current % defaultContents.length].desc,
        listens: banners[current]?.listens || defaultContents[current % defaultContents.length].listens,
        albums: banners[current]?.albums || defaultContents[current % defaultContents.length].albums,
        profilePicUrl: banners[current]?.profilePicUrl || "/img/banner-singer1.png"
    };

    // Responsive style
    const isMobile = breakpoint === "mobile";
    const isTablet = breakpoint === "tablet";
    const sectionStyle = isMobile
        ? { ...style.section, ...style.sectionMobile }
        : isTablet
            ? { ...style.section, ...style.sectionTablet }
            : style.section;
    const imageWrapStyle = isMobile
        ? { ...style.imageWrap, ...style.imageWrapMobile }
        : isTablet
            ? { ...style.imageWrap, ...style.imageWrapTablet }
            : style.imageWrap;
    const imgStyle = isMobile
        ? { ...style.img, ...style.imgMobile }
        : isTablet
            ? { ...style.img, ...style.imgTablet }
            : style.img;
    const contentStyle = isMobile
        ? { ...style.content, ...style.contentMobile }
        : isTablet
            ? { ...style.content, ...style.contentTablet }
            : style.content;
    const titleStyle = isMobile
        ? { ...style.title, ...style.titleMobile }
        : isTablet
            ? { ...style.title, ...style.titleTablet }
            : style.title;
    const descStyle = isMobile
        ? { ...style.desc, ...style.descMobile }
        : isTablet
            ? { ...style.desc, ...style.descTablet }
            : style.desc;
    const infoStyle = isMobile
        ? { ...style.info, ...style.infoMobile }
        : isTablet
            ? { ...style.info, ...style.infoTablet }
            : style.info;
    const btnStyle = isMobile
        ? { ...style.btn, ...style.btnMobile }
        : isTablet
            ? { ...style.btn, ...style.btnTablet }
            : style.btn;
    const navDotsStyle = isMobile
        ? { ...style.navDots, ...style.navDotsMobile }
        : isTablet
            ? { ...style.navDots, ...style.navDotsTablet }
            : style.navDots;

    // Loading skeleton
    if (loading) {
        return (
            <div style={{ ...sectionStyle, justifyContent: "center", alignItems: "center" }}>
                <div style={{ width: 120, height: 120, borderRadius: "50%", background: "#23283e", opacity: 0.3, marginBottom: 24 }} />
                <div style={{ width: 300, height: 32, background: "#23283e", opacity: 0.2, borderRadius: 8, marginBottom: 12 }} />
                <div style={{ width: 200, height: 18, background: "#23283e", opacity: 0.2, borderRadius: 8 }} />
            </div>
        );
    }

    return (
        <div className="banner-section" style={sectionStyle}>
            <div style={style.overlay} />
            <div style={imageWrapStyle}>
                <AnimatePresence mode="wait">
                    <motion.img
                        key={current}
                        src={content.profilePicUrl}
                        alt="Banner"
                        style={imgStyle}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.5 }}
                    />
                </AnimatePresence>
            </div>
            <div style={contentStyle}>
                <div style={style.tagline}>
                    <FaFireAlt style={style.fireIcon} />
                    {content.tagline}
                </div>
                <h2 style={titleStyle}>{content.title}</h2>
                <div style={descStyle}>{content.desc}</div>
                <div style={infoStyle}>
                    <div style={style.infoItem}>
                        <FaHeadphonesAlt style={style.infoIcon} />
                        <span>{content.listens}</span>
                    </div>
                    <div style={style.infoItem}>
                        <FaMusic style={style.infoIcon} />
                        <span>{content.albums}</span>
                    </div>
                </div>
                <div style={style.actions}>
                    <button
                        style={{ ...btnStyle, ...style.btnPrimary }}
                        tabIndex={0}
                        onClick={() => navigate("/top-tracks")}
                    >
                        {t('banner.listen_now')}
                    </button>
                    <button
                        style={{ ...btnStyle, ...style.btnOutline }}
                        tabIndex={0}
                        onClick={() => {
                            if (!isLoggedIn()) {
                                toast.info(t('banner.please_login_first'));
                                return;
                            }
                            navigate("/favourites");
                        }}
                    >
                        {t('banner.add_to_queue')}
                    </button>
                </div>
                {/* Navigation dots */}
                <div style={navDotsStyle}>
                    {banners.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrent(idx)}
                            style={{
                                ...style.navDot,
                                ...(idx === current ? style.navDotActive : {}),
                            }}
                            aria-label={`Go to banner ${idx + 1}`}
                            tabIndex={0}
                        />
                    ))}
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={1000} />
        </div>
    );
}