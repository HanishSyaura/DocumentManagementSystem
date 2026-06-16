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

  signIn(email: string): Promise<AuthState> {
    return authStore.signIn(email);
  },

  signOut(): Promise<AuthState> {
    return authStore.signOut();
  },
};

