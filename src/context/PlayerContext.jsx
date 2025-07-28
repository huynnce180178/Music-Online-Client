import { createContext, useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { message } from "antd";
import { toast } from "react-toastify";
import BASE_API_URL from "../services/base.api.url";

export const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
    const [currentSongId, setCurrentSongId] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playlist, setPlaylist] = useState([]);
    const [liked, setLiked] = useState(false);
    const [volume, setVolume] = useState(1);
    const [adPlaying, setAdPlaying] = useState(false);
    const [adAudio, setAdAudio] = useState(null);
    const [songCount, setSongCount] = useState(0);
    const [playType, setPlayType] = useState("song");
    const [contextId, setContextId] = useState(null);
    const audioRef = useRef(null);

    // Đồng bộ volume
    const handleVolume = (newVolume) => {
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    // Kiểm tra liked cho 1 bài hát bất kỳ
    const checkLiked = useCallback(async (songId) => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!songId || !token) return setLiked(false);
            const res = await axios.get(`${BASE_API_URL}/api/v1/user/wishlist`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 100 }
            });
            const list = res.data?.data?.content || [];
            setLiked(list.some(item => item.songId === songId));
        } catch {
            setLiked(false);
        }
    }, []);

    // Tự check liked khi đổi currentSongId
    useEffect(() => {
        if (!currentSongId) {
            setLiked(false);
            return;
        }
        checkLiked(currentSongId);
    }, [currentSongId, checkLiked]);

    // Hàm toggleWishlist: truyền vào songId
    const toggleWishlist = async () => {
        if (!currentSongId) return;
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        try {
            if (liked) {
                await axios.delete(`${BASE_API_URL}/api/v1/user/wishlist/remove/${currentSongId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLiked(false);
            } else {
                await axios.post(`${BASE_API_URL}/api/v1/user/wishlist/add`, { songId: currentSongId }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLiked(true);
            }
        } catch {
            toast.error("Unable to update favorites", { autoClose: 2000 });
        }
    };

    // Các hàm play, pause, next, prev...
    const playSong = (songId, playlistData = []) => {
        if (adPlaying) {
            toast.info("Please finish the ad before selecting another song!", { autoClose: 2000 });
            return;
        }
        setCurrentSongId(songId);
        setIsPlaying(true);
        if (playlistData.length > 0) setPlaylist(playlistData);
    };

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(err => {
                message.warning("Cannot play: " + err.message);
            });
        }
        setIsPlaying(!isPlaying);
    };

    const nextSong = () => {
        const index = playlist.indexOf(currentSongId);
        if (index >= 0 && index < playlist.length - 1) {
            setCurrentSongId(playlist[index + 1]);
            setIsPlaying(true);
        }
    };

    const prevSong = () => {
        const index = playlist.indexOf(currentSongId);
        if (index > 0) {
            setCurrentSongId(playlist[index - 1]);
            setIsPlaying(true);
        }
    };

    const handleDownload = async () => {
        if (!currentSongId) return;
        const token = localStorage.getItem("accessToken");
        const roles = JSON.parse(localStorage.getItem("roles")) || [];
        const canDownload = roles.includes("ROLE_PREMIUM") || roles.includes("ROLE_ARTIST");
        if (!canDownload) {
            message.warning("Upgrade to premium to download");
            return;
        }
        try {
            await axios.post(`${BASE_API_URL}/api/v1/user/downloads/${currentSongId}`, { songId: currentSongId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            message.success("Download successful");
        } catch {
            message.error("Download failed");
        }
    };

    const stopPlayer = () => {
        setIsPlaying(false);
        setCurrentSongId(null);
        if (audioRef.current) audioRef.current.pause();
    };

    const handleSelectSong = (songId, playlistData) => {
        if (adPlaying) {
            toast.info("Please finish the ad before selecting another song!", { autoClose: 2000 });
            return;
        }
        playSong(songId, playlistData);
    };

    const resetSongCount = () => setSongCount(0);

    // Fetch ad audio
    const fetchAdAudio = useCallback(async () => {
        try {
            const res = await axios.get(`${BASE_API_URL}/api/v1/guest/audio/play`);
            if (res.data?.data?.mediaUrl) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.src = "";
                }
                setIsPlaying(false);
                setAdAudio(res.data.data);
                setAdPlaying(true);
            }
        } catch { }
    }, []);

    // When ad ends
    const handleAdEnded = useCallback((songFileUrl, resumeTime = 0) => {
        setAdPlaying(false);
        setAdAudio(null);
        setSongCount(0); // Reset songCount về 0 sau khi nghe hết quảng cáo
        if (audioRef.current && songFileUrl) {
            audioRef.current.src = songFileUrl;
            audioRef.current.currentTime = resumeTime;
            audioRef.current.play().catch(() => { });
            setIsPlaying(true);
        }
    }, []);

    return (
        <PlayerContext.Provider
            value={{
                currentSongId,
                setCurrentSongId,
                isPlaying,
                setIsPlaying,
                playSong,
                handlePlayPause,
                nextSong,
                prevSong,
                playlist,
                setPlaylist,
                liked,
                toggleWishlist,
                checkLiked,
                handleDownload,
                volume,
                setVolume,
                handleVolume,
                audioRef,
                stopPlayer,
                handleSelectSong,
                adPlaying,
                setAdPlaying,
                adAudio,
                setAdAudio,
                songCount,
                setSongCount,
                fetchAdAudio,
                handleAdEnded,
                playType,
                setPlayType,
                contextId,
                setContextId,
                resetSongCount,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};

PlayerProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
