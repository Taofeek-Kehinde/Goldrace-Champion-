import { useEffect, useState } from 'react';
import { FiHeadphones } from 'react-icons/fi';

export default function WelcomeSplash({ onDone, duration = 3000 }) {
  const [leaving, setLeaving] = useState(false);

  // Trigger the fade-out just before unmount
  useEffect(() => {
    const leaveTimer = setTimeout(() => setLeaving(true), duration - 400);
    const doneTimer = setTimeout(onDone, duration);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, [duration, onDone]);

  const skip = () => {
    setLeaving(true);
    setTimeout(onDone, 250);
  };

  return (
    <div
      onClick={skip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') skip();
      }}
      aria-label="Skip welcome animation"
      className={`fixed inset-0 z-[100] flex items-center justify-center cursor-pointer
                  bg-[var(--canvas)]
                  transition-opacity duration-400 ease-out
                  ${leaving ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Ambient glow — dark mode only, matches the rest of the app */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden hidden dark:block">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        w-[40rem] h-[40rem] rounded-full bg-purple-600/10 blur-[140px]" />
      </div>

      <div className="relative flex flex-col items-center text-center px-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl
                        bg-[var(--surface)] border border-[var(--hairline)]
                        flex items-center justify-center mb-6
                        animate-in zoom-in-50 duration-500">
          <FiHeadphones className="text-[var(--ink-muted)]" size={28} />
        </div>

        {/* Small label */}
        <p className="text-[10px] uppercase tracking-[0.3em] text-[var(--ink-subtle)]
                      mb-3 animate-in fade-in slide-in-from-bottom-1 duration-700">
          Welcome to
        </p>

        {/* Big title */}
        <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight
                       text-[var(--ink)]
                       animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
          Goldrace Championship
        </h1>

        {/* Tagline */}
        <p className="mt-4 text-sm text-[var(--ink-subtle)]
                      animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
          Let the party begin.
        </p>

        {/* Progress bar */}
        <div className="mt-10 w-40 h-0.5 rounded-full overflow-hidden bg-[var(--surface)]">
          <div
            className="h-full bg-[var(--ink-muted)]"
            style={{
              animation: `splashProgress ${duration}ms linear forwards`,
            }}
          />
        </div>

        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-[var(--ink-subtle)]/70">
          Tap to skip
        </p>
      </div>

      {/* Progress keyframes injected inline — no Tailwind config needed */}
      <style>{`
        @keyframes splashProgress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-in, [style*="splashProgress"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}