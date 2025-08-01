import React, { useState, useEffect, useContext } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { PlayerContext } from "../context/PlayerContext";
import { X, Waves } from "lucide-react";
import { Pagination } from "antd";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function Favorite() {
    const { t } = useTranslation();
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const itemsPerPage = 10;

    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;

    const fetchFavorites = async (page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${BASE_API_URL}/api/v1/user/wishlist?page=${page - 1}&limit=${itemsPerPage}&sortBy=songId&orderBy=asc`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            const data = await response.json();
            setFavorites(data.data?.content || []);
            setTotalPages(data.data?.totalPages || 1);
        } catch (error) {
            setFavorites([]);
            setTotalPages(1);
            // console.error("Error fetching favorites", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFavorites(currentPage);
        // eslint-disable-next-line
    }, [currentPage]);

    const removeSong = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${BASE_API_URL}/api/v1/user/wishlist/remove/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchFavorites(currentPage);
            } else {
                alert("Failed to remove song.");
            }
        } catch (error) {
            alert("Error removing song.");
        }
    };

    const handleSelectSong = (songId) => {
        const allSongIds = favorites.map(song => song.songId);
        playSong?.(songId, allSongIds);
    };

    return (
        <div style={{ backgroundColor: '#181C2B', padding: '2rem',  minHeight: '45vh' }}>
            <h5 style={{
                color: '#3ed8ff',
                fontWeight: 700,
                fontSize: 26,
                fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                letterSpacing: 1
            }}>
                {t('favorites.title')}
            </h5>
            <div className="table-responsive" style={{ maxWidth: '90%', margin: '0 auto' }}>
                {loading ? (
                    <div className="col-12 text-center text-light" style={{ minHeight: '100%', padding: "60px 0" }}>
                        Loading...
                    </div>
                ) : favorites.length === 0 ? (
                    <div className="col-12 text-center mt-4 mb-5" style={{ minHeight: '100%' }}>
                        <i className="bi bi-heart" style={{ fontSize: 42, color: "#bbb" }}></i>
                        <p style={{ color: "#ccc", fontSize: 18, marginTop: 12 }}>
                            {t('favorites.no_favorites')}
                        </p>
                    </div>
                ) : (
                    <>
                        <table className="table table-borderless align-middle mb-5">
                            <thead>
                                <tr>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>#</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('favorites.song_title')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('favorites.artist')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('favorites.duration')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('favorites.remove')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td colSpan={6} style={{ backgroundColor: '#181C2B', padding: 0 }}>
                                        <div style={{
                                            borderBottom: '2px solid #00e0ff',
                                            width: '100%',
                                            marginBottom: '8px'
                                        }}></div>
                                    </td>
                                </tr>
                                {favorites.map((song, index) => (
                                    <tr key={song.songId}>
                                        <td style={{ backgroundColor: '#181C2B', color: 'white' }}>
                                            {song.playing ? <Waves size={16} color="#00e0ff" /> : (index + 1 + (currentPage - 1) * itemsPerPage)}
                                        </td>
                                        <td
                                            style={{
                                                backgroundColor: '#181C2B',
                                                color: song.playing ? '#00e0ff' : 'white',
                                                cursor: "pointer"
                                            }}
                                            onClick={() => handleSelectSong(song.songId)}
                                        >
                                            {song.title}
                                        </td>
                                        <td style={{ backgroundColor: '#181C2B', color: song.playing ? '#00e0ff' : 'white' }}>
                                            {song.artistName || "Unknown Artist"}
                                        </td>
                                        <td style={{ backgroundColor: '#181C2B', color: song.playing ? '#00e0ff' : 'white' }}>
                                            {song.duration}
                                        </td>
                                        <td style={{ backgroundColor: '#181C2B' }}>
                                            <X
                                                size={18}
                                                style={{
                                                    marginLeft: "25px",
                                                    cursor: 'pointer',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#00e0ff',
                                                }}
                                                onClick={() => removeSong(song.songId)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPages > 1 && (
                            <div className="mt-4 d-flex justify-content-center">
                                <Pagination
                                    current={currentPage}
                                    total={totalPages * itemsPerPage}
                                    pageSize={itemsPerPage}
                                    onChange={(page) => setCurrentPage(page)}
                                    showSizeChanger={false}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
