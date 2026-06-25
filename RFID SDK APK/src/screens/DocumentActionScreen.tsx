import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../styles/theme';
import { RegistryBackend, RfidBackend, type ProjectCategory, type RegistryRecord } from '../backend';

type ActionType = 'check-in' | 'check-out' | 'archive';

const normalizeHex = (value: string) => String(value ?? '').replace(/[^0-9a-fA-F]/g, '').toUpperCase();

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const buildUnknownRecord = (epcHex: string): RegistryRecord => ({
  id: `unknown-${epcHex}`,
  fileCode: 'UNREGISTERED',
  fileName: '-',
  epcHex,
  epcScheme: '-',
  trackingStatus: 'UNREGISTERED',
  trackingUpdatedAt: null,
  generatedAt: null,
  documentStatus: 'Not Found',
  document: null,
});

const getScreenTitle = (action: ActionType) => {
  if (action === 'check-in') return 'Check-In Document';
  if (action === 'check-out') return 'Check-Out Document';
  return 'Archive';
};

const getEmptyTitle = (action: ActionType) => {
  if (action === 'check-in') return 'Check-In';
  if (action === 'check-out') return 'Check-Out';
  return 'Archive';
};

const getEmptyIcon = (action: ActionType) => {
  if (action === 'check-in') return 'folder-download-outline';
  if (action === 'check-out') return 'folder-upload-outline';
  return 'archive-outline';
};

const getConfirmLabel = (action: ActionType) => {
  if (action === 'check-in') return 'Confirm Check-In';
  if (action === 'check-out') return 'Confirm Check-Out';
  return 'Confirm Archive';
};

const getTrackingEndpoint = (action: ActionType): 'check-in' | 'check-out' | 'archive' => {
  if (action === 'check-in') return 'check-in';
  if (action === 'check-out') return 'check-out';
  return 'archive';
};

const ResultCard = ({
  item,
  expanded,
  onToggle,
}: {
  item: RegistryRecord;
  expanded: boolean;
  onToggle: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.9} style={styles.resultCard} onPress={onToggle}>
      <View style={styles.resultHeaderRow}>
        <View style={styles.resultLeft}>
          <Text style={styles.resultFileCode}>{item.fileCode}</Text>
          <Text style={styles.resultTitle} numberOfLines={1}>
            {item.document?.title || item.fileName || 'Unknown document'}
          </Text>
        </View>
        <View style={styles.resultRight}>
          <Text style={styles.resultEpc} numberOfLines={1}>
            {item.epcHex}
          </Text>
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={22} color={Colors.textSecondary} />
        </View>
      </View>

      {expanded ? (
        <View style={styles.detailSection}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EPC Code:</Text>
            <Text style={styles.detailValue}>{item.epcHex}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Project Category:</Text>
            <Text style={styles.detailValue}>{item.document?.projectCategory?.name || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Version:</Text>
            <Text style={styles.detailValue}>{item.document?.version || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Updated:</Text>
            <Text style={styles.detailValue}>{formatDate(item.document?.updatedAt || item.generatedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Document Status:</Text>
            <Text style={styles.detailValue}>{item.documentStatus || '-'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tracking Status:</Text>
            <Text style={styles.detailValue}>{item.trackingStatus || '-'}</Text>
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

export default function DocumentActionScreen({ action }: { action: ActionType }) {
  const navigation = useNavigation<any>();

  const [projectCategoryId, setProjectCategoryId] = useState('');
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [results, setResults] = useState<RegistryRecord[]>([]);

  const scanningRef = useRef(false);
  const tagsSubRef = useRef<{ remove: () => void } | null>(null);
  const triggerSubRef = useRef<{ remove: () => void } | null>(null);

  const title = useMemo(() => getScreenTitle(action), [action]);
  const emptyTitle = useMemo(() => getEmptyTitle(action), [action]);
  const emptyIcon = useMemo(() => getEmptyIcon(action), [action]);
  const confirmLabel = useMemo(() => getConfirmLabel(action), [action]);
  const trackingEndpoint = useMemo(() => getTrackingEndpoint(action), [action]);

  const fetchLookup = async (epcHexes: string[]) => {
    if (!projectCategoryId) {
      throw new Error('Select a project category first.');
    }

    const normalized = Array.from(new Set(epcHexes.map(normalizeHex).filter(Boolean)));
    if (normalized.length === 0) return;

    const response = await RegistryBackend.lookupByEpcHexes({
      projectCategoryId,
      epcHexes: normalized,
    });

    const byEpc = new Map(response.records.map(record => [normalizeHex(record.epcHex), record]));
    setResults(normalized.map(epcHex => byEpc.get(epcHex) || buildUnknownRecord(epcHex)));
    setExpandedId(normalized.length === 1 ? (byEpc.get(normalized[0]) || buildUnknownRecord(normalized[0])).id : null);
  };

  const startScan = () => {
    if (scanningRef.current) return;
    if (!projectCategoryId) {
      setScreenError('Select a project category before scanning.');
      return;
    }
    scanningRef.current = true;
    setIsScanning(true);
    setScreenError(null);
    RfidBackend.startInventory();
  };

  const stopScan = () => {
    if (!scanningRef.current) return;
    scanningRef.current = false;
    setIsScanning(false);
    RfidBackend.stopInventory();
  };

  useEffect(() => {
    let mounted = true;
    RegistryBackend.getProjectCategories()
      .then(next => {
        if (!mounted) return;
        setCategories(next);
        if (!projectCategoryId && next.length > 0) {
          setProjectCategoryId(String(next[0].id));
        }
      })
      .catch((error: any) => {
        if (!mounted) return;
        setScreenError(error?.message || 'Unable to load project categories.');
      });

    tagsSubRef.current?.remove();
    tagsSubRef.current = RfidBackend.onTags(tags => {
      if (!scanningRef.current) return;
      const nextEpcs = Array.from(
        new Set([
          ...results.map(item => normalizeHex(item.epcHex)),
          ...tags.map(tag => normalizeHex(tag?.epc || '')).filter(Boolean),
        ]),
      );
      void fetchLookup(nextEpcs).catch((error: any) => {
        setScreenError(error?.message || 'RFID lookup failed.');
      });
    });

    triggerSubRef.current?.remove();
    triggerSubRef.current = RfidBackend.onTrigger(state => {
      const behavior = RfidBackend.getGlobal().triggerBehavior;
      if (behavior === 'toggle') {
        if (state === 'DOWN') {
          if (scanningRef.current) stopScan();
          else startScan();
        }
        return;
      }
      if (state === 'DOWN') startScan();
      else if (state === 'UP') stopScan();
    });

    return () => {
      mounted = false;
      tagsSubRef.current?.remove();
      triggerSubRef.current?.remove();
      stopScan();
    };
  }, [projectCategoryId, results]);

  const confirm = async () => {
    if (results.length === 0) return;
    setBusy(true);
    setScreenError(null);
    try {
      const updated = await Promise.all(
        results.map(item =>
          RegistryBackend.updateTracking(trackingEndpoint, {
            epcHex: item.epcHex,
            fileCode: item.fileCode !== 'UNREGISTERED' ? item.fileCode : undefined,
          }),
        ),
      );
      setResults(updated);
      stopScan();
    } catch (error: any) {
      setScreenError(error?.message || 'Tracking update failed.');
    } finally {
      setBusy(false);
    }
  };

  const showEmpty = results.length === 0;

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
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.fieldLabel}>Project Category</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={projectCategoryId} onValueChange={setProjectCategoryId} style={styles.picker}>
            <Picker.Item label="Select Project Category" value="" />
            {categories.map(category => (
              <Picker.Item key={category.id} label={category.name} value={String(category.id)} />
            ))}
          </Picker>
        </View>

        {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}

        {showEmpty ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIconCircle}>
              <Icon name={emptyIcon} size={64} color="#1e64a8" />
            </View>
            <Text style={styles.emptyTitle}>{emptyTitle}</Text>
            <Text style={styles.emptySubtitle}>Push trigger or "Scan" button to start scanning RFID Tag</Text>

            <TouchableOpacity
              style={[styles.scanButton, isScanning || busy ? styles.scanButtonActive : null]}
              activeOpacity={0.85}
              onPress={() => (isScanning ? stopScan() : startScan())}
              disabled={busy}
            >
              <Text style={styles.scanButtonText}>Scan Documents</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.resultsWrap}>
            {results.map(item => {
              const expanded = item.id === expandedId;
              return (
                <ResultCard
                  key={item.id}
                  item={item}
                  expanded={expanded}
                  onToggle={() => setExpandedId(expanded ? null : item.id)}
                />
              );
            })}
          </View>
        )}

        {!showEmpty ? (
          <View style={styles.confirmWrap}>
            <TouchableOpacity style={styles.confirmButton} activeOpacity={0.85} onPress={() => void confirm()} disabled={busy}>
              {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.confirmButtonText}>{confirmLabel}</Text>}
            </TouchableOpacity>
          </View>
        ) : null}

        <Text style={styles.footer}>© 2026 Document Management System. All rights reserved.</Text>
      </ScrollView>
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
  errorText: { marginBottom: 10, color: Colors.danger, fontSize: 12, fontWeight: '800' },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 86, paddingHorizontal: 20 },
  emptyIconCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#d7ebff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { marginTop: 18, fontWeight: '900', fontSize: 20, color: Colors.text },
  emptySubtitle: { marginTop: 6, color: Colors.textSecondary, fontSize: 12, textAlign: 'center' },
  scanButton: {
    marginTop: 14,
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: '#1e64a8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonActive: { backgroundColor: '#0d4b86' },
  scanButtonText: { color: '#ffffff', fontWeight: '900' },
  resultsWrap: { marginTop: 2 },
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
  confirmWrap: { marginTop: 10, alignItems: 'center' },
  confirmButton: {
    width: '72%',
    height: 44,
    borderRadius: 4,
    backgroundColor: '#2f7d32',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: { color: '#ffffff', fontWeight: '900' },
  footer: { marginTop: 18, textAlign: 'center', color: Colors.textSecondary, fontSize: 11 },
});
