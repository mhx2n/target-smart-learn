import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, isAdmin: false, loading: true });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, isAdmin: false, loading: true });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        checkAdmin(session.user);
      } else {
        setState({ user: null, isAdmin: false, loading: false });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkAdmin(session.user);
      } else {
        setState({ user: null, isAdmin: false, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkAdmin(user: User) {
    const adminEmails = ["himel2331@gmail.com"];
    const isAdmin = adminEmails.includes((user.email || "").toLowerCase());

    setState({
      user,
      isAdmin,
      loading: false,
    });
   }

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
