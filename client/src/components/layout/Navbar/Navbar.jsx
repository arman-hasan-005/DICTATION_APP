import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import { useTheme } from "../../../context/ThemeContext";
import { ROUTES } from "../../../constants/routes";
import styles from "./Navbar.module.css";

const NAV_LINKS = [
  { to: ROUTES.DASHBOARD,   label: "Dashboard",   icon: "🏠" },
  { to: ROUTES.SETUP,       label: "Practice",    icon: "🎧" },
  { to: ROUTES.SESSIONS,    label: "History",     icon: "📊" },
  { to: ROUTES.LEADERBOARD, label: "Leaderboard", icon: "🏆" },
  { to: ROUTES.PROFILE,     label: "Profile",     icon: "👤" },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hamburgerOpen, setHamburgerOpen] = useState(false);

  const hamburgerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setHamburgerOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Close menus when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.inner}>
          {/* Logo */}
          <Link to={ROUTES.DASHBOARD} className={styles.logo}>
            <span>🎙️</span>
            <span className={styles.logoText}>DictaClass</span>
          </Link>

          {/* Desktop nav links */}
          {isAuthenticated && (
            <div className={styles.links}>
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    [styles.link, isActive ? styles.linkActive : ""]
                      .filter(Boolean)
                      .join(" ")
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          )}

          <div className={styles.right}>
            {/* Theme toggle */}
            <button
              className={styles.iconBtn}
              onClick={toggleTheme}
              title={isDark ? "Light mode" : "Dark mode"}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            {isAuthenticated && user ? (
              <>
                {/* XP chip — hidden on mobile */}
                <div className={styles.xpChip}>
                  <span>⚡</span>
                  <span className={styles.xpValue}>{user.xp ?? 0} XP</span>
                </div>

                {/* Avatar dropdown — desktop only */}
                <div className={styles.avatarWrap} ref={dropdownRef}>
                  <button
                    className={styles.avatar}
                    onClick={() => setDropdownOpen((o) => !o)}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </button>
                  {dropdownOpen && (
                    <div className={styles.dropdown}>
                      <div className={styles.dropdownHeader}>
                        <p className={styles.dropdownName}>{user.name}</p>
                        <p className={styles.dropdownEmail}>{user.email}</p>
                      </div>
                      <Link
                        to={ROUTES.PROFILE}
                        className={styles.dropdownItem}
                        onClick={() => setDropdownOpen(false)}
                      >
                        👤 Profile
                      </Link>

                      <Link
                        to={ROUTES.SETUP}
                        className={styles.dropdownItem}
                        onClick={() => setDropdownOpen(false)}
                      >
                        🎓 Classroom Settings
                      </Link>
                      <button
                        className={styles.dropdownItem}
                        onClick={handleLogout}
                      >
                        🚪 Log out
                      </button>
                    </div>
                  )}
                </div>

                {/* Hamburger button — mobile only */}
                <div className={styles.hamburgerWrap} ref={hamburgerRef}>
                  <button
                    className={[
                      styles.hamburger,
                      hamburgerOpen ? styles.hamburgerOpen : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setHamburgerOpen((o) => !o)}
                    aria-label="Open menu"
                    type="button"
                  >
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                    <span className={styles.bar} />
                  </button>
                </div>
              </>
            ) : (
              <div className={styles.authBtns}>
                <Link to={ROUTES.LOGIN} className={styles.loginBtn}>
                  Log in
                </Link>
                <Link to={ROUTES.REGISTER} className={styles.registerBtn}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {isAuthenticated && user && hamburgerOpen && (
        <>
          {/* Backdrop */}
          <div
            className={styles.backdrop}
            onClick={() => setHamburgerOpen(false)}
          />

          {/* Drawer */}
          <div className={styles.drawer}>
            {/* User info */}
            <div className={styles.drawerHeader}>
              <div className={styles.drawerAvatar}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className={styles.drawerName}>{user.name}</p>
                <p className={styles.drawerEmail}>{user.email}</p>
              </div>
            </div>

            {/* Nav links */}
            <nav className={styles.drawerNav}>
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    [styles.drawerLink, isActive ? styles.drawerLinkActive : ""]
                      .filter(Boolean)
                      .join(" ")
                  }
                  onClick={() => setHamburgerOpen(false)}
                >
                  <span className={styles.drawerLinkIcon}>{l.icon}</span>
                  <span>{l.label}</span>
                </NavLink>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className={styles.drawerFooter}>
              <button className={styles.drawerLogout} onClick={handleLogout}>
                🚪 Log Out
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
