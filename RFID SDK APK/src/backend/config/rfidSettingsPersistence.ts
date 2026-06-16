import type { RfidSettings } from '../types/rfid';

type PersistedPayloadV1 = {
  version: 1;
  settings: RfidSettings;
};

const STORAGE_KEY = 'rfid.settings';

const loadAsyncStorage = async (): Promise<any | null> => {
  try {
    const mod: any = await import('@react-native-async-storage/async-storage');
    return mod?.default ?? mod;
  } catch {
    return null;
  }
};

export const rfidSettingsPersistence = {
  async load(): Promise<RfidSettings | null> {
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

    if (parsed?.version === 1 && parsed?.settings) {
      return parsed.settings as RfidSettings;
    }

    if (parsed?.operationMode || parsed?.inventoryScanMode || typeof parsed?.preferSingleTagForLed === 'boolean') {
      const operationMode = parsed?.operationMode === 'led-special' ? 'led-special' : 'standard';
      return {
        activeMode: operationMode,
        global: {
          soundEnabled: true,
          vibrationEnabled: false,
          triggerBehavior: 'hold',
        },
        profiles: {
          standard: {
            inventoryScanMode: parsed?.inventoryScanMode === 'once' ? 'once' : 'continue',
            preferSingleTagForLed: false,
            ledAssist: {
              locateEnabled: false,
              beepingAssist: 'off',
            },
          },
          'led-special': {
            inventoryScanMode: parsed?.inventoryScanMode === 'once' ? 'once' : 'continue',
            preferSingleTagForLed:
              typeof parsed?.preferSingleTagForLed === 'boolean' ? parsed.preferSingleTagForLed : true,
            ledAssist: {
              locateEnabled: true,
              beepingAssist: 'medium',
            },
          },
        },
      };
    }

    return null;
  },

  async save(settings: RfidSettings): Promise<void> {
    const storage = await loadAsyncStorage();
    if (!storage) return;

    const payload: PersistedPayloadV1 = {
      version: 1,
      settings,
    };
    await storage.setItem(STORAGE_KEY, JSON.stringify(payload));
  },
};
