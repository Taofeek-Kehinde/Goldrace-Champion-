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
    <div className="relative min-h-screen overflow-hidden bg-[#08060f]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-purple-600/25 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-fuchsia-500/20 blur-[130px] animate-pulse-slower" />
      </div>

      <div className="relative max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2">
            <FiMic className="text-purple-300 drop-shadow-[0_0_14px_rgba(168,85,247,0.7)]" />
            <span className="shimmer-text">Shoutouts</span>
          </h1>
          <span className="text-[10px] uppercase tracking-[0.15em] text-white/40 border border-white/10 rounded-full px-2.5 py-1">
            Public feed
          </span>
        </div>

        {shoutoutsLoading && shoutouts.length === 0 ? (
          <p className="text-neutral-500">Loading…</p>
        ) : shoutouts.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur">
            <FiMic className="mx-auto text-5xl text-neutral-700 mb-4" />
            <p className="text-neutral-300 mb-1 font-medium">
              No shoutouts yet.
            </p>
            <p className="text-sm text-neutral-500">
              Shoutouts appear here when a coin is claimed at the venue.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shoutouts.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-5 bg-white/[0.04] backdrop-blur-xl border border-white/10
                           hover:border-purple-400/30 transition-colors
                           flex gap-4"
              >
                {/* Selfie or fallback avatar */}
                <div className="shrink-0">
                  {s.photo_url ? (
                    <img
                      src={s.photo_url}
                      alt={s.claimer_name}
                      loading="lazy"
                      className="w-14 h-14 rounded-2xl object-cover border border-white/15
                                 shadow-[0_4px_20px_-8px_rgba(168,85,247,0.6)]"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl border border-white/10
                                    bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-cyan-400/20
                                    flex items-center justify-center
                                    text-white/80 font-bold text-lg">
                      {(s.claimer_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <p className="font-semibold text-purple-300 truncate">
                      {s.claimer_name}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider text-white/40 shrink-0">
                      {s.clubs?.name ?? 'Party'}
                    </span>
                  </div>
                  <p className="text-white/90 leading-relaxed italic">
                    "{s.shoutout}"
                  </p>
                  <p className="text-[10px] text-white/30 mt-2 tabular-nums">
                    {new Date(s.claimed_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}