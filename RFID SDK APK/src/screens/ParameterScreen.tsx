// src/screens/ParameterScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Card from '../components/common/Card';
import { Colors } from '../styles/theme';
import { Picker } from '@react-native-picker/picker';


export default function ParameterScreen() {
  const [power, setPower] = useState('30');
  const powerOptions = Array.from({ length: 33 }, (_, i) => (i + 1).toString());
  const [tagFocus, setTagFocus] = useState(true);
  const [fastId, setFastId] = useState(false);
  const [autoExport, setAutoExport] = useState(true);
  const [region, setRegion] = useState('FCC');
  const regions = [
    {label: 'FCC (US/NA)', value: 'FCC'},
    {label: 'ETSI (EU)', value: 'ETSI'},
    {label: 'China', value: 'CHINA'},
  ];
  const [session, setSession] = useState('S1');
  const sessionOptions = ['S0', 'S1', 'S2', 'S3'];
  const [profile, setProfile] = useState('A');
  const profileOptions = [
    {label: 'Profile 0', value: '0'},
    {label: 'Profile 1', value: '1'},
    {label: 'Profile 2', value: '2'},
    {label: 'Profile 3', value: '3'},
  ];
  const [target, setTarget] = useState('A');
  const targetOptions = ['A', 'B', 'AB'];

  // Helper for the "Set/Get" input rows
  const ConfigRow = ({ label, value, onChange, placeholder }: any) => (
    <View style={styles.configRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputActionGroup}>
        <TextInput 
          style={styles.rowInput} 
          value={value} 
          onChangeText={onChange} 
          placeholder={placeholder}
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Set</Text></TouchableOpacity>
        <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Get</Text></TouchableOpacity>
      </View>
    </View>
  );

  // Helper for dropdown rows
  const PickerRow =({ label, value, onValueChange, items }: any) => (
    <View style={styles.pickerRowContainer}>
      <Text style={styles.pickerRowLabel}>{label}</Text>
        <View style={styles.inclinePickerWrapper}>
          <Picker
            selectedValue={value}
            onValueChange={onValueChange}
            style={styles.pickerStyle}
            mode="dropdown"
          >
            {items.map((item: any) => (
              <Picker.Item
                key={typeof item === 'string' ? item : item.value}
                label={typeof item === 'string' ? item : item.label}
                value={typeof item === 'string' ? item : item.value}
              />
            ))}
          </Picker>
        </View>
    </View>
  );
  

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{ paddingBottom: 10 }}
    >
      <Text style={styles.sectionHeader}>BASIC CONFIGURATION</Text>
      <Card>
        <Text style={styles.fieldLabel}>Output Power (dBm)</Text>
          <View style={styles.inputActionGroup}>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={power}
                onValueChange={(itemValue) => setPower(itemValue)}
                style={styles.pickerStyle}
                mode="dropdown"
              >
                {powerOptions.map((p) => (
                  <Picker.Item key={p} label={`${p} dBm`} value={p} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Set</Text></TouchableOpacity>
            <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Get</Text></TouchableOpacity>
          </View>
        
        <Text style={styles.fieldLabel}>Operation Region</Text>
          <View style={styles.inputActionGroup}>
           <View style={styles.pickerContainer}>
              <Picker
                selectedValue={region}
                onValueChange={(val) => setRegion(val)}
                style={styles.pickerStyle}
                mode="dropdown"
              >
                {regions.map((r) => (
                  <Picker.Item key={r.value} label={r.label} value={r.value} />
                ))}
              </Picker>
            </View>
              <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Set</Text></TouchableOpacity>
              <TouchableOpacity style={styles.smallBtn}><Text style={styles.smallBtnText}>Get</Text></TouchableOpacity>
          </View>

        <View style={styles.tempBox}>
          <View style={styles.tempInfo}>
             <Icon name="thermometer" size={20} color={Colors.primary} />
             <View style={{marginLeft: 10}}>
                <Text style={styles.tempLabel}>DEVICE TEMPERATURE</Text>
                <Text style={styles.tempValue}>42.5°C</Text>
             </View>
          </View>
          <Icon name="refresh" size={20} color={Colors.primary} />
        </View>
      </Card>

      <Text style={styles.sectionHeader}>INVENTORY PARAMETERS</Text>
      <Card>
        {/*Dropdown Row*/}
        <PickerRow label="Session" value={session} onValueChange={setSession} items={sessionOptions} />
        <PickerRow label="Target" value={target} onValueChange={setTarget} items={targetOptions} />
        <PickerRow label="Profile" value={profile} onValueChange={setProfile} items={profileOptions} />
        <View style={styles.divider} />

        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Enable TagFocus</Text>
          <Switch value={tagFocus} onValueChange={setTagFocus} trackColor={{ true: Colors.primary }} />
        </View>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>FastID Read</Text>
          <Switch value={fastId} onValueChange={setFastId} trackColor={{ true: Colors.primary }} />
        </View>
        <View style={styles.checkRow}>
          <Text style={styles.checkLabel}>Auto-Export Logs</Text>
          <Switch value={autoExport} onValueChange={setAutoExport} trackColor={{ true: Colors.primary }} />
        </View>

        <TouchableOpacity style={styles.applyBtn}>
           <Icon name="content-save-outline" size={18} color="#fff" />
           <Text style={styles.applyBtnText}>Apply Inventory Params</Text>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  sectionHeader: { fontSize: 11, fontWeight: 'bold', color: Colors.textSecondary, marginBottom: 8, marginTop: 10 },
  fieldLabel: { fontSize: 13, color: Colors.text, marginBottom: 4, marginTop: 12 },
  configRow: { marginBottom: 10 },
  inputActionGroup: { flexDirection: 'row', alignItems: 'center' },
  rowInput: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, padding: 8, backgroundColor: '#fff' },
  dropdownPlaceholder: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, padding: 10, backgroundColor: '#fff' },
  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginLeft: 6, borderWidth: 1, borderColor: Colors.border },
  smallBtnText: { fontSize: 12, color: Colors.textSecondary },
  tempBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.primaryLight, padding: 12, borderRadius: 10, marginTop: 20 },
  tempInfo: { flexDirection: 'row', alignItems: 'center' },
  tempLabel: { fontSize: 10, fontWeight: 'bold', color: Colors.primary },
  tempValue: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  checkRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  checkLabel: { fontSize: 14, color: Colors.text },
  applyBtn: { backgroundColor: Colors.primary, flexDirection: 'row', padding: 7, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  applyBtnText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  fab: { position: 'absolute', bottom: 20, right: 0, width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  pickerContainer: { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, backgroundColor: '#fff', justifyContent: 'center', height: 45, overflow: 'hidden'},
  pickerStyle: { width: '100%', marginTop: -3 },
  pickerRowContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  pickerRowLabel: { fontSize: 14, color: Colors.text, flex: 1 },
  inclinePickerWrapper: { flex: 1.2, borderWidth: 1, borderColor: Colors.border, borderRadius: 6, backgroundColor: '#f9f9f9', height: 40, justifyContent: 'center'},
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 12, opacity: 0.5 },
});