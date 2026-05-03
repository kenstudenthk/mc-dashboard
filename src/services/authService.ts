import { supabase, supabaseAdmin } from '../lib/supabase';

interface AuthIdentity {
  email: string;
  name?: string;
}

export const authService = {
  getIdentity: async (): Promise<AuthIdentity | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.email) return null;
    return {
      email: session.user.email,
      name: session.user.user_metadata?.full_name,
    };
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('userEmail');
    await supabase.auth.signOut();
  },

  sendPasswordResetEmail: async (email: string): Promise<{ error: any }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });
    return { error };
  },

  inviteUser: async (email: string): Promise<{ error: any }> => {
    if (!supabaseAdmin) {
      console.warn("Supabase Admin client not initialized. Falling back to magic link for local dev.");
      // Fallback for local development if the service role key isn't present
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        }
      });
      return { error };
    }

    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${window.location.origin}/`,
      data: {
        force_password_change: true
      }
    });
    return { error };
  }
};
