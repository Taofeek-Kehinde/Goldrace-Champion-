import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiMusic,
  FiHeart,
  FiTrendingUp,
  FiPlayCircle,
  FiCheckCircle,
  FiSearch,
  FiX,
  FiChevronUp,
} from 'react-icons/fi';
import { HiOutlineFire } from 'react-icons/hi';
import { TbCrown } from 'react-icons/tb';
import { fetchDjs, fetchMyVotes, castVote } from './djSlice';

export default function Leaderboard() {
  const dispatch = useDispatch();
  const { list, loading, votedDjIds, error } = useSelector((s) => s.djs);
  const myUserId = useSelector((s) => s.auth.user?.id);
  const isAdmin = useSelector((s) => s.auth.profile?.is_admin === true);

  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchDjs());
    dispatch(fetchMyVotes());
  }, [dispatch]);

  const handleVote = (dj) => {
    if (!isAdmin && dj.user_id === myUserId) return;
    if (votedDjIds.includes(dj.id)) return;
    dispatch(castVote({ djId: dj.id }));
  };

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter((dj) => dj.stage_name.toLowerCase().includes(q));
  }, [list, query]);

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-[#08060f] relative">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-purple-600/25 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[26rem] h-[26rem] rounded-full bg-fuchsia-500/20 blur-[130px] animate-pulse-slower" />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
        }}
      />

      <header className="relative shrink-0 px-4 sm:px-6 pt-5 pb-3 border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <HiOutlineFire className="text-orange-400 drop-shadow-[0_0_14px_rgba(251,146,60,0.7)]" />
              <span className="shimmer-text">DJ Leaderboard</span>
            </h1>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30 backdrop-blur shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-[10px] text-green-300 font-semibold tracking-[0.15em]">
                LIVE
              </span>
            </span>

            <span className="ml-auto text-xs text-white/40 tabular-nums hidden sm:block">
              {filtered.length} DJ{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          {list.length > 0 && (
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search DJs…"
                className="w-full rounded-xl bg-white/[0.05] border border-white/10
                           pl-11 pr-10 py-2.5 text-sm text-white placeholder-white/40
                           outline-none backdrop-blur
                           transition-all duration-200
                           focus:border-purple-400/60 focus:bg-white/[0.08]
                           focus:shadow-[0_0_0_3px_rgba(168,85,247,0.2)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                             text-white/40 hover:text-white hover:bg-white/[0.06]
                             transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 backdrop-blur">
              {error}
            </div>
          )}
        </div>
      </header>

      <main className="relative flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 djs-scroll">
        <div className="max-w-3xl mx-auto">
          {loading && list.length === 0 ? (
            <LoadingSkeleton />
          ) : list.length === 0 ? (
            <EmptyState />
          ) : filtered.length === 0 ? (
            <NoResults query={query} onClear={() => setQuery('')} />
          ) : (
            <div className="space-y-3 pb-6">
              {filtered.map((dj) => {
                const rank = list.findIndex((d) => d.id === dj.id) + 1;
                return (
                  <DjRow
                    key={dj.id}
                    dj={dj}
                    rank={rank}
                    voted={votedDjIds.includes(dj.id)}
                    isMine={!isAdmin && dj.user_id === myUserId}
                    onVote={() => handleVote(dj)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <ScrollToTop targetSelector=".djs-scroll" />
    </div>
  );
}

function DjRow({ dj, rank, voted, isMine, onVote }) {
  const votes = dj.vote_counts?.total_votes ?? 0;
  const isPodium = rank <= 3;

  return (
    <div
      className={`
        group relative rounded-2xl
        transition-all duration-300 ease-out
        bg-white/[0.04] backdrop-blur-xl
        border border-white/10
        hover:border-purple-400/40 hover:bg-white/[0.06]
        hover:shadow-[0_10px_40px_-12px_rgba(168,85,247,0.55)]
        ${isPodium ? 'shadow-[0_4px_30px_-12px_rgba(168,85,247,0.4)]' : ''}
        p-3 sm:p-4
      `}
    >
      {isPodium && (
        <span
          className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${
            rank === 1
              ? 'bg-gradient-to-b from-yellow-300 to-amber-500'
              : rank === 2
              ? 'bg-gradient-to-b from-slate-200 to-slate-400'
              : 'bg-gradient-to-b from-orange-300 to-orange-500'
          }`}
        />
      )}

      {/* MOBILE */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            {dj.cover_url ? (
              <img
                src={dj.cover_url}
                alt={dj.stage_name}
                loading="lazy"
                className="w-12 h-12 rounded-xl object-cover border border-white/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-cyan-400/20 flex items-center justify-center">
                <FiMusic className="text-white/70" size={18} />
              </div>
            )}
            <div
              className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold tabular-nums border backdrop-blur-md ${
                rank === 1
                  ? 'bg-yellow-400/90 border-yellow-300 text-yellow-950'
                  : rank === 2
                  ? 'bg-slate-300/90 border-slate-200 text-slate-900'
                  : rank === 3
                  ? 'bg-orange-400/90 border-orange-300 text-orange-950'
                  : 'bg-neutral-900/90 border-white/20 text-purple-200'
              }`}
            >
              {rank}
            </div>
            {rank === 1 && (
              <TbCrown
                className="absolute -top-3 -right-1.5 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] rotate-12"
                size={14}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base text-white/90 truncate">
              {dj.stage_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={dj.music_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-purple-300/80 hover:text-purple-200"
              >
                <FiPlayCircle size={12} />
                Listen
              </a>
              {isMine && (
                <span className="text-[9px] uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 px-1.5 py-0.5 rounded-full">
                  Your track
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl font-extrabold tabular-nums text-white flex items-center gap-1">
              <FiTrendingUp className="text-purple-400/70 text-xs" />
              {votes}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-neutral-500">
              votes
            </p>
          </div>
        </div>

        {!isMine && (
          <button
            onClick={onVote}
            disabled={voted}
            className={`relative w-full rounded-xl py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all duration-300 ${
              voted
                ? 'bg-white/[0.03] text-neutral-400 border border-white/10 cursor-not-allowed'
                : 'text-white bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x shadow-[0_6px_24px_-8px_rgba(168,85,247,0.9)] active:scale-[0.98]'
            }`}
          >
            {voted ? (
              <>
                <FiCheckCircle size={16} />
                Voted
              </>
            ) : (
              <>
                <FiHeart size={16} />
                Vote
              </>
            )}
          </button>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="relative shrink-0">
          {dj.cover_url ? (
            <img
              src={dj.cover_url}
              alt={dj.stage_name}
              loading="lazy"
              className="w-16 h-16 rounded-xl object-cover border border-white/10 group-hover:border-purple-400/40 transition-colors"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/30 via-fuchsia-500/20 to-cyan-400/20 flex items-center justify-center">
              <FiMusic className="text-white/70" size={20} />
            </div>
          )}
          <div
            className={`absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-extrabold tabular-nums border backdrop-blur-md ${
              rank === 1
                ? 'bg-yellow-400/90 border-yellow-300 text-yellow-950 shadow-[0_0_18px_-4px_rgba(250,204,21,0.9)]'
                : rank === 2
                ? 'bg-slate-300/90 border-slate-200 text-slate-900'
                : rank === 3
                ? 'bg-orange-400/90 border-orange-300 text-orange-950'
                : 'bg-neutral-900/90 border-white/20 text-purple-200'
            }`}
          >
            {rank}
          </div>
          {rank === 1 && (
            <TbCrown
              className="absolute -top-4 -right-2 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.9)] rotate-12 pointer-events-none"
              size={16}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-lg truncate text-white/90 group-hover:text-white transition-colors">
              {dj.stage_name}
            </p>
            {isMine && (
              <span className="text-[10px] uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full">
                Your track
              </span>
            )}
          </div>
          <a
            href={dj.music_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-purple-300/80 hover:text-purple-200 transition-colors mt-0.5"
          >
            <FiPlayCircle />
            Listen
          </a>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-extrabold tabular-nums flex items-center gap-1.5 justify-end text-white">
            <FiTrendingUp className="text-purple-400/70 text-base" />
            {votes}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-neutral-500">
            votes
          </p>
        </div>

        {isMine ? (
          <button
            disabled
            title="You can't vote for your own track"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/[0.03] text-neutral-500 border border-white/10 cursor-not-allowed shrink-0 inline-flex items-center gap-1.5"
          >
            <FiMusic />
            Your track
          </button>
        ) : (
          <button
            onClick={onVote}
            disabled={voted}
            className={`group/btn relative overflow-hidden shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-1.5 transition-all duration-300 ${
              voted
                ? 'bg-white/[0.03] text-neutral-400 border border-white/10 cursor-not-allowed'
                : 'text-white border border-transparent bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x shadow-[0_6px_24px_-8px_rgba(168,85,247,0.9)] hover:shadow-[0_10px_32px_-8px_rgba(217,70,239,1)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
            }`}
          >
            {voted ? (
              <>
                <FiCheckCircle />
                Voted
              </>
            ) : (
              <>
                <FiHeart className="transition-transform group-hover/btn:scale-110" />
                Vote
                <span className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 animate-pulse"
        >
          <div className="w-16 h-16 rounded-xl bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-white/[0.06]" />
            <div className="h-3 w-20 rounded bg-white/[0.04]" />
          </div>
          <div className="h-8 w-16 rounded bg-white/[0.04]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur">
      <FiMusic className="mx-auto text-5xl text-neutral-600 mb-4" />
      <p className="text-neutral-300 mb-1 font-medium">The lineup is empty.</p>
      <p className="text-sm text-neutral-500">
        Check back soon — DJs drop here when the night starts.
      </p>
    </div>
  );
}

function NoResults({ query, onClear }) {
  return (
    <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur">
      <FiSearch className="mx-auto text-5xl text-neutral-600 mb-4" />
      <p className="text-neutral-300 mb-1 font-medium">
        No DJs match "{query}"
      </p>
      <button
        onClick={onClear}
        className="mt-3 text-sm text-purple-300 hover:text-purple-200 inline-flex items-center gap-1.5"
      >
        <FiX />
        Clear search
      </button>
    </div>
  );
}

function ScrollToTop({ targetSelector }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const onScroll = () => setVisible(target.scrollTop > 400);
    target.addEventListener('scroll', onScroll);
    return () => target.removeEventListener('scroll', onScroll);
  }, [targetSelector]);

  if (!visible) return null;

  const handleClick = () => {
    const target = document.querySelector(targetSelector);
    if (target) target.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-neutral-900/90 backdrop-blur border border-white/15 text-white/80 hover:text-white hover:border-purple-400/50 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.9)] flex items-center justify-center transition-all hover:-translate-y-0.5"
    >
      <FiChevronUp size={20} />
    </button>
  );
}