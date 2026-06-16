import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { AuthBackend } from '../backend';
import type { AuthState } from '../backend/auth/authStore';

type DashboardStats = {
  documentIn: number;
  documentOut: number;
  archived: number;
  lastUpdated: Date;
};

const StatBox = ({ label, value }: { label: string; value: number }) => {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
};

const ActionTile = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: string;
  onPress: () => void;
}) => {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.tile} onPress={onPress}>
      <View style={styles.tileTop} />
      <View style={styles.tileBottom} />
      <View style={styles.tileContent}>
        <View style={styles.tileIconWrap}>
          <Icon name={icon} size={54} color="#1e64a8" />
        </View>
        <Text style={styles.tileLabel}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default function MainScreen() {
  const navigation = useNavigation<any>();
  const [auth, setAuth] = useState<AuthState>(() => AuthBackend.getState());

  const [stats, setStats] = useState<DashboardStats>({
    documentIn: 105,
    documentOut: 2,
    archived: 14,
    lastUpdated: new Date(),
  });

  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => ({ ...prev, lastUpdated: new Date() }));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    return AuthBackend.onChange(setAuth);
  }, []);

  const lastUpdatedText = useMemo(() => {
    const hh = stats.lastUpdated.getHours().toString().padStart(2, '0');
    const mm = stats.lastUpdated.getMinutes().toString().padStart(2, '0');
    const ss = stats.lastUpdated.getSeconds().toString().padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }, [stats.lastUpdated]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View style={styles.logoBox}>
            <Icon name="file-document-outline" size={26} color="#ffffff" />
          </View>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.companyName}>CLB HOLDINGS BERHAD</Text>
            <Text style={styles.appName}>Document Management System</Text>
          </View>
        </View>

        <View style={styles.headerBottomRow}>
          <Text style={styles.loginAs}>
            Login as <Text style={styles.loginRole}>{auth.email ? auth.email : 'ADMIN'}</Text>
          </Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="cog-outline" size={22} color="#ffffff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.signOutButton} onPress={() => void AuthBackend.signOut()}>
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>DASHBOARD</Text>
          <View style={styles.statsRow}>
            <StatBox label="Document In" value={stats.documentIn} />
            <StatBox label="Document Out" value={stats.documentOut} />
            <StatBox label="Archived" value={stats.archived} />
          </View>
          <Text style={styles.lastUpdated}>Last updated {lastUpdatedText}</Text>
        </View>

        <View style={styles.tilesGrid}>
          <ActionTile label="SEARCH" icon="magnify" onPress={() => navigation.navigate('Search')} />
          <ActionTile
            label="CHECK-IN"
            icon="folder-download-outline"
            onPress={() => navigation.navigate('CheckIn')}
          />
          <ActionTile
            label="ARCHIVE"
            icon="archive-outline"
            onPress={() => navigation.navigate('Archive')}
          />
          <ActionTile
            label="CHECK-OUT"
            icon="folder-upload-outline"
            onPress={() => navigation.navigate('CheckOut')}
          />
        </View>

        <Text style={styles.footer}>© 2026 Document Management System. All rights reserved.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: '#1e64a8', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 14 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center' },
  logoBox: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitleWrap: { flex: 1 },
  companyName: { color: '#eaf4ff', fontWeight: '700', fontSize: 12, letterSpacing: 0.4 },
  appName: { color: '#ffffff', fontWeight: '800', fontSize: 18, marginTop: 2 },
  headerBottomRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loginAs: { color: '#eaf4ff', fontSize: 12 },
  loginRole: { color: '#ffffff', fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  signOutButton: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: { color: '#1e64a8', fontWeight: '800', fontSize: 12 },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 26 },
  dashboardCard: {
    backgroundColor: '#1a6ea4',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  dashboardTitle: { color: '#ffffff', fontWeight: '900', textAlign: 'center', fontSize: 14, marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#2d2d2d' },
  statValue: { marginTop: 6, fontSize: 34, fontWeight: '900', color: '#111111' },
  lastUpdated: { marginTop: 10, color: 'rgba(255,255,255,0.9)', textAlign: 'center', fontSize: 11 },
  tilesGrid: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: {
    width: '48%',
    height: 156,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#cfe8ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  tileTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '54%', backgroundColor: '#2a76b7' },
  tileBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%', backgroundColor: '#cfe8ff' },
  tileContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 8 },
  tileIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tileLabel: { marginTop: 10, fontWeight: '900', color: '#0f2237', letterSpacing: 0.6 },
  footer: { marginTop: 6, textAlign: 'center', color: Colors.textSecondary, fontSize: 11 },
});
