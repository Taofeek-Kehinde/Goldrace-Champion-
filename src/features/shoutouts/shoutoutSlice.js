import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../lib/supabaseClient';

// Only handles the clubs list now.
// The shoutout feed lives in coinClaimSlice (querying `coins`).
export const fetchClubs = createAsyncThunk('shoutouts/clubs', async () => {
  const { data, error } = await supabase.from('clubs').select('*').order('name');
  if (error) throw error;
  return data;
});

const shoutoutSlice = createSlice({
  name: 'shoutouts',
  initialState: {
    clubs: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchClubs.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(fetchClubs.fulfilled, (s, a) => {
        s.loading = false;
        s.clubs = a.payload;
      })
      .addCase(fetchClubs.rejected, (s, a) => {
        s.loading = false;
        s.error = a.error.message;
      });
  },
});

export default shoutoutSlice.reducer;