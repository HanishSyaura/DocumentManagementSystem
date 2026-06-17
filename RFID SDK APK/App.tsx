import React, { useEffect } from 'react';
import { NativeModules } from 'react-native';
import AppNavigator from './src/navigations/AppNavigator';
import { AuthBackend, RfidBackend } from './src/backend';

export default function App() {
  useEffect(() => {
    void RfidBackend.initialize();
    void AuthBackend.initialize();
    void RfidBackend.isTriggerInitialized().catch(() => false);
    // #region debug-point rfid-led-desync-config-js
    const url = 'http://172.19.1.37:7777/event';
    NativeModules?.RFIDModule?.configureDebug?.(url, 'rfid-led-desync', 'pre-fix');
    // #endregion debug-point rfid-led-desync-config-js
  }, []);

  return <AppNavigator />;
}
