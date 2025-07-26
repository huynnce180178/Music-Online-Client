import DownloadNow from "../components/DownloadNow"
import FreeDownloads from "../components/FreeDownloads"
import RecentlyPlayed from "../components/RecentlyPlayed"

export default function DownloadPage(props) {
    return (
        <>
            <FreeDownloads />
            <DownloadNow />
            <RecentlyPlayed />

        </>
    )
}