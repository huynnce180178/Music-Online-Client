import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { PlayerContext } from "../context/PlayerContext";
import { Dropdown, message } from 'antd';
import { PlayCircleFilled, EllipsisOutlined, DownloadOutlined, PlusSquareOutlined } from '@ant-design/icons';
import SubscriptionModalPlan from "./SubscriptionModalPlan";
import DownloadModal from "./DownloadModal";
import AddToPlaylistModal from "./AddToPlaylistModal";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

function SongRow({ song, index, onSelect, onDownload, onAddToPlaylist, t }) {
    const borderGradient = "linear-gradient(90deg, #252B4D 0%, #161A2D 100%)";
    const menuItems = [
        {
            key: 'download',
            icon: <DownloadOutlined />,
            label: t('weekly_top_10.download_with_location'),
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
                        {formatViews(song.views ?? song.totalViews)} {t('featured_artists.views')}
                    </span>
                </div>
            </div>
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
    song: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    onAddToPlaylist: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default function WeeklyTop10() {
    const [songs, setSongs] = useState([]);

    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [downloadModal, setDownloadModal] = useState({ open: false, songId: null, downloadInfo: null });
    const [addToPlaylistModal, setAddToPlaylistModal] = useState({ open: false, songId: null });

    const playerCtx = useContext(PlayerContext) || {};
    const { handleSelectSong: contextHandleSelectSong } = playerCtx;
    const { t } = useTranslation();

    useEffect(() => {
        axios.get(`${BASE_API_URL}/api/v1/guest/TopSongOfWeak`)
            .then(res => setSongs(res.data))
            .catch(() => setSongs([]));
    }, []);

    const handleSelectSong = (songId) => {
        const allSongIds = songs.map(a => a.songId);
        contextHandleSelectSong(songId, allSongIds);
    };

    const handleDownloadSong = async (songId) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.info({
                content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="message-icon" style={{ fontSize: '18px' }}>ℹ️</span>
                        <span>{t('weekly_top_10.login_to_download')}</span>
                    </div>
                ),
                duration: 3
            });
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
            message.error({
                content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="message-icon" style={{ fontSize: '18px' }}>❌</span>
                        <span>{t('weekly_top_10.download_failed')}</span>
                    </div>
                ),
                duration: 4
            });
        }
    };

    const handleAddToPlaylist = async (songId) => {
        setAddToPlaylistModal({ open: true, songId });
    };



    return (
        <div
            className="w-100"
            style={{
                background: "#181c2b",
                padding: "0 0 40px 0",
            }}
        >
            <div className="container" style={{ maxWidth: "100%", padding: "0 2vw" }}>
                <h2
                    className="fw-bold"
                    style={{
                        color: "#3ed8ff",
                        fontWeight: 700,
                        fontSize: 28,
                        fontFamily: "'Quicksand', 'Montserrat', sans-serif",
                        letterSpacing: 1,
                        marginBottom: 25,
                    }}
                >
                    {t('weekly_top_10.title')}
                </h2>
                <div className="row">
                    <div className="col-md-6">
                        {songs.slice(0, 5).map((song, idx) => (
                            <SongRow
                                key={song.songId}
                                song={song}
                                index={idx}
                                onSelect={handleSelectSong}
                                t={t}
                                onDownload={handleDownloadSong}
                                onAddToPlaylist={handleAddToPlaylist}
                            />
                        ))}
                    </div>
                    <div className="col-md-6">
                        {songs.slice(5, 10).map((song, idx) => (
                            <SongRow
                                key={song.songId}
                                song={song}
                                index={idx + 5}
                                onSelect={handleSelectSong}
                                t={t}
                                onDownload={handleDownloadSong}
                                onAddToPlaylist={handleAddToPlaylist}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <AddToPlaylistModal
                open={addToPlaylistModal.open}
                onClose={() => setAddToPlaylistModal({ open: false, songId: null })}
                songId={addToPlaylistModal.songId}
            />

            <SubscriptionModalPlan show={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

            <DownloadModal
                open={downloadModal.open}
                onClose={() => setDownloadModal({ open: false, songId: null, downloadInfo: null })}
                songId={downloadModal.songId}
                downloadInfo={downloadModal.downloadInfo}
            />
        </div>
    );
}

SongRow.propTypes = {
    song: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    onAddToPlaylist: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};
