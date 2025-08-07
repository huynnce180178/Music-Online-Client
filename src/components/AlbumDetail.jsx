// AlbumDetail.js
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { PlayCircleFilled, SwapOutlined, EllipsisOutlined, DownloadOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { Dropdown, message } from "antd";
import SubscriptionModalPlan from "./SubscriptionModalPlan";
import AddToPlaylistModal from "./AddToPlaylistModal";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';
import axios from "axios";
import BASE_API_URL from "../services/base.api.url";
import DownloadModal from "./DownloadModal";

function SongRow({ song, index, onSelect, t, onDownload, onAddToPlaylist }) {
    const borderGradient = "linear-gradient(90deg, #252B4D 0%, #161A2D 100%)";
    const menuItems = [
        {
            key: 'download',
            icon: <DownloadOutlined />,
            label: t('weekly_top_10.download'),
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onDownload(song.songId);
            },
        },
        {
            key: 'addToPlaylist',
            icon: <PlusSquareOutlined />,
            label: t('weekly_top_10.add_to_playlist'),
            onClick: (e) => {
                e.domEvent.stopPropagation();
                onAddToPlaylist(song.songId);
            },
        },
    ];

    // Helper function to format views
    function formatViews(views) {
        if (views >= 1e9) return (views / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
        if (views >= 1e6) return (views / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
        if (views >= 1e3) return (views / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
        return views?.toLocaleString() || "0";
    }

    return (
        <div
            className="song-row-modern d-flex align-items-center mb-3 px-4 py-2"
            style={{
                borderRadius: 18,
                background: "#252B4D",
                border: `2px solid transparent`,
                boxShadow: "0 4px 24px 0 rgba(37,43,77,0.18)",
                backgroundImage: borderGradient,
                backgroundClip: "padding-box, border-box",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                minHeight: 56,
                transition: "background 0.2s, box-shadow 0.2s, border 0.2s",
            }}
            onClick={() => onSelect(song.songId)}
        >
            {/* Rank */}
            <div
                className="fw-bold text-center me-4"
                style={{
                    fontSize: 24,
                    width: 40,
                    color: "#FFFFFF",
                    textShadow: "0 2px 8px #161A2D",
                    fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                    flexShrink: 0,
                }}
            >
                {String(index + 1).padStart(2, "0")}
            </div>
            {/* Cover */}
            <div style={{ position: "relative" }}>
                <img
                    src={song.profile_pic_url || "/img/default-cover.png"}
                    alt={song.songName}
                    className="rounded-3"
                    style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        boxShadow: "0 2px 12px 0 #252B4D44",
                        border: "2.5px solid #FFFFFF",
                        transition: "transform 0.18s",
                    }}
                />
                <PlayCircleFilled
                    className="play-btn-modern"
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%,-50%) scale(0.9)",
                        fontSize: 32,
                        color: "#DEDEDE",
                        opacity: 0,
                        pointerEvents: "none",
                        transition: "opacity 0.18s, transform 0.18s",
                    }}
                />
            </div>
            {/* Info */}
            <div className="flex-grow-1 ms-4" style={{ minWidth: 0 }}>
                <div
                    className="fw-bold text-truncate"
                    style={{
                        fontSize: 18,
                        color: "#FFFFFF",
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        letterSpacing: 0.2,
                    }}
                    title={song.songName}
                >
                    {song.songName}
                </div>
                <div
                    className="text-secondary text-truncate"
                    style={{
                        fontSize: 14,
                        color: "#DEDEDE",
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                    }}
                    title={song.artistName}
                >
                    {song.artistName}
                </div>
                <div style={{ fontSize: 12, color: "#DEDEDE", marginTop: 2 }}>
                    <span style={{
                        color: "#3ed8ff",
                        fontWeight: 600,
                        fontSize: 13,
                        letterSpacing: 0.2,
                        padding: "2px 8px"
                    }}>
                        {formatViews(song.views)} {t('featured_artists.views')}
                    </span>
                </div>
            </div>
            {/* Dropdown Menu */}
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
                <EllipsisOutlined
                    style={{
                        fontSize: 24,
                        color: "#DEDEDE",
                        marginLeft: 18,
                        transition: "color 0.2s, transform 0.18s",
                        cursor: "pointer",
                    }}
                    className="song-menu-modern"
                    onClick={e => e.stopPropagation()}
                />
            </Dropdown>
        </div>
    );
}

SongRow.propTypes = {
    song: PropTypes.shape({
        songId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        profile_pic_url: PropTypes.string,
        songName: PropTypes.string.isRequired,
        artistName: PropTypes.string,
        views: PropTypes.number,
    }).isRequired,
    index: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    onAddToPlaylist: PropTypes.func.isRequired,
};

export default function AlbumDetail() {
    const { t } = useTranslation();
    const { albumId } = useParams();
    const [songs, setSongs] = useState([]);
    const [album, setAlbum] = useState(null); // album detail info
    const [addToPlaylistModal, setAddToPlaylistModal] = useState({ open: false, songId: null });
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [downloadModal, setDownloadModal] = useState({ open: false, songId: null, downloadInfo: null });

    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;
    const navigate = useNavigate();

    useEffect(() => {
        // Đúng endpoint là /api/v1/guest/ablum/{albumId}/songs (chú ý: "ablum" bị typo, phải giống backend)
        axios.get(`${BASE_API_URL}/api/v1/guest/ablum/${albumId}/songs`)
            .then(res => {
                if (res.data && res.data.data) {
                    setAlbum(res.data.data.albumDetailResponseDTO);
                    setSongs(res.data.data.songResponseDTO || []);
                } else {
                    setAlbum(null);
                    setSongs([]);
                }
            })
            .catch(() => {
                setAlbum(null);
                setSongs([]);
            });
    }, [albumId]);

    const handleSelectSong = (songId) => {
        const allSongIds = songs.map(song => song.id || song.songId);
        playSong(songId, allSongIds, "album", albumId);
    };

    // Play all
    const handlePlayAll = () => {
        if (songs.length > 0) playSong(songs[0].id || songs[0].songId, songs.map(s => s.id || s.songId), "album", albumId);
    };
    // Shuffle
    const handleShuffle = () => {
        if (songs.length > 0) {
            const shuffled = [...songs].sort(() => Math.random() - 0.5);
            playSong(shuffled[0].id || shuffled[0].songId, shuffled.map(s => s.id || s.songId), "album", albumId);
        }
    };

    // Download function
    const handleDownloadSong = async (songId) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.info(t('weekly_top_10.login_to_download'));
            return;
        }
        const roles = JSON.parse(localStorage.getItem("roles")) || [];
        const canDownload = roles.includes("ROLE_PREMIUM") || roles.includes("ROLE_ARTIST");
        if (!canDownload) {
            setShowUpgradeModal(true);
            return;
        }

        try {
            const infoResponse = await axios.get(`${BASE_API_URL}/api/v1/user/downloads/${songId}/info`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const downloadInfo = infoResponse.data.data;
            setDownloadModal({ open: true, songId, downloadInfo });
        } catch (error) {
            console.error('Download error:', error);
            message.error(t('weekly_top_10.download_failed'));
        }
    };

    // Thêm vào playlist
    const handleAddToPlaylist = async (songId) => {
        setAddToPlaylistModal({ open: true, songId });
    };

    return (
        <div
            className="w-100"
            style={{
                background: "#181c2b",
                padding: "0 0 48px 0",
            }}
        >
            <div
                className="container"
                style={{
                    width: "100%",
                    maxWidth: "100%",
                    margin: "0 auto",
                    padding: "0 2vw",
                }}
            >
                {/* Back button styled like PlaylistSongsPage */}
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    style={{
                        margin: "32px 0 24px 0",
                        color: "#3ed8ff",
                        background: "none",
                        border: "none",
                        fontWeight: 600,
                        fontSize: 16,
                        boxShadow: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        cursor: "pointer"
                    }}
                >
                    &#8592; {t('playlist.back')}
                </button>
                {/* Album header section */}
                <div className="album-header-flex" style={{ display: "flex", gap: 40, alignItems: "center", marginBottom: 36 }}>
                    <img
                        src={album?.coverImage || "/img/default-cover.png"}
                        alt={album?.title}
                        style={{
                            width: 300,
                            height: 300,
                            borderRadius: 18,
                            objectFit: "cover",
                            boxShadow: "0 4px 32px #0006",
                            border: "2.5px solid #3ed8ff22"
                        }}
                    />
                    <div style={{ flex: 1 }}>
                        <h1 style={{
                            color: "#fff",
                            fontWeight: 700,
                            fontSize: 32,
                            marginBottom: 14,
                            letterSpacing: 0.5
                        }}>{album?.title || t('album_detail.album')}</h1>
                        <div style={{ color: "#8ca0c6", fontSize: 16, marginBottom: 12, maxWidth: 500 }}>
                            {album?.owner?.bio || t('profile.no_bio')}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                            <img
                                src={album?.owner?.profileImage || "/img/default-avatar.png"}
                                alt={album?.owner?.fullName}
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "2px solid #3ed8ff22",
                                    marginRight: 8
                                }}
                            />
                            <Link
                                to={album?.owner?.userId ? `/artist/${album?.owner?.userId}` : "#"}
                                style={{
                                    color: album?.owner?.userId ? "#3ed8ff" : "#b3b3b3",
                                    fontSize: 17,
                                    fontWeight: 600,
                                    textDecoration: "none",
                                    transition: "color 0.18s",
                                    pointerEvents: album?.owner?.userId ? "auto" : "none"
                                }}
                                onClick={e => {
                                    if (!localStorage.getItem("accessToken")) {
                                        e.preventDefault();
                                        message.info(t('album_detail.login_to_view_artist'));
                                    }
                                }}
                            >
                                {album?.owner?.fullName || t('profile.na')}
                            </Link>
                        </div>

                        <div style={{ display: "flex", gap: 16 }}>
                            <button
                                type="button"
                                style={{
                                    fontWeight: 600,
                                    fontSize: 18,
                                    borderRadius: 8,
                                    background: "#3ed8ff",
                                    border: "none",
                                    color: "#181c2b",
                                    padding: "8px 24px",
                                    cursor: "pointer"
                                }}
                                onClick={handlePlayAll}
                            >
                                <PlayCircleFilled style={{ marginRight: 8 }} />
                                {t('playlist.play')}
                            </button>
                            <button
                                type="button"
                                style={{
                                    fontWeight: 600,
                                    fontSize: 18,
                                    borderRadius: 8,
                                    background: "#23283e",
                                    border: "none",
                                    color: "#3ed8ff",
                                    padding: "8px 24px",
                                    cursor: "pointer"
                                }}
                                onClick={handleShuffle}
                            >
                                <SwapOutlined style={{ marginRight: 8 }} />
                                {t('playlist.shuffle')}
                            </button>
                        </div>
                    </div>
                </div>
                {/* End album header */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "1.5rem",
                    }}
                >
                    <h2
                        style={{
                            color: "#3ed8ff",
                            fontWeight: 700,
                            fontSize: 28,
                            fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                            letterSpacing: 1,
                            marginBottom: 0,
                            marginTop: 20,
                        }}
                    >
                        {t('album_detail.songs_in_album')}
                    </h2>
                </div>

                {songs.length === 0 ? (
                    <p style={{ color: "#fff" }}>{t('album_detail.no_songs_found')}</p>
                ) : (
                    songs.map((song, idx) => (
                        <SongRow
                            key={song.id}
                            song={{
                                songId: song.id,
                                songName: song.title,
                                artistName: song.artistName,
                                profile_pic_url: song.profilePicUrl,
                                views: song.views,
                            }}
                            index={idx}
                            onSelect={handleSelectSong}
                            t={t}
                            onDownload={handleDownloadSong}
                            onAddToPlaylist={handleAddToPlaylist}
                        />
                    ))
                )}
            </div>

            {/* Add to Playlist Modal */}
            <AddToPlaylistModal
                open={addToPlaylistModal.open}
                onClose={() => setAddToPlaylistModal({ open: false, songId: null })}
                songId={addToPlaylistModal.songId}
            />

            {/* Modal nâng cấp premium */}
            <SubscriptionModalPlan show={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

            {/* Download Modal */}
            <DownloadModal
                open={downloadModal.open}
                onClose={() => setDownloadModal({ open: false, songId: null, downloadInfo: null })}
                songId={downloadModal.songId}
                downloadInfo={downloadModal.downloadInfo}
            />

            <style>{`
                .album-header-flex {
                    display: flex;
                    gap: 40px;
                    align-items: center;
                    margin-bottom: 36px;
                }
                .album-header-flex img {
                    width: 300px;
                    height: 300px;
                    border-radius: 18px;
                    object-fit: cover;
                    box-shadow: 0 4px 32px #0006;
                    border: 2.5px solid #3ed8ff22;
                }
                .album-header-flex h1 {
                    color: #fff;
                    font-weight: 700;
                    font-size: 32px;
                    margin-bottom: 14px;
                    letter-spacing: 0.5px;
                }
                @media (max-width: 900px) {
                    .album-header-flex {
                        flex-direction: column !important;
                        gap: 18px !important;
                        align-items: flex-start !important;
                    }
                    .album-header-flex img {
                        width: 120px !important;
                        height: 120px !important;
                        border-radius: 12px !important;
                    }
                    .album-header-flex h1 {
                        font-size: 22px !important;
                    }
                }
                @media (max-width: 600px) {
                    .album-header-flex {
                        flex-direction: column !important;
                        gap: 10px !important;
                        align-items: flex-start !important;
                        margin-bottom: 18px !important;
                    }
                    .album-header-flex img {
                        width: 70vw !important;
                        max-width: 160px !important;
                        height: 70vw !important;
                        max-height: 160px !important;
                        border-radius: 10px !important;
                        margin-bottom: 8px !important;
                    }
                    .album-header-flex h1 {
                        font-size: 16px !important;
                        margin-bottom: 6px !important;
                    }
                    .album-header-flex > div {
                        width: 100% !important;
                    }
                    .album-header-flex .album-owner-avatar {
                        width: 32px !important;
                        height: 32px !important;
                        margin-right: 6px !important;
                    }
                }
                .song-row-modern:hover {
                    background: #163d56 !important;
                    box-shadow: 0 4px 24px 0 rgba(33,168,197,0.18);
                    transform: translateY(-2px) scale(1.01);
                }
                .song-row-modern:hover .play-btn-modern {
                    opacity: 1 !important;
                    pointer-events: auto;
                    transform: translate(-50%,-50%) scale(1.1);
                }
                .song-row-modern:hover img {
                    filter: brightness(0.95) blur(0.5px);
                }
                .song-row-modern:hover .song-menu-modern {
                    color: #21A8C5 !important;
                    transform: scale(1.15);
                }
                .ant-dropdown-menu {
                    background: #23283e !important;
                    border-radius: 18px !important;
                    padding: 10px 0 !important;
                    min-width: 170px !important;
                    box-shadow: 0 6px 28px 0 #3ed8ff33 !important;
                }
                .ant-dropdown-menu-item {
                    color: #fff !important;
                    font-weight: 500;
                    font-size: 15px;
                    padding: 10px 20px !important;
                    border-radius: 12px !important;
                    transition: background 0.16s, color 0.16s;
                    margin: 2px 8px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .ant-dropdown-menu-item:hover, .ant-dropdown-menu-item-active {
                    background: linear-gradient(90deg, #3ed8ff11, #1fa2ff18) !important;
                    color: #3ed8ff !important;
                }
                .ant-dropdown-menu-item:hover .anticon,
                .ant-dropdown-menu-item-active .anticon {
                    color: #3ed8ff !important;
                }
                .ant-dropdown-menu-item .anticon {
                    font-size: 18px;
                    color: #fff;
                    transition: color 0.18s;
                }
            `}</style>
        </div>
    );
}

