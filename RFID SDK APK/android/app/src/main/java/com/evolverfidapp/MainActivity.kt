package com.evolverfidapp

import android.os.Bundle
import android.util.Log
import com.facebook.react.ReactActivity

/**
 * Main Activity for Evolve RFID App
 * 
 * NOTE: Hardware button handling is done via ScanKeyHelper which uses
 * ScanKeyService callback. This is the same approach used by SEUIC's
 * reference implementation.
 * 
 * Do NOT add onKeyDown/onKeyUp handlers here - they will conflict
 * with ScanKeyService callbacks.
 * 
 * Key codes for reference:
 * - 249: Right-side barcode scanner button
 * - 250: Handle grip RFID trigger button
 */
class MainActivity : ReactActivity() {

    override fun getMainComponentName(): String = "EvolveRFIDApp"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("MainActivity", "Evolve RFID App started")
    }
}