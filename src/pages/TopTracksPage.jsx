import TopTracksOAT from '../components/TopTracksOAT';
import TrendingTracks from '../components/TrendingTracks';
import WeeklyTop10 from '../components/WeeklyTop10';
function TopTracksPage() {
    return (
        <>
            <WeeklyTop10 />
            <TopTracksOAT />
            <TrendingTracks />
        </>
    )
}

export default TopTracksPage