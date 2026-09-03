import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useModal } from "../context/ModalContext";
import { useTranslation } from "react-i18next";
import LanguageGridContent from "../ui/LanguageGridContent";
import AlertInbox from "./User/AlertInbox";
import LogoLight from "../assets/seedingL.png";
import Logo from "../assets/seeding.png";
import {
  LogOut,
  LogIn,
  User,
  Globe,
  Maximize,
  Palette,
  Settings,
  History,
  Map,
} from "lucide-react";

const MobileHeader = () => {
  const { isAuthenticated, userData, auth, logout, loading } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { openModal } = useModal();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);

  // Close alert drawer automatically on route change
  useEffect(() => {
    setAlertOpen(false);
  }, [location]);

  // Fullscreen Logic
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      if (document.exitFullscreen)
        document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Theme Cycling Logic
  const cycleTheme = () => {
    const themes = ["light", "dark", "forest", "coffee", "sunset"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  // Language Modal Trigger
  const handleOpenLanguage = () => {
    openModal(
      <React.Suspense fallback={<span className="loading loading-spinner" />}>
        <LanguageGridContent />
      </React.Suspense>,
      { className: "max-w-4xl" },
    );
  };

  const handleLogout = () => {
    if (logout) logout();
    navigate("/");
  };

  const avatarUrl = userData?.photo_url || auth?.currentUser?.photoURL;
  const initial =
    userData?.first_name?.[0] || auth?.currentUser?.displayName?.[0] || "U";

  return (
    <>
      {/* Updated Header Wrapper */}
      <header className="md:hidden w-full min-h-[4rem] pt-safe pb-2 bg-transparent backdrop-blur-md flex items-center justify-between px-4 relative z-50">
        {/* Dynamic Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 active:scale-95 transition-transform"
        >
          <img
            src={isDark ? LogoLight : Logo}
            alt="FarmAssist"
            className="w-8 h-8 object-contain drop-shadow-sm"
          />
          <span className="font-bold text-lg tracking-tight text-base-content">
            {t("navbar.logo_text", "FarmAssist")}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Notification Bell (Only visible to logged-in users) */}
          {userData && (
            <button
              onClick={() => setAlertOpen(true)}
              className="btn btn-ghost btn-circle btn-sm relative"
              title={t("navbar.pest_alerts")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-base-content/80"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full animate-ping"></span>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full shadow-sm"></span>
            </button>
          )}

          {/* Profile & Settings Dropdown */}
          <div className="dropdown dropdown-end">
            <label
              tabIndex={0}
              className="btn btn-sm btn-circle bg-base-200 border border-base-content/10 shadow-sm overflow-hidden"
            >
              {loading ? (
                <span className="loading loading-spinner w-4 h-4"></span>
              ) : isAuthenticated ? (
                avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="User"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-bold text-base-content uppercase">
                    {initial}
                  </span>
                )
              ) : (
                <Settings size={16} className="text-base-content/70" />
              )}
            </label>

            <ul
              tabIndex={0}
              className="dropdown-content menu p-2 shadow-2xl bg-base-100 rounded-2xl w-60 mt-4 border border-base-content/10 z-50"
            >
              {/* User Identity Display */}
              {isAuthenticated && (
                <div className="px-3 py-2 mb-2 border-b border-base-content/10">
                  <p className="font-bold text-sm truncate">
                    {userData?.first_name && userData?.last_name
                      ? `${userData.first_name} ${userData.last_name}`
                      : auth?.currentUser?.displayName || "Farmer"}
                  </p>
                  <p className="text-xs text-base-content/60 truncate">
                    {userData?.email}
                  </p>
                </div>
              )}

              {/* Utility Tools */}
              <li>
                <button
                  onClick={cycleTheme}
                  className="font-medium text-sm py-2"
                >
                  <Palette size={16} className="mr-2" />{" "}
                  {t("navbar.theme", "Theme")}:{" "}
                  <span className="capitalize ml-auto text-xs opacity-70">
                    {theme}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={handleOpenLanguage}
                  className="font-medium text-sm py-2"
                >
                  <Globe size={16} className="mr-2" />{" "}
                  {t("navbar.language", "Language")}:{" "}
                  <span className="uppercase ml-auto text-xs opacity-70">
                    {i18n?.language}
                  </span>
                </button>
              </li>
              <li>
                <button
                  onClick={toggleFullScreen}
                  className="font-medium text-sm py-2"
                >
                  <Maximize size={16} className="mr-2" />{" "}
                  {isFullscreen
                    ? t("navbar.exit_fullscreen", "Exit Fullscreen")
                    : t("navbar.enter_fullscreen", "Fullscreen")}
                </button>
              </li>

              <div className="divider my-1 h-px"></div>

              {/* Account Links */}
              {isAuthenticated ? (
                <>
                  <li>
                    <Link to="/my-farms" className="font-medium text-sm py-2">
                      <Map size={16} className="mr-2" />{" "}
                      {t("navbar.my_farms", "My Farms")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/history" className="font-medium text-sm py-2">
                      <History size={16} className="mr-2" />{" "}
                      {t("navbar.saved_recommendations", "History")}
                    </Link>
                  </li>
                  <li>
                    <Link to="/me" className="font-medium text-sm py-2">
                      <User size={16} className="mr-2" />{" "}
                      {t("navbar.edit_profile", "Edit Profile")}
                    </Link>
                  </li>
                  <li>
                    <button
                      onClick={handleLogout}
                      className="font-medium text-sm text-error py-2 hover:bg-error/10"
                    >
                      <LogOut size={16} className="mr-2" />{" "}
                      {t("Common.logout", "Logout")}
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    to="/login"
                    className="font-bold text-sm text-primary py-2 bg-primary/5 hover:bg-primary/10 rounded-xl"
                  >
                    <LogIn size={16} className="mr-2" />{" "}
                    {t("Common.login", "Login / Sign Up")}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </header>

      {/* ================= NOTIFICATION / ALERT DRAWER ================= */}
      <div
        className={`md:hidden fixed inset-0 z-[100] transition-all duration-300 ${isAlertOpen ? "visible" : "invisible"}`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${isAlertOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setAlertOpen(false)}
        />

        {/* Drawer Content */}
        <div
          className={`absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-base-100 shadow-2xl transform transition-transform duration-300 flex flex-col border-l border-base-200 ${isAlertOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <button
            onClick={() => setAlertOpen(false)}
            className="absolute top-3 right-4 z-50 btn btn-sm btn-circle btn-ghost text-error hover:bg-error/20"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <AlertInbox />
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
