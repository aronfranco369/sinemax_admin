import { createClient } from '@supabase/supabase-js';

/* "kitabu" Supabase project. The publishable key is safe to ship to the
   browser; override via env vars for other environments. */
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nawgqawbwmfvhywfvoke.supabase.co';
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_yw3Xcr3TTh5TfcVknVRkMQ_kv6Pq5lh';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
