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

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Login from "../components/Login";
import Register from "../components/Register";

import HomePage from "../pages/HomePage";
import AlbumsPage from "../pages/AlbumsPage";
import ArtistsPage from "../pages/ArtistsPage";
import GenresPage from "../pages/GenresPage";
import TopTracksPage from "../pages/TopTracksPage";
import DownloadPage from "../pages/DownloadPage";
import GenresList from "../components/GenresList";
import HistoryPage from "../pages/HistoryPage";
import FavoritePage from "../pages/FavoritePage";
import SongPlay from "../components/SongPlay";
import ActivateAccount from "../components/ActiveAccount";
import ResetPassword from "../components/ResetPassword";
import ProfilePage from "../pages/ProfilePage";
import PlaylistPage from "../pages/PlaylistPage";
import PlaylistSongsPage from "../pages/PlaylistSongsPage";

import AdminLayout from "./AdminLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUsers from "../pages/admin/AdminUsers";
import AdminSongs from "../pages/admin/AdminSongManagement.jsx/AdminSongs";
import AdminGenres from "../pages/admin/AdminGenres";
import AdminComments from "../pages/admin/AdminCommentManagement.jsx/AdminComments";
import AdminPendingComments from "../pages/admin/AdminCommentManagement.jsx/AdminPendingComments";
import AdminRejectedComments from "../pages/admin/AdminCommentManagement.jsx/AdminRejectedComments";
import AdminUpgrades from "../pages/admin/AdminUpgrades";
import AdminBanners from "../pages/admin/AdminBanners";
import AdminPendingSongs from "../pages/admin/AdminSongManagement.jsx/AdminPendingSongs";
import AdminSongsDeletedByArtist from "../pages/admin/AdminSongManagement.jsx/AdminSongsDeletedByArtist";
import AdminSongsDeletedByAdmin from "../pages/admin/AdminSongManagement.jsx/AdminSongsDeletedByAdmin";

import ArtistLayout from "./ArtistLayout";
import ArtistDashboard from "../pages/artist/ArtistDashboard";
import AlbumDetail from "../components/AlbumDetail";
import PaymentPage from "../components/PaymentPage";
import PaymentLayout from "./PaymentLayout";
import ArtistProfile from "../components/ArtistProfile";
import SearchResult from "../components/SearchResult";
import AdminAdvertisement from "../pages/admin/AdminAdvertisementManagement.jsx/AdminAdvertisement";
import AdminPendingAdvertisements from "../pages/admin/AdminAdvertisementManagement.jsx/AdminPendingAdvertisements";
import ArtistRejectedAdvertisements from "../pages/artist/ArtistAdvertisementManagement/ArtistRejectedAdvertisements";
import ArtistAdvertisement from "../pages/artist/ArtistAdvertisementManagement/ArtistAdvertisement";
import PaymentSuccess from "./PaymentSuccess";
import PaymentFail from "./PaymentFailed";

import AdminAlbums from "../pages/admin/AdminAlbumManagement.jsx/AdminAlbums";
import AdminPendingAlbums from "../pages/admin/AdminAlbumManagement.jsx/AdminPendingAlbums";
import AdminAlbumsDeletedByAdmin from "../pages/admin/AdminAlbumManagement.jsx/AdminAlbumsDeletedByAdmin";
import AdminAlbumsRejected from "../pages/admin/AdminAlbumManagement.jsx/AdminAlbumsRejected";

// Artist song management imports
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
}) {
  // (Nếu cần key cho Outlet thì dùng dòng dưới)
  // const location = useLocation();

  return (
    <>
      {!modalType && (
        <Sidebar
          collapsed={isMobile ? false : collapsed}
          setCollapsed={isMobile ? () => { } : setCollapsed}
          visible={sidebarVisible}
          setVisible={setSidebarVisible}
          isMobile={isMobile}
        />
      )}
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
      <div
        style={{
          minHeight: "100vh",
          marginLeft: !modalType && !isMobile ? sidebarWidth : 0,
          transition: "margin-left 0.3s cubic-bezier(.4,0,.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          setModalType={setModalType}
          onMenuClick={() => setSidebarVisible(true)}
          isMobile={isMobile}
          onSearch={onSearch}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* <Outlet key={location.pathname} /> // Nếu muốn, nhưng KHÔNG bắt buộc */}
          <Outlet />
        </div>
        <Footer />
      </div>
    </>
  );
}

function AppRoutes(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAdmin = location.pathname.startsWith("/admin");

  const handleSearch = (query) => {
    if (!query.trim()) return;
    navigate(`/search?keyword=${encodeURIComponent(query)}`);
  };

  return (
    <>
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

      <Routes>
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
          <Route path="advertisements" element={<AdminAdvertisement />} />
          <Route path="advertisements/pending" element={<AdminPendingAdvertisements />} />
        </Route>

        <Route path="/artist" element={<ArtistLayout />}>
          <Route index element={<ArtistDashboard />} />
          <Route path="albums" element={<ArtistAllAlbums />} />
          <Route path="albums/pending" element={<ArtistPendingAlbums />} />
          <Route path="albums/rejected" element={<ArtistRejectedAlbums />} />
          <Route path="albums/deleted" element={<ArtistDeletedAlbums />} />
          <Route path="albums/deleted-by-admin" element={<ArtistDeletedByAdminAlbums />} />
          <Route path="songs" element={<ArtistAllSongs />} />
          <Route path="songs/pending" element={<ArtistPendingSongs />} />
          <Route path="songs/rejected" element={<ArtistRejectedSongs />} />
          <Route path="songs/deleted" element={<ArtistDeletedSongs />} />
          <Route path="songs/deleted-by-admin" element={<ArtistDeletedByAdminSongs />} />
          <Route path="advertisements/approved" element={<ArtistAdvertisement />} />
          <Route path="advertisements/rejected" element={<ArtistRejectedAdvertisements />} />
        </Route>

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

        <Route
          path="/"
          element={
            <MainLayout
              {...props}
              onSearch={handleSearch}
              key={location.pathname}
            />
          }
        >
          <Route index element={<HomePage />} />
          <Route path="albums" element={<AlbumsPage />} />
          <Route path="artists" element={<ArtistsPage />} />
          <Route path="artist/:artistId" element={<ArtistProfile />} />
          <Route path="genres" element={<GenresPage />} />
          <Route path="genres/:genreId/songs" element={<GenresList />} />
          <Route path="genres-viewmore" element={<GenresList />} />
          <Route path="top-tracks" element={<TopTracksPage />} />
          <Route path="downloads" element={<DownloadPage />} />
          <Route path="favourites" element={<FavoritePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="album/:albumId" element={<AlbumDetail />} />
          <Route path="playlists" element={<PlaylistPage />} />
          <Route path="playlist/:id/songs" element={<PlaylistSongsPage />} />
          <Route path="search" element={<SearchResult />} />
        </Route>

        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/auth/forgot-password" element={<ResetPassword />} />
        <Route path="/auth/activate" element={<ActivateAccount />} />
      </Routes>

      {!isAdmin && <SongPlay sidebarWidth={props.sidebarWidth} />}
    </>
  );
}

export default function Index({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 576);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 576);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const sidebarWidth = !modalType && !isMobile ? (collapsed ? 80 : 200) : 0;

  return (
    <PlayerProvider>
      <Router>
        <AppRoutes
          modalType={modalType}
          setModalType={setModalType}
          isMobile={isMobile}
          sidebarWidth={sidebarWidth}
          setSidebarVisible={setSidebarVisible}
          sidebarVisible={sidebarVisible}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
        >
          {children}
        </AppRoutes>
      </Router>
    </PlayerProvider>
  );
}

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
};

Index.propTypes = {
  children: PropTypes.node,
};
