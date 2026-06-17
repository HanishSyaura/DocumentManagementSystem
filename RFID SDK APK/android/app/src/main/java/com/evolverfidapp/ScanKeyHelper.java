package com.evolverfidapp;

import android.content.Context;
import android.os.RemoteException;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.seuic.scankey.IKeyEventCallback;
import com.seuic.scankey.ScanKeyService;

/**
 * Helper class to handle hardware button triggers using ScanKeyService.
 * This matches the SEUIC autoid utouch reference implementation.
 * 
 * Key codes:
 * - 249: Right-side barcode scanner button
 * - 250: Handle grip RFID trigger button
 */
public class ScanKeyHelper {
    private static final String TAG = "ScanKeyHelper";
    
    // Key codes from SEUIC SDK
    public static final int KEY_BARCODE_SCAN = 249;  // Right-side barcode button
    public static final int KEY_RFID_TRIGGER = 250;  // Handle grip RFID button
    
    private static ScanKeyService mScanKeyService;
    private static IKeyEventCallback mCallback;
    private static ReactApplicationContext reactContext;
    private static boolean isInitialized = false;

    /**
     * Initialize the ScanKeyService callback.
     * Call this once when your RFID module is created.
     */
    public static void init(ReactApplicationContext context) {
        if (isInitialized) {
            Log.w(TAG, "ScanKeyHelper already initialized");
            return;
        }
        
        reactContext = context;
        
        try {
            mScanKeyService = ScanKeyService.getInstance();
            
            if (mScanKeyService == null) {
                Log.e(TAG, "ScanKeyService.getInstance() returned null!");
                return;
            }
            
            mCallback = new IKeyEventCallback.Stub() {
                @Override
                public void onKeyDown(int keyCode) throws RemoteException {
                    Log.d(TAG, "onKeyDown: keyCode=" + keyCode);
                    
                    if (keyCode == KEY_RFID_TRIGGER || keyCode == KEY_BARCODE_SCAN) {
                        Log.i(TAG, "RFID Trigger DOWN (key 250)");
                        sendEvent("onTrigger", "DOWN");
                        // #region debug-point rfid-led-desync-trigger
                        WritableMap dbg = Arguments.createMap();
                        dbg.putInt("keyCode", keyCode);
                        RFIDModule.debugPost("E", "trigger.down.rfid", dbg);
                        // #endregion debug-point rfid-led-desync-trigger
                    }

                    if (keyCode == KEY_BARCODE_SCAN) {
                        Log.i(TAG, "Barcode Scan Trigger (key 249)");
                        sendEvent("onBarcodeTrigger", "DOWN");
                        // #region debug-point rfid-led-desync-trigger
                        WritableMap dbg = Arguments.createMap();
                        dbg.putInt("keyCode", keyCode);
                        RFIDModule.debugPost("E", "trigger.down.barcode", dbg);
                        // #endregion debug-point rfid-led-desync-trigger
                    }
                    
                }

                @Override
                public void onKeyUp(int keyCode) throws RemoteException {
                    Log.d(TAG, "onKeyUp: keyCode=" + keyCode);
                    
                    if (keyCode == KEY_RFID_TRIGGER || keyCode == KEY_BARCODE_SCAN) {
                        Log.i(TAG, "RFID Trigger UP (key 250)");
                        sendEvent("onTrigger", "UP");
                        // #region debug-point rfid-led-desync-trigger
                        WritableMap dbg = Arguments.createMap();
                        dbg.putInt("keyCode", keyCode);
                        RFIDModule.debugPost("E", "trigger.up.rfid", dbg);
                        // #endregion debug-point rfid-led-desync-trigger
                    }

                    if (keyCode == KEY_BARCODE_SCAN) {
                        Log.i(TAG, "Barcode Scan Trigger UP (key 249)");
                        sendEvent("onBarcodeTrigger", "UP");
                        // #region debug-point rfid-led-desync-trigger
                        WritableMap dbg = Arguments.createMap();
                        dbg.putInt("keyCode", keyCode);
                        RFIDModule.debugPost("E", "trigger.up.barcode", dbg);
                        // #endregion debug-point rfid-led-desync-trigger
                    }
                }
            };

            // Register callback with specific key codes to monitor
            // "249,250" = barcode button and RFID trigger button
            mScanKeyService.registerCallback(mCallback, "249,250");
            isInitialized = true;
            Log.i(TAG, "ScanKeyService callback registered successfully for keys 249,250");
            
        } catch (Exception e) {
            Log.e(TAG, "Failed to initialize ScanKeyService: " + e.getMessage(), e);
        }
    }

    /**
     * Unregister and cleanup the callback.
     * Call this when your module is destroyed.
     */
    public static void destroy() {
        if (!isInitialized) {
            return;
        }
        
        try {
            if (mScanKeyService != null && mCallback != null) {
                mScanKeyService.unregisterCallback(mCallback);
                Log.i(TAG, "ScanKeyService callback unregistered");
            }
        } catch (Exception e) {
            Log.e(TAG, "Error unregistering callback: " + e.getMessage(), e);
        }
        
        isInitialized = false;
        mScanKeyService = null;
        mCallback = null;
    }

    /**
     * Check if the helper is initialized and ready.
     */
    public static boolean isInitialized() {
        return isInitialized;
    }

    /**
     * Send event to React Native JavaScript.
     */
    private static void sendEvent(String eventName, Object data) {
        if (reactContext == null) {
            Log.w(TAG, "Cannot send event " + eventName + ": reactContext is null");
            return;
        }
        
        if (!reactContext.hasActiveReactInstance()) {
            Log.w(TAG, "Cannot send event " + eventName + ": no active React instance");
            return;
        }
        
        try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, data);
            Log.d(TAG, "Event sent: " + eventName + " = " + data);
        } catch (Exception e) {
            Log.e(TAG, "Error sending event " + eventName + ": " + e.getMessage(), e);
        }
    }
}
