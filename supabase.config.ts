import { createClient } from '@supabase/supabase-js'

/**
 * Replace these with your actual Supabase project values.
 * Find them at: https://supabase.com/dashboard → your project → Settings → API
 *
 * For local dev, you can also use EXPO_PUBLIC_* env vars in a .env file.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})
