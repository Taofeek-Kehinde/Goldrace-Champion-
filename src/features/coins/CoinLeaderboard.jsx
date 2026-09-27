import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiAward, FiTrendingUp } from 'react-icons/fi';
import { FaCoins } from 'react-icons/fa';
import { TbCrown } from 'react-icons/tb';
import { fetchCoinLeaderboard } from './coinClaimSlice';

export default function CoinLeaderboard() {
  const dispatch = useDispatch();
  const { leaderboard, leaderboardLoading } = useSelector((s) => s.coinClaim);
  const myUserId = useSelector((s) => s.auth.user?.id);

  useEffect(() => {
    dispatch(fetchCoinLeaderboard());
  }, [dispatch]);

  if (leaderboardLoading && leaderboard.length === 0) {
    return (
      <div className="relative min-h-screen bg-[#08060f] flex items-center justify-center">
        <p className="text-neutral-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#08060f]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[32rem] h-[32rem] rounded-full bg-yellow-500/15 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-[30rem] h-[30rem] rounded-full bg-purple-500/20 blur-[130px] animate-pulse-slower" />
      </div>

      <div className="relative max-w-3xl mx-auto p-6">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-2">
            <FaCoins className="text-yellow-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.7)]" />
            <span className="shimmer-text">Coin Leaderboard</span>
          </h1>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] backdrop-blur">
            <FaCoins className="mx-auto text-5xl text-neutral-700 mb-4" />
            <p className="text-neutral-300 mb-1 font-medium">No coins claimed yet.</p>
            <p className="text-sm text-neutral-500">
              Scan a coin's QR at the venue to enter the board.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((row) => {
              const rank = row.rank;
              const isMe = row.id === myUserId;
              const isPodium = rank <= 3;

              return (
                <div
                  key={row.id}
                  className={`
                    group relative flex items-center gap-4 p-4 rounded-2xl
                    transition-all duration-300 ease-out
                    bg-white/[0.04] backdrop-blur-xl
                    border ${
                      isMe
                        ? 'border-purple-400/50 shadow-[0_8px_40px_-12px_rgba(168,85,247,0.7)]'
                        : 'border-white/10 hover:border-purple-400/40'
                    }
                    hover:-translate-y-0.5
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

                  <div className="relative shrink-0">
                    <div
                      className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        font-extrabold tabular-nums text-lg
                        border backdrop-blur
                        ${
                          rank === 1
                            ? 'bg-yellow-400/15 border-yellow-400/40 text-yellow-300 shadow-[0_0_24px_-6px_rgba(250,204,21,0.7)]'
                            : rank === 2
                            ? 'bg-slate-300/10 border-slate-300/30 text-slate-200'
                            : rank === 3
                            ? 'bg-orange-400/15 border-orange-400/40 text-orange-300'
                            : 'bg-white/[0.04] border-white/10 text-purple-300'
                        }
                      `}
                    >
                      {rank}
                    </div>
                    {rank === 1 && (
                      <TbCrown
                        className="absolute -top-3 -right-2 text-yellow-300 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] rotate-12"
                        size={18}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-lg truncate text-white/90 group-hover:text-white transition-colors">
                        {row.username}
                      </p>
                      {isMe && (
                        <span className="text-[10px] uppercase tracking-wider bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-2xl font-extrabold tabular-nums flex items-center gap-1.5 justify-end text-white">
                      <FiTrendingUp className="text-yellow-400/70 text-base" />
                      {row.coin_count}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-neutral-500">
                      coins
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}