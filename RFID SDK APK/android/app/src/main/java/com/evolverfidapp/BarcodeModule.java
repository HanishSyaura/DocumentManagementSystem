package com.evolverfidapp;

import android.util.Log;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

// SEUIC Scanner Imports
import com.seuic.scanner.Scanner;
import com.seuic.scanner.ScannerFactory;
import com.seuic.scanner.DecodeInfo;
import com.seuic.scanner.DecodeInfoCallBack;

public class BarcodeModule extends ReactContextBaseJavaModule implements DecodeInfoCallBack {
    private static final String TAG = "BarcodeModule";
    private final ReactApplicationContext context;
    private Scanner scanner;

    public BarcodeModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;
        initScanner();
    }

    private void initScanner() {
        try {
            scanner = ScannerFactory.getScanner(context);
            boolean opened = scanner.open();
            
            if (opened) {
                scanner.setDecodeInfoCallBack(this);
                scanner.enable();
                
                // 🔥 CRITICAL: Some engines default to 1D only. 
                // We tell it to enable all symbologies (1D and 2D/QR).
                // Parameter 1 usually represents "All Symbologies" 
                // depending on the JAR version.
                scanner.setParams(1, 1); 
                
                Log.i(TAG, "Barcode Scanner initialized, enabled, and 2D support requested.");
            } else {
                Log.e(TAG, "Scanner failed to open hardware.");
            }
        } catch (Exception e) {
            Log.e(TAG, "Scanner Init Error: " + e.getMessage());
        }
    }

    @Override
    public String getName() {
        return "BarcodeModule";
    }

    @ReactMethod
    public void startScan() {
        if (scanner != null) scanner.startScan();
    }

    @ReactMethod
    public void stopScan() {
        if (scanner != null) scanner.stopScan();
    }

    // Callback from hardware when barcode is decoded
    @Override
    public void onDecodeComplete(DecodeInfo info) {
        if (info != null) {
            WritableMap map = Arguments.createMap();
            map.putString("barcode", info.barcode);
            map.putString("type", info.codetype);
            map.putInt("length", info.length);
            
            sendEvent("onBarcodeRead", map);
        }
    }

    private void sendEvent(String name, WritableMap data) {
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(name, data);
    }

    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        if (scanner != null) {
            scanner.stopScan();
            scanner.close();
        }
    }
}