import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Avatar, message, Modal, Select, Dropdown } from 'antd';
import { DownloadOutlined, PlusSquareOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { PlayerContext } from '../context/PlayerContext';
import { useTranslation } from 'react-i18next';
import BASE_API_URL from "../services/base.api.url";
import DownloadModal from './DownloadModal';
import AddToPlaylistModal from './AddToPlaylistModal';

export default function ArtistProfile() {
    const { t } = useTranslation();
    const artistId = Number(useParams().artistId);

    const [artistInfo, setArtistInfo] = useState(null);
    const [albumsByArtist, setAlbumsByArtist] = useState([]);
    const [songsByArtist, setSongsByArtist] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [activeTab, setActiveTab] = useState("songs");
    const [loading, setLoading] = useState(true);
    const playerCtx = useContext(PlayerContext) || {};
    const [openedAlbumId, setOpenedAlbumId] = useState(null);
    const [albumSongs, setAlbumSongs] = useState({});
    const [loadingAlbum, setLoadingAlbum] = useState(null);
    const [downloadModal, setDownloadModal] = useState({ open: false, songId: null, downloadInfo: null });
    const [addToPlaylistModal, setAddToPlaylistModal] = useState({ open: false, songId: null });
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const { playSong } = playerCtx;

    useEffect(() => {
        if (!artistId) return;
        const fetchArtistInfo = async () => {
            try {
                const res = await axios.get(
                    `${BASE_API_URL}/api/v1/user/artist/view/${artistId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        }
                    }
                );
                setArtistInfo(res.data.data || null);
            } catch {
                setArtistInfo(null);
            }
        };
        fetchArtistInfo();
    }, [artistId]);

    useEffect(() => {
        setLoading(true);
        const fetchSongsByArtist = async () => {
            try {
                const res = await axios.get(
                    `${BASE_API_URL}/api/v1/user/song/artist/${artistId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        }
                    }
                );
                setSongsByArtist(res.data.data || []);
            } catch {
                message.error("Unable to load artist's track list.");
                setSongsByArtist([]);
            }
        };

        const fetchAlbumsByArtist = async () => {
            try {
                const res = await axios.get(
                    `${BASE_API_URL}/api/v1/user/albums/${artistId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        }
                    }
                );
                setAlbumsByArtist(res.data.data || []);
            } catch {
                message.error("Unable to load artist album list.");
                setAlbumsByArtist([]);
            }
        };

        Promise.all([fetchSongsByArtist(), fetchAlbumsByArtist()]).finally(() => {
            setLoading(false);
        });
    }, [artistId]);

    const handleToggleAlbum = async (albumId) => {
        if (openedAlbumId === albumId) {
            setOpenedAlbumId(null);
            return;
        }
        setOpenedAlbumId(albumId);
        if (!albumSongs[albumId]) {
            setLoadingAlbum(albumId);
            try {
                const res = await axios.get(`${BASE_API_URL}/api/v1/guest/ablum/${albumId}/songs`);
                setAlbumSongs(prev => ({
                    ...prev,
                    [albumId]: res.data?.data || []
                }));
            } catch {
                setAlbumSongs(prev => ({
                    ...prev,
                    [albumId]: []
                }));
            } finally {
                setLoadingAlbum(null);
            }
        }
    };

    useEffect(() => {
        if (!artistId) return;
        const checkFollowing = async () => {
            try {
                const res = await axios.get(
                    `${BASE_API_URL}/api/v1/Follow/isFollowing`,
                    {
                        params: { targetUserId: artistId },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        }
                    }
                );
                setIsFollowing(res.data.data === true);
            } catch {
                setIsFollowing(false);
            }
        };
        checkFollowing();
    }, [artistId]);

    const handleSelectSong = (songId) => {
        const allSongIds = songsByArtist.map(s => s.songId || s.id);
        if (typeof playSong === "function") {
            playSong(songId, allSongIds);
        }
    };

    const handleFollow = async () => {
        try {
            if (!artistId) return;
            if (!isFollowing) {
                await axios.get(
                    `${BASE_API_URL}/api/v1/Follow/followUser`,
                    {
                        params: { targetUserId: artistId },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        }
                    }
                );
                setIsFollowing(true);
                message.success("Followed artist!", 2);
            } else {
                await axios.get(
                    `${BASE_API_URL}/api/v1/Follow/unFollowUser`,
                    {
                        params: { targetUserId: artistId },
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
                        }
                    }
                );
                setIsFollowing(false);
                message.info("Artist unfollowed.", 2);
            }
        } catch (err) {
            message.error("There was an error while following/unfollowing.", 2);
        }
    };

    const handleDownloadSong = async (songId) => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            message.info({
                content: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="message-icon" style={{ fontSize: '18px' }}>ℹ️</span>
                        <span>Please login to download songs</span>
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
                        <span>Download failed</span>
                    </div>
                ),
                duration: 4
            });
        }
    };

    const handleAddToPlaylist = async (songId) => {
        setAddToPlaylistModal({ open: true, songId });
    };

    // Layout responsive header
    return (
        <div
            style={{
                backgroundColor: '#181c2b',
                color: '#fff',
                padding: '40px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            {/* Header Artist */}
            <div className="artist-profile-header">
                <div className="artist-profile-header-main">
                    <Avatar
                        size={120}
                        src={artistInfo?.profileImage || "/img/default-cover.png"}
                        alt={artistInfo ? `${artistInfo.firstName} ${artistInfo.lastName}` : "Artist"}
                        className="artist-profile-avatar"
                    />
                    <span className="artist-profile-name">
                        {artistInfo ? `${artistInfo.firstName} ${artistInfo.lastName}` : "Artist"}
                    </span>
                </div>
                {/* Bio */}
                {artistInfo?.bio && (
                    <div className="artist-profile-bio">
                        {artistInfo.bio}
                    </div>
                )}
                <button
                    onClick={handleFollow}
                    className="artist-profile-follow-btn"
                    style={{
                        background: isFollowing
                            ? "linear-gradient(90deg, #5170ff 0%, #b472ff 100%)"
                            : "linear-gradient(90deg, #1db954 0%, #21c8f6 100%)",
                    }}
                >
                    {isFollowing ? "Followed" : "+ Follow"}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #333', paddingBottom: 8, marginBottom: 0 }}>
                <span
                    onClick={() => setActiveTab("songs")}
                    style={{
                        color: activeTab === "songs" ? '#3ed8ff' : '#b3b3b3',
                        fontWeight: 600,
                        cursor: 'pointer',
                        paddingBottom: 4,
                        borderBottom: activeTab === "songs" ? "2.5px solid #3ed8ff" : "none",
                        fontSize: 20,
                        letterSpacing: 0.2,
                        transition: "all 0.14s"
                    }}
                >
                    {t('artist_profile.songs')}
                </span>
                <span
                    onClick={() => setActiveTab("albums")}
                    style={{
                        color: activeTab === "albums" ? '#3ed8ff' : '#b3b3b3',
                        fontWeight: 600,
                        cursor: 'pointer',
                        paddingBottom: 4,
                        borderBottom: activeTab === "albums" ? "2.5px solid #3ed8ff" : "none",
                        fontSize: 20,
                        letterSpacing: 0.2,
                        transition: "all 0.14s"
                    }}
                >
                    {t('artist_profile.albums')}
                </span>
            </div>

            {/* Tab Content */}
            <div style={{
                minHeight: 160,
                marginTop: 40,
                flex: 1,
                display: "flex",
                flexDirection: "column"
            }}>
                {loading ? (
                    <div style={{ color: "#3ed8ff", fontSize: 22, marginTop: 24, fontWeight: 500 }}>
                        Loading...
                    </div>
                ) : (
                    <>
                        {/* Songs List */}
                        {activeTab === "songs" && (
                            songsByArtist.length > 0 ? (
                                <div>
                                    {songsByArtist.map((s) => {
                                        const songId = s.songId || s.id;
                                        const songName = s.title || s.songName;
                                        const artistName = s.artistName;
                                        const profilePicUrl = s.profilePicUrl || "/img/default-cover.png";
                                        const duration = s.duration || "";

                                        const menuItems = [
                                            {
                                                key: 'download',
                                                icon: <DownloadOutlined />,
                                                label: t('weekly_top_10.download_with_location'),
                                                onClick: (e) => {
                                                    e.domEvent.stopPropagation();
                                                    handleDownloadSong(songId);
                                                },
                                            },
                                            {
                                                key: 'addToPlaylist',
                                                icon: <PlusSquareOutlined />,
                                                label: t('weekly_top_10.add_to_playlist'),
                                                onClick: (e) => {
                                                    e.domEvent.stopPropagation();
                                                    handleAddToPlaylist(songId);
                                                },
                                            },
                                        ];

                                        return (
                                            <div
                                                key={songId}
                                                className="song-card-ui"
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    background: "linear-gradient(90deg, #182841 60%, #151C2F 100%)",
                                                    borderRadius: 10,
                                                    boxShadow: "0 2px 16px 0 rgba(20,30,40,0.14)",
                                                    padding: "5px 15px",
                                                    marginBottom: 15,
                                                    position: "relative",
                                                    cursor: "pointer",
                                                    transition: "all 0.18s",
                                                    gap: 18,
                                                }}
                                                onClick={() => handleSelectSong(songId)}
                                            >
                                                <img
                                                    src={profilePicUrl}
                                                    alt={songName}
                                                    style={{
                                                        width: 60,
                                                        height: 60,
                                                        objectFit: "cover",
                                                        borderRadius: 12,
                                                        background: "#333",
                                                        flexShrink: 0,
                                                        boxShadow: "0 2px 10px rgba(60,60,90,0.10)"
                                                    }}
                                                />
                                                <div style={{
                                                    flex: 1,
                                                    minWidth: 0,
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    justifyContent: "center"
                                                }}>
                                                    <div
                                                        style={{
                                                            color: "#fff",
                                                            fontWeight: 600,
                                                            fontSize: 17,
                                                            fontFamily: "'Quicksand','Montserrat',sans-serif",
                                                            lineHeight: 1,
                                                            marginBottom: 3,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap"
                                                        }}
                                                        title={songName}
                                                    >
                                                        {songName}
                                                    </div>
                                                    <div
                                                        style={{
                                                            color: "#bfc9db",
                                                            fontWeight: 500,
                                                            fontSize: 15,
                                                            marginBottom: 2,
                                                            whiteSpace: "nowrap",
                                                            textOverflow: "ellipsis",
                                                            overflow: "hidden",
                                                            letterSpacing: 0.1,
                                                        }}
                                                        title={artistName}
                                                    >
                                                        {artistName}
                                                    </div>
                                                    <div style={{
                                                        marginTop: 2,
                                                        display: "flex",
                                                        gap: 18,
                                                        alignItems: "center"
                                                    }}>
                                                        {duration && (
                                                            <span style={{ color: "#87a2be", fontSize: 14 }}>
                                                                {t('artist_profile.duration')}: {duration}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <Dropdown
                                                    menu={{ items: menuItems }}
                                                    trigger={['click']}
                                                    placement="bottomRight"
                                                    overlayStyle={{ zIndex: 1000 }}
                                                >
                                                    <EllipsisOutlined
                                                        style={{
                                                            fontSize: 18,
                                                            color: '#87a2be',
                                                            cursor: 'pointer',
                                                            padding: 8,
                                                            borderRadius: 6,
                                                            transition: 'all 0.2s',
                                                            marginLeft: 'auto'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.color = '#3ed8ff';
                                                            e.currentTarget.style.background = 'rgba(62, 216, 255, 0.1)';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.color = '#87a2be';
                                                            e.currentTarget.style.background = 'transparent';
                                                        }}
                                                    />
                                                </Dropdown>
                                            </div>
                                        );
                                    })}
                                    <style>{`
                                        .song-card-ui:hover {
                                            background: #232953 !important;
                                            box-shadow: 0 4px 24px 0 rgba(38,210,255,0.12);
                                            transform: translateY(-2px) scale(1.012);
                                        }
                                    `}</style>
                                </div>
                            ) : (
                                <p style={{ color: "#bbb" }}>{t('artist_profile.no_songs_available')}</p>
                            )
                        )}

                        {/* Albums List */}
                        {activeTab === "albums" && (
                            albumsByArtist.length > 0 ? (
                                <div>
                                    {albumsByArtist.map((a) => {
                                        const albumId = a.albumId || a.id;
                                        const albumName = a.titleAlbum || a.albumName || a.title || "Unknown Album";
                                        const coverImageUrl = a.coverImageUrl || "/img/default-cover.png";
                                        // const releaseDate = a.releaseDateStr || a.releaseDate || "?";
                                        // const type = a.type || "Album";
                                        const isOpen = openedAlbumId === albumId;

                                        return (
                                            <div key={albumId} style={{ marginBottom: 28 }}>
                                                <div
                                                    className="album-pro-card"
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        borderRadius: 18,
                                                        background: isOpen ? "linear-gradient(90deg,#212B3D 70%,#181C2B 100%)" : "linear-gradient(90deg,#182841 60%,#151C2F 100%)",
                                                        boxShadow: isOpen ? "0 8px 40px 0 #3ed8ff25" : "0 3px 24px 0 #2227",
                                                        border: isOpen ? "2.5px solid #3ed8ff" : "2.5px solid transparent",
                                                        cursor: "pointer",
                                                        padding: "5px 15px",
                                                        gap: 24,
                                                        position: "relative",
                                                        transition: "all 0.17s cubic-bezier(.4,2.2,.5,1)"
                                                    }}
                                                    onClick={() => handleToggleAlbum(albumId)}
                                                >
                                                    <img
                                                        src={coverImageUrl}
                                                        alt={albumName}
                                                        style={{
                                                            width: 70,
                                                            height: 70,
                                                            objectFit: "cover",
                                                            borderRadius: 16,
                                                            background: "#333",
                                                            boxShadow: "0 2px 14px #2225",
                                                            flexShrink: 0
                                                        }}
                                                    />
                                                    <div style={{
                                                        flex: 1,
                                                        minWidth: 0,
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        justifyContent: "center",
                                                    }}>
                                                        <div style={{
                                                            color: "#fff",
                                                            fontWeight: 600,
                                                            fontSize: 20,
                                                            fontFamily: "'Quicksand','Montserrat',sans-serif",
                                                            lineHeight: 1.3,
                                                            marginBottom: 6,
                                                            letterSpacing: 0.2,
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap"
                                                        }}>{albumName}</div>
                                                        <div style={{
                                                            color: "#b9d1ea",
                                                            fontSize: 15,
                                                            fontWeight: 500,
                                                            letterSpacing: 0.05,
                                                            marginTop: 2
                                                        }}>
                                                            {/* {t('artist_profile.released')}: <span style={{ color: "#3ed8ff" }}>{releaseDate}</span> */}
                                                            {/* <span style={{ marginLeft: 24, color: "#b6d7f6" }}>{t('artist_profile.type')}: <span style={{ color: "#8ff" }}>{type}</span></span> */}
                                                        </div>
                                                    </div>
                                                    <div style={{
                                                        marginLeft: 24,
                                                        fontSize: 22,
                                                        color: "#3ed8ff",
                                                        fontWeight: 700,
                                                        transition: "transform 0.18s"
                                                    }}>
                                                        {isOpen ? "▲" : "▼"}
                                                    </div>
                                                </div>
                                                {/* DANH SÁCH BÀI HÁT */}
                                                {isOpen && (
                                                    <div style={{
                                                        background: "linear-gradient(90deg, #182841 70%, #151C2F 100%)",
                                                        borderRadius: "0 0 18px 18px",
                                                        marginTop: -2,
                                                        padding: "6px 0 16px 30px",
                                                        boxShadow: "0 3px 24px #2227",
                                                    }}>
                                                        {loadingAlbum === albumId ? (
                                                            <div style={{ color: "#3ed8ff", fontSize: 16, margin: 18 }}>{t('artist_profile.loading_songs')}</div>
                                                        ) : (
                                                            (albumSongs[albumId]?.length > 0 ? (
                                                                                                                                 albumSongs[albumId].map((song, idx) => {
                                                                     const songId = song.id || song.songId;
                                                                     const songName = song.title || song.songName;
                                                                     const artistName = song.artistName;
                                                                     
                                                                     const menuItems = [
                                                                         {
                                                                             key: 'download',
                                                                             icon: <DownloadOutlined />,
                                                                             label: t('weekly_top_10.download_with_location'),
                                                                             onClick: (e) => {
                                                                                 e.domEvent.stopPropagation();
                                                                                 handleDownloadSong(songId);
                                                                             },
                                                                         },
                                                                         {
                                                                             key: 'addToPlaylist',
                                                                             icon: <PlusSquareOutlined />,
                                                                             label: t('weekly_top_10.add_to_playlist'),
                                                                             onClick: (e) => {
                                                                                 e.domEvent.stopPropagation();
                                                                                 handleAddToPlaylist(songId);
                                                                             },
                                                                         },
                                                                     ];

                                                                     return (
                                                                         <div
                                                                             key={songId}
                                                                             className="song-in-album-row"
                                                                             style={{
                                                                                 display: "flex",
                                                                                 alignItems: "center",
                                                                                 gap: 16,
                                                                                 padding: "12px 20px 12px 0",
                                                                                 borderRadius: 12,
                                                                                 background: "#23253b",
                                                                                 margin: "10px 0",
                                                                                 boxShadow: "0 2px 14px #2234",
                                                                                 cursor: "pointer",
                                                                                 transition: "background 0.17s, box-shadow 0.18s"
                                                                             }}
                                                                             onClick={e => {
                                                                                 e.stopPropagation();
                                                                                 if (typeof playSong === "function") {
                                                                                     const allIds = albumSongs[albumId].map(s => s.id || s.songId);
                                                                                     playSong(songId, allIds);
                                                                                 }
                                                                             }}
                                                                             onMouseOver={e => {
                                                                                 e.currentTarget.style.background = "#263559";
                                                                                 e.currentTarget.style.boxShadow = "0 4px 24px #2ce8ff25";
                                                                             }}
                                                                             onMouseOut={e => {
                                                                                 e.currentTarget.style.background = "#23253b";
                                                                                 e.currentTarget.style.boxShadow = "0 2px 14px #2234";
                                                                             }}
                                                                         >
                                                                        <img
                                                                            src={song.profilePicUrl || "/img/default-cover.png"}
                                                                            alt={song.title || song.songName}
                                                                            style={{
                                                                                width: 48,
                                                                                height: 48,
                                                                                borderRadius: 10,
                                                                                objectFit: "cover",
                                                                                boxShadow: "0 2px 8px #1115",
                                                                                background: "#2a2e44"
                                                                            }}
                                                                        />
                                                                                                                                                 <div style={{ flex: 1, minWidth: 0 }}>
                                                                             <div style={{
                                                                                 color: "#fff",
                                                                                 fontWeight: 600,
                                                                                 fontSize: 16,
                                                                                 fontFamily: "'Quicksand','Montserrat',sans-serif",
                                                                                 overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis"
                                                                             }}>
                                                                                 {songName}
                                                                             </div>
                                                                             <div style={{ color: "#a1ebfa", fontSize: 14 }}>
                                                                                 {artistName}
                                                                             </div>
                                                                         </div>
                                                                         <Dropdown
                                                                             menu={{ items: menuItems }}
                                                                             trigger={['click']}
                                                                             placement="bottomRight"
                                                                             overlayStyle={{ zIndex: 1000 }}
                                                                         >
                                                                             <EllipsisOutlined
                                                                                 style={{
                                                                                     fontSize: 16,
                                                                                     color: '#87a2be',
                                                                                     cursor: 'pointer',
                                                                                     padding: 6,
                                                                                     borderRadius: 4,
                                                                                     transition: 'all 0.2s',
                                                                                     marginLeft: 'auto'
                                                                                 }}
                                                                                 onClick={(e) => e.stopPropagation()}
                                                                                 onMouseEnter={(e) => {
                                                                                     e.currentTarget.style.color = '#3ed8ff';
                                                                                     e.currentTarget.style.background = 'rgba(62, 216, 255, 0.1)';
                                                                                 }}
                                                                                 onMouseLeave={(e) => {
                                                                                     e.currentTarget.style.color = '#87a2be';
                                                                                     e.currentTarget.style.background = 'transparent';
                                                                                 }}
                                                                             />
                                                                                                                                                  </Dropdown>
                                                                     </div>
                                                                 );
                                                                 })
                                                            ) : (
                                                                <div style={{ color: "#bbb", margin: 16 }}>{t('artist_profile.no_songs_in_album')}</div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}

                                    <style>{`
                                        .song-in-album-row:hover, .song-in-album-row:focus {
                                            background: #263559 !important;
                                            box-shadow: 0 4px 32px #2ce8ff35 !important;
                                        }
                                    `}</style>
                                </div>
                            ) : (
                                <p style={{ color: "#bbb" }}>{t('artist_profile.no_albums_available')}</p>
                            )
                        )}
                    </>
                )}
            </div>
            <style>{`
                /* === ARTIST PROFILE RESPONSIVE HEADER === */
                .artist-profile-header {
                    display: flex;
                    flex-direction: column;
                    gap: 18px;
                    align-items: flex-start;
                    margin-bottom: 30px;
                }
                .artist-profile-header-main {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }
                .artist-profile-avatar {
                    box-shadow: 0 2px 10px 0 rgba(40,200,120,0.13);
                    background: #fff;
                }
                .artist-profile-name {
                    font-weight: 700;
                    font-size: 38px;
                    line-height: 1.12;
                    font-family: 'Quicksand','Montserrat',sans-serif;
                    color: #fff;
                    display: block;
                    word-break: break-word;
                }
                .artist-profile-bio {
                    color: #b9d1ea;
                    font-size: 17px;
                    font-family: 'Quicksand','Montserrat',sans-serif;
                    font-weight: 500;
                    margin-top: 4px;
                    margin-bottom: 4px;
                    max-width: 420px;
                    white-space: pre-line;
                }
                .artist-profile-follow-btn {
                    color: #fff;
                    border: none;
                    border-radius: 8px;
                    padding: 5px 28px;
                    margin-top: 2px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 18px;
                    box-shadow: 0 2px 10px 0 rgba(40,200,120,0.11);
                    letter-spacing: 0.5px;
                    transition: background 0.15s;
                }
                /* MOBILE */
                @media (max-width: 600px) {
                    .artist-profile-header {
                        gap: 10px;
                        margin-bottom: 24px;
                        padding: 0 6vw;
                        align-items: stretch;
                    }
                    .artist-profile-header-main {
                        flex-direction: row;
                        align-items: center;
                        gap: 10px;
                    }
                    .artist-profile-avatar {
                        width: 70px !important;
                        height: 70px !important;
                        min-width: 70px !important;
                        min-height: 70px !important;
                        max-width: 70px !important;
                        max-height: 70px !important;
                    }
                    .artist-profile-name {
                        font-size: 20px !important;
                        line-height: 1.18;
                    }
                    .artist-profile-bio {
                        font-size: 14px;
                        max-width: 100vw;
                        margin: 0 0 6px 0;
                    }
                    .artist-profile-follow-btn {
                        font-size: 14px;
                        padding: 5px 16px;
                        margin-top: 0;
                    }
                }
            `}</style>

            {/* Download Modal */}
            <DownloadModal
                open={downloadModal.open}
                onClose={() => setDownloadModal({ open: false, songId: null, downloadInfo: null })}
                songId={downloadModal.songId}
                downloadInfo={downloadModal.downloadInfo}
            />

            {/* Add to Playlist Modal */}
            <AddToPlaylistModal
                open={addToPlaylistModal.open}
                onClose={() => setAddToPlaylistModal({ open: false, songId: null })}
                songId={addToPlaylistModal.songId}
            />
        </div>
    );
}
