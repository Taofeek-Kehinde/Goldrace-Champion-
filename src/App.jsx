import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { setUser, fetchProfile } from './features/auth/authSlice';
import { useRealtime } from './hooks/useRealtime';

import Navbar from './shared/components/Navbar';
import AuthPage from './features/auth/AuthPage';
import CoinLeaderboard from './features/coins/CoinLeaderboard';
import Leaderboard from './features/djs/Leaderboard';
import GoldClaimPage from './features/coins/GoldClaimPage';
import ShoutoutWall from './features/shoutouts/ShoutoutWall';
import AdminPanel from './features/admin/AdminPanel';
import BatchPrintPage from './features/admin/BatchPrintPage';
import AdminGate from './features/admin/AdminGate';
import WelcomeSplash from './shared/components/WelcomeSplash';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [showSplash, setShowSplash] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  const wasLoggedInAtLoad = useRef(false);
  const prevUserIdRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      wasLoggedInAtLoad.current = !!u;
      prevUserIdRef.current = u?.id ?? null;
      dispatch(setUser(u));
      if (u) dispatch(fetchProfile(u.id));
      setAuthChecked(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const u = session?.user ?? null;
      const nextId = u?.id ?? null;

      dispatch(setUser(u));
      if (u) dispatch(fetchProfile(u.id));

      if (
        event === 'SIGNED_IN' &&
        u &&
        !wasLoggedInAtLoad.current &&
        nextId !== prevUserIdRef.current
      ) {
        // Don't show the party splash to admins.
        // They need to reach /admin and enter a passcode; the splash just delays them.
        // We can't reliably know `is_admin` yet at this instant, so we
        // check the email domain OR a metadata flag if you set one.
        // Simplest reliable check: skip the splash if the user is heading to /admin.
        const goingToAdmin =
          typeof window !== 'undefined' &&
          window.location.pathname.startsWith('/admin');

        if (!goingToAdmin) {
          setShowSplash(true);
        }
      }

      wasLoggedInAtLoad.current = !!u;
      prevUserIdRef.current = nextId;
    });

    return () => sub.subscription.unsubscribe();
  }, [dispatch]);

  useRealtime();

  if (!authChecked) {
    return <div className="min-h-screen bg-[var(--canvas)]" />;
  }

  return (
    <BrowserRouter>
      <ScrollToTop />

      {showSplash && (
        <WelcomeSplash onDone={() => setShowSplash(false)} duration={3000} />
      )}

      <Navbar />

      <Routes>
        {/* Public — anyone can view */}
        <Route path="/" element={<CoinLeaderboard />} />
        <Route path="/djs" element={<Leaderboard />} />
        <Route path="/shoutouts" element={<ShoutoutWall />} />

        {/* Public — but the claim form requires login (handled inside) */}
        <Route path="/gold/:id" element={<GoldClaimPage />} />

        {/* Auth page — reached only when needed */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthPage />}
        />

        {/* Admin — passcode-gated */}
        <Route
          path="/admin"
          element={
            <AdminGate>
              <AdminPanel />
            </AdminGate>
          }
        />
        <Route
          path="/admin/batches/:id"
          element={
            <AdminGate>
              <BatchPrintPage />
            </AdminGate>
          }
        />

        {/* Legacy redirects */}
        <Route path="/coins/leaderboard" element={<Navigate to="/" replace />} />
        <Route path="/coins" element={<Navigate to="/" replace />} />
        <Route path="/submit" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;