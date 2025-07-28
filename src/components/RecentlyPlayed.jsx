import { useState, useEffect } from "react";
import axios from "axios";
import SubscriptionModalPlan from "./SubscriptionModalPlan";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

// Responsive hook
function useIsMobile() {
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    return isMobile;
}

export default function BannerList() {
    const [banners, setBanners] = useState([]);
    const [banner, setBanner] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    // Kiểm tra role khi mount
    useEffect(() => {
        const roles = JSON.parse(localStorage.getItem("roles") || "[]");
        setIsPremium(roles.includes("ROLE_PREMIUM"));
    }, []);

    // Lấy danh sách banner khi mount
    useEffect(() => {
        if (isPremium) return; // Nếu là premium thì không gọi API
        axios.get(`${BASE_API_URL}/api/v1/guest/banner/list`, { withCredentials: true })
            .then(res => {
                const bannersData = res.data?.data || [];
                setBanners(bannersData);
                if (bannersData.length > 0) {
                    const randomBanner = bannersData[Math.floor(Math.random() * bannersData.length)];
                    setBanner(randomBanner);
                } else {
                    setBanner(null);
                }
            })
            .catch(() => setBanner(null));
    }, [isPremium]);

    // Đổi banner mỗi 1 phút
    useEffect(() => {
        if (isPremium || banners.length === 0) return;
        const interval = setInterval(() => {
            const randomBanner = banners[Math.floor(Math.random() * banners.length)];
            setBanner(randomBanner);
        }, 30000);
        return () => clearInterval(interval);
    }, [banners, isPremium]);

    // Nếu là premium thì không render banner
    if (isPremium) return null;

    if (!banner) {
        return (
            <div style={{
                width: "100%",
                background: "#181c2b",
                padding: isMobile ? "16px 0" : "20px 0",
                display: "flex",
                justifyContent: "center"
            }}>
                <span style={{ 
                    color: "#fff", 
                    fontSize: isMobile ? 16 : 18 
                }}>{t('banner.no_banners_approved')}</span>
            </div>
        );
    }

    return (
        <>
            <div style={{
                width: "100%",
                background: "#181c2b",
                padding: isMobile ? "16px 0" : "32px 0",
                display: "flex",
                justifyContent: "center"
            }}>
                <div
                    style={{
                        width: "100%",
                        maxWidth: isMobile ? "95%" : 1100,
                        borderRadius: isMobile ? 12 : 18,
                        overflow: "hidden",
                        boxShadow: "0 4px 24px #3ed8ff22",
                        cursor: banner.redirectUrl ? "pointer" : "default",
                        position: "relative"
                    }}
                    onClick={() => setShowSubscriptionModal(true)}
                >
                    <img
                        src={banner.mediaUrl}
                        alt={banner.title}
                        style={{
                            width: "100%",
                            height: isMobile ? 100 : 150,
                            objectFit: "cover",
                            display: "block",
                            background: "#23283e"
                        }}
                    />
                    {/* Overlay text nếu muốn */}
                    {/* <div style={{
                        position: "absolute",
                        left: 0, top: 0, width: "100%", height: "100%",
                        display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
                        color: "#fff", fontWeight: 700, fontSize: 28,
                        background: "rgba(0,0,0,0.18)"
                    }}>
                        <div>{banner.title}</div>
                        <div style={{ fontWeight: 400, fontSize: 18 }}>{banner.description}</div>
                    </div> */}
                </div>
            </div>
            <SubscriptionModalPlan
                show={showSubscriptionModal}
                onClose={() => setShowSubscriptionModal(false)}
            />
        </>
    );
}