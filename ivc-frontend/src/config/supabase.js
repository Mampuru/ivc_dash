import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_APP_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error(
    'Missing VITE_SUPABASE_URL. Did you forget to add it to your .env file?'
  )
}

if (!supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_ANON_KEY. Did you forget to add it to your .env file?'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey);
        