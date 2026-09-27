import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiLogOut,
  FiShield,
  FiHeadphones,
  FiTrendingUp,
  FiAward,
  FiMic,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import { signOut } from '../../features/auth/authSlice';

export default function Navbar() {
  const dispatch = useDispatch();
  const location = useLocation();
  const profile = useSelector((s) => s.auth.profile);
  const isAdmin = profile?.is_admin === true;

  const [open, setOpen] = useState(false);

  // Close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  // Lock body scroll while the drawer is open
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const linkClass = ({ isActive }) =>
    `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-purple-500/15 text-purple-300'
        : 'text-neutral-300 hover:text-white hover:bg-white/[0.05]'
    }`;

  const nav = (
    <>
      <NavLink to="/" end className={linkClass}>
        <FiTrendingUp className="text-base" />
        DJ Board
      </NavLink>
      <NavLink to="/coins/leaderboard" className={linkClass}>
        <FiAward className="text-base" />
        Coin Board
      </NavLink>
      <NavLink to="/shoutouts" className={linkClass}>
        <FiMic className="text-base" />
        Shoutouts
      </NavLink>
      {isAdmin && (
        <NavLink to="/admin" className={linkClass}>
          <FiShield className="text-base" />
          Admin
        </NavLink>
      )}
    </>
  );

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-neutral-800 bg-neutral-900/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link
  to="/"
  className="flex items-center gap-2 min-w-0 hover:text-purple-300 transition-colors"
  onClick={() => setOpen(false)}
>
  <FiHeadphones className="text-purple-400 shrink-0" size={22} />
  <span
    className="
      font-bold truncate
      text-base sm:text-lg md:text-xl
      leading-tight
    "
  >
    <span className="hidden sm:inline">Goldrace Championship</span>
    <span className="sm:hidden">Goldrace</span>
  </span>
</Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {nav}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Coin pill — always visible, smaller on mobile */}
            <span className="inline-flex items-center gap-1.5 bg-yellow-500/15 text-yellow-300 border border-yellow-500/30 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium tabular-nums">
              <FaCoins className="text-[10px]" />
              {profile?.coin_balance ?? 0}
            </span>

            {/* Logout — desktop only (mobile has it inside the drawer) */}
            <button
              onClick={() => dispatch(signOut())}
              className="hidden md:inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              <FiLogOut />
              Logout
            </button>

            {/* Hamburger — mobile only */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg
                         border border-white/10 bg-white/[0.04] backdrop-blur
                         text-white/80 hover:text-white hover:bg-white/[0.08]
                         transition-colors"
            >
              {open ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer + backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
        >
          {/* Backdrop */}
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer panel — slides in from the right */}
          <div
            className="absolute top-0 right-0 h-full w-72 max-w-[80vw]
                       border-l border-white/10
                       bg-neutral-950/95 backdrop-blur-2xl
                       shadow-[0_0_60px_-10px_rgba(0,0,0,0.9)]
                       flex flex-col
                       animate-in slide-in-from-right duration-200"
          >
            {/* Drawer header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
              <span className="font-bold">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg
                           border border-white/10 bg-white/[0.04]
                           text-white/70 hover:text-white hover:bg-white/[0.08]
                           transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Drawer nav */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
              {nav}
            </div>

            {/* Drawer footer — logout */}
            <div className="border-t border-white/10 p-3">
              <button
                onClick={() => {
                  setOpen(false);
                  dispatch(signOut());
                }}
                className="w-full inline-flex items-center justify-center gap-2
                           px-3 py-2.5 rounded-lg
                           border border-white/10 bg-white/[0.04]
                           text-sm font-medium text-white/80 hover:text-white hover:bg-white/[0.08]
                           transition-colors"
              >
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}