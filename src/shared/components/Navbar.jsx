import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiLogOut,
  FiHeadphones,
  FiAward,
  FiTrendingUp,
  FiMic,
  FiMenu,
  FiX,
  FiSun,
  FiMoon,
  FiLogIn,
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import { signOut } from '../../features/auth/authSlice';
import { useTheme } from '../../hooks/useTheme';

export default function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const profile = useSelector((s) => s.auth.profile);
  const user = useSelector((s) => s.auth.user);
  const isLoggedIn = !!user;
  const { theme, toggle } = useTheme();

  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'text-[var(--ink)] bg-[var(--surface-hover)]'
        : 'text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface)]'
    }`;

  const nav = (
    <>
      <NavLink to="/" end className={linkClass}>
        <FiAward className="text-base" />
        Coin Board
      </NavLink>
      <NavLink to="/djs" className={linkClass}>
        <FiTrendingUp className="text-base" />
        DJ Board
      </NavLink>
      <NavLink to="/shoutouts" className={linkClass}>
        <FiMic className="text-base" />
        Shoutouts
      </NavLink>
    </>
  );

  const themeButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex items-center justify-center w-9 h-9 rounded-lg
                 border border-[var(--hairline)] bg-[var(--surface)]
                 text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]
                 transition-colors"
    >
      {theme === 'dark' ? <FiSun size={16} /> : <FiMoon size={16} />}
    </button>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-[var(--hairline)] bg-[var(--canvas)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 min-w-0 text-[var(--ink)] hover:opacity-80 transition-opacity"
          >
            <FiHeadphones className="shrink-0 text-[var(--ink-muted)]" size={20} />
            <span className="font-semibold truncate text-base sm:text-lg tracking-tight">
              <span className="hidden sm:inline">Goldrace Championship</span>
              <span className="sm:hidden">Goldrace</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">{nav}</div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isLoggedIn ? (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full
                                 bg-[var(--surface)] border border-[var(--hairline)]
                                 px-2.5 sm:px-3 py-1
                                 text-xs sm:text-sm font-medium tabular-nums text-[var(--ink-muted)]">
                  <FaCoins className="text-[11px] text-yellow-500/90" />
                  {profile?.coin_balance ?? 0}
                </span>

                <div className="hidden md:block">{themeButton}</div>

                <button
                  onClick={() => dispatch(signOut())}
                  className="hidden md:inline-flex items-center gap-1.5 text-sm
                             text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors"
                >
                  <FiLogOut />
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="hidden md:block">{themeButton}</div>

                <Link
                  to={`/auth?next=${encodeURIComponent(location.pathname)}`}
                  className="hidden md:inline-flex items-center gap-1.5
                             rounded-xl px-3 py-2 text-sm font-medium
                             bg-[var(--ink)] text-[var(--canvas)]
                             hover:opacity-90 transition-opacity"
                >
                  <FiLogIn />
                  Sign in
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg
                         border border-[var(--hairline)] bg-[var(--surface)]
                         text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]
                         transition-colors"
            >
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {open && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[80vw]
                       border-l border-[var(--hairline)]
                       bg-[var(--canvas)]/95 backdrop-blur-2xl
                       shadow-[0_0_60px_-10px_rgba(0,0,0,0.6)]
                       flex flex-col"
          >
            <div className="h-16 px-4 flex items-center justify-between border-b border-[var(--hairline)]">
              <span className="font-semibold text-[var(--ink)]">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg
                           border border-[var(--hairline)] bg-[var(--surface)]
                           text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]
                           transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {nav}
            </div>

            <div className="border-t border-[var(--hairline)] p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-[var(--ink-muted)]">
                  {theme === 'dark' ? 'Dark mode' : 'Light mode'}
                </span>
                {themeButton}
              </div>

              {isLoggedIn ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    dispatch(signOut());
                  }}
                  className="w-full inline-flex items-center justify-center gap-2
                             px-3 py-2.5 rounded-lg
                             border border-[var(--hairline)] bg-[var(--surface)]
                             text-sm font-medium text-[var(--ink-muted)]
                             hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]
                             transition-colors"
                >
                  <FiLogOut />
                  Logout
                </button>
              ) : (
                <Link
                  to={`/auth?next=${encodeURIComponent(location.pathname)}`}
                  onClick={() => setOpen(false)}
                  className="w-full inline-flex items-center justify-center gap-2
                             px-3 py-2.5 rounded-lg
                             bg-[var(--ink)] text-[var(--canvas)]
                             text-sm font-medium
                             hover:opacity-90 transition-opacity"
                >
                  <FiLogIn />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}