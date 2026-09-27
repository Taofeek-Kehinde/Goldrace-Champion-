import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabaseClient';
import { setUser, fetchProfile } from './features/auth/authSlice';
import { useRealtime } from './hooks/useRealtime';

import Navbar from './shared/components/Navbar';
import AuthPage from './features/auth/AuthPage';
import Leaderboard from './features/djs/Leaderboard';
import CoinLeaderboard from './features/coins/CoinLeaderboard';
import GoldClaimPage from './features/coins/GoldClaimPage';
import ShoutoutWall from './features/shoutouts/ShoutoutWall';
import AdminPanel from './features/admin/AdminPanel';
import BatchPrintPage from './features/admin/BatchPrintPage';

function AdminOnly({ children }) {
  const isAdmin = useSelector((s) => s.auth.profile?.is_admin === true);
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const profileLoaded = useSelector((s) => s.auth.profile !== null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user ?? null;
      dispatch(setUser(u));
      if (u) dispatch(fetchProfile(u.id));
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      dispatch(setUser(u));
      if (u) dispatch(fetchProfile(u.id));
    });
    return () => sub.subscription.unsubscribe();
  }, [dispatch]);

  useRealtime();

  return (
    <BrowserRouter>
      {user && <Navbar />}
      <Routes>
        {/* AuthPage handles its own redirect (respects ?next=) */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Public claim page — auth redirect handled inside the component */}
        <Route path="/gold/:id" element={<GoldClaimPage />} />

        <Route
          path="/"
          element={
            user ? (
              profileLoaded ? <Leaderboard /> : null
            ) : (
              <Navigate to="/auth" />
            )
          }
        />

        <Route
          path="/coins/leaderboard"
          element={user ? <CoinLeaderboard /> : <Navigate to="/auth" />}
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

        {/* Legacy routes → redirect home */}
        <Route path="/coins" element={<Navigate to="/coins/leaderboard" replace />} />
        <Route path="/submit" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;