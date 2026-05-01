import { supabase } from '../lib/supabase';

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
};
