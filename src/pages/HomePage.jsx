import { useEffect, useState } from "react";
import MoodModal from "../components/MoodModal";
import BannerSection from "../components/BannerSection";
import RecentlyPlayed from "../components/RecentlyPlayed";
import FeaturedArtists from "../components/FeaturedArtists";
import NewReleases from "../components/NewReleases";
import FeaturedAlbums from "../components/FeaturedAlbums";
import TopGenres from "../components/TopGenres";
import WeeklyTop10 from "../components/WeeklyTop10";

export default function HomePage() {
    const [showMood, setShowMood] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        const roles = JSON.parse(localStorage.getItem("roles") || "[]");
        const userId = localStorage.getItem("userId");
        const isUser = roles.some(role => role === "ROLE_USER" || role === "USER" || role === "user");
        const today = new Date().toISOString().slice(0, 10);
        // Lưu theo từng user
        const moodAsked = localStorage.getItem(`moodAskedToday_${userId}`);
        if (token && isUser && moodAsked !== today) {
            setShowMood(true);
        }
    }, []);

    const handleMoodSelected = () => {
        setShowMood(false);
        const userId = localStorage.getItem("userId");
        localStorage.setItem(`moodAskedToday_${userId}`, new Date().toISOString().slice(0, 10));
    };

    return (
        <>
            <MoodModal
                open={showMood}
                onClose={() => setShowMood(false)}
                onMoodSelected={handleMoodSelected}
            />
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