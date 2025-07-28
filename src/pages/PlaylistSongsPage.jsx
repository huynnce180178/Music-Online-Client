import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { PlayCircleFilled, PauseCircleFilled, SwapOutlined, ArrowLeftOutlined, } from "@ant-design/icons";
import { message, Button, Spin, Popconfirm, } from "antd";
import axios from "axios";
import { DeleteOutlined } from "@ant-design/icons";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

export default function PlaylistSongsPage() {
    const { id } = useParams();
    const [songs, setSongs] = useState([]);
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const navigate = useNavigate();
    const { playSong, currentSongId, isPlaying } = useContext(PlayerContext);
    const { t } = useTranslation();

    useEffect(() => {
        const fetchPlaylistAndSongs = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("accessToken");
                let found = null;
                let ownerFlag = false;
                // Kiểm tra quyền sở hữu playlist
                if (token) {
                    const userRes = await axios.get(`${BASE_API_URL}/api/v1/user/playlist`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    found = (userRes.data.data || []).find(p => p.id === Number(id));
                    if (found) {
                        setPlaylist(found);
                        ownerFlag = true;
                    }
                }
                if (!ownerFlag) {
                    // Nếu không phải playlist của mình, lấy từ community
                    const res = await axios.get(`${BASE_API_URL}/api/v1/guest/public/playlists`);
                    found = (res.data.data || []).find(p => p.id === Number(id));
                    setPlaylist(found);
                }
                setIsOwner(ownerFlag);

                // Gọi API lấy danh sách bài hát theo quyền sở hữu
                let songsRes;
                if (ownerFlag && token) {
                    songsRes = await axios.get(`${BASE_API_URL}/api/v1/user/playlist/${id}/songs`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } else {
                    songsRes = await axios.get(`${BASE_API_URL}/api/v1/guest/playlist/${id}/songs`);
                }
                setSongs(songsRes.data.data || []);
            } catch {
                message.error(t('playlist.failed_to_load'));
                setIsOwner(false);
            }
            setLoading(false);
        };
        fetchPlaylistAndSongs();
    }, [id]);

    // Play all
    const handlePlayAll = () => {
        if (songs.length > 0) playSong(songs[0].id, songs.map(s => s.id), "playlist", id);
    };
    // Shuffle
    const handleShuffle = () => {
        if (songs.length > 0) {
            const shuffled = [...songs].sort(() => Math.random() - 0.5);
            playSong(shuffled[0].id, shuffled.map(s => s.id), "playlist", id);
        }
    };
    // Play song
    const handleSelectSong = (songId) => {
        playSong(songId, songs.map(s => s.id), "playlist", id);
    };
    // Hàm xóa bài hát khỏi playlist của mình
    const handleRemoveSong = async (songId) => {
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${BASE_API_URL}/api/v1/user/playlist/remove-song`, {
                params: { playlistId: id, songId },
                headers: { Authorization: `Bearer ${token}` }
            });
            setSongs(songs.filter(s => s.id !== songId));
            message.success(t('playlist.song_removed_success'));
        } catch {
            message.error(t('playlist.failed_to_remove_song'));
        }
    };

    return (
        <div
            style={{
                background: "#181c2b",
                minHeight: "100vh",
                padding: "0 0 48px 0",
                width: "100%",
                fontFamily: "'Quicksand', 'Montserrat', sans-serif"
            }}
        >
            <div
                className="container-fluid"
                style={{
                    width: "100%",
                    maxWidth: 1300,
                    margin: "0 auto",
                    padding: "0 2vw",
                }}
            >
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate(-1)}
                    style={{
                        margin: "32px 0 24px 0",
                        color: "#3ed8ff",
                        background: "none",
                        border: "none",
                        fontWeight: 600,
                        fontSize: 16,
                        boxShadow: "none"
                    }}
                >
                    {t('playlist.back')}
                </Button>
                <div className="playlist-header-flex" style={{ display: "flex", gap: 40, alignItems: "center", marginBottom: 36 }}>
                    <img
                        src={playlist?.imageUrl || "/img/default-cover.png"}
                        alt={playlist?.name}
                        style={{
                            width: 300,
                            height: 300,
                            borderRadius: 18,
                            objectFit: "cover",
                            boxShadow: "0 4px 32px #0006",
                            border: "2.5px solid #3ed8ff22"
                        }}
                    />
                    <div>
                        <h1 style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 32,
                            marginBottom: 14,
                            letterSpacing: 0.5
                        }}>{playlist?.name || "Playlist"}</h1>
                        <div style={{ color: "#8ca0c6", fontSize: 16, marginBottom: 24, maxWidth: 500 }}>
                            {playlist?.description}
                        </div>
                        <div style={{ display: "flex", gap: 16 }}>
                            <Button
                                type="primary"
                                icon={isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
                                size="large"
                                style={{
                                    fontWeight: 600,
                                    fontSize: 18,
                                    borderRadius: 8,
                                    background: "#3ed8ff",
                                    border: "none",
                                    color: "#181c2b"
                                }}
                                onClick={handlePlayAll}
                            >{t('playlist.play')}</Button>
                            <Button
                                icon={<SwapOutlined />}
                                size="large"
                                style={{
                                    fontWeight: 600,
                                    fontSize: 18,
                                    borderRadius: 8,
                                    background: "#23283e",
                                    border: "none",
                                    color: "#3ed8ff"
                                }}
                                onClick={handleShuffle}
                            >{t('playlist.shuffle')}</Button>
                        </div>
                    </div>
                </div>
                <div style={{
                    background: "#23283e",
                    borderRadius: 18,
                    padding: 0,
                    boxShadow: "0 4px 24px #3ed8ff22"
                }}>
                    {/* Header chỉnh đẹp, đồng bộ */}
                    <div className="playlist-song-header">
                        <div style={{ textAlign: "center" }}>#</div>
                        <div></div>
                        <div style={{ textAlign: "left" }}>{t('playlist.title')}</div>
                        <div style={{ textAlign: "left" }}>{t('playlist.artist')}</div>
                        <div style={{ textAlign: "left" }}>{t('playlist.album')}</div>
                        <div style={{ textAlign: "right" }}>{t('playlist.duration')}</div>
                        <div></div>
                    </div>
                    {loading ? (
                        <Spin style={{ margin: 40 }} />
                    ) : (
                        songs.length === 0 ? (
                            <div style={{ color: "#fff", padding: 32 }}>{t('playlist.no_songs_in_playlist')}</div>
                        ) : (
                            songs.map((song, idx) => (
                                <div
                                    key={song.id}
                                    className="playlist-song-row"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "48px 56px 2fr 1.5fr 1.5fr 120px 40px",
                                        alignItems: "center",
                                        padding: "10px 0",
                                        borderBottom: "1px solid #23232f",
                                        background: currentSongId === song.id ? "#22304a" : "transparent",
                                        cursor: "pointer",
                                        transition: "background 0.2s"
                                    }}
                                    onClick={() => handleSelectSong(song.id)}
                                >
                                    {/* Số thứ tự */}
                                    <div style={{
                                        color: "#8ca0c6",
                                        fontWeight: 700,
                                        fontSize: 18,
                                        textAlign: "center"
                                    }}>{String(idx + 1).padStart(2, "0")}</div>
                                    {/* Ảnh bài hát */}
                                    <div style={{ display: "flex", justifyContent: "center" }}>
                                        <img
                                            src={song.profilePicUrl || "/img/default-cover.png"}
                                            alt={song.title}
                                            style={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 8,
                                                objectFit: "cover",
                                                border: "2px solid #23283e",
                                                boxShadow: "0 2px 8px #0002"
                                            }}
                                        />
                                    </div>
                                    {/* Tiêu đề bài hát */}
                                    <div style={{
                                        color: "#fff",
                                        fontWeight: 600,
                                        fontSize: 16,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>{song.title}</div>
                                    {/* Nghệ sĩ */}
                                    <div style={{
                                        color: "#8ca0c6",
                                        fontWeight: 500,
                                        fontSize: 15,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>{song.artistName}</div>
                                    {/* Album */}
                                    <div style={{
                                        color: "#fff",
                                        fontSize: 15,
                                        fontWeight: 400,
                                        textAlign: "left",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap"
                                    }}>{song.albumName || ""}</div>
                                    {/* Duration */}
                                    <div style={{
                                        color: "#3ed8ff",
                                        fontWeight: 600,
                                        fontSize: 15,
                                        textAlign: "right"
                                    }}>{song.duration}</div>
                                    {/* Actions: chỉ hiện nút xóa nếu là chủ sở hữu */}
                                    <div>
                                        {isOwner && (
                                            <Popconfirm
                                                title={t('playlist.remove_song_confirm')}
                                                onConfirm={(e) => {
                                                    e?.stopPropagation();
                                                    handleRemoveSong(song.id);
                                                }}
                                                okText={t('playlist.remove')}
                                                cancelText={t('playlist.cancel')}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <Button
                                                    icon={<DeleteOutlined />}
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    style={{ marginLeft: 8 }}
                                                    onClick={e => e.stopPropagation()}
                                                />
                                            </Popconfirm>
                                        )}
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
            <style>{`
                .playlist-song-header {
                    display: grid;
                    grid-template-columns: 48px 56px 2fr 1.5fr 1.5fr 120px 40px;
                    background: transparent;
                    color: #b3b9c9;
                    font-weight: 700;
                    font-size: 18px;
                    padding: 12px 0;
                    border-bottom: 1px solid #2a314a;
                    align-items: center;
                }
                .playlist-song-row {
                    display: grid;
                    grid-template-columns: 48px 56px 2fr 1.5fr 1.5fr 120px 40px;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid #23232f;
                    background: transparent;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                .playlist-song-row:hover {
                    background: #181f2a !important;
                }
                .playlist-song-row:hover span {
                    color: #3ed8ff !important;
                }
                .playlist-song-row:hover img {
                    filter: brightness(0.95) blur(0.5px);
                }
                .playlist-song-row:hover .anticon {
                    color: #3ed8ff !important;
                }

                /* Tablet */
                @media (max-width: 1200px) {
                    .playlist-song-header,
                    .playlist-song-row {
                        grid-template-columns: 36px 44px 2fr 1.2fr 1.2fr 80px 32px !important;
                        font-size: 15px !important;
                    }
                    .playlist-header-flex img {
                        width: 180px !important;
                        height: 180px !important;
                    }
                }
                /* Small tablet */
                @media (max-width: 900px) {
                    .playlist-song-header,
                    .playlist-song-row {
                        grid-template-columns: 28px 36px 2fr 1fr 1fr 60px 28px !important;
                        font-size: 13px !important;
                    }
                    .playlist-header-flex {
                        flex-direction: column !important;
                        gap: 18px !important;
                        align-items: flex-start !important;
                    }
                    .playlist-header-flex img {
                        width: 120px !important;
                        height: 120px !important;
                        border-radius: 12px !important;
                    }
                    .playlist-header-flex h1 {
                        font-size: 22px !important;
                    }
                }
                /* Mobile */
                @media (max-width: 600px) {
                    .container-fluid {
                        padding: 0 4vw !important;
                    }
                    .playlist-header-flex {
                        flex-direction: column !important;
                        gap: 10px !important;
                        align-items: flex-start !important;
                        margin-bottom: 18px !important;
                    }
                    .playlist-header-flex img {
                        width: 70vw !important;
                        max-width: 160px !important;
                        height: 70vw !important;
                        max-height: 160px !important;
                        border-radius: 10px !important;
                        margin-bottom: 8px !important;
                    }
                    .playlist-header-flex h1 {
                        font-size: 16px !important;
                        margin-bottom: 6px !important;
                    }
                    .playlist-header-flex > div {
                        width: 100% !important;
                    }
                    /* Chỉ hiện số thứ tự, ảnh, tiêu đề, nghệ sĩ, nút xóa */
                    .playlist-song-header,
                    .playlist-song-row {
                        grid-template-columns: 18px 28px 2fr 1.2fr 36px !important;
                        font-size: 11px !important;
                        padding: 4px 0 !important;
                    }
                    .playlist-song-header > div:nth-child(5),
                    .playlist-song-header > div:nth-child(6),
                    .playlist-song-row > div:nth-child(5),
                    .playlist-song-row > div:nth-child(6) {
                        display: none !important;
                    }
                    .playlist-song-header > div:last-child {
                        display: block !important;
                    }
                    .playlist-song-row > div:last-child {
                        display: flex !important;
                        justify-content: flex-end !important;
                        align-items: center !important;
                    }
                    .playlist-song-row img {
                        width: 22px !important;
                        height: 22px !important;
                        border-radius: 5px !important;
                    }
                    .playlist-song-row > div {
                        font-size: 11px !important;
                    }
                    .playlist-song-row > div:nth-child(3),
                    .playlist-song-header > div:nth-child(3) {
                        font-size: 12px !important;
                        font-weight: 600 !important;
                    }
                    .playlist-song-header {
                        padding: 6px 0 !important;
                    }
                    .playlist-song-row {
                        min-height: 32px !important;
                    }
                    .playlist-header-flex button {
                        font-size: 13px !important;
                        padding: 2px 10px !important;
                        height: 32px !important;
                        border-radius: 6px !important;
                    }
                }
                /* Extra small mobile */
                @media (max-width: 400px) {
                    .playlist-header-flex img {
                        width: 90vw !important;
                        max-width: 100px !important;
                        height: 90vw !important;
                        max-height: 100px !important;
                    }
                    .playlist-song-header,
                    .playlist-song-row {
                        grid-template-columns: 12px 16px 1fr 0.8fr 20px !important;
                        font-size: 9px !important;
                    }
                    .playlist-song-row img {
                        width: 14px !important;
                        height: 14px !important;
                        border-radius: 3px !important;
                    }
                }
            `}</style>
        </div>
    );
}