// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Check that .env is at the project root ' +
    'and that you restarted `npm run dev` after creating it.'
  );
}

if (!key) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Check that .env is at the project root ' +
    'and that you restarted `npm run dev` after creating it.'
  );
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

if (import.meta.env.DEV) {
  window.supabase = supabase;
}