// src/screens/ReadWriteScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Card from '../components/common/Card';
import AppButton from '../components/common/AppButton';
import { Colors } from '../styles/theme';
import { RfidBackend, type RfidMemoryBank } from '../backend';

export default function ReadWriteScreen() {
  const [targetEpc, setTargetEpc] = useState('');
  const [bank, setBank] = useState<RfidMemoryBank>('USER');
  const [offset, setOffset] = useState('0');
  const [length, setLength] = useState('2');
  const [dataHex, setDataHex] = useState('');
  const [lockBank, setLockBank] = useState('USER');
  const [lockMode, setLockMode] = useState('UNLOCK');
  const [accessPwd, setAccessPwd] = useState('');
  const [killPwd, setKillPwd] = useState('');
  const [lockTypeOverride, setLockTypeOverride] = useState('');
  const [status, setStatus] = useState('');

  const parseIntSafe = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10);
    return Number.isFinite(n) ? n : fallback;
  };

  const computeLockType = () => {
    const bankCode =
      lockBank === 'EPC' ? 1 : lockBank === 'TID' ? 2 : lockBank === 'USER' ? 3 : 0;
    const modeCode = lockMode === 'LOCK' ? 1 : lockMode === 'PERMALOCK' ? 3 : 2;
    return ((bankCode & 0xff) << 8) | (modeCode & 0xff);
  };


  const RadioBtn = ({ label }: any) => (
    <TouchableOpacity
        style={styles.radioItem}
        onPress={() => setBank(label)}
        activeOpacity={0.7}
    >
      <View style={[
        styles.outer,
        bank == label && { borderColor: Colors.primary }
      ]}>
        {bank == label && <View style={styles.inner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const LockOption = ({ label, onPress, selected }: any) => (
    <Text 
        onPress={onPress}
        style={{
            paddingVertical: 10,      // More height
            paddingHorizontal: 16,    // More width
            backgroundColor: selected ? Colors.primary : '#F0F0F0',
            color: selected ? '#fff' : '#666',
            marginRight: 10,
            marginBottom: 10,         // Added for spacing when wrapping
            borderRadius: 10,         // Softer corners
            fontSize: 10,             // Readable size
            fontWeight: '600',        // Semi-bold text
            textAlign: 'center',      // Centers text if you add minWidth
            overflow: 'hidden'        // Required for borderRadius on Android <Text>
        }}
    >
    {label}
    </Text>
  );

  const ReadWriteBtn = ({ title, variant, style, onPress }: any) => (
    <AppButton 
      title={title}
      variant={variant}
      onPress={onPress}
      style={[
        {
            paddingVertical: 7,
            borderRadius: 10,
        },
        style
      ]}
    />
  );


  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{ paddingBottom: 10 }}
    >
      <Card title="Target Tag Selection">
        <TextInput
          style={styles.input}
          placeholder="E28011912000732A39AD0954"
          value={targetEpc}
          onChangeText={setTargetEpc}
          autoCapitalize="characters"
        />
      </Card>

      <Card title="Read / Write Data">
        <View style={styles.radioGrid}>
          {['EPC', 'TID', 'USER', 'PASSWORD'].map(b => <RadioBtn key={b} label={b} />)}
        </View>
        
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Text style={styles.fieldLabel}>OFFSET (WORD)</Text>
            <TextInput
              style={styles.input}
              value={offset}
              onChangeText={setOffset}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>LENGTH (WORD)</Text>
            <TextInput
              style={styles.input}
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.fieldLabel}>DATA (HEX STRING)</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={dataHex}
          onChangeText={setDataHex}
          autoCapitalize="characters"
        />

        <View style={styles.btnGroup}>
          <ReadWriteBtn
            title="Read"
            style={{ flex: 1, marginRight: 8 }}
            onPress={async () => {
              setStatus('Reading...');
              try {
                const out = await RfidBackend.readTagMemory({
                  targetEpc,
                  bank,
                  offset: parseIntSafe(offset, 0),
                  length: parseIntSafe(length, 1),
                  accessPassword: accessPwd,
                });
                setDataHex(out);
                setStatus('Read OK');
              } catch (e: any) {
                setStatus(`Read failed: ${e?.message ?? String(e)}`);
              }
            }}
          />
          <ReadWriteBtn
            title="Write"
            variant="outline"
            style={{ flex: 1 }}
            onPress={async () => {
              setStatus('Writing...');
              try {
                await RfidBackend.writeTagMemory({
                  targetEpc,
                  bank,
                  offset: parseIntSafe(offset, 0),
                  dataHex,
                  accessPassword: accessPwd,
                });
                setStatus('Write OK');
              } catch (e: any) {
                setStatus(`Write failed: ${e?.message ?? String(e)}`);
              }
            }}
          />
        </View>

        {!!status && <Text style={styles.statusText}>{status}</Text>}
      </Card>

      <Card title="Lock / Kill Tag">
        <Text style={styles.fieldLabel}>LOCK BANK</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap',  }}>
        {['EPC', 'USER', 'TID'].map(b => (
            <LockOption
            key={b}
            label={b}
            selected={lockBank === b}
            onPress={() => setLockBank(b)}
            />
        ))}
        </View>

        <Text style={styles.fieldLabel}>LOCK MODE</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap'}}>
        {['LOCK', 'UNLOCK', 'PERMALOCK'].map(m => (
            <LockOption
            key={m}
            label={m}
            selected={lockMode === m}
            onPress={() => setLockMode(m)}
            />
        ))}
        </View>

        <Text style={[styles.fieldLabel, { marginTop: 20 }]}>KILL TAG</Text>
        <TextInput
        style={styles.input}
        placeholder="Kill Password"
        value={killPwd}
        onChangeText={setKillPwd}
        autoCapitalize="characters"
        />

        <AppButton
        title="Kill Tag"
        style={styles.lockBtn}
        onPress={async () => {
          setStatus('Killing tag...');
          try {
            await RfidBackend.killTag({ targetEpc, killPassword: killPwd });
            setStatus('Kill OK');
          } catch (e: any) {
            setStatus(`Kill failed: ${e?.message ?? String(e)}`);
          }
        }}
        />

        <Text style={styles.fieldLabel}>ACCESS PASSWORD</Text>
        <TextInput
            style={styles.input}
            placeholder="Enter password"
            value={accessPwd}
            onChangeText={setAccessPwd}
            autoCapitalize="characters"
        />

        <Text style={styles.fieldLabel}>LOCK TYPE (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 259 (override)"
          value={lockTypeOverride}
          onChangeText={setLockTypeOverride}
          keyboardType="numeric"
        />

        <AppButton
        title="Execute Lock Operation"
        style={styles.lockBtn}
        onPress={async () => {
          setStatus('Locking tag...');
          try {
            const lockType = lockTypeOverride.trim()
              ? parseIntSafe(lockTypeOverride, computeLockType())
              : computeLockType();
            await RfidBackend.lockTag({ targetEpc, lockType, accessPassword: accessPwd });
            setStatus('Lock OK');
          } catch (e: any) {
            setStatus(`Lock failed: ${e?.message ?? String(e)}`);
          }
        }}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: 16 },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, padding: 10, marginTop: 4 },
  row: { flexDirection: 'row', marginVertical: 10 },
  fieldLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 8, marginBottom: 3 },
  radioGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  radioItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginVertical: 8},
  outer: { height: 20, width: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  inner: { height: 10, width: 10, borderRadius: 5, backgroundColor: Colors.primary },
  radioLabel: { fontWeight: '600' },
  btnGroup: { flexDirection: 'row', marginTop: 16 },
  lockBtn: { marginTop: 16, backgroundColor: '#e74c3c', paddingVertical: 7, borderRadius: 10 },
  statusText: { marginTop: 12, fontSize: 12, color: Colors.textSecondary },
});
