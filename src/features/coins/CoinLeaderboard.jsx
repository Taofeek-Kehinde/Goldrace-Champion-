import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiAward, FiTrendingUp, FiLoader } from 'react-icons/fi';
import { FaCoins, FaCrown } from 'react-icons/fa';
import { fetchCoinLeaderboard } from '../coins/coinClaimSlice';
import { supabase } from '../../lib/supabaseClient';

export default function CoinLeaderboard() {
  const dispatch = useDispatch();
  const { leaderboard, leaderboardLoading } = useSelector((s) => s.coinClaim);
  const myUserId = useSelector((s) => s.auth.user?.id);
  const isAdmin = useSelector((s) => s.auth.profile?.is_admin === true);

  // Initial fetch on mount
  useEffect(() => {
    dispatch(fetchCoinLeaderboard());
  }, [dispatch]);

  // ---- LIVE UPDATES ----
  // Subscribe to realtime changes on the `coins` table.
  // When any coin is claimed anywhere, refetch the leaderboard.
  useEffect(() => {
    const channel = supabase
      .channel('rt-coins-leaderboard')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'coins' },
        (payload) => {
          const justClaimed = payload.new?.claimed_by && !payload.old?.claimed_by;
          const unclaimed = !payload.new?.claimed_by && payload.old?.claimed_by;
          if (justClaimed || unclaimed) {
            dispatch(fetchCoinLeaderboard());
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'coins' },
        () => {
          // New coin rows created (batch generation) — refetch just in case
          dispatch(fetchCoinLeaderboard());
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[rt] leaderboard channel error');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dispatch]);

  const myRow = useMemo(
    () => leaderboard.find((p) => p.id === myUserId),
    [leaderboard, myUserId]
  );

  return (
    <div className="h-[calc(100dvh-4rem)] flex flex-col overflow-hidden bg-[var(--canvas)]">
      {/* Fixed header */}
      <header className="relative shrink-0 border-b border-[var(--hairline)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl
                              bg-[var(--surface)] border border-[var(--hairline)]">
                <FaCoins className="text-yellow-500/90 text-lg" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--ink)]">
                  Coin Leaderboard
                </h1>
                <p className="text-xs sm:text-sm text-[var(--ink-subtle)] mt-0.5">
                  Top earners this season
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {myRow && (
                <div className="inline-flex items-center gap-2 rounded-full
                                bg-yellow-500/[0.08] border border-yellow-500/30
                                px-3 py-1 text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-yellow-600 dark:text-yellow-400 font-semibold">
                    Your rank
                  </span>
                  <span className="text-yellow-700 dark:text-yellow-300 font-semibold tabular-nums">
                    #{myRow.rank}
                  </span>
                  <span className="text-yellow-600/50 dark:text-yellow-400/50">·</span>
                  <span className="text-yellow-700 dark:text-yellow-300 font-semibold tabular-nums">
                    {myRow.coin_count}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-yellow-600/70 dark:text-yellow-400/70">
                    coins
                  </span>
                </div>
              )}

              {!leaderboardLoading && leaderboard.length > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full
                                 bg-[var(--surface)] border border-[var(--hairline)]
                                 px-3 py-1 text-xs font-medium text-[var(--ink-muted)]">
                  <FiTrendingUp className="text-xs" />
                  {leaderboard.length}{' '}
                  {leaderboard.length === 1 ? 'player' : 'players'}
                </span>
              )}
            </div>
          </div>

          {!myRow && !isAdmin && leaderboard.length > 0 && (
            <p className="mt-3 text-xs text-[var(--ink-subtle)]">
              You're not on the board yet — claim a coin to join.
            </p>
          )}
        </div>
      </header>

      {/* Scrollable list */}
      <main className="relative flex-1 min-h-0 overflow-y-auto scrollbar-thin">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {leaderboardLoading && leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <FiLoader className="animate-spin text-[var(--ink-subtle)]" size={24} />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-20 rounded-2xl
                            border border-dashed border-[var(--hairline)]
                            bg-[var(--surface)]">
              <FiAward className="mx-auto text-3xl text-[var(--ink-subtle)] mb-3" />
              <p className="text-[var(--ink-muted)] font-medium">
                No one's on the board yet.
              </p>
              <p className="text-sm text-[var(--ink-subtle)] mt-1">
                Claims will show up here the moment they land.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((player, idx) => {
                const rank = player.rank ?? idx + 1;
                const isFirst = rank === 1;
                const isSecond = rank === 2;
                const isThird = rank === 3;
                const isMe = player.id === myUserId;

                return (
                  <div
                    key={player.id ?? idx}
                    className={`flex items-center gap-4 p-3 sm:p-4 rounded-xl
                                border transition-colors
                                ${
                                  isFirst
                                    ? 'bg-yellow-500/[0.06] border-yellow-500/30 hover:bg-yellow-500/[0.09]'
                                    : isMe
                                    ? 'bg-[var(--surface-hover)] border-[var(--ink-subtle)]'
                                    : 'bg-[var(--surface)] border-[var(--hairline)] hover:bg-[var(--surface-hover)]'
                                }`}
                  >
                    <div className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border">
                      {isFirst ? (
                        <FaCrown className="text-yellow-400" size={18} />
                      ) : (
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            isSecond
                              ? 'text-slate-400'
                              : isThird
                              ? 'text-orange-500'
                              : 'text-[var(--ink-muted)]'
                          }`}
                        >
                          {rank}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-medium truncate ${
                            isFirst ? 'text-yellow-500' : 'text-[var(--ink)]'
                          }`}
                        >
                          {player.username ?? 'Anonymous'}
                        </p>
                        {isMe && (
                          <span className="text-[10px] uppercase tracking-wider
                                           bg-[var(--surface-hover)] text-[var(--ink-muted)]
                                           border border-[var(--hairline)]
                                           px-2 py-0.5 rounded-full shrink-0">
                            You
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold tabular-nums text-[var(--ink)] inline-flex items-center gap-1.5">
                        <FaCoins className="text-yellow-500/80 text-xs" />
                        {player.coin_count ?? 0}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-[var(--ink-subtle)]">
                        coins
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}