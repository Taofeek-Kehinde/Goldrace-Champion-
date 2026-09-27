import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiMic } from 'react-icons/fi';
import { fetchShoutoutFeed } from '../coins/coinClaimSlice';

export default function ShoutoutWall() {
  const dispatch = useDispatch();
  const { shoutouts, shoutoutsLoading } = useSelector((s) => s.coinClaim);

  useEffect(() => {
    dispatch(fetchShoutoutFeed());
  }, [dispatch]);

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-[var(--canvas)]">
      {/* Soft glow — dark mode only */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-600/15 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/10 blur-[130px] animate-pulse-slower" />
      </div>

      {/* Fixed header */}
      <header className="relative shrink-0 border-b border-[var(--hairline)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight flex items-center gap-2 text-[var(--ink)]">
              <FiMic className="text-[var(--ink-muted)]" />
              Shoutouts
            </h1>
            <span className="text-[10px] uppercase tracking-[0.15em]
                             text-[var(--ink-subtle)]
                             border border-[var(--hairline)]
                             rounded-full px-2.5 py-1">
              Public feed
            </span>
            <span className="ml-auto text-xs text-[var(--ink-subtle)] tabular-nums hidden sm:block">
              {shoutouts.length} shoutout{shoutouts.length === 1 ? '' : 's'}
            </span>
          </div>
        </div>
      </header>

      {/* Scrollable list */}
      <main className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          {shoutoutsLoading && shoutouts.length === 0 ? (
            <p className="text-[var(--ink-subtle)] py-8 text-center">Loading…</p>
          ) : shoutouts.length === 0 ? (
            <div className="text-center py-20 rounded-2xl
                            border border-dashed border-[var(--hairline)]
                            bg-[var(--surface)]">
              <FiMic className="mx-auto text-4xl text-[var(--ink-subtle)] mb-4" />
              <p className="text-[var(--ink-muted)] mb-1 font-medium">
                No shoutouts yet.
              </p>
              <p className="text-sm text-[var(--ink-subtle)]">
                Shoutouts appear here when a coin is claimed at the venue.
              </p>
            </div>
          ) : (
            <div className="space-y-3 pb-6">
              {shoutouts.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl p-4 sm:p-5
                             bg-[var(--surface)] border border-[var(--hairline)]
                             transition-colors hover:bg-[var(--surface-hover)]
                             flex gap-4"
                >
                  <div className="shrink-0">
                    {s.photo_url ? (
                      <img
                        src={s.photo_url}
                        alt={s.claimer_name}
                        loading="lazy"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover
                                   border border-[var(--hairline)]"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl
                                      border border-[var(--hairline)]
                                      bg-[var(--surface-hover)]
                                      flex items-center justify-center
                                      text-[var(--ink-muted)] font-semibold text-lg">
                        {(s.claimer_name ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <p className="font-medium text-[var(--ink)] truncate">
                        {s.claimer_name}
                      </p>
                      <span className="text-[10px] uppercase tracking-wider
                                       text-[var(--ink-subtle)] shrink-0">
                        {s.clubs?.name ?? 'Party'}
                      </span>
                    </div>
                    <p className="text-[var(--ink-muted)] leading-relaxed italic">
                      "{s.shoutout}"
                    </p>
                    <p className="text-[10px] text-[var(--ink-subtle)] mt-2 tabular-nums">
                      {new Date(s.claimed_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}