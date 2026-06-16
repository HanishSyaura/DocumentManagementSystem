import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useInventory } from '../hooks/useInventory';
import { RfidBackend } from '../backend';
import { Colors } from '../styles/theme';

// =========================================================
// 1. SUB-COMPONENTS (OUTSIDE MAIN COMPONENT)
// =========================================================

const CheckItem = ({ label, selected, onPress, isRadio }: any) => (
  <TouchableOpacity style={styles.checkItem} onPress={onPress}>
    <Icon
      name={selected 
        ? (isRadio ? "radiobox-marked" : "checkbox-marked") 
        : (isRadio ? "radiobox-blank" : "checkbox-blank-outline")
      }
      size={22}
      color={selected ? Colors.primary : Colors.textSecondary}
    />
    <Text style={styles.checkLabel}>{label}</Text>
  </TouchableOpacity>
);

const SettingsModal = ({ visible, title, onClose, children }: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{title} Settings</Text>
        <View style={styles.modalBody}>{children}</View>
        <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
          <Text style={styles.modalCloseText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// =========================================================
// 2. MAIN SCREEN COMPONENT
// =========================================================

export default function InventoryScreen() {
  const { tags, startScan, stopScan, isScanning, clearTags } = useInventory();
  
  const [scanMode, setScanMode] = useState<'once' | 'continue'>('continue');
  const [isFilter, setIsFilter] = useState(false);
  const [isSpecial, setIsSpecial] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [filterQuery, setFilterQuery] = useState('');

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [specialModalVisible, setSpecialModalVisible] = useState(false);

  // --- REF FOR HARDWARE SYNC ---
  // We use a ref so the hardware trigger listener always has the 
  // latest scanMode without needing to restart the useEffect.
  const scanModeRef = useRef(scanMode);
  useEffect(() => {
    scanModeRef.current = scanMode;
  }, [scanMode]);

  // --- 1. HARDWARE TRIGGER IMPLEMENTATION ---
  useEffect(() => {
    const triggerSub = RfidBackend.onTrigger((state: 'DOWN' | 'UP') => {
      if (state === 'DOWN') {
        console.log("Hardware Trigger: DOWN. Starting scan mode:", scanModeRef.current);
        startScan(scanModeRef.current);
      } else {
        console.log("Hardware Trigger: UP. Stopping scan.");
        stopScan();
      }
    });

    return () => {
      triggerSub.remove();
    };
  }, []); // Only run once on mount

  // --- 2. MUTUALLY EXCLUSIVE LOGIC ---
  const toggleFilter = () => {
    const nextValue = !isFilter;
    setIsFilter(nextValue);
    if (nextValue) {
      setIsSpecial(false); 
      setFilterModalVisible(true);
    }
    setFilterQuery(''); 
  };

  const toggleSpecial = () => {
    const nextValue = !isSpecial;
    setIsSpecial(nextValue);
    if (nextValue) {
      setIsFilter(false); 
      setSpecialModalVisible(true);
    }
  };

  // --- 3. FILTER LOGIC ---
  const displayTags = useMemo(() => {
    if (!isFilter || filterQuery.trim() === '') return tags;
    return tags.filter(tag => 
      tag.epc.toLowerCase().includes(filterQuery.toLowerCase())
    );
  }, [tags, isFilter, filterQuery]);

  // --- 4. TIMER ---
  useEffect(() => {
    let interval: any;
    if (isScanning) {
      interval = setInterval(() => setElapsed(prev => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  };

  return (
    <View style={styles.container}>
      
      {/* 1. Dashboard Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Unique Count</Text>
          <Text style={styles.statValue}>{tags.length}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Total Tags</Text>
          <Text style={styles.statValue}>
            {tags.reduce((acc, curr) => acc + curr.count, 0)}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statTitle}>Time</Text>
          <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
        </View>
      </View>

      {/* 2. Controls */}
      <View style={styles.controlBar}>
        <CheckItem label="Once" isRadio selected={scanMode === 'once'} onPress={() => setScanMode('once')} />
        <CheckItem label="Continue" isRadio selected={scanMode === 'continue'} onPress={() => setScanMode('continue')} />
        <View style={styles.vDivider} />
        <CheckItem label="Filter" selected={isFilter} onPress={toggleFilter} />
        <CheckItem label="Special" selected={isSpecial} onPress={toggleSpecial} />
      </View>

      {/* Filter Search Input */}
      {isFilter && (
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search EPC in table..."
            value={filterQuery}
            onChangeText={setFilterQuery}
          />
        </View>
      )}

      {/* Special LED Indicator */}
      {isSpecial && (
        <View style={styles.specialIndicator}>
          <Icon name="lightbulb-on" size={16} color="#FFD700" />
          <Text style={styles.specialText}>LED Mode Active</Text>
        </View>
      )}

      {/* Modals */}
      <SettingsModal visible={filterModalVisible} title="Filter" onClose={() => setFilterModalVisible(false)}>
        <Text style={styles.modalInfo}>Filter enabled. Table results will be filtered by EPC based on your search input.</Text>
      </SettingsModal>
    
      <SettingsModal visible={specialModalVisible} title="Special" onClose={() => setSpecialModalVisible(false)}>
        <Text style={styles.modalInfo}>Special LED Mode. The reader will trigger the LED on compatible tags.</Text>
      </SettingsModal>

      {/* 3. Action Buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity 
          style={[styles.mainBtn, isScanning && styles.stopBtn]} 
          onPress={() => isScanning ? stopScan() : startScan(scanMode)}
        >
          <Icon name={isScanning ? "stop" : "play"} size={22} color="#fff" />
          <Text style={styles.mainBtnText}>{isScanning ? "Stop Inventory" : "Start Inventory"}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.clearBtn} onPress={() => { clearTags(); setElapsed(0); }}>
           <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Table Header */}
      <View style={styles.tableHeader}>
        <Text style={[styles.hCell, { flex: 0.6 }]}>S/N</Text>
        <Text style={[styles.hCell, { flex: 3 }]}>TAG EPC</Text>
        <Text style={[styles.hCell, { flex: 1 }]}>COUNT</Text>
        <Text style={[styles.hCell, { flex: 1 }]}>RSSI</Text>
      </View>

      {/* 5. Tag List */}
      <FlatList
        data={displayTags}
        keyExtractor={(item) => item.epc}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, { flex: 0.6 }]}>{String(index + 1).padStart(2, '0')}</Text>
            <Text style={[styles.cell, { flex: 3, fontWeight: '600' }]} numberOfLines={1}>{item.epc}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.count}</Text>
            <Text style={[styles.cell, { flex: 1, color: Colors.primary }]}>{item.rssi ?? '--'}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fa', padding: 15 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  statCard: { backgroundColor: '#fff', padding: 12, borderRadius: 10, width: '31%', elevation: 2 },
  statTitle: { fontSize: 10, color: Colors.textSecondary, fontWeight: 'bold' },
  statValue: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
  controlBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 10, elevation: 1, borderWidth: 1, borderColor: '#eee' },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  checkLabel: { fontSize: 12, marginLeft: 4, color: Colors.text },
  vDivider: { width: 1, height: 20, backgroundColor: '#ddd', marginRight: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, borderRadius: 8, height: 40, marginBottom: 10, borderWidth: 1, borderColor: Colors.primary },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  specialIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#333', padding: 8, borderRadius: 6, marginBottom: 10 },
  specialText: { color: '#fff', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  mainBtn: { flex: 3, backgroundColor: Colors.primary, flexDirection: 'row', height: 45, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  stopBtn: { backgroundColor: Colors.danger },
  mainBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14, marginLeft: 8 },
  clearBtn: { flex: 1, backgroundColor: '#e0e0e0', height: 45, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  clearBtnText: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  hCell: { fontSize: 11, fontWeight: 'bold', color: Colors.textSecondary, textAlign: 'center' },
  row: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: '#fff' },
  cell: { fontSize: 12, color: Colors.text, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 15, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: Colors.primary },
  modalBody: { marginBottom: 20 },
  modalInfo: { fontSize: 14, color: '#444', lineHeight: 20 },
  modalCloseBtn: { backgroundColor: Colors.primary, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalCloseText: { color: '#fff', fontWeight: 'bold' },
});
