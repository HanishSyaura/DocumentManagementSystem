import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors } from '../../styles/theme';

export default function AppButton({ title, onPress, variant = 'primary', style }: any) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.button,
        variant === 'outline' ? styles.outline : styles.primary,
        style
      ]}
    >
      <Text style={[styles.text, variant === 'outline' && { color: Colors.text }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  primary: { backgroundColor: Colors.primary },
  outline: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: Colors.border 
  },
  text: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});