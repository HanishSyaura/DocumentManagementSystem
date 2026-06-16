import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../styles/theme';

export default function DmsPlaceholderScreen({ title }: { title: string }) {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Home')}>
          <Icon name="arrow-left" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightSpacer} />
      </View>

      <View style={styles.body}>
        <Text style={styles.bodyText}>Page design akan dibuat lepas ni.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    height: 58,
    backgroundColor: '#1e64a8',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  title: { flex: 1, textAlign: 'center', color: '#ffffff', fontWeight: '900', fontSize: 16 },
  rightSpacer: { width: 38, height: 38 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  bodyText: { color: Colors.textSecondary, fontSize: 14, textAlign: 'center' },
});

