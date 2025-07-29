import { useEffect } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import BannerSection from "../components/BannerSection";
import RecentlyPlayed from "../components/RecentlyPlayed";
import FeaturedArtists from "../components/FeaturedArtists";
import NewReleases from "../components/NewReleases";
import FeaturedAlbums from "../components/FeaturedAlbums";
import TopGenres from "../components/TopGenres";
import WeeklyTop10 from "../components/WeeklyTop10";
import BASE_API_URL from "../services/base.api.url";

export default function HomePage({ setShowMood, setCollapsed }) {
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const roles = JSON.parse(localStorage.getItem("roles") || "[]");
        const userId = localStorage.getItem("userId");
        const isUser = roles.some(role => role === "ROLE_USER" || role === "USER" || role === "user");
        const today = new Date().toISOString().slice(0, 10);
        const moodAsked = localStorage.getItem(`moodAskedToday_${userId}`);

        if (token && isUser && userId && moodAsked !== today) {
            axios.get(`${BASE_API_URL}/api/v1/user/MoodSong/hasTodayMood`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => {
                    if (!res.data?.data) {
                        setShowMood(true);
                        if (setCollapsed) setCollapsed(true);
                    } else {
                        localStorage.setItem(`moodAskedToday_${userId}`, today);
                    }
                })
                .catch(() => { });
        }
    }, [setShowMood, setCollapsed]);

    return (
        <>
            <BannerSection />
            <WeeklyTop10 />
            <RecentlyPlayed />
            <FeaturedArtists />
            <NewReleases />
            <FeaturedAlbums />
            <TopGenres />

        </>
    );
}

HomePage.propTypes = {
    setShowMood: PropTypes.func,
    setCollapsed: PropTypes.func,
};