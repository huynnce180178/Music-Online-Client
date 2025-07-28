import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { PlayerContext } from "../context/PlayerContext";
import { Dropdown, message, Modal, Select } from 'antd';
import { PlayCircleFilled, EllipsisOutlined, DownloadOutlined, PlusSquareOutlined } from '@ant-design/icons';
import SubscriptionModalPlan from "./SubscriptionModalPlan";
import PropTypes from "prop-types";
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";

function SongRow({ song, index, onSelect, onDownload, onAddToPlaylist, t }) {
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
    song: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    onDownload: PropTypes.func.isRequired,
    onAddToPlaylist: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default function WeeklyTop10() {
    const [songs, setSongs] = useState([]);
    const [playlistModal, setPlaylistModal] = useState({ open: false, songId: null });
    const [userPlaylists, setUserPlaylists] = useState([]);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    const playerCtx = useContext(PlayerContext) || {};
    const { playSong } = playerCtx;
    const { t } = useTranslation();

    useEffect(() => {
        axios.get(`${BASE_API_URL}/api/v1/guest/TopSongOfWeak`)
            .then(res => setSongs(res.data))
            .catch(() => setSongs([]));
    }, []);

    // Chọn bài hát để phát
    const handleSelectSong = (songId) => {
        const allSongIds = songs.map(a => a.songId);
        playSong(songId, allSongIds);
    };

    // Download (check giống PlayerContext)
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
            await axios.post(`${BASE_API_URL}/api/v1/user/downloads/${songId}`, { songId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(t('weekly_top_10.download_success'));
        } catch {
            message.error(t('weekly_top_10.download_failed'));
        }
    };

    // Thêm vào playlist (không phân quyền, chỉ cần login)
    const handleAddToPlaylist = async (songId) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.info(t('weekly_top_10.login_to_add_playlist'));
            return;
        }
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/playlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserPlaylists(res.data.data || []);
            setSelectedPlaylistId(null);
            setPlaylistModal({ open: true, songId });
        } catch {
            message.error(t('weekly_top_10.get_playlist_failed'));
        }
    };

    const handleCloseModal = () => setPlaylistModal({ open: false, songId: null });

    const handleAddSongToPlaylist = async () => {
        if (!selectedPlaylistId) {
            message.warning(t('weekly_top_10.select_playlist_warning'));
            return;
        }
        const token = localStorage.getItem("accessToken");
        try {
            await axios.post(`${BASE_API_URL}/api/v1/user/playlist/add-song?playlistId=${selectedPlaylistId}&songId=${playlistModal.songId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success(t('weekly_top_10.added_to_playlist'));
            setPlaylistModal({ open: false, songId: null });
        } catch {
            message.error(t('weekly_top_10.add_to_playlist_failed'));
        }
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

            {/* Modal thêm vào playlist */}
            <Modal
                title={t('weekly_top_10.add_to_playlist')}
                open={playlistModal.open}
                onOk={handleAddSongToPlaylist}
                onCancel={handleCloseModal}
                okText={t('weekly_top_10.add')}
                cancelText={t('weekly_top_10.cancel')}
            >
                <Select
                    style={{ width: "100%" }}
                    placeholder={t('weekly_top_10.select_playlist')}
                    value={selectedPlaylistId}
                    onChange={setSelectedPlaylistId}
                >
                    {userPlaylists.map(pl => (
                        <Select.Option key={pl.id} value={pl.id}>
                            {pl.name}
                        </Select.Option>
                    ))}
                </Select>
            </Modal>

            {/* Modal nâng cấp premium */}
            <SubscriptionModalPlan show={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />

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
