export type PersistedAuthPayloadV1 = {
  version: 1;
  loggedIn: boolean;
  email: string;
};

export type PersistedAuthPayloadV2 = {
  version: 2;
  loggedIn: boolean;
  email: string;
  displayName: string;
  baseUrl: string;
  accessToken: string;
  refreshToken: string;
};

export type PersistedAuthPayload = PersistedAuthPayloadV1 | PersistedAuthPayloadV2;

const STORAGE_KEY = 'auth.session';

const loadAsyncStorage = async (): Promise<any | null> => {
  try {
    const mod: any = await import('@react-native-async-storage/async-storage');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
};

export const authPersistence = {
  async load(): Promise<PersistedAuthPayload | null> {
    const storage = await loadAsyncStorage();
    if (!storage) return null;

    const raw = await storage.getItem(STORAGE_KEY);
    if (!raw) return null;

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }

    if (parsed?.version === 1 && typeof parsed?.loggedIn === 'boolean' && typeof parsed?.email === 'string') {
      return parsed as PersistedAuthPayloadV1;
    }

    if (
      parsed?.version === 2 &&
      typeof parsed?.loggedIn === 'boolean' &&
      typeof parsed?.email === 'string' &&
      typeof parsed?.displayName === 'string' &&
      typeof parsed?.baseUrl === 'string' &&
      typeof parsed?.accessToken === 'string' &&
      typeof parsed?.refreshToken === 'string'
    ) {
      return parsed as PersistedAuthPayloadV2;
    }

    return null;
  },

  async save(payload: PersistedAuthPayload): Promise<void> {
    const storage = await loadAsyncStorage();
    if (!storage) return;
    await storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },

  async clear(): Promise<void> {
    const storage = await loadAsyncStorage();
    if (!storage) return;
    await storage.removeItem(STORAGE_KEY);
  },
};

