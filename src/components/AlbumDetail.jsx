// AlbumDetail.js
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PlayerContext } from "../context/PlayerContext";
import { PlayCircleFilled, EllipsisOutlined, DownloadOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { Dropdown, Modal, Select, message } from "antd";
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
                    <span style={{ color: "#FFFFFF" }}>{song.views?.toLocaleString() || 0} {t('weekly_top_10.plays')}</span>
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
    const [addToPlaylistModal, setAddToPlaylistModal] = useState({ open: false, songId: null });
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [downloadModal, setDownloadModal] = useState({ open: false, songId: null, downloadInfo: null });

    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;

    useEffect(() => {
        fetch(`${BASE_API_URL}/api/v1/guest/ablum/${albumId}/songs`)
            .then(res => res.json())
            .then(data => {
                if (data && data.data) {
                    setSongs(data.data);
                }
            })
            .catch(err => {
                console.error(err);
                setSongs([]);
            });
    }, [albumId]);

    const handleSelectSong = (songId) => {
        const allSongIds = songs.map(song => song.id || song.songId);
        playSong(songId, allSongIds);
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
                            key={song.id || song.songId}
                            song={{
                                songId: song.id || song.songId,
                                songName: song.title || song.songName,
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
