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
    <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-[var(--canvas)] relative">
      {/* Soft glow — dark mode only */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -top-40 -left-40 w-[28rem] h-[28rem] rounded-full bg-purple-600/15 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[26rem] h-[26rem] rounded-full bg-fuchsia-500/10 blur-[130px] animate-pulse-slower" />
      </div>

      <header className="relative shrink-0 px-4 sm:px-6 pt-5 pb-3 border-b border-[var(--hairline)]">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight flex items-center gap-2 text-[var(--ink)]">
              <HiOutlineFire className="text-orange-500" />
              DJ Leaderboard
            </h1>

            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)] border border-[var(--hairline)] shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-[10px] text-[var(--ink-muted)] font-semibold tracking-[0.15em]">
                LIVE
              </span>
            </span>

            <span className="ml-auto text-xs text-[var(--ink-subtle)] tabular-nums hidden sm:block">
              {filtered.length} DJ{filtered.length === 1 ? '' : 's'}
            </span>
          </div>

          {list.length > 0 && (
            <div className="relative">
              <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-subtle)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search DJs…"
                className="w-full rounded-xl bg-[var(--surface)] border border-[var(--hairline)]
                           pl-11 pr-10 py-2.5 text-sm text-[var(--ink)] placeholder-[var(--ink-subtle)]
                           outline-none
                           transition-all duration-200
                           focus:border-[var(--ink-subtle)] focus:bg-[var(--surface-hover)]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md
                             text-[var(--ink-subtle)] hover:text-[var(--ink)] hover:bg-[var(--surface-hover)]
                             transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 text-sm text-red-500 dark:text-red-300/90
                            bg-red-500/[0.08] border border-red-500/20
                            rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}
        </div>
      </header>

      <main className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 sm:px-6 py-4 djs-scroll">
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
  const isFirst = rank === 1;

  const rankBadgeClass =
    rank === 1
      ? 'bg-yellow-500 border-yellow-400 text-black'
      : rank === 2
      ? 'bg-slate-400 border-slate-300 text-black'
      : rank === 3
      ? 'bg-orange-500 border-orange-400 text-black'
      : 'bg-[var(--canvas)] border-[var(--hairline)] text-[var(--ink-muted)]';

  return (
    <div
      className={`group relative rounded-2xl p-3 sm:p-4
                  border transition-all duration-200
                  ${
                    isFirst
                      ? 'bg-yellow-500/[0.06] border-yellow-500/30 hover:bg-yellow-500/[0.09]'
                      : 'bg-[var(--surface)] border-[var(--hairline)] hover:bg-[var(--surface-hover)]'
                  }`}
    >
      {/* Podium accent bar */}
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
                className="w-12 h-12 rounded-xl object-cover border border-[var(--hairline)]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-[var(--hairline)] bg-[var(--surface-hover)] flex items-center justify-center">
                <FiMusic className="text-[var(--ink-subtle)]" size={18} />
              </div>
            )}
            <div
              className={`absolute -top-1.5 -left-1.5 w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold tabular-nums border ${rankBadgeClass}`}
            >
              {rank}
            </div>
            {isFirst && (
              <TbCrown
                className="absolute -top-3 -right-1.5 text-yellow-500 rotate-12"
                size={14}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-base truncate ${
                isFirst ? 'text-yellow-600 dark:text-yellow-400' : 'text-[var(--ink)]'
              }`}
            >
              {dj.stage_name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <a
                href={dj.music_link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[var(--ink-subtle)] hover:text-[var(--ink)]"
              >
                <FiPlayCircle size={12} />
                Listen
              </a>
              {isMine && (
                <span className="text-[9px] uppercase tracking-wider
                                 bg-[var(--surface-hover)] text-[var(--ink-muted)]
                                 border border-[var(--hairline)]
                                 px-1.5 py-0.5 rounded-full">
                  Your track
                </span>
              )}
            </div>
          </div>

          <div className="text-right shrink-0">
            <p className="text-xl font-semibold tabular-nums text-[var(--ink)] flex items-center gap-1">
              <FiTrendingUp className="text-[var(--ink-subtle)] text-xs" />
              {votes}
            </p>
            <p className="text-[9px] uppercase tracking-wider text-[var(--ink-subtle)]">
              votes
            </p>
          </div>
        </div>

        {!isMine && (
          <button
            onClick={onVote}
            disabled={voted}
            className={`w-full rounded-xl py-2.5 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all ${
              voted
                ? 'bg-[var(--surface)] text-[var(--ink-subtle)] border border-[var(--hairline)] cursor-not-allowed'
                : 'bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 active:scale-[0.98]'
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
              className="w-16 h-16 rounded-xl object-cover border border-[var(--hairline)]"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl border border-[var(--hairline)] bg-[var(--surface-hover)] flex items-center justify-center">
              <FiMusic className="text-[var(--ink-subtle)]" size={20} />
            </div>
          )}
          <div
            className={`absolute -top-2 -left-2 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold tabular-nums border ${rankBadgeClass}`}
          >
            {rank}
          </div>
          {isFirst && (
            <TbCrown
              className="absolute -top-4 -right-2 text-yellow-500 rotate-12 pointer-events-none"
              size={16}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`font-semibold text-lg truncate ${
                isFirst ? 'text-yellow-600 dark:text-yellow-400' : 'text-[var(--ink)]'
              }`}
            >
              {dj.stage_name}
            </p>
            {isMine && (
              <span className="text-[10px] uppercase tracking-wider
                               bg-[var(--surface-hover)] text-[var(--ink-muted)]
                               border border-[var(--hairline)]
                               px-2 py-0.5 rounded-full">
                Your track
              </span>
            )}
          </div>
          <a
            href={dj.music_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-subtle)] hover:text-[var(--ink)] transition-colors mt-0.5"
          >
            <FiPlayCircle />
            Listen
          </a>
        </div>

        <div className="text-right shrink-0">
          <p className="text-2xl font-semibold tabular-nums flex items-center gap-1.5 justify-end text-[var(--ink)]">
            <FiTrendingUp className="text-[var(--ink-subtle)] text-base" />
            {votes}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--ink-subtle)]">
            votes
          </p>
        </div>

        {isMine ? (
          <button
            disabled
            title="You can't vote for your own track"
            className="shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium
                       bg-[var(--surface)] text-[var(--ink-subtle)]
                       border border-[var(--hairline)] cursor-not-allowed
                       inline-flex items-center gap-1.5"
          >
            <FiMusic />
            Your track
          </button>
        ) : (
          <button
            onClick={onVote}
            disabled={voted}
            className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium
                        inline-flex items-center gap-1.5 transition-all
                        ${
                          voted
                            ? 'bg-[var(--surface)] text-[var(--ink-subtle)] border border-[var(--hairline)] cursor-not-allowed'
                            : 'bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 active:scale-[0.98]'
                        }`}
          >
            {voted ? (
              <>
                <FiCheckCircle />
                Voted
              </>
            ) : (
              <>
                <FiHeart />
                Vote
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
          className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--surface)] border border-[var(--hairline)] animate-pulse"
        >
          <div className="w-16 h-16 rounded-xl bg-[var(--surface-hover)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded bg-[var(--surface-hover)]" />
            <div className="h-3 w-20 rounded bg-[var(--surface)]" />
          </div>
          <div className="h-8 w-16 rounded bg-[var(--surface)]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--surface)]">
      <FiMusic className="mx-auto text-5xl text-[var(--ink-subtle)] mb-4" />
      <p className="text-[var(--ink-muted)] mb-1 font-medium">
        The lineup is empty.
      </p>
      <p className="text-sm text-[var(--ink-subtle)]">
        Check back soon — DJs drop here when the night starts.
      </p>
    </div>
  );
}

function NoResults({ query, onClear }) {
  return (
    <div className="text-center py-20 rounded-2xl border border-dashed border-[var(--hairline)] bg-[var(--surface)]">
      <FiSearch className="mx-auto text-5xl text-[var(--ink-subtle)] mb-4" />
      <p className="text-[var(--ink-muted)] mb-1 font-medium">
        No DJs match "{query}"
      </p>
      <button
        onClick={onClear}
        className="mt-3 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)] inline-flex items-center gap-1.5"
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
      className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full
                 bg-[var(--canvas)]/90 backdrop-blur
                 border border-[var(--hairline)]
                 text-[var(--ink-muted)] hover:text-[var(--ink)]
                 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.5)]
                 flex items-center justify-center transition-all hover:-translate-y-0.5"
    >
      <FiChevronUp size={20} />
    </button>
  );
}