package com.evolverfidapp;

import android.util.Log;
import android.media.AudioManager;
import android.media.ToneGenerator;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import com.seuic.uhf.UHFService;
import com.seuic.uhf.EPC;
import com.seuic.uhf.IReadTagsListener;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.List;
import java.util.Locale;

/**
 * RFID Module for React Native
 * 
 * This module handles UHF RFID operations including:
 * - Single scan (inventoryOnce)
 * - Continuous scan (inventoryStart/Stop)
 * - Hardware button trigger via ScanKeyHelper
 * 
 * IMPORTANT: Hardware button triggers are handled by ScanKeyHelper,
 * which uses ScanKeyService callback (same as SEUIC reference).
 * Do NOT use ScannerKey polling in this module.
 */
public class RFIDModule extends ReactContextBaseJavaModule {
    private static final String TAG = "RFIDModule";
    private final ReactApplicationContext context;
    private UHFService uhfService;
    private boolean isScanning = false;
    private final Object toneLock = new Object();
    private ToneGenerator toneGenerator;

    // #region debug-point rfid-led-desync-config
    private static volatile String DEBUG_SERVER_URL = null;
    private static volatile String DEBUG_SESSION_ID = "rfid-led-desync";
    private static volatile String DEBUG_RUN_ID = "pre-fix";

    @ReactMethod
    public void configureDebug(String serverUrl, String sessionId, String runId) {
        DEBUG_SERVER_URL = (serverUrl == null || serverUrl.trim().isEmpty()) ? null : serverUrl.trim();
        if (sessionId != null && !sessionId.trim().isEmpty()) DEBUG_SESSION_ID = sessionId.trim();
        if (runId != null && !runId.trim().isEmpty()) DEBUG_RUN_ID = runId.trim();
        debugPost("NA", "configureDebug", null);
    }

    static void debugPost(String hypothesisId, String msg, WritableMap data) {
        final String url = DEBUG_SERVER_URL;
        if (url == null || url.isEmpty()) return;

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                StringBuilder json = new StringBuilder(256);
                json.append("{");
                json.append("\"sessionId\":\"").append(escapeJson(DEBUG_SESSION_ID)).append("\",");
                json.append("\"runId\":\"").append(escapeJson(DEBUG_RUN_ID)).append("\",");
                json.append("\"hypothesisId\":\"").append(escapeJson(hypothesisId)).append("\",");
                json.append("\"msg\":\"").append(escapeJson(msg)).append("\",");
                json.append("\"ts\":").append(System.currentTimeMillis());

                if (data != null) {
                    json.append(",\"data\":").append(data.toString());
                }

                json.append("}");

                URL u = new URL(url);
                conn = (HttpURLConnection) u.openConnection();
                conn.setRequestMethod("POST");
                conn.setConnectTimeout(1000);
                conn.setReadTimeout(1000);
                conn.setDoOutput(true);
                conn.setRequestProperty("Content-Type", "application/json");

                byte[] bytes = json.toString().getBytes("UTF-8");
                conn.setFixedLengthStreamingMode(bytes.length);
                OutputStream os = conn.getOutputStream();
                os.write(bytes);
                os.flush();
                os.close();
                conn.getResponseCode();
            } catch (Throwable ignored) {
            } finally {
                if (conn != null) conn.disconnect();
            }
        }, "RFIDDebugPost").start();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
    // #endregion debug-point rfid-led-desync-config

    private final IReadTagsListener tagListener = new IReadTagsListener() {
        @Override
        public void tagsRead(List<EPC> tagList) {
            if (!isScanning) return;
            if (tagList == null || tagList.isEmpty()) return;

            WritableArray arr = Arguments.createArray();
            for (EPC tag : tagList) {
                WritableMap map = Arguments.createMap();
                map.putString("epc", tag.getId());
                map.putInt("rssi", tag.rssi);
                arr.pushMap(map);
            }

            Log.d(TAG, "tagsRead callback: " + arr.size() + " tag(s)");
            sendEvent("onTags", arr);

            // #region debug-point rfid-led-desync-tagsread
            WritableMap dbg = Arguments.createMap();
            dbg.putInt("count", arr.size());
            dbg.putBoolean("isScanning", isScanning);
            dbg.putString("thread", Thread.currentThread().getName());
            debugPost("D", "tagsRead", dbg);
            // #endregion debug-point rfid-led-desync-tagsread
        }
    };

    public RFIDModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.context = reactContext;

        try {
            uhfService = UHFService.getInstance();
            boolean opened = uhfService.open();
            Log.i(TAG, "UHFService opened: " + opened);
            // #region debug-point rfid-led-desync-open
            WritableMap dbg = Arguments.createMap();
            dbg.putBoolean("opened", opened);
            debugPost("E", "uhf.open", dbg);
            // #endregion debug-point rfid-led-desync-open
        } catch (Exception e) {
            Log.e(TAG, "UHF Init failed: " + e.getMessage(), e);
            uhfService = null;
            // #region debug-point rfid-led-desync-open-fail
            WritableMap dbg = Arguments.createMap();
            dbg.putString("error", String.valueOf(e.getMessage()));
            debugPost("E", "uhf.open.fail", dbg);
            // #endregion debug-point rfid-led-desync-open-fail
        }

        // Initialize hardware button trigger callback via ScanKeyService
        // This replaces the old ScannerKey polling approach
        ScanKeyHelper.init(reactContext);
        Log.i(TAG, "ScanKeyHelper initialized");
    }

    @Override
    public String getName() {
        return "RFIDModule";
    }

    /**
     * Called when the React instance is being destroyed.
     * Cleanup resources here.
     */
    @Override
    public void onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy();
        
        // Stop any ongoing scan
        if (isScanning) {
            stopScanInternal();
        }
        
        // Cleanup ScanKeyHelper
        ScanKeyHelper.destroy();
        Log.i(TAG, "RFIDModule destroyed");
    }

    @ReactMethod
    public void startScan() {
        startScanContinue();
    }

    @ReactMethod
    public void startScanOnce() {
        if (isScanning) {
            Log.w(TAG, "Scan already in progress");
            sendEvent("onError", "Scan already in progress");
            // #region debug-point rfid-led-desync-start-once-reject
            debugPost("E", "startScanOnce.reject.isScanning", null);
            // #endregion debug-point rfid-led-desync-start-once-reject
            return;
        }

        if (uhfService == null) {
            Log.e(TAG, "UHFService not initialized");
            sendEvent("onError", "UHFService not initialized");
            // #region debug-point rfid-led-desync-start-once-reject
            debugPost("E", "startScanOnce.reject.noService", null);
            // #endregion debug-point rfid-led-desync-start-once-reject
            return;
        }

        isScanning = true;
        Log.i(TAG, "Starting ONCE scan via inventoryOnce()");
        // #region debug-point rfid-led-desync-start-once
        debugPost("E", "startScanOnce.begin", null);
        // #endregion debug-point rfid-led-desync-start-once

        new Thread(() -> {
            try {
                EPC wildcardFilter = new EPC();
                boolean success = uhfService.inventoryOnce(wildcardFilter, 0);
                // #region debug-point rfid-led-desync-inventory-once
                WritableMap dbg = Arguments.createMap();
                dbg.putBoolean("success", success);
                debugPost("E", "inventoryOnce", dbg);
                // #endregion debug-point rfid-led-desync-inventory-once

                if (success) {
                    List<EPC> tagList = uhfService.getTagIDs();
                    if (tagList != null && !tagList.isEmpty()) {
                        WritableArray arr = Arguments.createArray();

                        for (EPC tag : tagList) {
                            WritableMap map = Arguments.createMap();
                            map.putString("epc", tag.getId());
                            map.putInt("rssi", tag.rssi);
                            arr.pushMap(map);
                        }

                        sendEvent("onTags", arr);
                        // #region debug-point rfid-led-desync-once-tags
                        WritableMap dbg2 = Arguments.createMap();
                        dbg2.putInt("count", arr.size());
                        debugPost("D", "inventoryOnce.tags", dbg2);
                        // #endregion debug-point rfid-led-desync-once-tags
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Scan error: " + e.getMessage(), e);
                sendEvent("onError", "Scan error: " + e.getMessage());
                // #region debug-point rfid-led-desync-once-error
                WritableMap dbg = Arguments.createMap();
                dbg.putString("error", String.valueOf(e.getMessage()));
                debugPost("E", "inventoryOnce.error", dbg);
                // #endregion debug-point rfid-led-desync-once-error
            } finally {
                isScanning = false;
                // #region debug-point rfid-led-desync-start-once-end
                debugPost("E", "startScanOnce.end", null);
                // #endregion debug-point rfid-led-desync-start-once-end
            }
        }, "RFIDScanOnceThread").start();
    }

    @ReactMethod
    public void startScanContinue() {
        if (isScanning) {
            Log.w(TAG, "Scan already in progress");
            sendEvent("onError", "Scan already in progress");
            // #region debug-point rfid-led-desync-start-cont-reject
            debugPost("E", "startScanContinue.reject.isScanning", null);
            // #endregion debug-point rfid-led-desync-start-cont-reject
            return;
        }

        if (uhfService == null) {
            Log.e(TAG, "UHFService not initialized");
            sendEvent("onError", "UHFService not initialized");
            // #region debug-point rfid-led-desync-start-cont-reject
            debugPost("E", "startScanContinue.reject.noService", null);
            // #endregion debug-point rfid-led-desync-start-cont-reject
            return;
        }

        uhfService.registerReadTags(tagListener);
        boolean started = uhfService.inventoryStart();
        isScanning = started;

        Log.i(TAG, "inventoryStart() returned: " + started);
        // #region debug-point rfid-led-desync-inventory-start
        WritableMap dbg = Arguments.createMap();
        dbg.putBoolean("started", started);
        debugPost("E", "inventoryStart", dbg);
        // #endregion debug-point rfid-led-desync-inventory-start

        if (!started) {
            uhfService.unregisterReadTags(tagListener);
            sendEvent("onError", "inventoryStart() failed");
        }
    }

    @ReactMethod
    public void stopScan() {
        stopScanInternal();
    }

    private void stopScanInternal() {
        isScanning = false;
        Log.i(TAG, "Stopping scan...");
        // #region debug-point rfid-led-desync-inventory-stop-begin
        debugPost("E", "stopScan.begin", null);
        // #endregion debug-point rfid-led-desync-inventory-stop-begin

        if (uhfService != null) {
            try {
                uhfService.inventoryStop();
                uhfService.unregisterReadTags(tagListener);
                Log.i(TAG, "inventoryStop() called, listener unregistered");
                // #region debug-point rfid-led-desync-inventory-stop
                debugPost("E", "inventoryStop", null);
                // #endregion debug-point rfid-led-desync-inventory-stop
            } catch (Exception e) {
                Log.e(TAG, "Stop error: " + e.getMessage(), e);
                // #region debug-point rfid-led-desync-inventory-stop-error
                WritableMap dbg = Arguments.createMap();
                dbg.putString("error", String.valueOf(e.getMessage()));
                debugPost("E", "inventoryStop.error", dbg);
                // #endregion debug-point rfid-led-desync-inventory-stop-error
            }
        }
    }

    /**
     * Check if a scan is currently in progress.
     * Useful for React Native to check state.
     */
    @ReactMethod
    public void isScanning(Promise promise) {
        promise.resolve(isScanning);
    }

    /**
     * Check if the ScanKeyHelper is initialized.
     * Useful for debugging hardware button issues.
     */
    @ReactMethod
    public void isTriggerInitialized(Promise promise) {
        promise.resolve(ScanKeyHelper.isInitialized());
    }

    @ReactMethod
    public void readMemory(String targetEpc, int bank, int offset, int length, String accessPassword, Promise promise) {
        if (isScanning) {
            promise.reject("RFID_SCAN_IN_PROGRESS", "Stop inventory scan before readMemory");
            // #region debug-point rfid-led-desync-rw
            debugPost("A", "readMemory.reject.isScanning", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }
        if (uhfService == null) {
            promise.reject("RFID_NOT_INITIALIZED", "UHFService not initialized");
            // #region debug-point rfid-led-desync-rw
            debugPost("E", "readMemory.reject.noService", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }
        if (length <= 0) {
            promise.reject("RFID_INVALID_LENGTH", "length must be > 0");
            // #region debug-point rfid-led-desync-rw
            debugPost("E", "readMemory.reject.badLength", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }

        // #region debug-point rfid-led-desync-rw
        WritableMap dbg0 = Arguments.createMap();
        dbg0.putInt("bank", bank);
        dbg0.putInt("offset", offset);
        dbg0.putInt("length", length);
        dbg0.putString("targetEpc", targetEpc == null ? "" : targetEpc);
        debugPost("A", "readMemory.begin", dbg0);
        // #endregion debug-point rfid-led-desync-rw

        new Thread(() -> {
            try {
                byte[] pwd = ensurePasswordBytes(accessPassword);
                byte[] epcFilter = parseHexOrNull(targetEpc);
                byte[] out = new byte[length * 2];

                boolean ok = uhfService.readTagData(pwd, epcFilter, bank, offset, length, out);
                if (!ok) {
                    promise.reject("RFID_READ_FAILED", "readTagData returned false");
                    // #region debug-point rfid-led-desync-rw
                    debugPost("A", "readMemory.fail.false", null);
                    // #endregion debug-point rfid-led-desync-rw
                    return;
                }
                promise.resolve(bytesToHex(out));
                // #region debug-point rfid-led-desync-rw
                WritableMap dbg1 = Arguments.createMap();
                dbg1.putInt("bytes", out.length);
                debugPost("A", "readMemory.ok", dbg1);
                // #endregion debug-point rfid-led-desync-rw
            } catch (Throwable t) {
                promise.reject("RFID_READ_ERROR", String.valueOf(t.getMessage()), t);
                // #region debug-point rfid-led-desync-rw
                WritableMap dbg2 = Arguments.createMap();
                dbg2.putString("error", String.valueOf(t.getMessage()));
                debugPost("A", "readMemory.error", dbg2);
                // #endregion debug-point rfid-led-desync-rw
            }
        }, "RFIDReadThread").start();
    }

    @ReactMethod
    public void writeMemory(String targetEpc, int bank, int offset, String dataHex, String accessPassword, Promise promise) {
        if (isScanning) {
            promise.reject("RFID_SCAN_IN_PROGRESS", "Stop inventory scan before writeMemory");
            // #region debug-point rfid-led-desync-rw
            debugPost("A", "writeMemory.reject.isScanning", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }
        if (uhfService == null) {
            promise.reject("RFID_NOT_INITIALIZED", "UHFService not initialized");
            // #region debug-point rfid-led-desync-rw
            debugPost("E", "writeMemory.reject.noService", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }

        // #region debug-point rfid-led-desync-rw
        WritableMap dbg0 = Arguments.createMap();
        dbg0.putInt("bank", bank);
        dbg0.putInt("offset", offset);
        dbg0.putInt("dataHexLen", dataHex == null ? 0 : dataHex.length());
        dbg0.putString("targetEpc", targetEpc == null ? "" : targetEpc);
        debugPost("A", "writeMemory.begin", dbg0);
        // #endregion debug-point rfid-led-desync-rw

        new Thread(() -> {
            try {
                byte[] pwd = ensurePasswordBytes(accessPassword);
                byte[] epcFilter = parseHexOrNull(targetEpc);
                byte[] data = parseHex(dataHex);

                if (data.length == 0) {
                    promise.reject("RFID_INVALID_DATA", "dataHex is empty");
                    // #region debug-point rfid-led-desync-rw
                    debugPost("E", "writeMemory.reject.empty", null);
                    // #endregion debug-point rfid-led-desync-rw
                    return;
                }
                if ((data.length % 2) != 0) {
                    promise.reject("RFID_INVALID_DATA", "dataHex must be even-length (full bytes)");
                    // #region debug-point rfid-led-desync-rw
                    debugPost("E", "writeMemory.reject.oddBytes", null);
                    // #endregion debug-point rfid-led-desync-rw
                    return;
                }

                int length = data.length / 2;
                boolean ok = uhfService.writeTagData(pwd, epcFilter, bank, offset, length, data);
                if (!ok) {
                    promise.reject("RFID_WRITE_FAILED", "writeTagData returned false");
                    // #region debug-point rfid-led-desync-rw
                    debugPost("A", "writeMemory.fail.false", null);
                    // #endregion debug-point rfid-led-desync-rw
                    return;
                }
                promise.resolve(true);
                // #region debug-point rfid-led-desync-rw
                WritableMap dbg1 = Arguments.createMap();
                dbg1.putInt("bytes", data.length);
                debugPost("A", "writeMemory.ok", dbg1);
                // #endregion debug-point rfid-led-desync-rw
            } catch (Throwable t) {
                promise.reject("RFID_WRITE_ERROR", String.valueOf(t.getMessage()), t);
                // #region debug-point rfid-led-desync-rw
                WritableMap dbg2 = Arguments.createMap();
                dbg2.putString("error", String.valueOf(t.getMessage()));
                debugPost("A", "writeMemory.error", dbg2);
                // #endregion debug-point rfid-led-desync-rw
            }
        }, "RFIDWriteThread").start();
    }

    @ReactMethod
    public void lockTag(String targetEpc, int lockType, String accessPassword, Promise promise) {
        if (isScanning) {
            promise.reject("RFID_SCAN_IN_PROGRESS", "Stop inventory scan before lockTag");
            // #region debug-point rfid-led-desync-rw
            debugPost("A", "lockTag.reject.isScanning", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }
        if (uhfService == null) {
            promise.reject("RFID_NOT_INITIALIZED", "UHFService not initialized");
            // #region debug-point rfid-led-desync-rw
            debugPost("E", "lockTag.reject.noService", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }

        // #region debug-point rfid-led-desync-rw
        WritableMap dbg0 = Arguments.createMap();
        dbg0.putInt("lockType", lockType);
        dbg0.putString("targetEpc", targetEpc == null ? "" : targetEpc);
        debugPost("A", "lockTag.begin", dbg0);
        // #endregion debug-point rfid-led-desync-rw

        new Thread(() -> {
            try {
                byte[] pwd = ensurePasswordBytes(accessPassword);
                byte[] epcFilter = parseHexOrNull(targetEpc);

                boolean ok = uhfService.lockTag(pwd, epcFilter, lockType);
                if (!ok) {
                    promise.reject("RFID_LOCK_FAILED", "lockTag returned false");
                    // #region debug-point rfid-led-desync-rw
                    debugPost("A", "lockTag.fail.false", null);
                    // #endregion debug-point rfid-led-desync-rw
                    return;
                }
                promise.resolve(true);
                // #region debug-point rfid-led-desync-rw
                debugPost("A", "lockTag.ok", null);
                // #endregion debug-point rfid-led-desync-rw
            } catch (Throwable t) {
                promise.reject("RFID_LOCK_ERROR", String.valueOf(t.getMessage()), t);
                // #region debug-point rfid-led-desync-rw
                WritableMap dbg2 = Arguments.createMap();
                dbg2.putString("error", String.valueOf(t.getMessage()));
                debugPost("A", "lockTag.error", dbg2);
                // #endregion debug-point rfid-led-desync-rw
            }
        }, "RFIDLockThread").start();
    }

    @ReactMethod
    public void killTag(String targetEpc, String killPassword, Promise promise) {
        if (isScanning) {
            promise.reject("RFID_SCAN_IN_PROGRESS", "Stop inventory scan before killTag");
            // #region debug-point rfid-led-desync-rw
            debugPost("A", "killTag.reject.isScanning", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }
        if (uhfService == null) {
            promise.reject("RFID_NOT_INITIALIZED", "UHFService not initialized");
            // #region debug-point rfid-led-desync-rw
            debugPost("E", "killTag.reject.noService", null);
            // #endregion debug-point rfid-led-desync-rw
            return;
        }

        // #region debug-point rfid-led-desync-rw
        WritableMap dbg0 = Arguments.createMap();
        dbg0.putString("targetEpc", targetEpc == null ? "" : targetEpc);
        dbg0.putInt("killPwdLen", killPassword == null ? 0 : killPassword.length());
        debugPost("A", "killTag.begin", dbg0);
        // #endregion debug-point rfid-led-desync-rw

        new Thread(() -> {
            try {
                byte[] killPwd = ensurePasswordBytes(killPassword);
                byte[] epcFilter = parseHexOrNull(targetEpc);

                boolean ok = uhfService.killTag(killPwd, epcFilter);
                if (!ok) {
                    promise.reject("RFID_KILL_FAILED", "killTag returned false");
                    // #region debug-point rfid-led-desync-rw
                    debugPost("A", "killTag.fail.false", null);
                    // #endregion debug-point rfid-led-desync-rw
                    return;
                }
                promise.resolve(true);
                // #region debug-point rfid-led-desync-rw
                debugPost("A", "killTag.ok", null);
                // #endregion debug-point rfid-led-desync-rw
            } catch (Throwable t) {
                promise.reject("RFID_KILL_ERROR", String.valueOf(t.getMessage()), t);
                // #region debug-point rfid-led-desync-rw
                WritableMap dbg2 = Arguments.createMap();
                dbg2.putString("error", String.valueOf(t.getMessage()));
                debugPost("A", "killTag.error", dbg2);
                // #endregion debug-point rfid-led-desync-rw
            }
        }, "RFIDKillThread").start();
    }

    @ReactMethod
    public void readTagLED(String targetEpc, String accessPassword, int type, Promise promise) {
        if (uhfService == null) {
            promise.reject("RFID_NOT_INITIALIZED", "UHFService not initialized");
            return;
        }
        byte[] epc = parseHexOrNull(targetEpc);
        if (epc == null || epc.length == 0) {
            promise.reject("RFID_INVALID_EPC", "targetEpc is required");
            return;
        }

        new Thread(() -> {
            try {
                byte[] pwd = ensurePasswordBytes(accessPassword);
                boolean ok = uhfService.readTagLED(pwd, epc, type);
                if (!ok) {
                    promise.reject("RFID_LED_FAILED", "readTagLED returned false");
                    return;
                }
                promise.resolve(true);
            } catch (Throwable t) {
                promise.reject("RFID_LED_ERROR", String.valueOf(t.getMessage()), t);
            }
        }, "RFIDReadLedThread").start();
    }

    @ReactMethod
    public void playBeep(int durationMs) {
        int d = durationMs <= 0 ? 60 : Math.min(durationMs, 2000);
        synchronized (toneLock) {
            if (toneGenerator == null) {
                toneGenerator = new ToneGenerator(AudioManager.STREAM_MUSIC, 90);
            }
            toneGenerator.startTone(ToneGenerator.TONE_PROP_BEEP, d);
        }
    }

    private void sendEvent(String name, Object data) {
        if (context.hasActiveReactInstance()) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                   .emit(name, data);
        } else {
            Log.w(TAG, "sendEvent(" + name + ") dropped: no active React instance");
        }
    }

    private static byte[] ensurePasswordBytes(String hex) {
        byte[] raw = parseHex(hex);
        if (raw.length == 0) return new byte[] { 0, 0, 0, 0 };
        if (raw.length == 4) return raw;

        byte[] out = new byte[] { 0, 0, 0, 0 };
        int copyLen = Math.min(raw.length, 4);
        System.arraycopy(raw, 0, out, 4 - copyLen, copyLen);
        return out;
    }

    private static byte[] parseHexOrNull(String hex) {
        byte[] data = parseHex(hex);
        return data.length == 0 ? null : data;
    }

    private static byte[] parseHex(String hex) {
        if (hex == null) return new byte[0];
        String cleaned = hex.replaceAll("[^0-9A-Fa-f]", "");
        if (cleaned.isEmpty()) return new byte[0];
        if ((cleaned.length() % 2) != 0) cleaned = "0" + cleaned;

        int len = cleaned.length() / 2;
        byte[] out = new byte[len];
        for (int i = 0; i < len; i++) {
            int hi = Character.digit(cleaned.charAt(i * 2), 16);
            int lo = Character.digit(cleaned.charAt(i * 2 + 1), 16);
            if (hi < 0 || lo < 0) return new byte[0];
            out[i] = (byte) ((hi << 4) + lo);
        }
        return out;
    }

    private static String bytesToHex(byte[] data) {
        if (data == null || data.length == 0) return "";
        StringBuilder sb = new StringBuilder(data.length * 2);
        for (byte b : data) {
            sb.append(String.format(Locale.US, "%02X", b));
        }
        return sb.toString();
    }
}
