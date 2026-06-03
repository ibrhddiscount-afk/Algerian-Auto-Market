import { setAuthTokenGetter } from "@workspace/api-client-react";

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: AuthUser;
}

interface SupabaseAuthUser {
  id?: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

interface SupabaseAuthResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: SupabaseAuthUser;
}

interface SupabaseStorageSession {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  user?: SupabaseAuthUser;
}

const AUTH_STORAGE_KEY = "autodz.auth.session";
const DEV_TOKEN_KEY = "autodz.dev.access_token";
const AUTH_EVENT = "autodz-auth-changed";

function getSupabaseUrl() {
  return import.meta.env.VITE_SUPABASE_URL as string | undefined;
}

function getSupabaseAnonKey() {
  return import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
}

export function isSupabaseAuthConfigured() {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

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

function toAuthUser(user: SupabaseAuthUser | undefined): AuthUser | undefined {
  if (!user?.id) return undefined;

  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name ?? user.user_metadata?.name,
  };
}

function toAuthSession(response: SupabaseAuthResponse): AuthSession | null {
  const user = toAuthUser(response.user);

  if (!response.access_token || !user) return null;

  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: response.expires_in
      ? Math.floor(Date.now() / 1000) + response.expires_in
      : undefined,
    user,
  };
}

function getStorage() {
  return typeof window === "undefined" ? undefined : window.localStorage;
}

function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function addAuthChangeListener(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;

  window.addEventListener(AUTH_EVENT, listener);
  window.addEventListener("storage", listener);

  return () => {
    window.removeEventListener(AUTH_EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export function readStoredSession(): AuthSession | null {
  const parsed = safeParseJson(getStorage()?.getItem(AUTH_STORAGE_KEY) ?? null);

  if (!parsed || typeof parsed !== "object") return null;

  const session = parsed as Partial<AuthSession>;

  if (!session.accessToken || !session.user?.id) return null;

  return session as AuthSession;
}

export function writeStoredSession(session: AuthSession) {
  getStorage()?.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  emitAuthChanged();
}

export function clearStoredSession() {
  getStorage()?.removeItem(AUTH_STORAGE_KEY);
  emitAuthChanged();
}

function findExternalSupabaseSession() {
  const storage = getStorage();
  if (!storage) return undefined;

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith("sb-") || !key.endsWith("-auth-token")) continue;

    const parsed = safeParseJson(storage.getItem(key));
    if (isSupabaseSession(parsed)) return parsed;
  }

  return undefined;
}

async function requestSupabaseAuth<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const supabaseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!supabaseUrl || !anonKey) {
    throw new Error("Supabase Auth n'est pas configuré côté frontend.");
  }

  const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1${path}`, {
    ...options,
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  const data = (await response.json().catch(() => null)) as T | { error_description?: string; msg?: string; message?: string } | null;

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? "error_description" in data
          ? data.error_description
          : "msg" in data
            ? data.msg
            : "message" in data
              ? data.message
              : undefined
        : undefined;

    throw new Error(message ?? `Supabase Auth a répondu ${response.status}.`);
  }

  return data as T;
}

export async function signInWithPassword(email: string, password: string) {
  const data = await requestSupabaseAuth<SupabaseAuthResponse>("/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const session = toAuthSession(data);

  if (!session) throw new Error("Session Supabase invalide.");

  writeStoredSession(session);
  return session;
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  const data = await requestSupabaseAuth<SupabaseAuthResponse>("/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      data: {
        full_name: name,
        name,
      },
    }),
  });
  const session = toAuthSession(data);

  if (session) writeStoredSession(session);

  return { session, user: toAuthUser(data.user) };
}

export async function signOutOfSupabase() {
  const token = getAuthToken();

  if (token && isSupabaseAuthConfigured()) {
    await requestSupabaseAuth("/logout", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
      },
    }).catch(() => undefined);
  }

  clearStoredSession();
}

export function getAuthToken() {
  const storedSession = readStoredSession();
  if (storedSession?.accessToken) return storedSession.accessToken;

  return findExternalSupabaseSession()?.access_token ?? getStorage()?.getItem(DEV_TOKEN_KEY) ?? null;
}

export function getAuthUser(): AuthUser | null {
  const storedSession = readStoredSession();
  if (storedSession?.user) return storedSession.user;

  const externalSession = findExternalSupabaseSession();
  const externalUser = toAuthUser(externalSession?.user);

  return externalUser ?? null;
}

export function configureApiAuth() {
  setAuthTokenGetter(getAuthToken);
}
