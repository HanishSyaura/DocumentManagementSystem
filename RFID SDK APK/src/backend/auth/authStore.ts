import { authPersistence } from './authPersistence';

type LoginInput = {
  baseUrl: string;
  email: string;
  password: string;
};

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  skipRefresh?: boolean;
};

type LoginResult = {
  user?: {
    id?: number | string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  requires2FA?: boolean;
  message?: string;
};

export type AuthState = {
  loggedIn: boolean;
  email: string;
  displayName: string;
  baseUrl: string;
  accessToken: string;
  refreshToken: string;
  initialized: boolean;
};

const defaultState: AuthState = {
  loggedIn: false,
  email: '',
  displayName: '',
  baseUrl: '',
  accessToken: '',
  refreshToken: '',
  initialized: false,
};

let state: AuthState = { ...defaultState };
const listeners = new Set<(s: AuthState) => void>();

const snapshot = (): AuthState => ({ ...state });

const emit = () => {
  const s = snapshot();
  listeners.forEach(l => l(s));
};

const extractMessage = (payload: any, fallback: string) => {
  if (typeof payload?.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }
  if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
    const first = payload.errors[0];
    if (typeof first?.message === 'string' && first.message.trim()) {
      return first.message.trim();
    }
  }
  return fallback;
};

const normalizeBaseUrl = (value: string) => {
  const trimmed = String(value ?? '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  if (trimmed.endsWith('/api')) return trimmed;
  return `${trimmed}/api`;
};

const resolveDisplayName = (user?: LoginResult['user']) => {
  const firstName = String(user?.firstName ?? '').trim();
  const lastName = String(user?.lastName ?? '').trim();
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  return fullName || String(user?.email ?? '').trim();
};

const saveSession = async () => {
  if (!state.baseUrl) {
    await authPersistence.clear();
    return;
  }

  if (!state.loggedIn || !state.accessToken || !state.refreshToken) {
    await authPersistence.save({
      version: 2,
      loggedIn: false,
      email: '',
      displayName: '',
      baseUrl: state.baseUrl,
      accessToken: '',
      refreshToken: '',
    });
    return;
  }

  await authPersistence.save({
    version: 2,
    loggedIn: true,
    email: state.email,
    displayName: state.displayName,
    baseUrl: state.baseUrl,
    accessToken: state.accessToken,
    refreshToken: state.refreshToken,
  });
};

const clearSession = async () => {
  state = {
    ...defaultState,
    initialized: true,
    baseUrl: state.baseUrl,
  };
  emit();
  await saveSession();
};

const requestJson = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  const baseUrl = normalizeBaseUrl(state.baseUrl);
  if (!baseUrl) {
    throw new Error('Server URL is required');
  }

  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!options.skipAuth && state.accessToken) {
    headers.set('Authorization', `Bearer ${state.accessToken}`);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401 && !options.skipAuth && !options.skipRefresh && state.refreshToken) {
    await authStore.refreshSession();
    return requestJson<T>(path, { ...options, skipRefresh: true });
  }

  if (!response.ok) {
    throw new Error(extractMessage(payload, `Request failed with status ${response.status}`));
  }

  return (payload?.data ?? payload) as T;
};

export const authStore = {
  get(): AuthState {
    return snapshot();
  },

  async initialize(): Promise<AuthState> {
    const loaded = await authPersistence.load();
    if (loaded?.version === 2) {
      state = {
        loggedIn: Boolean(loaded.loggedIn && loaded.accessToken && loaded.refreshToken),
        email: loaded.email ?? '',
        displayName: loaded.displayName ?? '',
        baseUrl: normalizeBaseUrl(loaded.baseUrl ?? ''),
        accessToken: loaded.accessToken ?? '',
        refreshToken: loaded.refreshToken ?? '',
        initialized: true,
      };
    } else {
      state = {
        ...defaultState,
        initialized: true,
      };
    }

    if (state.loggedIn) {
      try {
        const me = await requestJson<{ user: LoginResult['user'] }>('/auth/me');
        state = {
          ...state,
          email: String(me?.user?.email ?? state.email).trim(),
          displayName: resolveDisplayName(me?.user) || state.displayName,
        };
        await saveSession();
      } catch {
        await clearSession();
      }
    } else {
      await saveSession();
    }

    emit();
    return snapshot();
  },

  subscribe(listener: (s: AuthState) => void): () => void {
    listeners.add(listener);
    listener(snapshot());
    return () => {
      listeners.delete(listener);
    };
  },

  async setBaseUrl(baseUrl: string): Promise<AuthState> {
    state = {
      ...state,
      baseUrl: normalizeBaseUrl(baseUrl),
      initialized: true,
    };
    emit();
    await saveSession();
    return snapshot();
  },

  async signIn(input: LoginInput): Promise<AuthState> {
    const baseUrl = normalizeBaseUrl(input.baseUrl);
    if (!baseUrl) {
      throw new Error('Server URL is required');
    }

    state = {
      ...state,
      baseUrl,
      initialized: true,
    };
    emit();

    const result = await requestJson<LoginResult>('/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        email: String(input.email ?? '').trim(),
        password: String(input.password ?? ''),
      }),
    });

    if (result?.requires2FA) {
      throw new Error('This mobile flow does not support 2FA yet. Use a non-2FA account or extend verify-2fa support.');
    }

    if (!result?.accessToken || !result?.refreshToken || !result?.user?.email) {
      throw new Error(result?.message || 'Login response is incomplete');
    }

    state = {
      loggedIn: true,
      email: String(result.user.email).trim(),
      displayName: resolveDisplayName(result.user),
      baseUrl,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      initialized: true,
    };
    emit();
    await saveSession();
    return snapshot();
  },

  async refreshSession(): Promise<AuthState> {
    if (!state.baseUrl || !state.refreshToken) {
      throw new Error('Refresh token is not available');
    }

    const result = await requestJson<{ accessToken?: string; refreshToken?: string }>('/auth/refresh-token', {
      method: 'POST',
      skipAuth: true,
      skipRefresh: true,
      body: JSON.stringify({ refreshToken: state.refreshToken }),
    });

    if (!result?.accessToken) {
      throw new Error('Unable to refresh access token');
    }

    state = {
      ...state,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken || state.refreshToken,
      initialized: true,
    };
    emit();
    await saveSession();
    return snapshot();
  },

  async signOut(): Promise<AuthState> {
    try {
      if (state.loggedIn && state.baseUrl && state.accessToken) {
        await requestJson('/auth/logout', {
          method: 'POST',
          skipRefresh: true,
        });
      }
    } catch {
      // Clear the local session even if logout request fails.
    }

    await clearSession();
    return snapshot();
  },

  async getJson<T>(path: string): Promise<T> {
    return requestJson<T>(path, { method: 'GET' });
  },

  async postJson<T>(path: string, body?: unknown): Promise<T> {
    return requestJson<T>(path, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  },
};

