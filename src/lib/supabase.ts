import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string,
);

// Admin client for backend/privileged operations
// Note: VITE_SUPABASE_SERVICE_ROLE_KEY is injected during build on Cloudflare Pages
export const supabaseAdmin = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;
