import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Outlet,
  useNavigate,
} from "react-router-dom";
import { Modal } from "antd";
import { PlayerProvider } from "../context/PlayerContext";
import PropTypes from "prop-types";
import { useTokenExpirationCheck } from "../utils";

// Components
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Login from "../components/Login";
import Register from "../components/Register";
import SongPlay from "../components/SongPlay";
import AlbumDetail from "../components/AlbumDetail";
import PaymentPage from "../components/PaymentPage";
import ArtistProfile from "../components/ArtistProfile";
import SearchResult from "../components/SearchResult";
import GenresList from "../components/GenresList";
import ActivateAccount from "../components/ActiveAccount";
import ResetPassword from "../components/ResetPassword";
import OAuthCallback from "../components/OAuthCallback";
import OAuthTest from "../components/OAuthTest";
import WebSocketDebug from "../components/WebSocketDebug";
import MoodModal from "../components/MoodModal";
import TokenExpirationModal from "../components/TokenExpirationModal";

// Pages
import HomePage from "../pages/HomePage";
import AlbumsPage from "../pages/AlbumsPage";
import ArtistsPage from "../pages/ArtistsPage";
import GenresPage from "../pages/GenresPage";
import TopTracksPage from "../pages/TopTracksPage";
import DownloadPage from "../pages/DownloadPage";
import HistoryPage from "../pages/HistoryPage";
import FavoritePage from "../pages/FavoritePage";
import ProfilePage from "../pages/ProfilePage";
import PlaylistPage from "../pages/PlaylistPage";
import PlaylistSongsPage from "../pages/PlaylistSongsPage";

// Admin Layout & Pages
import AdminLayout from "./AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminSongs from "../pages/admin/AdminSongManagement.jsx/AdminSongs";
import AdminPendingSongs from "../pages/admin/AdminSongManagement.jsx/AdminPendingSongs";
import AdminSongsDeletedByArtist from "../pages/admin/AdminSongManagement.jsx/AdminSongsDeletedByArtist";
import AdminSongsDeletedByAdmin from "../pages/admin/AdminSongManagement.jsx/AdminSongsDeletedByAdmin";
import AdminAlbums from "../pages/admin/AdminAlbumManagement.jsx/AdminAlbums";
import AdminPendingAlbums from "../pages/admin/AdminAlbumManagement.jsx/AdminPendingAlbums";
import AdminAlbumsDeletedByAdmin from "../pages/admin/AdminAlbumManagement.jsx/AdminAlbumsDeletedByAdmin";
import AdminAlbumsRejected from "../pages/admin/AdminAlbumManagement.jsx/AdminAlbumsRejected";
import AdminGenres from "../pages/admin/AdminGenres";
import AdminComments from "../pages/admin/AdminCommentManagement.jsx/AdminComments";
import AdminPendingComments from "../pages/admin/AdminCommentManagement.jsx/AdminPendingComments";
import AdminRejectedComments from "../pages/admin/AdminCommentManagement.jsx/AdminRejectedComments";
import AdminUpgrades from "../pages/admin/AdminUpgrades";
import AdminBanners from "../pages/admin/AdminBanners";
import AdminAdvertisement from "../pages/admin/AdminAdvertisementManagement.jsx/AdminAdvertisement";
import AdminPendingAdvertisements from "../pages/admin/AdminAdvertisementManagement.jsx/AdminPendingAdvertisements";

// Artist Layout & Pages
import ArtistLayout from "./ArtistLayout";
import ArtistAllSongs from '../pages/artist/ArtistSongManagement/ArtistAllSongs';
import ArtistPendingSongs from '../pages/artist/ArtistSongManagement/ArtistPendingSongs';
import ArtistRejectedSongs from '../pages/artist/ArtistSongManagement/ArtistRejectedSongs';
import ArtistDeletedSongs from '../pages/artist/ArtistSongManagement/ArtistDeletedSongs';
import ArtistDeletedByAdminSongs from '../pages/artist/ArtistSongManagement/ArtistDeletedByAdminSongs';
import ArtistAllAlbums from '../pages/artist/ArtistAlbumManagement/ArtistAllAlbums';
import ArtistRejectedAlbums from '../pages/artist/ArtistAlbumManagement/ArtistRejectedAlbums';
import ArtistPendingAlbums from '../pages/artist/ArtistAlbumManagement/ArtistPendingAlbums';
import ArtistDeletedAlbums from '../pages/artist/ArtistAlbumManagement/ArtistDeletedAlbums';
import ArtistDeletedByAdminAlbums from '../pages/artist/ArtistAlbumManagement/ArtistDeletedByAdminAlbums';
import ArtistRejectedAdvertisements from "../pages/artist/ArtistAdvertisementManagement/ArtistRejectedAdvertisements";
import ArtistAdvertisement from "../pages/artist/ArtistAdvertisementManagement/ArtistAdvertisement";

// Payment
import PaymentLayout from "./PaymentLayout";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFail from "./PaymentFailed";

// Main layout for normal user pages
function MainLayout({
  modalType,
  isMobile,
  sidebarWidth,
  setModalType,
  setSidebarVisible,
  sidebarVisible,
  collapsed,
  setCollapsed,
  onSearch,
  showMood, // nhận prop này
}) {
  useTokenExpirationCheck();
  
  return (
    <>
      {/* Sidebar */}
      {!modalType && !showMood && ( // ẩn hoàn toàn khi showMood=true
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          setCollapsed={isMobile ? () => { } : setCollapsed}
          visible={sidebarVisible}
          setVisible={setSidebarVisible}
          isMobile={isMobile}
        />
      )}
      {/* Overlay for mobile sidebar */}
      {isMobile && sidebarVisible && (
        <div
          onClick={() => setSidebarVisible(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 1000,
          }}
        />
      )}
      {/* Main content */}
      <div
        style={{
          minHeight: "100vh",
          marginLeft: (!modalType && !isMobile && !showMood) ? sidebarWidth : 0, // Sửa dòng này
          transition: "margin-left 0.3s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Header
          setModalType={setModalType}
          onMenuClick={() => setSidebarVisible(true)}
          isMobile={isMobile}
          onSearch={onSearch}
        />
        {/* Page content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Outlet />
        </div>
        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

// Routing structure
function AppRoutes(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");

  // Search handler
  const handleSearch = (query) => {
    if (!query.trim()) return;
    navigate(`/search?keyword=${encodeURIComponent(query)}`);
  };

  return (
    <>
      {/* Auth Modal */}
      <Modal
        open={!!props.modalType}
        onCancel={() => props.setModalType(null)}
        footer={null}
        width={600}
        centered
        closeIcon={null}
        styles={{
          body: {
            background: "linear-gradient(135deg, #3ed8ff 60%, #38bdf8 100%)",
            borderRadius: 24,
            padding: 0,
          },
        }}
      >
        {props.modalType === "login" ? (
          <Login
            onClose={() => props.setModalType(null)}
            onSwitchToRegister={() => props.setModalType("register")}
          />
        ) : props.modalType === "register" ? (
          <Register
            onClose={() => props.setModalType(null)}
            onSwitchToLogin={() => props.setModalType("login")}
          />
        ) : null}
      </Modal>

      {/* App Routes */}
      <Routes>
        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="songs" element={<AdminSongs />} />
          <Route path="songs/pending" element={<AdminPendingSongs />} />
          <Route path="songs/deleted-by-artist" element={<AdminSongsDeletedByArtist />} />
          <Route path="songs/deleted-by-admin" element={<AdminSongsDeletedByAdmin />} />
          <Route path="albums" element={<AdminAlbums />} />
          <Route path="albums/pending" element={<AdminPendingAlbums />} />
          <Route path="albums/deleted-by-admin" element={<AdminAlbumsDeletedByAdmin />} />
          <Route path="albums/rejected" element={<AdminAlbumsRejected />} />
          <Route path="genres" element={<AdminGenres />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="comments/pending" element={<AdminPendingComments />} />
          <Route path="comments/rejected" element={<AdminRejectedComments />} />
          <Route path="upgrades" element={<AdminUpgrades />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="Advertisements" element={<AdminAdvertisement />} />
          <Route path="advertisements/pending" element={<AdminPendingAdvertisements />} />
        </Route>

        {/* Artist routes */}
        <Route path="/artist" element={<ArtistLayout />}>
          <Route path="albums" element={<ArtistAllAlbums />} />
          <Route path="albums/pending" element={<ArtistPendingAlbums />} />
          <Route path="albums/rejected" element={<ArtistRejectedAlbums />} />
          <Route path="albums/deleted" element={<ArtistDeletedAlbums />} />
          <Route path="albums/deleted-by-admin" element={<ArtistDeletedByAdminAlbums />} />
          <Route index element={<ArtistAllSongs />} />
          <Route path="songs" element={<ArtistAllSongs />} />
          <Route path="songs/pending" element={<ArtistPendingSongs />} />
          <Route path="songs/rejected" element={<ArtistRejectedSongs />} />
          <Route path="songs/deleted" element={<ArtistDeletedSongs />} />
          <Route path="songs/deleted-by-admin" element={<ArtistDeletedByAdminSongs />} />
          <Route path="advertisements/approved" element={<ArtistAdvertisement />} />
          <Route path="/artist/rejected" element={<ArtistRejectedAdvertisements />} />
        </Route>

        {/* Payment routes */}
        <Route
          path="/payment/:planId"
          element={
            <PaymentLayout>
              <PaymentPage />
            </PaymentLayout>
          }
        />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/fail" element={<PaymentFail />} />

        {/* OAuth Callback */}
        <Route path="/oauth/callback" element={<OAuthCallback />} />
        <Route path="/oauth/test" element={<OAuthTest />} />
        <Route path="/oauth/debug" element={<WebSocketDebug />} />

        {/* Main user routes */}
        <Route
          path="/"
          element={
            <MainLayout
              {...props}
              onSearch={handleSearch}
              key={location.pathname}
              showMood={props.showMood} // truyền prop này
            />
          }
        >
          <Route index element={<HomePage setShowMood={props.setShowMood} setCollapsed={props.setCollapsed} />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artist/:artistId" element={<ArtistProfile />} />
          <Route path="genres" element={<GenresPage />} />
          <Route path="top-tracks" element={<TopTracksPage />} />
          <Route path="downloads" element={<DownloadPage />} />
          <Route path="genres-viewmore" element={<GenresList />} />
          <Route path="favourites" element={<FavoritePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="album/:albumId" element={<AlbumDetail />} />
          <Route path="playlists" element={<PlaylistPage />} />
          <Route path="playlist/:id/songs" element={<PlaylistSongsPage />} />
          <Route path="search" element={<SearchResult />} />
        </Route>

        {/* Profile & Auth routes */}
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/forgot-password" element={<ResetPassword />} />
        <Route path="/auth/activate" element={<ActivateAccount />} />
      </Routes>

      {/* Song player (not for admin) */}
      {!isAdmin && <SongPlay sidebarWidth={props.sidebarWidth} />}
    </>
  );
}

// App entry point
export default function Index({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [showMood, setShowMood] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = !modalType && !isMobile ? (collapsed ? 80 : 200) : 0;

  return (
    <PlayerProvider>
      <Router>
        <MoodModal
          open={showMood}
          onClose={() => setShowMood(false)}
          onMoodSelected={() => setShowMood(false)}
        />
        <TokenExpirationModal />
        <AppRoutes
          modalType={modalType}
          setModalType={setModalType}
          isMobile={isMobile}
          sidebarWidth={sidebarWidth}
          setSidebarVisible={setSidebarVisible}
          sidebarVisible={sidebarVisible}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          showMood={showMood}
          setShowMood={setShowMood}
        >
          {children}
        </AppRoutes>
      </Router>
    </PlayerProvider>
  );
}

// PropTypes validation
MainLayout.propTypes = {
  children: PropTypes.node,
  modalType: PropTypes.string,
  isMobile: PropTypes.bool,
  sidebarWidth: PropTypes.number,
  setModalType: PropTypes.func,
  setSidebarVisible: PropTypes.func,
  sidebarVisible: PropTypes.bool,
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
  onSearch: PropTypes.func,
  showMood: PropTypes.bool, // thêm dòng này để validate prop showMood
};

AppRoutes.propTypes = {
  modalType: PropTypes.string,
  setModalType: PropTypes.func,
  isMobile: PropTypes.bool,
  sidebarWidth: PropTypes.number,
  setSidebarVisible: PropTypes.func,
  sidebarVisible: PropTypes.bool,
  collapsed: PropTypes.bool,
  setCollapsed: PropTypes.func,
  onSearch: PropTypes.func,
  children: PropTypes.node,
  showMood: PropTypes.bool,
  setShowMood: PropTypes.func,
};

Index.propTypes = {
  children: PropTypes.node,
};
