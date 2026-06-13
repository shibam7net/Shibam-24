import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string) => {
    if (username !== 'shib') {
      return { error: 'بيانات الدخول غير صحيحة' };
    }
    // First ensure admin user exists
    try {
      await supabase.functions.invoke('admin-seed');
    } catch {}

    const { error } = await supabase.auth.signInWithPassword({
      email: 'shib@shibampress.local',
      password,
    });
    if (error) return { error: 'بيانات الدخول غير صحيحة' };
    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return { user, loading, login, logout };
}
