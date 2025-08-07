import { Button, message, Pagination } from 'antd';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useContext, useEffect, useState } from 'react';
import { PlayerContext } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function History() {
    const { t } = useTranslation();
    const [histories, setHistories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1); // Trang hiện tại (1-based)
    const [totalPages, setTotalPages] = useState(0);
    const token = localStorage.getItem("accessToken");

    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;

    const fetchHistories = (pageNumber = 1) => {
        if (!token) {
            setHistories([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        axios.get(`${BASE_API_URL}/api/v1/user/history`, {
            headers: {
                Authorization: `Bearer ${token}`
            },
            params: {
                page: pageNumber - 1, // backend is 0-based
                limit: 12,
                sortBy: "playedAt",
                orderBy: "desc",
            }
        })
            .then(res => {
                const data = res.data?.data;
                setHistories(Array.isArray(data?.content) ? data.content : []);
                setTotalPages(data?.totalPages || 0);
            })
            .catch(err => {
                console.warn("Unable to load history:", err);
                setHistories([]);
                setTotalPages(0);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchHistories(page);
    }, [page]);

    const handleClearAll = () => {
        if (!token) {
            message.warning("You are not logged in.");
            return;
        }

        const confirmed = window.confirm("Are you sure you want to delete all music listening history?");
        if (!confirmed) return;

        axios.delete(`${BASE_API_URL}/api/v1/user/history/clear-all`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
            .then(() => {
                setHistories([]);
                setTotalPages(0);
                message.success("All history cleared!");
            })
            .catch(() => {
                message.error("Delete history failed!");
            });
    };

    const handlePlaySong = (songId, historyId) => {
        const allSongIds = histories.map(item => item.songId);
        playSong?.(songId, allSongIds, "history", historyId);
    };

    return (
        <div style={{
            width: "100%",
            background: "#181c2b",
            minHeight: "100%", // hoặc để auto nếu không cần full
            padding: "0 0 48px 0",
            display: "flex",
            justifyContent: "center"
        }}>
            <div className="container-fluid" style={{ maxWidth: 1550, padding: "0 2vw" }}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-end mb-3 mt-4 flex-wrap">
                    <span style={{
                        color: "#3ed8ff",
                        fontWeight: 700,
                        fontSize: 26,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        letterSpacing: 1,
                    }}>
                        {t('history.title')}
                    </span>
                    <Button
                        style={{
                            width: "80px",
                            height: "40px",
                            background: "#3BC8E7",
                            color: "white",
                            fontSize: 18,
                            borderRadius: 50,
                        }}
                        onClick={handleClearAll}
                        disabled={histories.length === 0}
                    >
                        {t('history.clear')}
                    </Button>
                </div>

                {/* Nội dung */}
                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 text-center text-light">{t('loading')}</div>
                    ) : histories.length === 0 ? (
                        <div className="col-12 text-center mt-4">
                            <i className="bi bi-clock-history" style={{ fontSize: 42, color: "#bbb" }}></i>
                            <p style={{ color: "#ccc", fontSize: 18, marginTop: 12 }}>
                                {t('history.empty')}
                            </p>
                        </div>
                    ) : (
                        histories.map((history, idx) => (
                            <div className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2" key={idx}>
                                <div
                                    className="h-100"
                                    onClick={() => handlePlaySong(history.songId, history.historyId)}
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
                                    <div style={{
                                        position: "relative",
                                        borderRadius: 18,
                                        overflow: "hidden",
                                        background: "#23283e",
                                        boxShadow: "0 4px 24px #3ed8ff22",
                                        height: 200,
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "flex-end",
                                    }}>
                                        <img
                                            src={history.profilePicUrl}
                                            alt={history.title}
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
                                            position: "relative",
                                            zIndex: 2,
                                            color: "#fff",
                                            fontWeight: 700,
                                            fontSize: 16,
                                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                                            textShadow: "0 2px 8px #181f2a88",
                                            padding: "16px",
                                        }}>
                                            <div style={{
                                                display: "-webkit-box",
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: "vertical",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}>
                                                {history.title}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Phân trang */}
                {totalPages > 1 && (
                    <div className="mt-4 d-flex justify-content-center">
                        <Pagination
                            current={page}
                            total={totalPages * 12}
                            pageSize={12}
                            onChange={p => setPage(p)}
                            showSizeChanger={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
