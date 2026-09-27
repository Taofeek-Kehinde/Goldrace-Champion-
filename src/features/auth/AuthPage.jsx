import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiEye,
  FiEyeOff,
  FiMail,
  FiLock,
  FiUser,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import { useTheme } from '../../hooks/useTheme';
import { signIn, signUp } from './authSlice';

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((s) => s.auth);
  const user = useSelector((s) => s.auth.user);
  const { theme, toggle } = useTheme();

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [showPassword, setShowPassword] = useState(false);

  const next = searchParams.get('next') || '/';

  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signin') dispatch(signIn(form));
    else dispatch(signUp(form));
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-[var(--canvas)]">
      {/* Theme toggle — top right */}
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        className="absolute top-4 right-4 z-10 inline-flex items-center justify-center
                   w-10 h-10 rounded-xl
                   border border-[var(--hairline)] bg-[var(--surface)]
                   text-[var(--ink-muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]
                   backdrop-blur transition-colors"
      >
        {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
      </button>

      {/* Soft single glow — dark mode only */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl
                          bg-[var(--surface)] border border-[var(--hairline)] mb-4">
            <span className="text-xl">🎧</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--ink)]">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ink-subtle)]">
            {mode === 'signin'
              ? 'Sign in to continue to GoldRace'
              : 'Join the party and start voting'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-7
                     bg-[var(--surface)] backdrop-blur-xl
                     border border-[var(--hairline)]
                     shadow-[0_20px_60px_-20px_rgba(0,0,0,0.5)]"
        >
          <div className="space-y-3">
            {mode === 'signup' && (
              <Field
                type="text"
                icon={<FiUser />}
                placeholder="Username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="username"
              />
            )}

            <Field
              type="email"
              icon={<FiMail />}
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />

            <Field
              type={showPassword ? 'text' : 'password'}
              icon={<FiLock />}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="flex items-center justify-center w-8 h-8 rounded-md
                             text-[var(--ink-subtle)] hover:text-[var(--ink)]
                             transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              }
            />
          </div>

          {error && (
            <div className="mt-4 text-sm text-red-500 dark:text-red-300/90
                            bg-red-500/[0.08] border border-red-500/20
                            rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-xl
                       bg-[var(--ink)] text-[var(--canvas)]
                       py-2.5 font-medium text-sm
                       transition-all duration-200
                       hover:opacity-90
                       active:scale-[0.99]
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <div className="mt-5 text-center text-sm text-[var(--ink-subtle)]">
            {mode === 'signin' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-[var(--ink)] hover:opacity-80 transition-opacity"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-[var(--ink)] hover:opacity-80 transition-opacity"
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--ink-subtle)]/70">
          By continuing you agree to the terms of service.
        </p>
      </div>
    </div>
  );
}

function Field({ icon, trailing, className = '', ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2
                         text-[var(--ink-subtle)]">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-xl
                    bg-[var(--surface)] border border-[var(--hairline)]
                    ${icon ? 'pl-10' : 'pl-4'} ${trailing ? 'pr-11' : 'pr-4'}
                    py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-subtle)]
                    outline-none
                    transition-all duration-200
                    focus:border-[var(--ink-subtle)] focus:bg-[var(--surface-hover)]
                    ${className}`}
      />
      {trailing && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          {trailing}
        </span>
      )}
    </div>
  );
}