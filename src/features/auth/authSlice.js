import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';

// ---------------------------------------------------------------
// Fetch the user's profile AND their admin status.
// The admins table is the source of truth for admin-ness
// (profiles.role no longer decides it).
// ---------------------------------------------------------------
export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId, { rejectWithValue }) => {
    if (!userId) return rejectWithValue('no_user_id');
    
    const [profileRes, adminRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('admins').select('id, role').eq('id', userId).maybeSingle(),
    ]);

    if (profileRes.error) return rejectWithValue(profileRes.error.message);

    return {
      ...profileRes.data,
      is_admin: !!adminRes.data,
      admin_role: adminRes.data?.role ?? null,
    };
  }
);

export const signIn = createAsyncThunk(
  'auth/signIn',
  async ({ email, password }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return rejectWithValue(error.message);
    return data.user;
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async ({ email, password, username }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return rejectWithValue(error.message);
    return data.user;
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await supabase.auth.signOut();
});

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, profile: null, loading: false, error: null },
  reducers: {
    setUser(state, action) {
      state.user = action.payload;
    },
    updateBalance(state, action) {
      if (state.profile) state.profile.coin_balance = action.payload;
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ---- fetchProfile ----
      .addCase(fetchProfile.pending, (s) => {
        s.error = null;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.profile = a.payload;
      })
      .addCase(fetchProfile.rejected, (s, a) => {
        s.error = a.payload || a.error.message;
      })

      // ---- signIn ----
      .addCase(signIn.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(signIn.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
      })
      .addCase(signIn.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // ---- signUp ----
      .addCase(signUp.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(signUp.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload;
      })
      .addCase(signUp.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload || a.error.message;
      })

      // ---- signOut ----
      .addCase(signOut.fulfilled, (s) => {
        s.user = null;
        s.profile = null;
      });
  },
});

export const { setUser, updateBalance, clearAuthError } = authSlice.actions;
export default authSlice.reducer;