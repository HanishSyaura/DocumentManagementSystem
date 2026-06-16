export type RfidOperationMode = 'standard' | 'led-special';

export type InventoryScanMode = 'once' | 'continue';

export type RfidMemoryBank = 'PASSWORD' | 'EPC' | 'TID' | 'USER';

export type TriggerBehavior = 'hold' | 'toggle';

export type BeepingAssistLevel = 'off' | 'low' | 'medium' | 'high';

export type TagReadModel = {
  epc: string;
  rssi?: number;
  count?: number;
};

export type RfidGlobalSettings = {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  triggerBehavior: TriggerBehavior;
};

export type LedAssistSettings = {
  locateEnabled: boolean;
  beepingAssist: BeepingAssistLevel;
};

export type RfidProfileSettings = {
  inventoryScanMode: InventoryScanMode;
  preferSingleTagForLed: boolean;
  ledAssist: LedAssistSettings;
};

export type RfidSettings = {
  activeMode: RfidOperationMode;
  global: RfidGlobalSettings;
  profiles: Record<RfidOperationMode, RfidProfileSettings>;
};

export type ReadTagMemoryInput = {
  targetEpc?: string;
  bank: RfidMemoryBank;
  offset: number;
  length: number;
  accessPassword?: string;
};

export type WriteTagMemoryInput = {
  targetEpc?: string;
  bank: RfidMemoryBank;
  offset: number;
  dataHex: string;
  accessPassword?: string;
};

export type LockTagInput = {
  targetEpc?: string;
  lockType: number;
  accessPassword?: string;
};

export type KillTagInput = {
  targetEpc?: string;
  killPassword: string;
};

export type StartInventoryInput = {
  scanMode?: InventoryScanMode;
  operationMode?: RfidOperationMode;
};

export type SubscriptionLike = {
  remove: () => void;
};
