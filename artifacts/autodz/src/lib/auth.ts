import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

interface SupabaseStorageSession {
  access_token?: string;
  user?: {
    id?: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      name?: string;
    };
  };
}

const DEV_TOKEN_KEY = "autodz.dev.access_token";

function safeParseJson(value: string | null) {
  if (!value) return undefined;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function isSupabaseSession(value: unknown): value is SupabaseStorageSession {
  return typeof value === "object" && value !== null && "access_token" in value;
}

function findSupabaseSession() {
  if (typeof window === "undefined") return undefined;

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;

    const parsed = safeParseJson(window.localStorage.getItem(key));
    if (isSupabaseSession(parsed)) return parsed;
  }

  return undefined;
}

export function getAuthToken() {
  if (typeof window === "undefined") return null;

  return findSupabaseSession()?.access_token ?? window.localStorage.getItem(DEV_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  const session = findSupabaseSession();
  const user = session?.user;

  if (!user?.id) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name,
  };
}

export function configureApiAuth() {
  setAuthTokenGetter(getAuthToken);
}
