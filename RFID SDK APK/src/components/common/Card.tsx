import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Colors } from '../../styles/theme';

export default function Card({ children, title }: any) {
  return (
    <View style={styles.card}>
      {title && <Text style={styles.cardTitle}>{title.toUpperCase()}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
});