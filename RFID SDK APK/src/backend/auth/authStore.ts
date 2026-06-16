import { authPersistence } from './authPersistence';

export type AuthState = {
  loggedIn: boolean;
  email: string;
  initialized: boolean;
};

const defaultState: AuthState = {
  loggedIn: false,
  email: '',
  initialized: false,
};

let state: AuthState = { ...defaultState };
const listeners = new Set<(s: AuthState) => void>();

const snapshot = (): AuthState => ({ ...state });

const emit = () => {
  const s = snapshot();
  listeners.forEach(l => l(s));
};

export const authStore = {
  get(): AuthState {
    return snapshot();
  },

  async initialize(): Promise<AuthState> {
    const loaded = await authPersistence.load();
    if (loaded?.loggedIn) {
      state = {
        loggedIn: true,
        email: loaded.email ?? '',
        initialized: true,
      };
    } else {
      state = { ...defaultState, initialized: true };
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

  async signIn(email: string): Promise<AuthState> {
    state = { loggedIn: true, email, initialized: true };
    emit();
    await authPersistence.save({ version: 1, loggedIn: true, email });
    return snapshot();
  },

  async signOut(): Promise<AuthState> {
    state = { ...defaultState, initialized: true };
    emit();
    await authPersistence.clear();
    return snapshot();
  },
};

