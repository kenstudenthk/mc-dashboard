import { supabase, REMEMBER_ME_KEY } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthIdentity {
  email: string;
  user: User;
  session: Session;
}

export const authService = {
  /**
   * Sign in with email + password.
   *
   * @param remember - true → session stored in localStorage (persists across browser restarts);
   *                   false → stored in sessionStorage (cleared when the tab closes).
   *
   * Sets REMEMBER_ME_KEY *before* calling Supabase so the custom storage
   * adapter in src/lib/supabase.ts routes the session token to the right store.
   */
  signIn: async (email: string, password: string, remember = true): Promise<AuthIdentity> => {
    localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error('Sign in failed');
    return { email: data.user.email!, user: data.user, session: data.session };
  },

  /** Return the current session, or null if not signed in. */
  getSession: async (): Promise<AuthIdentity | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return { email: session.user.email!, user: session.user, session };
  },

  /** Sign out and redirect to /login. */
  signOut: async (): Promise<void> => {
    localStorage.removeItem(REMEMBER_ME_KEY);
    await supabase.auth.signOut();
    window.location.href = '/login';
  },

  /**
   * Send a password-reset email.
   * Supabase will include a magic link that redirects back to /login,
   * where the PASSWORD_RECOVERY auth event is detected.
   */
  resetPasswordForEmail: async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  },

  /** Update the current user's password (used in change-password + reset-password screens). */
  updatePassword: async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  },

  /**
   * Clear the first-time login flag stored in user_metadata.
   * Call this after a successful forced password change.
   */
  clearForcePasswordChange: async (): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      data: { force_password_change: false },
    });
    if (error) throw error;
  },

  /**
   * Subscribe to auth-state changes (sign-in, sign-out, token refresh, recovery).
   * Returns the subscription object — call .unsubscribe() in the cleanup function.
   */
  onAuthStateChange: (callback: (identity: AuthIdentity | null) => void) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        callback({ email: session.user.email!, user: session.user, session });
      } else {
        callback(null);
      }
    });
  },
};
