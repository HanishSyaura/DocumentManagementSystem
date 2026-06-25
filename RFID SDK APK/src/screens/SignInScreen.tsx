import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';
import { AuthBackend } from '../backend';

export default function SignInScreen() {
  const [serverUrl, setServerUrl] = useState(() => AuthBackend.getState().baseUrl.replace(/\/api$/, '') || 'http://10.0.2.2:4000');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return serverUrl.trim().length > 0 && email.trim().length > 0 && password.length > 0;
  }, [serverUrl, email, password]);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await AuthBackend.signIn(serverUrl.trim(), email.trim(), password);
    } catch (error: any) {
      Alert.alert('Sign in failed', error?.message || 'Unable to connect to the server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.bg} />
      <View style={styles.bgOverlay1} />
      <View style={styles.bgOverlay2} />

      <View style={styles.content}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Icon name="file-document-outline" size={26} color="#ffffff" />
          </View>
          <Text style={styles.brandText}>FileNix</Text>
        </View>

        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>Welcome back</Text>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Server URL</Text>
          <View style={styles.inputWrap}>
            <Icon name="server-network" size={18} color={Colors.textSecondary} />
            <TextInput
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="http://your-server:4000"
              placeholderTextColor="#9aa3ad"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.inputWrap}>
            <Icon name="email-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor="#9aa3ad"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>
        </View>

        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.inputWrap}>
            <Icon name="lock-outline" size={18} color={Colors.textSecondary} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#9aa3ad"
              style={styles.input}
              secureTextEntry={secure}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeButton} onPress={() => setSecure(v => !v)}>
              <Icon name={secure ? 'eye-outline' : 'eye-off-outline'} size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.forgotWrap}
          onPress={() => Alert.alert('Forgot password', 'Reset flow is not wired in the mobile app yet.')}
        >
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          style={[styles.signInButton, !canSubmit || submitting ? styles.signInDisabled : null]}
          onPress={submit}
          disabled={!canSubmit || submitting}
        >
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e64a8' },
  bg: { ...StyleSheet.absoluteFillObject, backgroundColor: '#1e64a8' },
  bgOverlay1: {
    position: 'absolute',
    left: -120,
    top: 140,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  bgOverlay2: {
    position: 'absolute',
    right: -160,
    bottom: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,0,0,0.10)',
  },
  content: { flex: 1, paddingHorizontal: 22, justifyContent: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  brandText: { color: '#ffffff', fontSize: 34, fontWeight: '900' },
  title: { color: '#ffffff', fontSize: 28, fontWeight: '900', textAlign: 'center' },
  subtitle: { marginTop: 6, color: 'rgba(255,255,255,0.7)', textAlign: 'center', fontWeight: '700' },
  fieldBlock: { marginTop: 18 },
  fieldLabel: { color: '#ffffff', fontWeight: '800', marginBottom: 8, fontSize: 12 },
  inputWrap: {
    backgroundColor: '#f3f5f7',
    borderRadius: 8,
    height: 46,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: { flex: 1, marginLeft: 8, color: Colors.text, fontWeight: '700' },
  eyeButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  forgotWrap: { marginTop: 12, alignSelf: 'flex-end' },
  forgotText: { color: 'rgba(255,255,255,0.85)', fontWeight: '800', fontSize: 12 },
  signInButton: {
    marginTop: 20,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInDisabled: { opacity: 0.6 },
  signInText: { color: '#1e64a8', fontWeight: '900', fontSize: 16 },
});
