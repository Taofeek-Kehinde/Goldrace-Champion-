import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import { fetchProfile } from '../auth/authSlice';

// ---------------------------------------------------------------
// Shared comparator — the ONLY place leaderboard ordering is defined.
//  1. Highest votes first
//  2. Same votes → earliest submission first
//  3. Final tie-break → stable by id (deterministic across clients)
// ---------------------------------------------------------------
export function sortLeaderboard(list) {
  return [...list].sort((a, b) => {
    const av = a.vote_counts?.total_votes ?? 0;
    const bv = b.vote_counts?.total_votes ?? 0;
    if (bv !== av) return bv - av;

    const at = a.created_at ? new Date(a.created_at).getTime() : 0;
    const bt = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (at !== bt) return at - bt;

    return String(a.id).localeCompare(String(b.id));
  });
}

// ---------------------------------------------------------------
// Fetch all DJs with their vote counts, then sort with tie-breaks
// ---------------------------------------------------------------
export const fetchDjs = createAsyncThunk('djs/fetch', async () => {
  const { data, error } = await supabase
    .from('djs')
    .select(`
      id,
      user_id,
      stage_name,
      music_link,
      cover_url,
      created_at,
      vote_counts(total_votes)
    `)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return sortLeaderboard(data || []);
});

// ---------------------------------------------------------------
// Fetch the current user's past votes (so Vote button stays
// disabled after a page refresh)
// ---------------------------------------------------------------
export const fetchMyVotes = createAsyncThunk(
  'djs/fetchMyVotes',
  async (_, { getState }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return [];
    const { data, error } = await supabase
      .from('votes')
      .select('dj_id')
      .eq('user_id', userId);
    if (error) throw error;
    return data.map((v) => v.dj_id);
  }
);

// ---------------------------------------------------------------
// Submit a track — one per user (enforced by unique constraint)
// ---------------------------------------------------------------
export const submitDj = createAsyncThunk(
  'djs/submit',
  async ({ stageName, musicLink, coverUrl }, { getState, dispatch }) => {
    const userId = getState().auth.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('djs')
      .insert({
        user_id: userId,
        stage_name: stageName.trim(),
        music_link: musicLink.trim(),
        cover_url: coverUrl,
      })
      .select()
      .single();
    if (error) throw error;

    // Seed the vote count row so sorting works immediately
    await supabase
      .from('vote_counts')
      .insert({ dj_id: data.id, total_votes: 0 });

    // Refresh profile so role becomes 'dj' client-side
    dispatch(fetchProfile(userId));

    return data;
  }
);

// ---------------------------------------------------------------
// Cast a vote — optimistic bump so UI is instant, rolled back on error
// ---------------------------------------------------------------
export const castVote = createAsyncThunk(
  'djs/vote',
  async ({ djId }, { getState, dispatch, rejectWithValue }) => {
    const userId = getState().auth.user?.id;
    if (!userId) return rejectWithValue('Not authenticated');

    // Bump locally right now
    dispatch(optimisticVote(djId));

    const { error } = await supabase
      .from('votes')
      .insert({ dj_id: djId, user_id: userId });

    if (error) {
      // Roll back the local bump
      dispatch(rollbackVote(djId));
      if (error.code === '23505') return rejectWithValue('already_voted');
      return rejectWithValue(error.message);
    }
    return { djId };
  }
);

const djSlice = createSlice({
  name: 'djs',
  initialState: {
    list: [],
    loading: false,
    error: null,
    votedDjIds: [],
  },
  reducers: {
    // Fired by Realtime when the DB trigger updates vote_counts.
    // The payload is { dj_id, total_votes } — authoritative value.
    realtimeVoteUpdate(state, action) {
      const { dj_id, total_votes } = action.payload;
      const dj = state.list.find((d) => d.id === dj_id);
      if (!dj) return;
      dj.vote_counts = { total_votes };
      state.list = sortLeaderboard(state.list);
    },

    // Client-side optimistic bump (no server confirmation yet)
    optimisticVote(state, action) {
      const dj = state.list.find((d) => d.id === action.payload);
      if (!dj) return;
      const current = dj.vote_counts?.total_votes ?? 0;
      dj.vote_counts = { total_votes: current + 1 };
      state.list = sortLeaderboard(state.list);
    },

    // Revert an optimistic bump if the server rejected the insert
    rollbackVote(state, action) {
      const dj = state.list.find((d) => d.id === action.payload);
      if (!dj) return;
      const current = dj.vote_counts?.total_votes ?? 0;
      dj.vote_counts = { total_votes: Math.max(current - 1, 0) };
      state.list = sortLeaderboard(state.list);
    },

    clearDjError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ------- fetchDjs -------
      .addCase(fetchDjs.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchDjs.fulfilled, (s, a) => {
        s.loading = false;
        s.list = a.payload; // already sorted
      })
      .addCase(fetchDjs.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      })

      // ------- fetchMyVotes -------
      .addCase(fetchMyVotes.fulfilled, (s, a) => {
        s.votedDjIds = a.payload;
      })
      .addCase(fetchMyVotes.rejected, (s, a) => {
        s.error = a.error.message;
      })

      // ------- submitDj -------
      .addCase(submitDj.fulfilled, (s, a) => {
        s.list.push({ ...a.payload, vote_counts: { total_votes: 0 } });
        s.list = sortLeaderboard(s.list);
      })
      .addCase(submitDj.rejected, (s, a) => {
        s.error = a.error.message;
      })

      // ------- castVote -------
      .addCase(castVote.fulfilled, (s, a) => {
        if (!s.votedDjIds.includes(a.payload.djId)) {
          s.votedDjIds.push(a.payload.djId);
        }
      })
      .addCase(castVote.rejected, (s, a) => {
        const djId = a.meta.arg.djId;
        if (a.payload === 'already_voted') {
          // Already-voted is not an error — keep the id marked
          if (!s.votedDjIds.includes(djId)) s.votedDjIds.push(djId);
          return;
        }
        s.error = a.payload || a.error.message;
      });
  },
});

export const {
  realtimeVoteUpdate,
  optimisticVote,
  rollbackVote,
  clearDjError,
} = djSlice.actions;

export default djSlice.reducer;