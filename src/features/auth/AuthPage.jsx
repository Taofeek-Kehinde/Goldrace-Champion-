import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser } from 'react-icons/fi';
import { signIn, signUp } from './authSlice';

export default function AuthPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, error } = useSelector((s) => s.auth);
  const user = useSelector((s) => s.auth.user);

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ email: '', password: '', username: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Where to send the user after auth
  const next = searchParams.get('next') || '/';

  // If already logged in, bounce immediately (with next preserved)
  useEffect(() => {
    if (user) navigate(next, { replace: true });
  }, [user, next, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'signin') dispatch(signIn(form));
    else dispatch(signUp(form));
    // Redirect is handled by the useEffect above once `user` is set
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#08060f]">
      {/* Animated background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-purple-600/40 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 w-[32rem] h-[32rem] rounded-full bg-fuchsia-500/30 blur-[130px] animate-pulse-slower" />
        <div className="absolute top-1/3 left-1/2 w-[20rem] h-[20rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-[120px] animate-float" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-3xl p-8 sm:p-10
                   bg-white/[0.06] backdrop-blur-2xl
                   border border-white/15
                   shadow-[0_8px_40px_0_rgba(139,92,246,0.25),inset_0_1px_0_0_rgba(255,255,255,0.15)]"
      >
        <div className="relative mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            <span className="shimmer-text">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/50">
            {mode === 'signin'
              ? 'Sign in to your GoldRace account'
              : 'Join the party. Start voting.'}
          </p>
        </div>

        <div className="space-y-3">
          {mode === 'signup' && (
            <GlassInput
              type="text"
              icon={<FiUser />}
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              required
              autoComplete="username"
            />
          )}
          <GlassInput
            type="email"
            icon={<FiMail />}
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            autoComplete="email"
          />
          <GlassInput
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
                className="flex items-center justify-center w-8 h-8 rounded-lg
                           text-white/50 hover:text-purple-300
                           hover:bg-white/[0.06]
                           transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            }
          />
        </div>

        {error && (
          <div className="mt-4 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 backdrop-blur">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative mt-6 w-full overflow-hidden rounded-xl
                     bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500
                     bg-[length:200%_100%] animate-gradient-x
                     py-3 font-semibold text-white
                     shadow-[0_8px_30px_-8px_rgba(168,85,247,0.9)]
                     transition-all duration-300
                     hover:shadow-[0_12px_40px_-8px_rgba(217,70,239,1)]
                     hover:-translate-y-0.5
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          <span className="relative z-10">
            {loading ? 'Loading…' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </span>
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-5 w-full text-sm text-white/50 hover:text-white transition-colors"
        >
          {mode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <span className="text-purple-300 underline-offset-4 hover:underline">
                Sign up
              </span>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <span className="text-purple-300 underline-offset-4 hover:underline">
                Sign in
              </span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function GlassInput({ icon, trailing, className = '', ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`w-full rounded-xl bg-white/[0.05] border border-white/10
                    ${icon ? 'pl-11' : 'pl-4'} ${trailing ? 'pr-12' : 'pr-4'}
                    py-3 text-white placeholder-white/40
                    outline-none backdrop-blur
                    transition-all duration-200
                    focus:border-purple-400/60 focus:bg-white/[0.08]
                    focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]
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