import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { FiLock, FiShield, FiAlertTriangle } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';

const SESSION_KEY = 'goldrace-admin-verified';

export default function AdminGate({ children }) {
  const user = useSelector((s) => s.auth.user);
  const profile = useSelector((s) => s.auth.profile);

  const [verified, setVerified] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === 'true'
  );
  const [passcode, setPasscode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // If the user is logged in but their profile says they're not an admin,
  // force the gate closed and clear any cached verification.
  useEffect(() => {
    if (profile && profile.is_admin !== true) {
      sessionStorage.removeItem(SESSION_KEY);
      setVerified(false);
    }
  }, [profile]);

  // Not logged in at all → send to login, come back here
  if (!user) {
    return <Navigate to="/auth?next=/admin" replace />;
  }

  // Profile still loading — don't flash the gate
  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--canvas)]" />
    );
  }

  // Logged in but not an admin → dead end
  if (profile.is_admin !== true) {
    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl p-8 text-center
                        bg-[var(--surface)] border border-[var(--hairline)]">
          <FiAlertTriangle className="mx-auto text-4xl text-red-500 mb-4" />
          <h1 className="text-xl font-semibold text-[var(--ink)] mb-2">
            Not authorized
          </h1>
          <p className="text-sm text-[var(--ink-subtle)]">
            This account doesn't have admin access.
          </p>
        </div>
      </div>
    );
  }

  // Admin identity confirmed, but needs passcode this session
  if (!verified) {
    const handleVerify = async (e) => {
      e.preventDefault();
      setBusy(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc(
        'verify_admin_passcode',
        { p_passcode: passcode }
      );

      setBusy(false);

      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      if (!data?.success) {
        setError(
          data?.error === 'wrong_passcode'
            ? 'Wrong passcode.'
            : data?.error === 'not_admin'
            ? 'This account is not an admin.'
            : 'Verification failed.'
        );
        setPasscode('');
        return;
      }

      sessionStorage.setItem(SESSION_KEY, 'true');
      setVerified(true);
    };

    return (
      <div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center px-4">
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl
                            bg-[var(--surface)] border border-[var(--hairline)] mb-4">
              <FiShield className="text-[var(--ink-muted)]" size={20} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
              Admin access
            </h1>
            <p className="mt-1.5 text-sm text-[var(--ink-subtle)]">
              Enter the admin passcode to continue.
            </p>
          </div>

          <form
            onSubmit={handleVerify}
            className="rounded-2xl p-7
                       bg-[var(--surface)] backdrop-blur-xl
                       border border-[var(--hairline)]
                       shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
          >
            <div className="relative mb-4">
              <FiLock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2
                                 text-[var(--ink-subtle)]" />
              <input
                type="password"
                autoFocus
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Passcode"
                className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm
                           bg-[var(--surface)] border border-[var(--hairline)]
                           text-[var(--ink)] placeholder-[var(--ink-subtle)]
                           outline-none transition-all
                           focus:border-[var(--ink-subtle)] focus:bg-[var(--surface-hover)]"
                required
              />
            </div>

            {error && (
              <div className="mb-4 text-sm text-red-500 dark:text-red-300/90
                              bg-red-500/[0.08] border border-red-500/20
                              rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !passcode}
              className="w-full rounded-xl py-2.5 text-sm font-medium
                         bg-[var(--ink)] text-[var(--canvas)]
                         hover:opacity-90 active:scale-[0.99]
                         transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? 'Verifying…' : 'Unlock Admin'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[var(--ink-subtle)]">
            Signed in as {user.email}
          </p>
        </div>
      </div>
    );
  }

  // Both gates passed
  return children;
}