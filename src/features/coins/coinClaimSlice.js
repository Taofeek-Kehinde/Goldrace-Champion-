import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import { fetchProfile, updateBalance } from '../auth/authSlice';

// ---------------------------------------------------------------
// Fetch a coin by token — used by the /gold/:token page
// ---------------------------------------------------------------
export const fetchCoinByToken = createAsyncThunk(
  'coinClaim/fetchByToken',
  async (token, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('coins')
      .select(
        'id, token, club_id, claimed_by, claimed_at, claimer_name, clubs(name)'
      )
      .eq('token', token)
      .maybeSingle();

    if (error) return rejectWithValue(error.message);
    if (!data) return rejectWithValue('invalid_token');
    return data;
  }
);

// ---------------------------------------------------------------
// Upload a selfie to Storage and return its public URL
// ---------------------------------------------------------------
export const uploadSelfie = createAsyncThunk(
  'coinClaim/uploadSelfie',
  async ({ blob, userId }, { rejectWithValue }) => {
    if (!blob) return rejectWithValue('no_blob');
    if (!userId) return rejectWithValue('not_authenticated');

    const filename = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.jpg`;

    const { error: upErr } = await supabase.storage
      .from('coin-selfies')
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (upErr) return rejectWithValue(upErr.message);

    const { data: pub } = supabase.storage
      .from('coin-selfies')
      .getPublicUrl(filename);

    return { publicUrl: pub.publicUrl, path: filename };
  }
);

// ---------------------------------------------------------------
// Claim a coin via the atomic RPC.
//
// On success we refresh two things:
//   1. The user's profile → updates navbar coin balance
//   2. The leaderboard    → updates their position + coin count
//      on this screen immediately, without waiting for a page reload
// ---------------------------------------------------------------
export const claimCoin = createAsyncThunk(
  'coinClaim/claim',
  async ({ token, shoutout, photoUrl }, { dispatch, rejectWithValue }) => {
    const { data, error } = await supabase.rpc('claim_coin', {
      p_token: token,
      p_shoutout: shoutout || null,
      p_photo_url: photoUrl || null,
    });

    if (error) return rejectWithValue(error.message);
    if (!data?.success) return rejectWithValue(data?.error || 'claim_failed');

    // 1. Refresh the claimer's profile so the navbar balance updates
    const { data: auth } = await supabase.auth.getUser();
    if (auth?.user?.id) {
      // Optimistic: if the RPC returned the new balance, apply it now
      if (typeof data.new_balance === 'number') {
        dispatch(updateBalance(data.new_balance));
      }
      // Server as source of truth
      dispatch(fetchProfile(auth.user.id));
    }

    // 2. Refresh the leaderboard so this claim shows up immediately
    dispatch(fetchCoinLeaderboard());

    return data;
  }
);

// ---------------------------------------------------------------
// Coin leaderboard (buyers ranked by coins)
// ---------------------------------------------------------------
export const fetchCoinLeaderboard = createAsyncThunk(
  'coinClaim/leaderboard',
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('coin_leaderboard')
      .select('*')
      .order('rank', { ascending: true })
      .limit(100);

    if (error) return rejectWithValue(error.message);
    return data || [];
  }
);

// ---------------------------------------------------------------
// Shoutout feed (public, read-only, from claimed coins)
// ---------------------------------------------------------------
export const fetchShoutoutFeed = createAsyncThunk(
  'coinClaim/shoutouts',
  async (_, { rejectWithValue }) => {
    const { data, error } = await supabase
      .from('coins')
      .select('id, claimer_name, shoutout, photo_url, claimed_at, clubs(name)')
      .not('shoutout', 'is', null)
      .order('claimed_at', { ascending: false })
      .limit(50);

    if (error) return rejectWithValue(error.message);
    return data || [];
  }
);

const coinClaimSlice = createSlice({
  name: 'coinClaim',
  initialState: {
    coin: null,
    coinLoading: false,
    coinError: null,

    uploadingSelfie: false,
    selfieError: null,

    claiming: false,
    claimResult: null,
    claimError: null,
    justClaimed: false,

    leaderboard: [],
    leaderboardLoading: false,

    shoutouts: [],
    shoutoutsLoading: false,
  },
  reducers: {
    resetClaim(state) {
      state.coin = null;
      state.coinError = null;
      state.claimResult = null;
      state.claimError = null;
      state.claiming = false;
      state.uploadingSelfie = false;
      state.selfieError = null;
      state.justClaimed = false;
    },
    prependShoutout(state, action) {
      state.shoutouts.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- fetchCoinByToken ----
      .addCase(fetchCoinByToken.pending, (s) => {
        s.coinLoading = true;
        s.coinError = null;
      })
      .addCase(fetchCoinByToken.fulfilled, (s, a) => {
        s.coinLoading = false;
        s.coin = a.payload;
      })
      .addCase(fetchCoinByToken.rejected, (s, a) => {
        s.coinLoading = false;
        s.coinError = a.payload || a.error.message;
      })

      // ---- uploadSelfie ----
      .addCase(uploadSelfie.pending, (s) => {
        s.uploadingSelfie = true;
        s.selfieError = null;
      })
      .addCase(uploadSelfie.fulfilled, (s) => {
        s.uploadingSelfie = false;
      })
      .addCase(uploadSelfie.rejected, (s, a) => {
        s.uploadingSelfie = false;
        s.selfieError = a.payload || a.error.message;
      })

      // ---- claimCoin ----
      .addCase(claimCoin.pending, (s) => {
        s.claiming = true;
        s.claimError = null;
      })
      .addCase(claimCoin.fulfilled, (s, a) => {
        s.claiming = false;
        s.claimResult = a.payload;
        s.justClaimed = true;
        if (s.coin && a.payload?.claimed_by) {
          s.coin.claimed_by = a.payload.claimed_by;
        }
      })
      .addCase(claimCoin.rejected, (s, a) => {
        s.claiming = false;
        s.claimError = a.payload || a.error.message;
      })

      // ---- leaderboard ----
      .addCase(fetchCoinLeaderboard.pending, (s) => {
        s.leaderboardLoading = true;
      })
      .addCase(fetchCoinLeaderboard.fulfilled, (s, a) => {
        s.leaderboardLoading = false;
        s.leaderboard = a.payload;
      })
      .addCase(fetchCoinLeaderboard.rejected, (s) => {
        s.leaderboardLoading = false;
      })

      // ---- shoutouts ----
      .addCase(fetchShoutoutFeed.pending, (s) => {
        s.shoutoutsLoading = true;
      })
      .addCase(fetchShoutoutFeed.fulfilled, (s, a) => {
        s.shoutoutsLoading = false;
        s.shoutouts = a.payload;
      })
      .addCase(fetchShoutoutFeed.rejected, (s) => {
        s.shoutoutsLoading = false;
      });
  },
});

export const { resetClaim, prependShoutout } = coinClaimSlice.actions;
export default coinClaimSlice.reducer;