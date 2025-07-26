import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

// Component AlbumRow để render mỗi album
function AlbumRow({ album, index, showBorder, onClick }) {
    return (
        <div
            className="position-relative px-0 py-2 mb-2"
            style={{ background: "transparent", minHeight: 56, cursor: "pointer" }}
            onClick={() => onClick(album.id)}
        >
            <div className="d-flex align-items-center" style={{ gap: 10 }}>
                {/* Number */}
                <span
                    className="fw-bold text-white d-inline-block text-end"
                    style={{
                        fontSize: 32,
                        width: 38,
                        minWidth: 38,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        lineHeight: "1",
                        letterSpacing: "-1px",
                    }}
                >
                    {index + 1 < 10 ? `0${index + 1}` : index + 1}
                </span>
                {/* Image */}
                <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="rounded-3"
                    style={{
                        width: 38,
                        height: 38,
                        objectFit: "cover",
                        marginRight: 10,
                    }}
                />
                {/* Info */}
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                    <div
                        className="fw-bold text-white text-truncate"
                        style={{
                            fontSize: 15,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            marginBottom: 2,
                        }}
                        title={album.title}
                    >
                        {album.title}
                    </div>
                    <div
                        className="text-secondary text-truncate"
                        style={{
                            fontSize: 13,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        }}
                        title={album.totalViews}
                    >
                        {album.totalViews} views
                    </div>
                </div>
            </div>
            {/* Border giữa các dòng */}
            {showBorder && (
                <div
                    className="position-absolute start-0 bottom-0 w-100"
                    style={{
                        height: 1,
                        background: "linear-gradient(90deg,#252B4D 40%,#252B4D 60%,#161A2D 100%)",
                        left: 0,
                    }}
                />
            )}
        </div>
    );
}

// Component chính để hiển thị Top 15 Albums
export default function Top15Albums() {
    const { t } = useTranslation();
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/album/top15`)
            .then((res) => res.json())
            .then((data) => {
                setAlbums(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Lỗi khi lấy dữ liệu:", error);
                setLoading(false);
            });
    }, []);

    // Chia album thành 3 cột
    const columns = [[], [], []];
    albums.forEach((album, i) => columns[i % 3].push({ ...album, i }));

    const handleAlbumClick = (albumId) => {
        navigate(`/album/${albumId}`);
    };

    return (
        <div className="w-100" style={{ background: "#181c2b", padding: "0 0 48px 0" }}>
            <div
                className="container-fluid"
                style={{ width: "100%", maxWidth: 1550, padding: "0 3vw" }}
            >
                <span style={{
                    color: "#3ed8ff", fontWeight: 700, fontSize: 28,
                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                }}>
                    {t('albums_page.top_15_albums')}
                </span>

                {loading ? (
                    <div style={{ color: "#fff" }}>Loading...</div>
                ) : (
                    <div className="row gx-5">
                        {columns.map((column, colIdx) => (
                            <div className="col-12 col-lg-4" key={colIdx}>
                                <div>
                                    {column.map((album, idx) => (
                                        <AlbumRow
                                            album={album}
                                            index={album.i}
                                            key={album.i}
                                            showBorder={idx !== column.length - 1}
                                            onClick={handleAlbumClick}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}