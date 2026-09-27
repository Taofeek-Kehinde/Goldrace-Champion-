import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import WelcomeSplash from './shared/components/WelcomeSplash';

function AdminOnly({ children }) {
  const isAdmin = useSelector((s) => s.auth.profile?.is_admin === true);
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const profileLoaded = useSelector((s) => s.auth.profile !== null);

  // Splash visibility
  const [showSplash, setShowSplash] = useState(false);

  // Whether the initial auth check has completed. Without this,
  // the app would briefly show "not logged in" on refresh.
  const [authChecked, setAuthChecked] = useState(false);

  // Remember whether the user was logged in on app load.
  // Prevents the splash from firing on a page refresh.
  const wasLoggedInAtLoad = useRef(false);

  // Track the previous user id so we only fire on a genuine user change
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

      // Show splash whenever a user signs in — every single time.
      // Conditions:
      //   1. The event is SIGNED_IN (Supabase fires this on login + signup)
      //   2. There is a user id (not a sign-out)
      //   3. The user was NOT already logged in when the app booted
      //      (prevents splash on page refresh)
      //   4. The user id is actually different from the previous one
      //      (prevents splash on token refresh / duplicate events)
      if (
        event === 'SIGNED_IN' &&
        u &&
        !wasLoggedInAtLoad.current &&
        nextId !== prevUserIdRef.current
      ) {
        setShowSplash(true);
      }

      wasLoggedInAtLoad.current = !!u;
      prevUserIdRef.current = nextId;
    });

    return () => sub.subscription.unsubscribe();
  }, [dispatch]);

  useRealtime();

  // Don't render routes until auth has been checked
  if (!authChecked) {
    return <div className="min-h-screen bg-[var(--canvas)]" />;
  }

  return (
    <BrowserRouter>
      {showSplash && (
        <WelcomeSplash onDone={() => setShowSplash(false)} duration={3000} />
      )}

      {user && <Navbar />}

      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/gold/:id" element={<GoldClaimPage />} />

        <Route
          path="/"
          element={
            user ? (
              profileLoaded ? <CoinLeaderboard /> : null
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route
          path="/djs"
          element={
            user ? (
              profileLoaded ? <Leaderboard /> : null
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route
          path="/shoutouts"
          element={user ? <ShoutoutWall /> : <Navigate to="/auth" />}
        />

        <Route
          path="/admin"
          element={
            user ? (
              profileLoaded ? (
                <AdminOnly>
                  <AdminPanel />
                </AdminOnly>
              ) : null
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route
          path="/admin/batches/:id"
          element={
            user ? (
              profileLoaded ? (
                <AdminOnly>
                  <BatchPrintPage />
                </AdminOnly>
              ) : null
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route path="/coins/leaderboard" element={<Navigate to="/" replace />} />
        <Route path="/coins" element={<Navigate to="/" replace />} />
        <Route path="/submit" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;