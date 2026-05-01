import { createClient } from '@supabase/supabase-js';

/**
 * Key used to store the "Remember Me" preference.
 * Set to 'false' (string) to use sessionStorage; anything else → localStorage.
 */
export const REMEMBER_ME_KEY = 'mc_remember_me';

/**
 * Custom storage adapter for Supabase auth.
 *
 * Routes session tokens to localStorage (persistent across browser sessions)
 * or sessionStorage (cleared when the tab closes) based on the Remember Me
 * preference the user set at sign-in time.
 *
 * The preference is stored in localStorage under REMEMBER_ME_KEY so it
 * survives page reloads even when the session itself is in sessionStorage.
 */
const rememberMeStorage: Storage = {
  get length() {
    return localStorage.length + sessionStorage.length;
  },
  key(index: number) {
    return localStorage.key(index);
  },
  getItem(key: string): string | null {
    const remember = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
    return remember ? localStorage.getItem(key) : sessionStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    const remember = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
    if (remember) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem(key: string): void {
    // Remove from both to avoid stale tokens after preference changes.
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  },
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — ' +
    'copy .env.example to .env.local and fill in your Supabase project values.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: rememberMeStorage,
    persistSession: true,
    detectSessionInUrl: true,  // Handles magic-link / recovery tokens in URL hash
  },
});
