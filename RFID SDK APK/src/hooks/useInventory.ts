import { useCallback, useEffect, useState, useRef } from 'react';
import { RfidBackend, type InventoryScanMode } from '../backend';

/**
 * Custom hook for RFID inventory management.
 * 
 * Handles:
 * - Starting/stopping scans
 * - Collecting tag data
 * - Hardware button triggers (via RFIDService.onTrigger)
 */
export function useInventory() {
  const [tags, setTags] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const clearTags = useCallback(() => setTags([]), []);

  const startScan = useCallback((mode: InventoryScanMode = 'continue') => {
    console.log('[useInventory] startScan called, mode:', mode);
    setIsScanning(true);
    RfidBackend.startInventory({ scanMode: mode });
  }, []);

  const stopScan = useCallback(() => {
    console.log('[useInventory] stopScan called');
    setIsScanning(false);
    RfidBackend.stopInventory();
  }, []);

  // Subscribe to tag events
  useEffect(() => {
    const tagSub = RfidBackend.onTags((tagList: { epc: string; rssi?: number }[]) => {
      setTags(prev => {
        const newTags = [...prev];
        tagList.forEach(({ epc, rssi }) => {
          const index = newTags.findIndex(t => t.epc === epc);
          if (index !== -1) {
            // Update existing tag (increment count, update RSSI)
            newTags[index] = { ...newTags[index], count: newTags[index].count + 1, rssi };
          } else {
            // Add new tag
            newTags.push({ epc, count: 1, rssi });
          }
        });
        return newTags;
      });
    });

    return () => {
      tagSub.remove();
    };
  }, []);

  return { tags, startScan, stopScan, isScanning, clearTags };
}

/**
 * Custom hook for hardware button trigger handling.
 * 
 * This should be used in your InventoryScreen component.
 * It handles the trigger events from ScanKeyHelper.
 * 
 * Logic:
 * - DOWN + not scanning → start scan
 * - UP + scanning → stop scan
 */
export function useHardwareTrigger(
  isScanning: boolean,
  scanMode: 'once' | 'continue',
  startScan: (mode: 'once' | 'continue') => void,
  stopScan: () => void
) {
  // Use refs to avoid stale closure issues
  const isScanningRef = useRef(isScanning);
  const scanModeRef = useRef(scanMode);

  useEffect(() => { isScanningRef.current = isScanning; }, [isScanning]);
  useEffect(() => { scanModeRef.current = scanMode; }, [scanMode]);

  useEffect(() => {
    console.log('[useHardwareTrigger] Setting up trigger listener');

    const triggerSub = RfidBackend.onTrigger((state) => {
      const behavior = RfidBackend.getGlobal().triggerBehavior;
      console.log('[useHardwareTrigger] Trigger event:', state, 
        '| isScanning:', isScanningRef.current, 
        '| mode:', scanModeRef.current);

      if (behavior === 'toggle') {
        if (state === 'DOWN') {
          if (isScanningRef.current) stopScan();
          else startScan(scanModeRef.current);
        }
        return;
      }

      if (state === 'DOWN' && !isScanningRef.current) {
        console.log('[useHardwareTrigger] Starting scan, mode:', scanModeRef.current);
        startScan(scanModeRef.current);
        return;
      }

      if (state === 'UP' && isScanningRef.current) {
        console.log('[useHardwareTrigger] Stopping scan');
        stopScan();
        return;
      }
    });

    // Note: Do NOT call RFIDModule.startTriggerListener() here
    // ScanKeyHelper is initialized automatically when RFIDModule is created

    return () => {
      console.log('[useHardwareTrigger] Cleaning up trigger listener');
      triggerSub.remove();
    };
  }, [startScan, stopScan]);
}
