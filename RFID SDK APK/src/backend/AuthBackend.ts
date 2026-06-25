import { authStore, type AuthState } from './auth/authStore';

export const AuthBackend = {
  initialize(): Promise<AuthState> {
    return authStore.initialize();
  },

  getState(): AuthState {
    return authStore.get();
  },

  onChange(listener: (s: AuthState) => void): () => void {
    return authStore.subscribe(listener);
  },

  setBaseUrl(baseUrl: string): Promise<AuthState> {
    return authStore.setBaseUrl(baseUrl);
  },

  signIn(baseUrl: string, email: string, password: string): Promise<AuthState> {
    return authStore.signIn({ baseUrl, email, password });
  },

  signOut(): Promise<AuthState> {
    return authStore.signOut();
  },

  getJson<T>(path: string): Promise<T> {
    return authStore.getJson<T>(path);
  },

  postJson<T>(path: string, body?: unknown): Promise<T> {
    return authStore.postJson<T>(path, body);
  },
};

