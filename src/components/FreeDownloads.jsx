import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { X, Waves } from 'lucide-react';
import { Pagination } from 'antd';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function FreeDownloads() {
    const { t } = useTranslation();
    const [downloads, setDownloads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const itemsPerPage = 10;

    const fetchDownloads = async (page = 1) => {
        try {
            setLoading(true);
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${BASE_API_URL}/api/v1/user/downloads/paging?page=${page - 1}&size=${itemsPerPage}&sortBy=addedAt&direction=desc`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });
            const data = await response.json();
            setDownloads(data.data.content);
            setTotalPages(data.data.totalPages);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching downloads", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDownloads(currentPage);
    }, [currentPage]);

    const removeSong = async (id) => {
        try {
            const token = localStorage.getItem("accessToken");
            const response = await fetch(`${BASE_API_URL}/api/v1/user/downloads/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (response.ok) {
                fetchDownloads(currentPage);
            } else {
                alert("Failed to remove song.");
            }
        } catch (error) {
            console.error("Error removing song", error);
            alert("Error removing song.");
        }
    };

    return (
        <div style={{ backgroundColor: '#181C2B', padding: '2rem' }}>
            <h5 style={{
                color: '#3ed8ff',
                fontWeight: 700,
                fontSize: 26,
                fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                letterSpacing: 1
            }}>
                {t('downloads.title')}
            </h5>

            <div className="table-responsive" style={{ maxWidth: '90%', margin: '0 auto' }}>
                {loading ? (
                    <div className="col-12 text-center text-light">Loading...</div>
                ) : downloads.length === 0 ? (
                    <div className="col-12 text-center mt-4">
                        <i className="bi bi-cloud-arrow-down" style={{ fontSize: 42, color: "#bbb" }}></i>
                        <p style={{ color: "#ccc", fontSize: 18, marginTop: 12 }}>
                            {t('downloads.no_songs')}
                        </p>
                    </div>
                ) : (
                    <>
                        <table className="table table-borderless align-middle mb-5">
                            <thead>
                                <tr>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('downloads.number')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('downloads.song_title')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('downloads.album')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('downloads.duration')}</th>
                                    <th style={{ backgroundColor: '#181C2B', color: '#00e0ff' }}>{t('downloads.remove')}</th>
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
                                {downloads.map((song, index) => (
                                    <tr key={song.songId}>
                                        <td style={{ backgroundColor: '#181C2B', color: 'white' }}>
                                            {song.playing ? <Waves size={16} color="#00e0ff" /> : (index + 1 + (currentPage - 1) * itemsPerPage)}
                                        </td>
                                        <td style={{ backgroundColor: '#181C2B', color: song.playing ? '#00e0ff' : 'white' }}>
                                            {song.songTitle}
                                        </td>
                                        <td style={{ backgroundColor: '#181C2B', color: song.playing ? '#00e0ff' : 'white' }}>
                                            {song.albumName}
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
