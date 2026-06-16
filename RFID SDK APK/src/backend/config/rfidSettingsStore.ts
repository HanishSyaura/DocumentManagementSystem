import type {
  InventoryScanMode,
  RfidGlobalSettings,
  RfidOperationMode,
  RfidProfileSettings,
  RfidSettings,
  TriggerBehavior,
} from '../types/rfid';
import { rfidSettingsPersistence } from './rfidSettingsPersistence';

const defaultSettings: RfidSettings = {
  activeMode: 'standard',
  global: {
    soundEnabled: true,
    vibrationEnabled: false,
    triggerBehavior: 'hold',
  },
  profiles: {
    standard: {
      inventoryScanMode: 'continue',
      preferSingleTagForLed: false,
      ledAssist: {
        locateEnabled: false,
        beepingAssist: 'off',
      },
    },
    'led-special': {
      inventoryScanMode: 'continue',
      preferSingleTagForLed: true,
      ledAssist: {
        locateEnabled: true,
        beepingAssist: 'medium',
      },
    },
  },
};

let currentSettings: RfidSettings = {
  activeMode: defaultSettings.activeMode,
  global: { ...defaultSettings.global },
  profiles: {
    standard: { ...defaultSettings.profiles.standard, ledAssist: { ...defaultSettings.profiles.standard.ledAssist } },
    'led-special': {
      ...defaultSettings.profiles['led-special'],
      ledAssist: { ...defaultSettings.profiles['led-special'].ledAssist },
    },
  },
};
const listeners = new Set<(settings: RfidSettings) => void>();
let isInitialized = false;

const emit = () => {
  const snapshot: RfidSettings = {
    activeMode: currentSettings.activeMode,
    global: { ...currentSettings.global },
    profiles: {
      standard: {
        ...currentSettings.profiles.standard,
        ledAssist: { ...currentSettings.profiles.standard.ledAssist },
      },
      'led-special': {
        ...currentSettings.profiles['led-special'],
        ledAssist: { ...currentSettings.profiles['led-special'].ledAssist },
      },
    },
  };
  listeners.forEach(listener => listener(snapshot));
};

export const rfidSettingsStore = {
  isInitialized(): boolean {
    return isInitialized;
  },

  async initialize(): Promise<RfidSettings> {
    const loaded = await rfidSettingsPersistence.load();
    if (loaded?.activeMode && loaded?.profiles?.standard && loaded?.profiles?.['led-special']) {
      currentSettings = {
        activeMode: loaded.activeMode,
        global: loaded.global
          ? { ...loaded.global }
          : { ...defaultSettings.global },
        profiles: {
          standard: {
            ...defaultSettings.profiles.standard,
            ...loaded.profiles.standard,
            ledAssist: {
              ...defaultSettings.profiles.standard.ledAssist,
              ...(loaded.profiles.standard as any).ledAssist,
            },
          },
          'led-special': {
            ...defaultSettings.profiles['led-special'],
            ...loaded.profiles['led-special'],
            ledAssist: {
              ...defaultSettings.profiles['led-special'].ledAssist,
              ...(loaded.profiles['led-special'] as any).ledAssist,
            },
          },
        },
      };
      emit();
    }
    isInitialized = true;
    return rfidSettingsStore.get();
  },

  get(): RfidSettings {
    return {
      activeMode: currentSettings.activeMode,
      global: { ...currentSettings.global },
      profiles: {
        standard: {
          ...currentSettings.profiles.standard,
          ledAssist: { ...currentSettings.profiles.standard.ledAssist },
        },
        'led-special': {
          ...currentSettings.profiles['led-special'],
          ledAssist: { ...currentSettings.profiles['led-special'].ledAssist },
        },
      },
    };
  },

  set(
    next: Partial<RfidSettings> & {
      operationMode?: RfidOperationMode;
      inventoryScanMode?: InventoryScanMode;
      preferSingleTagForLed?: boolean;
      soundEnabled?: boolean;
      vibrationEnabled?: boolean;
      triggerBehavior?: TriggerBehavior;
      global?: Partial<RfidGlobalSettings>;
      profile?: RfidOperationMode;
      profilePatch?: Partial<RfidProfileSettings>;
    },
  ): RfidSettings {
    if (next.operationMode) {
      currentSettings.activeMode = next.operationMode;
    }

    if (next.activeMode) {
      currentSettings.activeMode = next.activeMode;
    }

    if (next.inventoryScanMode) {
      currentSettings.profiles[currentSettings.activeMode] = {
        ...currentSettings.profiles[currentSettings.activeMode],
        inventoryScanMode: next.inventoryScanMode,
      };
    }

    if (typeof next.preferSingleTagForLed === 'boolean') {
      currentSettings.profiles['led-special'] = {
        ...currentSettings.profiles['led-special'],
        preferSingleTagForLed: next.preferSingleTagForLed,
      };
    }

    if (typeof next.soundEnabled === 'boolean') {
      currentSettings.global = { ...currentSettings.global, soundEnabled: next.soundEnabled };
    }

    if (typeof next.vibrationEnabled === 'boolean') {
      currentSettings.global = { ...currentSettings.global, vibrationEnabled: next.vibrationEnabled };
    }

    if (next.triggerBehavior) {
      currentSettings.global = { ...currentSettings.global, triggerBehavior: next.triggerBehavior };
    }

    if (next.global) {
      currentSettings.global = { ...currentSettings.global, ...next.global };
    }

    if (next.profiles) {
      (Object.keys(next.profiles) as RfidOperationMode[]).forEach(mode => {
        const patch = next.profiles?.[mode];
        if (!patch) return;
        currentSettings.profiles[mode] = {
          ...currentSettings.profiles[mode],
          ...patch,
        };
      });
    }

    if (next.profile && next.profilePatch) {
      currentSettings.profiles[next.profile] = {
        ...currentSettings.profiles[next.profile],
        ...next.profilePatch,
      };
    }

    emit();
    void rfidSettingsPersistence.save(rfidSettingsStore.get());
    return rfidSettingsStore.get();
  },

  reset(): RfidSettings {
    currentSettings = {
      activeMode: defaultSettings.activeMode,
      global: { ...defaultSettings.global },
      profiles: {
        standard: {
          ...defaultSettings.profiles.standard,
          ledAssist: { ...defaultSettings.profiles.standard.ledAssist },
        },
        'led-special': {
          ...defaultSettings.profiles['led-special'],
          ledAssist: { ...defaultSettings.profiles['led-special'].ledAssist },
        },
      },
    };
    emit();
    void rfidSettingsPersistence.save(rfidSettingsStore.get());
    return rfidSettingsStore.get();
  },

  subscribe(listener: (settings: RfidSettings) => void): () => void {
    listeners.add(listener);
    listener(rfidSettingsStore.get());
    return () => {
      listeners.delete(listener);
    };
  },
};
