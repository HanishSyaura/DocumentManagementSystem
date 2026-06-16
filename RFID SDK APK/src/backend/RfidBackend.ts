import { nativeRfidAdapter } from './adapters/nativeRfidAdapter';
import { rfidSettingsStore } from './config/rfidSettingsStore';
import type {
  InventoryScanMode,
  KillTagInput,
  LockTagInput,
  ReadTagMemoryInput,
  RfidGlobalSettings,
  RfidOperationMode,
  RfidProfileSettings,
  RfidSettings,
  StartInventoryInput,
  SubscriptionLike,
  TriggerBehavior,
  TagReadModel,
  WriteTagMemoryInput,
} from './types/rfid';

const resolveMode = (overrideMode?: RfidOperationMode): RfidOperationMode => {
  return overrideMode ?? rfidSettingsStore.get().activeMode;
};

const resolveScanMode = (
  operationMode: RfidOperationMode,
  overrideScanMode?: InventoryScanMode,
): InventoryScanMode => {
  return overrideScanMode ?? rfidSettingsStore.get().profiles[operationMode].inventoryScanMode;
};

const startStandardInventory = (scanMode: InventoryScanMode) => {
  nativeRfidAdapter.startScan(scanMode);
};

const startLedSpecialInventory = (scanMode: InventoryScanMode) => {
  // LED-special masih guna scan base yang sama buat masa ini.
  // Bila LED/search workflow siap, branch ni tempat untuk queue/lock/search policy.
  nativeRfidAdapter.startScan(scanMode);
};

export const RfidBackend = {
  async initialize(): Promise<RfidSettings> {
    return rfidSettingsStore.initialize();
  },

  getSettings(): RfidSettings {
    return rfidSettingsStore.get();
  },

  updateSettings(next: Partial<RfidSettings>): RfidSettings {
    return rfidSettingsStore.set(next);
  },

  setActiveMode(mode: RfidOperationMode): RfidSettings {
    return rfidSettingsStore.set({ activeMode: mode });
  },

  async switchActiveMode(mode: RfidOperationMode): Promise<RfidSettings> {
    const scanning = await nativeRfidAdapter.isScanning().catch(() => false);
    if (scanning) {
      nativeRfidAdapter.stopScan();
    }
    return rfidSettingsStore.set({ activeMode: mode });
  },

  getActiveMode(): RfidOperationMode {
    return rfidSettingsStore.get().activeMode;
  },

  getProfile(mode: RfidOperationMode): RfidProfileSettings {
    return rfidSettingsStore.get().profiles[mode];
  },

  updateProfile(mode: RfidOperationMode, patch: Partial<RfidProfileSettings>): RfidSettings {
    return rfidSettingsStore.set({ profile: mode, profilePatch: patch });
  },

  getGlobal(): RfidGlobalSettings {
    return rfidSettingsStore.get().global;
  },

  updateGlobal(patch: Partial<RfidGlobalSettings> & { triggerBehavior?: TriggerBehavior }): RfidSettings {
    return rfidSettingsStore.set({ global: patch });
  },

  resetSettings(): RfidSettings {
    return rfidSettingsStore.reset();
  },

  onSettingsChange(listener: (settings: RfidSettings) => void): () => void {
    return rfidSettingsStore.subscribe(listener);
  },

  startInventory(input: StartInventoryInput = {}): void {
    const operationMode = resolveMode(input.operationMode);
    const scanMode = resolveScanMode(operationMode, input.scanMode);

    if (operationMode === 'led-special') {
      startLedSpecialInventory(scanMode);
      return;
    }

    startStandardInventory(scanMode);
  },

  stopInventory(): void {
    nativeRfidAdapter.stopScan();
  },

  readTagLED(targetEpc: string, accessPassword = '', type = 1): Promise<boolean> {
    return nativeRfidAdapter.readTagLED(targetEpc, accessPassword, type);
  },

  playBeep(durationMs: number): void {
    nativeRfidAdapter.playBeep(durationMs);
  },

  isScanning(): Promise<boolean> {
    return nativeRfidAdapter.isScanning();
  },

  isTriggerInitialized(): Promise<boolean> {
    return nativeRfidAdapter.isTriggerInitialized();
  },

  readTagMemory(input: ReadTagMemoryInput): Promise<string> {
    return nativeRfidAdapter.readMemory(input);
  },

  writeTagMemory(input: WriteTagMemoryInput): Promise<boolean> {
    return nativeRfidAdapter.writeMemory(input);
  },

  lockTag(input: LockTagInput): Promise<boolean> {
    return nativeRfidAdapter.lockTag(input);
  },

  killTag(input: KillTagInput): Promise<boolean> {
    return nativeRfidAdapter.killTag(input);
  },

  onTags(callback: (tags: TagReadModel[]) => void): SubscriptionLike {
    return nativeRfidAdapter.onTags(callback);
  },

  onTrigger(callback: (state: 'DOWN' | 'UP') => void): SubscriptionLike {
    return nativeRfidAdapter.onTrigger(callback);
  },

  onError(callback: (error: string) => void): SubscriptionLike {
    return nativeRfidAdapter.onError(callback);
  },
};
