import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function AllArtists() {
    const { t } = useTranslation();
    const [artists, setArtists] = useState([]);
    const isLoggedIn = !!localStorage.getItem("accessToken");

    useEffect(() => {
        axios
            .get(`${BASE_API_URL}/api/v1/guest/artist/listArtist?page=0&limit=100&sortBy=id&orderBy=asc`)
            .then(res => {
                const data = res.data?.content;
                if (Array.isArray(data)) {
                    setArtists(data);
                } else {
                    setArtists([]);
                }
            })
            .catch((err) => {
                console.error("Error fetching artists:", err);
                setArtists([]);
            });
    }, []);

    return (
        <div style={{ width: "100%", background: "#181c2b", padding: "0 0 48px 0", display: "flex", justifyContent: "center" }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 2vw" }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-end mb-3 mt-4 flex-wrap">
                    <span
                        style={{
                            color: "#3ed8ff",
                            fontWeight: 700,
                            fontSize: 26,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            letterSpacing: 1,
                        }}
                    >
                        {t('all_artists.all_artists')}
                    </span>
                </div>

                {/* Artist Grid */}
                <div className="row g-4">
                    {artists.map((artist, idx) => (
                        <div
                            className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2"
                            key={idx}
                        >
                            <div
                                className="h-100"
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
                                onClick={() => {
                                    if (isLoggedIn) {
                                        // Nếu đăng nhập, chuyển trang
                                        window.location.href = `/artist/${artist.artistId}`;
                                        // Hoặc dùng useNavigate nếu bạn dùng react-router-dom v6:
                                        // navigate(`/artist/${artist.artistId}`);
                                    } else {
                                        // Nếu guest, hiện thông báo
                                        toast.info("Please login to view artist information!", { autoClose: 2000 });
                                    }
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
                                        src={artist.profile_image || "/img/default-profile.png"}
                                        alt={`${artist.firstName?.trim()} ${artist.lastName?.trim()}`}
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
                                        {(artist.firstName || '').trim()} {(artist.lastName || '').trim()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    <ToastContainer />
                </div>
            </div>
        </div>
    );
}
