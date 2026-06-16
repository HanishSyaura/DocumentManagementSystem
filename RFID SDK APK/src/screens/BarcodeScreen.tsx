import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Vibration, 
  Linking, 
  Alert 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarcodeService, BarcodeData } from '../services/BarcodeService';
import { Colors } from '../styles/theme';

export default function BarcodeScreen() {
  const [list, setList] = useState<BarcodeData[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const dataSub = BarcodeService.onBarcodeRead((data) => {
      console.log("RAW DATA RECEIVED:", data);
      if (data && data.barcode) {
        try { Vibration.vibrate(100); } catch (e) {}
        setList(prev => [data, ...prev]);
      }
    });

    const triggerSub = BarcodeService.onHardwareTrigger((state) => {
      if (state === 'DOWN') {
        setIsScanning(true);
        BarcodeService.startScan();
      } else {
        setIsScanning(false);
        BarcodeService.stopScan();
      }
    });

    return () => {
      dataSub.remove();
      triggerSub.remove();
    };
  }, []);

  /**
   * Action Handler: Handles opening URLs or showing text
   */
  const handleItemPress = async (content: string) => {
    if (!content) return;

    // 1. SANITIZATION (Crucial for Handheld Scanners)
    // Removes non-printable characters, newlines, and hidden bytes
    const cleanContent = content.replace(/[^\x20-\x7E]/g, '').trim();
    
    // 2. DETECT URL
    const isUrl = cleanContent.toLowerCase().startsWith('http://') || 
                  cleanContent.toLowerCase().startsWith('https://');

    if (isUrl) {
      try {
        // We attempt to open directly (industrial devices can be picky with canOpenURL)
        const supported = await Linking.canOpenURL(cleanContent);
        
        if (supported) {
          await Linking.openURL(cleanContent);
        } else {
          // If the system claims it can't open it, try forcing it anyway 
          // or show a copy dialog
          Alert.alert(
            "Link Detected",
            cleanContent,
            [
              { text: "Cancel", style: "cancel" },
              { text: "Force Open", onPress: () => Linking.openURL(cleanContent) },
            ]
          );
        }
      } catch (error) {
        Alert.alert("Error", "No web browser found on this device.");
      }
    } else {
      // If it's just text (like a product SKU or serial)
      Alert.alert("Scanned Data", cleanContent);
    }
  };

  const getIcon = (type: string, content: string) => {
    const safeContent = (content || "").replace(/[^\x20-\x7E]/g, '').trim();
    const isUrl = safeContent.toLowerCase().startsWith('http');
    if (isUrl) return 'earth';
    
    const t = (type || "").toUpperCase();
    if (t.includes('QR')) return 'qrcode';
    return 'barcode';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scanner Engine</Text>
        <View style={styles.badge}>
           <Text style={styles.badgeText}>{list.length} Items</Text>
        </View>
      </View>

      {/* Main Scan Trigger Area */}
      <TouchableOpacity 
        activeOpacity={0.8}
        style={[styles.scanArea, isScanning && styles.scanAreaActive]}
        onPressIn={() => { setIsScanning(true); BarcodeService.startScan(); }}
        onPressOut={() => { setIsScanning(false); BarcodeService.stopScan(); }}
      >
        <Icon name={isScanning ? "record-circle-outline" : "qrcode-scan"} size={50} color="#fff" />
        <Text style={styles.scanText}>
            {isScanning ? "LASER ACTIVE" : "HOLD BUTTON TO SCAN"}
        </Text>
        <Text style={styles.scanSub}>Supports 1D Barcodes & 2D QR Codes</Text>
      </TouchableOpacity>

      <FlatList
        data={list}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => {
          const cleanBarcode = (item.barcode || "").replace(/[^\x20-\x7E]/g, '').trim();
          const isUrl = cleanBarcode.toLowerCase().startsWith('http');

          return (
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={() => handleItemPress(item.barcode)}
              style={[styles.card, isUrl && styles.cardLink]}
            >
              <View style={[styles.iconBox, isUrl && styles.iconBoxLink]}>
                <Icon name={getIcon(item.type, item.barcode)} size={24} color={isUrl ? Colors.primary : '#555'} />
              </View>
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={[styles.barcodeText, isUrl && styles.linkText]} numberOfLines={1}>
                    {cleanBarcode}
                </Text>
                <Text style={styles.typeText}>
                  {item.type} {isUrl ? '• Tap to open link' : `• Length: ${item.length}`}
                </Text>
              </View>
              {isUrl && <Icon name="open-in-new" size={18} color={Colors.primary} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
            <View style={styles.empty}>
                <Icon name="tray-arrow-down" size={40} color="#ccc" />
                <Text style={styles.emptyText}>No data scanned yet</Text>
            </View>
        }
      />

      {list.length > 0 && (
        <TouchableOpacity style={styles.clearBtn} onPress={() => setList([])}>
            <Icon name="delete-sweep" size={20} color={Colors.danger} />
            <Text style={styles.clearText}>Clear All Results</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7fa', padding: 15 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  badge: { backgroundColor: Colors.primary, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  scanArea: { 
    backgroundColor: Colors.primary, 
    height: 140, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 20,
    elevation: 4 
  },
  scanAreaActive: { backgroundColor: '#d32f2f' },
  scanText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  scanSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  card: { 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  cardLink: {
    borderColor: Colors.primary,
    backgroundColor: '#f0f4ff',
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline'
  },
  iconBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  iconBoxLink: { backgroundColor: '#e0eaff' },
  barcodeText: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  typeText: { fontSize: 11, color: '#757575', marginTop: 2, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#aaa', marginTop: 10 },
  clearBtn: { flexDirection: 'row', padding: 15, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: Colors.danger, fontWeight: 'bold', marginLeft: 8 }
});