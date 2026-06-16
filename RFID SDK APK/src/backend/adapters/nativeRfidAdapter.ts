import { RFIDService } from '../../services/RFIDService';
import type {
  InventoryScanMode,
  KillTagInput,
  LockTagInput,
  ReadTagMemoryInput,
  SubscriptionLike,
  TagReadModel,
  WriteTagMemoryInput,
} from '../types/rfid';

export const nativeRfidAdapter = {
  startScan(mode: InventoryScanMode) {
    RFIDService.startScan(mode);
  },

  stopScan() {
    RFIDService.stopScan();
  },

  isScanning(): Promise<boolean> {
    return RFIDService.isScanning();
  },

  isTriggerInitialized(): Promise<boolean> {
    return RFIDService.isTriggerInitialized();
  },

  readMemory(input: ReadTagMemoryInput): Promise<string> {
    return RFIDService.readMemory(input);
  },

  writeMemory(input: WriteTagMemoryInput): Promise<boolean> {
    return RFIDService.writeMemory(input);
  },

  lockTag(input: LockTagInput): Promise<boolean> {
    return RFIDService.lockTag(input);
  },

  killTag(input: KillTagInput): Promise<boolean> {
    return RFIDService.killTag(input);
  },

  readTagLED(targetEpc: string, accessPassword = '', type = 1): Promise<boolean> {
    return RFIDService.readTagLED({ targetEpc, accessPassword, type });
  },

  playBeep(durationMs: number): void {
    RFIDService.playBeep(durationMs);
  },

  onTags(callback: (tags: TagReadModel[]) => void): SubscriptionLike {
    return RFIDService.onTags(callback);
  },

  onTrigger(callback: (state: 'DOWN' | 'UP') => void): SubscriptionLike {
    return RFIDService.onTrigger(callback);
  },

  onError(callback: (error: string) => void): SubscriptionLike {
    return RFIDService.onError(callback);
  },
};
