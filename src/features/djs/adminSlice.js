import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';
import { fetchDjs } from './djSlice';

export const adminAddDj = createAsyncThunk(
  'admin/addDj',
  async ({ stageName, musicLink, coverUrl }, { dispatch, rejectWithValue }) => {
    const stage = stageName.trim();
    const link = musicLink.trim();
    if (!stage || !link) {
      return rejectWithValue('Stage name and music link are required');
    }

    const { data: auth } = await supabase.auth.getUser();
    const adminUserId = auth?.user?.id;
    if (!adminUserId) return rejectWithValue('Not authenticated');

    // Admin-added DJs have no user account of their own, so user_id is NULL.
    // created_by records which admin added the row. This lets the
    // partial unique index (on user_id where not null) coexist cleanly:
    // admins can add unlimited DJs, but real users are still limited to one.
    const { data, error } = await supabase
      .from('djs')
      .insert({
        user_id: null,
        created_by: adminUserId,
        stage_name: stage,
        music_link: link,
        cover_url: coverUrl || null,
      })
      .select()
      .single();

    if (error) return rejectWithValue(error.message);

    // Seed vote_counts so the leaderboard sort has a value to work with
    await supabase
      .from('vote_counts')
      .insert({ dj_id: data.id, total_votes: 0 });

    // Refresh the public leaderboard for all connected clients
    dispatch(fetchDjs());

    return data;
  }
);

export const adminDeleteDj = createAsyncThunk(
  'admin/deleteDj',
  async ({ djId }, { dispatch, rejectWithValue }) => {
    const { error } = await supabase.from('djs').delete().eq('id', djId);
    if (error) return rejectWithValue(error.message);
    dispatch(fetchDjs());
    return { djId };
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    submitting: false,
    deleting: false,
    error: null,
    lastAdded: null,
  },
  reducers: {
    clearAdminError(state) {
      state.error = null;
    },
    clearLastAdded(state) {
      state.lastAdded = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminAddDj.pending, (s) => {
        s.submitting = true;
        s.error = null;
      })
      .addCase(adminAddDj.fulfilled, (s, a) => {
        s.submitting = false;
        s.lastAdded = a.payload;
      })
      .addCase(adminAddDj.rejected, (s, a) => {
        s.submitting = false;
        s.error = a.payload || a.error.message;
      })

      .addCase(adminDeleteDj.pending, (s) => {
        s.deleting = true;
        s.error = null;
      })
      .addCase(adminDeleteDj.fulfilled, (s) => {
        s.deleting = false;
      })
      .addCase(adminDeleteDj.rejected, (s, a) => {
        s.deleting = false;
        s.error = a.payload || a.error.message;
      });
  },
});

export const { clearAdminError, clearLastAdded } = adminSlice.actions;
export default adminSlice.reducer;