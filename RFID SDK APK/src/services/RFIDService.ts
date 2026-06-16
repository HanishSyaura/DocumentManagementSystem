import { NativeModules, DeviceEventEmitter } from 'react-native';

/**
 * RFID Service for React Native
 * 
 * Provides an interface to the native RFID module for:
 * - Starting/stopping RFID scans (once or continuous mode)
 * - Subscribing to tag events
 * - Subscribing to hardware trigger events
 * 
 * Hardware trigger events are automatically handled by ScanKeyHelper
 * in the native module. No need to manually start/stop the trigger listener.
 */
const { RFIDModule } = NativeModules;

export type RfidMemoryBank = 'PASSWORD' | 'EPC' | 'TID' | 'USER';

type ReadMemoryParams = {
  targetEpc?: string;
  bank: RfidMemoryBank;
  offset: number;
  length: number;
  accessPassword?: string;
};

type WriteMemoryParams = {
  targetEpc?: string;
  bank: RfidMemoryBank;
  offset: number;
  dataHex: string;
  accessPassword?: string;
};

type LockTagParams = {
  targetEpc?: string;
  lockType: number;
  accessPassword?: string;
};

type KillTagParams = {
  targetEpc?: string;
  killPassword: string;
};

type ReadLedParams = {
  targetEpc: string;
  accessPassword?: string;
  type?: number;
};

const bankToCode = (bank: RfidMemoryBank): number => {
  switch (bank) {
    case 'PASSWORD':
      return 0;
    case 'EPC':
      return 1;
    case 'TID':
      return 2;
    case 'USER':
      return 3;
  }
};

export const RFIDService = {
  /**
   * Start an RFID scan with the specified mode.
   * @param mode - 'once' for single scan, 'continue' for continuous scanning
   */
  startScan: (mode: 'once' | 'continue' = 'continue') => {
    console.log('[RFIDService] startScan, mode:', mode);
    if (mode === 'once') {
      RFIDModule.startScanOnce();
    } else {
      RFIDModule.startScanContinue();
    }
  },
  
  /** Single scan - scans once and returns results */
  startScanOnce: () => {
    console.log('[RFIDService] startScanOnce');
    RFIDModule.startScanOnce();
  },
  
  /** Continuous scan - keeps scanning until stopScan is called */
  startScanContinue: () => {
    console.log('[RFIDService] startScanContinue');
    RFIDModule.startScanContinue();
  },
  
  /** Stop the current scan */
  stopScan: () => {
    console.log('[RFIDService] stopScan');
    RFIDModule.stopScan();
  },

  /**
   * Check if a scan is currently in progress.
   * @returns Promise<boolean>
   */
  isScanning: (): Promise<boolean> => {
    return RFIDModule.isScanning();
  },

  /**
   * Check if the hardware trigger is initialized.
   * Useful for debugging.
   * @returns Promise<boolean>
   */
  isTriggerInitialized: (): Promise<boolean> => {
    return RFIDModule.isTriggerInitialized();
  },

  readMemory: ({
    targetEpc = '',
    bank,
    offset,
    length,
    accessPassword = '',
  }: ReadMemoryParams): Promise<string> => {
    return RFIDModule.readMemory(targetEpc, bankToCode(bank), offset, length, accessPassword);
  },

  writeMemory: ({
    targetEpc = '',
    bank,
    offset,
    dataHex,
    accessPassword = '',
  }: WriteMemoryParams): Promise<boolean> => {
    return RFIDModule.writeMemory(targetEpc, bankToCode(bank), offset, dataHex, accessPassword);
  },

  lockTag: ({ targetEpc = '', lockType, accessPassword = '' }: LockTagParams): Promise<boolean> => {
    return RFIDModule.lockTag(targetEpc, lockType, accessPassword);
  },

  killTag: ({ targetEpc = '', killPassword }: KillTagParams): Promise<boolean> => {
    return RFIDModule.killTag(targetEpc, killPassword);
  },

  readTagLED: ({ targetEpc, accessPassword = '', type = 1 }: ReadLedParams): Promise<boolean> => {
    return RFIDModule.readTagLED(targetEpc, accessPassword, type);
  },

  playBeep: (durationMs: number) => {
    RFIDModule.playBeep(durationMs);
  },

  /**
   * Subscribe to tag events.
   * @param callback - Function called with array of { epc, rssi }
   * @returns Subscription that can be removed
   */
  onTags: (callback: (tags: { epc: string; rssi: number }[]) => void) =>
    DeviceEventEmitter.addListener('onTags', callback),

  /**
   * Subscribe to hardware trigger events.
   * 
   * Events are automatically emitted by ScanKeyHelper when the
   * hardware button is pressed/released:
   * - 'DOWN': Button pressed
   * - 'UP': Button released
   * 
   * @param callback - Function called with 'DOWN' or 'UP'
   * @returns Subscription that can be removed
   */
  onTrigger: (callback: (state: 'DOWN' | 'UP') => void) =>
    DeviceEventEmitter.addListener('onTrigger', callback),

  /**
   * Subscribe to error events.
   * @param callback - Function called with error message
   * @returns Subscription that can be removed
   */
  onError: (callback: (error: string) => void) =>
    DeviceEventEmitter.addListener('onError', callback),
};
