import { NativeModules, DeviceEventEmitter } from 'react-native';

const { BarcodeModule } = NativeModules;

export interface BarcodeData {
  barcode: string;
  type: string;
  length: number;
}

export const BarcodeService = {
  startScan: () => BarcodeModule.startScan(),
  stopScan: () => BarcodeModule.stopScan(),
  
  onBarcodeRead: (callback: (data: BarcodeData) => void) => {
    return DeviceEventEmitter.addListener('onBarcodeRead', callback);
  },

  onHardwareTrigger: (callback: (state: 'DOWN' | 'UP') => void) => {
    return DeviceEventEmitter.addListener('onBarcodeTrigger', callback);
  }
};