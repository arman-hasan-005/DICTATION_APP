import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth }  from '../../../hooks/useAuth';
import { useTheme } from '../../../context/ThemeContext';
import { ROUTES }   from '../../../constants/routes';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { to: ROUTES.DASHBOARD,   label: 'Dashboard'   },
  { to: ROUTES.SETUP,       label: 'Practice'    },
  { to: ROUTES.UPLOAD,      label: '📄 Upload'   },
  { to: ROUTES.LEADERBOARD, label: 'Leaderboard' },
  { to: ROUTES.PROFILE,     label: 'Profile'     },
];

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate(ROUTES.LOGIN); };

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        <Link to={ROUTES.DASHBOARD} className={styles.logo}>
          <span>🎙️</span>
          <span className={styles.logoText}>DictaClass</span>
        </Link>

        {isAuthenticated && (
          <div className={styles.links}>
            {NAV_LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  [styles.link, isActive ? styles.linkActive : ''].filter(Boolean).join(' ')
                }
              >
                {l.label}
              </NavLink>
            ))}
          </div>
        )}

        <div className={styles.right}>
          <button className={styles.iconBtn} onClick={toggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            {isDark ? '☀️' : '🌙'}
          </button>

          {isAuthenticated && user ? (
            <>
              <div className={styles.xpChip}>
                <span>⚡</span>
                <span className={styles.xpValue}>{user.xp ?? 0} XP</span>
              </div>
              <div className={styles.avatarWrap}>
                <button className={styles.avatar} onClick={() => setMenuOpen((o) => !o)}>
                  {user.name?.charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <p className={styles.dropdownName}>{user.name}</p>
                      <p className={styles.dropdownEmail}>{user.email}</p>
                    </div>
                    <Link to={ROUTES.PROFILE}    className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>👤 Profile</Link>
                    <Link to={ROUTES.UPLOAD}     className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>📄 Upload Content</Link>
                    <Link to={ROUTES.SETUP}      className={styles.dropdownItem} onClick={() => setMenuOpen(false)}>🎓 Classroom Settings</Link>
                    <button className={styles.dropdownItem} onClick={handleLogout}>🚪 Log out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.authBtns}>
              <Link to={ROUTES.LOGIN}    className={styles.loginBtn}>Log in</Link>
              <Link to={ROUTES.REGISTER} className={styles.registerBtn}>Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
