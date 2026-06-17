import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../styles/theme';
import { RfidBackend } from '../backend';
import { BarcodeService } from '../services/BarcodeService';

type DocumentRecord = {
  id: string;
  fileCode: string;
  title: string;
  epc: string;
  projectCategory: string;
  version: string;
  lastUpdated: string;
  documentStatus: string;
  trackingStatus: string;
};

export default function SearchScreen() {
  const navigation = useNavigation<any>();

  const [projectCategory, setProjectCategory] = useState<string>('');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [results, setResults] = useState<DocumentRecord[]>([]);

  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  const rfidSubRef = useRef<{ remove: () => void } | null>(null);
  const barcodeSubRef = useRef<{ remove: () => void } | null>(null);
  const triggerScanRef = useRef(false);
  const triggerSeenRef = useRef<Set<string>>(new Set());

  const [isLocating, setIsLocating] = useState(false);
  const [locateTargetEpc, setLocateTargetEpc] = useState<string | null>(null);
  const [locateRssi, setLocateRssi] = useState<number | null>(null);
  const [locateError, setLocateError] = useState<string | null>(null);

  const locatingRef = useRef(false);
  const locateRssiRef = useRef<number | null>(null);
  const locateSubRef = useRef<{ remove: () => void } | null>(null);
  const beepTimerRef = useRef<any>(null);
  const lastBlinkRef = useRef<number>(0);

  const dataSource = useMemo<DocumentRecord[]>(
    () => [
      {
        id: '1',
        fileCode: 'MoM01260616001',
        title: 'Minutes of Meeting Project 16 June 2026',
        epc: '301646F608001D000F88AF41',
        projectCategory: 'Internal',
        version: '1.0',
        lastUpdated: '16/06/2026',
        documentStatus: 'Published',
        trackingStatus: 'Registered',
      },
    ],
    [],
  );

  const resetScanSubscriptions = () => {
    rfidSubRef.current?.remove();
    rfidSubRef.current = null;
    barcodeSubRef.current?.remove();
    barcodeSubRef.current = null;
  };

  const stopLocate = () => {
    locatingRef.current = false;
    setIsLocating(false);
    setLocateTargetEpc(null);
    setLocateRssi(null);
    locateRssiRef.current = null;
    setLocateError(null);
    locateSubRef.current?.remove();
    locateSubRef.current = null;
    if (beepTimerRef.current) {
      clearTimeout(beepTimerRef.current);
      beepTimerRef.current = null;
    }
    try {
      RfidBackend.stopInventory();
    } catch {}
  };

  useEffect(() => {
    return () => {
      stopLocate();
      resetScanSubscriptions();
    };
  }, []);

  const normalizeHex = (value: string) => {
    const cleaned = value.replace(/[^0-9a-fA-F]/g, '').toUpperCase();
    return cleaned;
  };

  const looksLikeEpc = (value: string) => {
    const cleaned = normalizeHex(value);
    return cleaned.length >= 8 && cleaned.length % 2 === 0;
  };

  const resolveLocateTargetEpc = (): string | null => {
    const expanded = results.find(r => r.id === expandedId);
    if (expanded?.epc) return normalizeHex(expanded.epc);

    const q = query.trim();
    if (!q) return null;
    if (looksLikeEpc(q)) return normalizeHex(q);

    const byCode = dataSource.find(d => d.fileCode.toLowerCase() === q.toLowerCase());
    return byCode?.epc ? normalizeHex(byCode.epc) : null;
  };

  const computeBeepInterval = (level: 'off' | 'low' | 'medium' | 'high', rssi: number | null) => {
    if (level === 'off') return null;
    const raw = typeof rssi === 'number' ? rssi : 0;
    const x = Math.max(0, Math.min(100, raw));
    const t = x / 100;

    if (level === 'low') {
      return Math.round(800 - t * 450);
    }
    if (level === 'medium') {
      return Math.round(650 - t * 470);
    }
    return Math.round(450 - t * 370);
  };

  const scheduleBeepLoop = (targetEpc: string) => {
    const settings = RfidBackend.getSettings();
    const global = settings.global;
    const ledAssist = settings.profiles['led-special'].ledAssist;
    const interval = computeBeepInterval(ledAssist.beepingAssist, locateRssiRef.current);

    if (!locatingRef.current || !targetEpc || !ledAssist.locateEnabled || interval == null) return;

    const doBeep = () => {
      if (!locatingRef.current) return;
      if (global.soundEnabled) {
        try {
          RfidBackend.playBeep(60);
        } catch {}
      }
      if (global.vibrationEnabled) {
        try {
          Vibration.vibrate(40);
        } catch {}
      }
      scheduleBeepLoop(targetEpc);
    };

    beepTimerRef.current = setTimeout(doBeep, interval);
  };

  const startLocate = () => {
    setLocateError(null);

    const settings = RfidBackend.getSettings();
    if (settings.activeMode !== 'led-special') {
      Alert.alert('LED Special required', 'Please switch Active Mode to LED Special in Settings, then try again.');
      return;
    }

    const ledAssist = settings.profiles['led-special'].ledAssist;
    if (!ledAssist.locateEnabled) {
      Alert.alert('LED Locate disabled', 'Enable LED Locate in Settings > LED Assist.');
      return;
    }

    const targetEpc = resolveLocateTargetEpc();
    if (!targetEpc) {
      setLocateError('Target not found. Select a card or key in File Code / EPC.');
      return;
    }

    stopLocate();
    locatingRef.current = true;
    setIsLocating(true);
    setLocateTargetEpc(targetEpc);
    setLocateRssi(null);
    locateRssiRef.current = null;

    locateSubRef.current = RfidBackend.onTags(tags => {
      const match = tags.find(t => normalizeHex(t.epc) === targetEpc);
      if (!match) return;
      const rssi = typeof match.rssi === 'number' ? match.rssi : null;
      setLocateRssi(rssi);
      locateRssiRef.current = rssi;

      const now = Date.now();
      if (now - lastBlinkRef.current > 1500) {
        lastBlinkRef.current = now;
        RfidBackend.readTagLED(targetEpc, '', 1).catch(() => {});
      }
    });

    try {
      RfidBackend.startInventory({ scanMode: 'continue' });
      scheduleBeepLoop(targetEpc);
    } catch {
      setLocateError('Locate start failed');
      stopLocate();
    }
  };

  const runSearch = () => {
    const q = query.trim().toLowerCase();
    const cat = projectCategory.trim().toLowerCase();

    if (!q && !cat) {
      setResults([]);
      setExpandedId(null);
      return;
    }

    const filtered = dataSource.filter(item => {
      if (cat && item.projectCategory.toLowerCase() !== cat) return false;
      if (!q) return true;
      return (
        item.fileCode.toLowerCase().includes(q) ||
        item.epc.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q)
      );
    });

    setResults(filtered);
    setExpandedId(filtered.length === 1 ? filtered[0].id : null);
  };

  const resolveScannedRecord = (epc: string): DocumentRecord => {
    const normalized = normalizeHex(epc);
    const found = dataSource.find(d => normalizeHex(d.epc) === normalized);
    if (found) return found;
    return {
      id: `scan-${normalized}`,
      fileCode: 'UNREGISTERED',
      title: 'Unknown Tag (Not in system)',
      epc: normalized,
      projectCategory: '-',
      version: '-',
      lastUpdated: '-',
      documentStatus: 'Not Found',
      trackingStatus: 'Unregistered',
    };
  };

  const scanRfidNearby = async () => {
    setScanBusy(true);
    setScanError(null);
    resetScanSubscriptions();
    setExpandedId(null);

    const seen = new Set<string>();

    const finish = (err: string | null) => {
      setScanBusy(false);
      setScanError(err);
      setScanModalVisible(false);
      resetScanSubscriptions();
      try {
        RfidBackend.stopInventory();
      } catch {}
    };

    const timeoutId = setTimeout(() => {
      if (seen.size === 0) {
        finish('No RFID tag detected');
        return;
      }
      finish(null);
    }, 5000);

    rfidSubRef.current = RfidBackend.onTags(tags => {
      let changed = false;
      tags.forEach(t => {
        const epc = t?.epc ? normalizeHex(t.epc) : '';
        if (!epc) return;
        if (seen.has(epc)) return;
        seen.add(epc);
        changed = true;
      });
      if (!changed) return;
      setResults(Array.from(seen).map(resolveScannedRecord));
    });

    try {
      RfidBackend.startInventory({ scanMode: 'continue' });
    } catch {
      clearTimeout(timeoutId);
      finish('RFID scan failed');
    }
  };

  const scanRfidOnce = async () => {
    if (!query.trim()) {
      return scanRfidNearby();
    }
    setScanBusy(true);
    setScanError(null);
    resetScanSubscriptions();

    const timeoutId = setTimeout(() => {
      setScanBusy(false);
      setScanError('RFID scan timeout');
      resetScanSubscriptions();
      try {
        RfidBackend.stopInventory();
      } catch {}
    }, 6000);

    rfidSubRef.current = RfidBackend.onTags(tags => {
      const first = tags?.[0]?.epc;
      if (!first) return;
      clearTimeout(timeoutId);
      setQuery(first);
      setScanBusy(false);
      setScanModalVisible(false);
      resetScanSubscriptions();
      try {
        RfidBackend.stopInventory();
      } catch {}
    });

    try {
      RfidBackend.startInventory({ scanMode: 'once' });
    } catch {
      clearTimeout(timeoutId);
      setScanBusy(false);
      setScanError('RFID scan failed');
      resetScanSubscriptions();
      try {
        RfidBackend.stopInventory();
      } catch {}
    }
  };

  const scanBarcodeOnce = async () => {
    setScanBusy(true);
    setScanError(null);
    resetScanSubscriptions();

    const timeoutId = setTimeout(() => {
      setScanBusy(false);
      setScanError('Barcode scan timeout');
      resetScanSubscriptions();
      try {
        BarcodeService.stopScan();
      } catch {}
    }, 6000);

    barcodeSubRef.current = BarcodeService.onBarcodeRead(data => {
      if (!data?.barcode) return;
      clearTimeout(timeoutId);
      setQuery(data.barcode);
      setScanBusy(false);
      setScanModalVisible(false);
      resetScanSubscriptions();
      try {
        BarcodeService.stopScan();
      } catch {}
    });

    try {
      BarcodeService.startScan();
    } catch {
      clearTimeout(timeoutId);
      setScanBusy(false);
      setScanError('Barcode scan failed');
      resetScanSubscriptions();
    }
  };

  const closeScanModal = () => {
    setScanModalVisible(false);
    setScanBusy(false);
    setScanError(null);
    resetScanSubscriptions();
    try {
      BarcodeService.stopScan();
    } catch {}
    try {
      RfidBackend.stopInventory();
    } catch {}
  };

  useEffect(() => {
    const sub = RfidBackend.onTrigger(state => {
      if (isLocating) return;
      const behavior = RfidBackend.getGlobal().triggerBehavior;

      const startTriggerScan = () => {
        if (triggerScanRef.current) return;
        triggerScanRef.current = true;
        triggerSeenRef.current = new Set();
        setScanError(null);
        resetScanSubscriptions();

        rfidSubRef.current = RfidBackend.onTags(tags => {
          let changed = false;
          tags.forEach(t => {
            const epc = t?.epc ? normalizeHex(t.epc) : '';
            if (!epc) return;
            if (triggerSeenRef.current.has(epc)) return;
            triggerSeenRef.current.add(epc);
            changed = true;
          });
          if (!changed) return;
          setResults(Array.from(triggerSeenRef.current).map(resolveScannedRecord));
        });

        try {
          RfidBackend.startInventory({ scanMode: 'continue' });
        } catch {
          triggerScanRef.current = false;
          setScanError('RFID scan failed');
          resetScanSubscriptions();
        }
      };

      const stopTriggerScan = () => {
        if (!triggerScanRef.current) return;
        triggerScanRef.current = false;
        resetScanSubscriptions();
        try {
          RfidBackend.stopInventory();
        } catch {}
      };

      if (behavior === 'toggle') {
        if (state === 'DOWN') {
          if (triggerScanRef.current) stopTriggerScan();
          else startTriggerScan();
        }
        return;
      }

      if (state === 'DOWN') startTriggerScan();
      else if (state === 'UP') stopTriggerScan();
    });

    return () => {
      sub.remove();
      triggerScanRef.current = false;
    };
  }, [isLocating, dataSource]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerSystem}>Document Management System</Text>
          <Text style={styles.headerCompany}>CLB HOLDINGS BERHAD</Text>
        </View>

        <View style={styles.headerBottom}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
            <Icon name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Document</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.fieldLabel}>Project Category</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={projectCategory} onValueChange={setProjectCategory} style={styles.picker}>
            <Picker.Item label="Select Project Category" value="" />
            <Picker.Item label="Internal" value="Internal" />
            <Picker.Item label="External" value="External" />
          </Picker>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchInputWrap}>
            <Icon name="magnify" size={18} color={Colors.textSecondary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search File Code / EPC Code"
              placeholderTextColor="#9aa3ad"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity style={styles.searchButton} activeOpacity={0.85} onPress={runSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanButton}
            activeOpacity={0.85}
            onPress={() => {
              setScanModalVisible(true);
              setScanError(null);
            }}
          >
            <Icon name="qrcode-scan" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.locateRow}>
          <TouchableOpacity
            style={[styles.locateButton, isLocating ? styles.locateButtonDisabled : null]}
            activeOpacity={0.85}
            onPress={startLocate}
            disabled={isLocating}
          >
            <Icon name="crosshairs-gps" size={18} color="#ffffff" />
            <Text style={styles.locateButtonText}>Locate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stopButton, !isLocating ? styles.locateButtonDisabled : null]}
            activeOpacity={0.85}
            onPress={stopLocate}
            disabled={!isLocating}
          >
            <Text style={styles.stopButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>

        {locateTargetEpc ? (
          <Text style={styles.locateInfo}>
            Target: {locateTargetEpc} {typeof locateRssi === 'number' ? `| RSSI: ${locateRssi}` : ''}
          </Text>
        ) : null}

        {locateError ? <Text style={styles.locateError}>{locateError}</Text> : null}

        {results.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Icon name="magnify" size={56} color="#1e64a8" />
            </View>
            <Text style={styles.emptyTitle}>Search File</Text>
            <Text style={styles.emptySubtitle}>Search by File Code or EPC Code</Text>
          </View>
        ) : (
          <View style={styles.resultsWrap}>
            {results.map(item => {
              const expanded = item.id === expandedId;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.9}
                  style={styles.resultCard}
                  onPress={() => setExpandedId(expanded ? null : item.id)}
                >
                  <View style={styles.resultHeaderRow}>
                    <View style={styles.resultLeft}>
                      <Text style={styles.resultFileCode}>{item.fileCode}</Text>
                      <Text style={styles.resultTitle} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </View>
                    <View style={styles.resultRight}>
                      <Text style={styles.resultEpc} numberOfLines={1}>
                        {item.epc}
                      </Text>
                      <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={22} color={Colors.textSecondary} />
                    </View>
                  </View>

                  {expanded ? (
                    <View style={styles.detailSection}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>EPC Code:</Text>
                        <Text style={styles.detailValue}>{item.epc}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Project Category:</Text>
                        <Text style={styles.detailValue}>{item.projectCategory}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Version:</Text>
                        <Text style={styles.detailValue}>{item.version}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Last Updated:</Text>
                        <Text style={styles.detailValue}>{item.lastUpdated}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Document Status:</Text>
                        <Text style={styles.detailValue}>{item.documentStatus}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Tracking Status:</Text>
                        <Text style={styles.detailValue}>{item.trackingStatus}</Text>
                      </View>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <Text style={styles.footer}>© 2026 Document Management System. All rights reserved.</Text>
      </ScrollView>

      <Modal transparent animationType="fade" visible={scanModalVisible} onRequestClose={closeScanModal}>
        <Pressable style={styles.modalOverlay} onPress={closeScanModal}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalTitle}>Scan</Text>
            <Text style={styles.modalSubtitle}>Choose scan type</Text>

            {scanError ? <Text style={styles.modalError}>{scanError}</Text> : null}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, scanBusy ? styles.modalButtonDisabled : null]}
                disabled={scanBusy}
                onPress={scanRfidOnce}
              >
                <Icon name="radio-tower" size={20} color="#ffffff" />
                <Text style={styles.modalButtonText}>RFID</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, scanBusy ? styles.modalButtonDisabled : null]}
                disabled={scanBusy}
                onPress={scanBarcodeOnce}
              >
                <Icon name="barcode-scan" size={20} color="#ffffff" />
                <Text style={styles.modalButtonText}>Barcode</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              {scanBusy ? <ActivityIndicator color={Colors.primary} /> : null}
              <TouchableOpacity style={styles.modalClose} onPress={closeScanModal} disabled={scanBusy}>
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: '#1e64a8', paddingTop: 18, paddingBottom: 14, paddingHorizontal: 16 },
  headerTop: { alignItems: 'center' },
  headerSystem: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  headerCompany: { color: '#d7ebff', fontWeight: '700', fontSize: 11, marginTop: 2 },
  headerBottom: { marginTop: 10, flexDirection: 'row', alignItems: 'center' },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: { flex: 1, textAlign: 'center', color: '#ffffff', fontWeight: '900', fontSize: 20 },
  headerRightSpacer: { width: 36, height: 36 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 20 },
  fieldLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6 },
  pickerWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 10,
  },
  picker: { height: 46, width: '100%' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 44,
  },
  searchInput: { flex: 1, marginLeft: 6, color: Colors.text, fontSize: 13, paddingVertical: 0 },
  searchButton: {
    marginLeft: 10,
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1e64a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: { color: '#ffffff', fontWeight: '800' },
  scanButton: {
    marginLeft: 10,
    height: 44,
    width: 44,
    borderRadius: 8,
    backgroundColor: '#1e64a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  locateButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#1e64a8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  locateButtonText: { marginLeft: 8, color: '#ffffff', fontWeight: '900' },
  stopButton: {
    marginLeft: 10,
    height: 42,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopButtonText: { color: '#ffffff', fontWeight: '900' },
  locateButtonDisabled: { opacity: 0.55 },
  locateInfo: { marginBottom: 6, color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  locateError: { marginBottom: 8, color: Colors.danger, fontSize: 12, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 92, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 102,
    height: 102,
    borderRadius: 51,
    backgroundColor: '#d7ebff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 18, fontWeight: '900', fontSize: 20, color: Colors.text },
  emptySubtitle: { marginTop: 6, color: Colors.textSecondary, fontSize: 12 },
  resultsWrap: { marginTop: 8 },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resultHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  resultLeft: { flex: 1, paddingRight: 10 },
  resultFileCode: { fontSize: 18, fontWeight: '900', color: Colors.text },
  resultTitle: { marginTop: 6, fontSize: 13, fontWeight: '700', color: Colors.textSecondary },
  resultRight: { width: 118, alignItems: 'flex-end', justifyContent: 'center' },
  resultEpc: { fontSize: 9, color: Colors.textSecondary, marginBottom: 4 },
  detailSection: { marginTop: 12, borderTopWidth: 1, borderTopColor: '#eef2f6', paddingTop: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  detailLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '700' },
  detailValue: { fontSize: 12, color: Colors.text, fontWeight: '700' },
  footer: { marginTop: 10, textAlign: 'center', color: Colors.textSecondary, fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { width: '86%', backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: Colors.text },
  modalSubtitle: { marginTop: 4, color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  modalError: { marginTop: 10, color: Colors.danger, fontWeight: '800', fontSize: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#1e64a8',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalButtonDisabled: { opacity: 0.55 },
  modalButtonText: { marginLeft: 8, color: '#ffffff', fontWeight: '900' },
  modalFooter: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalClose: { paddingHorizontal: 12, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { color: Colors.primary, fontWeight: '900' },
});
