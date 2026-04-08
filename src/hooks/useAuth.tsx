import { useState, useEffect, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { isBackendConnectivityError, toUserFacingError } from "@/lib/backend";

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isAdmin: false,
  loading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAdmin: false,
    loading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const setLoggedOutState = () => {
      if (!isMounted) return;
      setState({ user: null, isAdmin: false, loading: false });
    };

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;

        if (session?.user) {
          void checkAdmin(session.user);
          return;
        }

        setLoggedOutState();
      })
      .catch(() => {
        setLoggedOutState();
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void checkAdmin(session.user);
      } else {
        setLoggedOutState();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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

  return (
    <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
  );
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    if (isBackendConnectivityError(error)) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    }

    throw toUserFacingError(error, "লগইন");
  }
}

export async function signUp(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  } catch (error) {
    if (isBackendConnectivityError(error)) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
    }

    throw toUserFacingError(error, "অ্যাকাউন্ট তৈরি");
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    if (isBackendConnectivityError(error)) {
      const { error: localError } = await supabase.auth.signOut({ scope: "local" });
      if (!localError) return;
      throw toUserFacingError(localError, "লগআউট");
    }

    throw toUserFacingError(error, "লগআউট");
  }
}
