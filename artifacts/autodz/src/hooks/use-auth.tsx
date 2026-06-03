import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  addAuthChangeListener,
  clearStoredSession,
  getAuthUser,
  isSupabaseAuthConfigured,
  signInWithPassword,
  signOutOfSupabase,
  signUpWithPassword,
  type AuthUser,
} from "@/lib/auth";

interface AuthContextValue {
  user: AuthUser | null;
  isConfigured: boolean;
  isDevFallback: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  refresh: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readAuthUser() {
  return getAuthUser();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readAuthUser());
  const isConfigured = isSupabaseAuthConfigured();
  const isDevFallback = !user && import.meta.env.DEV;

  const refresh = () => setUser(readAuthUser());

  useEffect(() => addAuthChangeListener(refresh), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isConfigured,
      isDevFallback,
      async signIn(email, password) {
        await signInWithPassword(email, password);
        refresh();
      },
      async signUp(email, password, name) {
        const result = await signUpWithPassword(email, password, name);
        refresh();

        return { needsEmailConfirmation: !result.session };
      },
      async signOut() {
        await signOutOfSupabase();
        clearStoredSession();
        refresh();
      },
      refresh,
    }),
    [isConfigured, isDevFallback, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
