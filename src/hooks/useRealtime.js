import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../lib/supabaseClient';
import { realtimeVoteUpdate, fetchMyVotes } from '../features/djs/djSlice';
import { fetchShoutoutFeed, fetchCoinLeaderboard } from '../features/coins/coinClaimSlice';

export function useRealtime() {
  const dispatch = useDispatch();
  const userId = useSelector((s) => s.auth.user?.id);

  useEffect(() => {
    if (!userId) return;

    // Vote counts (leaderboard numbers)
    const voteChannel = supabase
      .channel('rt-vote-counts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vote_counts' },
        (payload) => {
          const row = payload.new || payload.old;
          if (!row?.dj_id) return;

          if (typeof row.total_votes !== 'number') {
            supabase
              .from('vote_counts')
              .select('dj_id, total_votes')
              .eq('dj_id', row.dj_id)
              .single()
              .then(({ data }) => {
                if (data) dispatch(realtimeVoteUpdate(data));
              });
            return;
          }

          dispatch(
            realtimeVoteUpdate({
              dj_id: row.dj_id,
              total_votes: row.total_votes,
            })
          );
        }
      )
      .subscribe();

    // Votes (for syncing this user's voted list across tabs)
    const voteInsertChannel = supabase
      .channel('rt-votes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'votes' },
        (payload) => {
          if (payload.new?.user_id === userId) dispatch(fetchMyVotes());
        }
      )
      .subscribe();

    // NEW: when a coin is claimed, refresh the coin leaderboard and shoutout feed
    // for all connected clients, live.
    const coinsChannel = supabase
      .channel('rt-coins')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'coins' },
        (payload) => {
          // Only react if a coin just got claimed
          if (payload.new?.claimed_by && !payload.old?.claimed_by) {
            dispatch(fetchCoinLeaderboard());
            if (payload.new.shoutout) dispatch(fetchShoutoutFeed());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(voteChannel);
      supabase.removeChannel(voteInsertChannel);
      supabase.removeChannel(coinsChannel);
    };
  }, [dispatch, userId]);
}