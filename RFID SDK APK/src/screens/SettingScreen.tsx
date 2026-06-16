import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from '../components/common/Card';
import { Colors } from '../styles/theme';
import pkg from '../../package.json';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import { RfidBackend, type BeepingAssistLevel, type RfidOperationMode, type TriggerBehavior } from '../backend';

const SettingItem = ({ icon, label, value, onValueChange, type = 'switch' }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.leftSide}>
        <View style={styles.iconCircle}>
          <Icon name={icon} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>
      {type === 'switch' ? (
        <Switch value={value} onValueChange={onValueChange} trackColor={{ true: Colors.primary }} />
      ) : (
        <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
      )}
    </View>
  );

export default function SettingScreen() {
  const navigation = useNavigation<any>();

  const [activeMode, setActiveMode] = useState<RfidOperationMode>('standard');
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(false);
  const [triggerBehavior, setTriggerBehavior] = useState<TriggerBehavior>('hold');

  const [standardScanMode, setStandardScanMode] = useState<'once' | 'continue'>('continue');
  const [ledScanMode, setLedScanMode] = useState<'once' | 'continue'>('continue');
  const [preferSingleLed, setPreferSingleLed] = useState(true);
  const [locateEnabled, setLocateEnabled] = useState(true);
  const [beepingAssist, setBeepingAssist] = useState<BeepingAssistLevel>('medium');

  const [showFirmware, setShowFirmware] = useState(false);
  const handleRestoreDefaults = () => {
    Alert.alert(
      "Restore Default Settings",
      "Are you sure you want to restore default settings? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Restore",
          style: "destructive",
          onPress: () => {
            const next = RfidBackend.resetSettings();
            setActiveMode(next.activeMode);
            setSound(next.global.soundEnabled);
            setVibrate(next.global.vibrationEnabled);
            setTriggerBehavior(next.global.triggerBehavior);
            setStandardScanMode(next.profiles.standard.inventoryScanMode);
            setLedScanMode(next.profiles['led-special'].inventoryScanMode);
            setPreferSingleLed(next.profiles['led-special'].preferSingleTagForLed);
            setLocateEnabled(next.profiles['led-special'].ledAssist.locateEnabled);
            setBeepingAssist(next.profiles['led-special'].ledAssist.beepingAssist);
          }
        }
      ]
    );
  };

  useEffect(() => {
    const s = RfidBackend.getSettings();
    setActiveMode(s.activeMode);
    setSound(s.global.soundEnabled);
    setVibrate(s.global.vibrationEnabled);
    setTriggerBehavior(s.global.triggerBehavior);
    setStandardScanMode(s.profiles.standard.inventoryScanMode);
    setLedScanMode(s.profiles['led-special'].inventoryScanMode);
    setPreferSingleLed(s.profiles['led-special'].preferSingleTagForLed);
    setLocateEnabled(s.profiles['led-special'].ledAssist.locateEnabled);
    setBeepingAssist(s.profiles['led-special'].ledAssist.beepingAssist);

    return RfidBackend.onSettingsChange(next => {
      setActiveMode(next.activeMode);
      setSound(next.global.soundEnabled);
      setVibrate(next.global.vibrationEnabled);
      setTriggerBehavior(next.global.triggerBehavior);
      setStandardScanMode(next.profiles.standard.inventoryScanMode);
      setLedScanMode(next.profiles['led-special'].inventoryScanMode);
      setPreferSingleLed(next.profiles['led-special'].preferSingleTagForLed);
      setLocateEnabled(next.profiles['led-special'].ledAssist.locateEnabled);
      setBeepingAssist(next.profiles['led-special'].ledAssist.beepingAssist);
    });
  }, []);

  const modeLabel = useMemo(() => (activeMode === 'standard' ? 'Standard' : 'LED Special'), [activeMode]);

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
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerRightSpacer} />
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
      {/* 1. Firmware Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showFirmware}
        onRequestClose={() => setShowFirmware(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowFirmware(false)}>
          <View style={styles.modalContent}>
            <Icon name="information-outline" size={44} color={Colors.primary} />
            <Text style={styles.modalTitle}>Application Information</Text>
            
            <View style={styles.modalTextContainer}>
              <Text style={styles.modalVersionLabel}>Firmware Version</Text>
              <Text style={styles.modalVersionValue}>v{pkg.version}</Text>
              
              <View style={styles.modalDivider} />
              
              <Text style={styles.modalCopyright}>
                © {new Date().getFullYear()} Evolve Technology Platform
              </Text>
            </View>

            <TouchableOpacity style={styles.closeButton} onPress={() => setShowFirmware(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Text style={styles.sectionHeader}>RFID MODE</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Active Mode</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={activeMode}
              onValueChange={async (value: RfidOperationMode) => {
                await RfidBackend.switchActiveMode(value);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Standard" value="standard" />
              <Picker.Item label="LED Special" value="led-special" />
            </Picker>
          </View>
        </View>
        <Text style={styles.hintText}>Current mode: {modeLabel}. Tukar mode lepas tu user trigger/scan semula.</Text>
      </Card>

      <Text style={styles.sectionHeader}>GLOBAL</Text>
      <Card>
        <SettingItem
          icon="volume-high"
          label="Reading Sound"
          value={sound}
          onValueChange={(v: boolean) => {
            setSound(v);
            RfidBackend.updateGlobal({ soundEnabled: v });
          }}
        />
        <SettingItem
          icon="vibrate"
          label="Vibration Feedback"
          value={vibrate}
          onValueChange={(v: boolean) => {
            setVibrate(v);
            RfidBackend.updateGlobal({ vibrationEnabled: v });
          }}
        />
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Trigger Behavior</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={triggerBehavior}
              onValueChange={(value: TriggerBehavior) => {
                setTriggerBehavior(value);
                RfidBackend.updateGlobal({ triggerBehavior: value });
              }}
              style={styles.picker}
            >
              <Picker.Item label="Hold to scan" value="hold" />
              <Picker.Item label="Tap to toggle" value="toggle" />
            </Picker>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionHeader}>STANDARD PROFILE</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Inventory Scan Mode</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={standardScanMode}
              onValueChange={(value: 'once' | 'continue') => {
                setStandardScanMode(value);
                RfidBackend.updateProfile('standard', { inventoryScanMode: value });
              }}
              style={styles.picker}
            >
              <Picker.Item label="Continuous" value="continue" />
              <Picker.Item label="Once" value="once" />
            </Picker>
          </View>
        </View>
      </Card>

      <Text style={styles.sectionHeader}>LED SPECIAL PROFILE</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Inventory Scan Mode</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={ledScanMode}
              onValueChange={(value: 'once' | 'continue') => {
                setLedScanMode(value);
                RfidBackend.updateProfile('led-special', { inventoryScanMode: value });
              }}
              style={styles.picker}
            >
              <Picker.Item label="Continuous" value="continue" />
              <Picker.Item label="Once" value="once" />
            </Picker>
          </View>
        </View>
        <SettingItem
          icon="target"
          label="Prefer Single Tag"
          value={preferSingleLed}
          onValueChange={(v: boolean) => {
            setPreferSingleLed(v);
            RfidBackend.updateProfile('led-special', { preferSingleTagForLed: v });
          }}
        />
      </Card>

      <Text style={styles.sectionHeader}>LED ASSIST</Text>
      <Card>
        <SettingItem
          icon="led-on"
          label="Enable LED Locate"
          value={locateEnabled}
          onValueChange={(v: boolean) => {
            setLocateEnabled(v);
            RfidBackend.updateProfile('led-special', {
              ledAssist: { locateEnabled: v, beepingAssist },
            });
          }}
        />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Beeping Assist</Text>
          <View style={styles.pickerWrap}>
            <Picker
              selectedValue={beepingAssist}
              onValueChange={(value: BeepingAssistLevel) => {
                setBeepingAssist(value);
                RfidBackend.updateProfile('led-special', {
                  ledAssist: { locateEnabled, beepingAssist: value },
                });
              }}
              style={styles.picker}
              enabled={locateEnabled}
            >
              <Picker.Item label="Off" value="off" />
              <Picker.Item label="Low" value="low" />
              <Picker.Item label="Medium" value="medium" />
              <Picker.Item label="High" value="high" />
            </Picker>
          </View>
        </View>

        <Text style={styles.hintText}>Beeping assist akan ikut RSSI (signal strength) untuk target EPC semasa locate.</Text>
      </Card>

      <Text style={styles.sectionHeader}>DEVICE & SYSTEM</Text>
      <Card>
        <TouchableOpacity onPress={() => setShowFirmware(true)}>
          <View style={styles.settingItem}>
            <View style={styles.leftSide}>
              <View style={styles.iconCircle}>
                <Icon name="information-outline" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.label}>Application Information</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionHeader}>OTHERS</Text>
      <Card>
        <TouchableOpacity onPress={handleRestoreDefaults}>
          <View style={styles.settingItem}>
            <View style={styles.leftSide}>
              <View style={styles.iconCircle}>
                <Icon name="restore" size={20} color={Colors.danger} />
              </View>
              <Text style={[styles.label, { color: Colors.danger }]}>Restore Default Settings</Text>
            </View>
            <Icon name="chevron-right" size={24} color={Colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </Card>
        <Text style={styles.footer}>© 2026 Document Management System. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 24 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, marginTop: 18 },

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
  
  // Setting Items
  settingItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  leftSide: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  label: { fontSize: 15, color: Colors.text, fontWeight: '500' },

  row: { paddingVertical: 8 },
  rowLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6 },
  pickerWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  picker: { height: 46, width: '100%' },
  hintText: { marginTop: 8, fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
  footer: { marginTop: 18, textAlign: 'center', color: Colors.textSecondary, fontSize: 11 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', elevation: 10 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 12 },
  modalTextContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
  modalVersionLabel: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  modalVersionValue: { fontSize: 20, color: Colors.primary, fontWeight: 'bold', marginTop: 4 },
  modalDivider: { height: 1, backgroundColor: '#EEE', width: '100%', marginVertical: 15 },
  modalCopyright: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
  closeButton: { backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 12, marginTop: 25, width: '100%', alignItems: 'center' },
  closeButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
