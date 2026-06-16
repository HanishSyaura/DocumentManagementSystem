# Guide Debug LED Tag (End-to-End)

Dokumen ni guide kau dari kosong sampai dapat log untuk kes: **“kadang boleh read tapi tak blink / blink tapi tak boleh read”** pada **LED tag**.

## 0) Apa yang kau perlukan
- 1 PC Windows (yang ada project ni)
- 1 handheld RFID (SEUIC) + kabel USB
- LED tag/label (1 keping untuk test awal)
- Wi‑Fi (recommended) atau USB (ADB)

## 1) Setup handheld (sekali je)
### 1.1 Enable Developer Options + USB Debugging
1. Handheld → Settings
2. About phone/device → tap “Build number” 7 kali
3. Back → Developer options
4. ON: **USB debugging**

### 1.2 Install ADB di PC (kalau belum ada)
Kalau kau dah boleh run `adb` dalam PowerShell, skip.

Check:
```powershell
adb version
```

## 2) Sambung handheld ke PC
### 2.1 Sambung USB
1. Cucuk USB handheld ↔ PC
2. Kat handheld akan keluar prompt “Allow USB debugging?” → tick “Always allow” → OK

### 2.2 Confirm PC nampak device
Dalam PowerShell:
```powershell
adb devices
```
Expected:
- Device muncul sebagai `device`

Kalau status `unauthorized`:
- cabut & cucuk balik USB
- tekan “Allow USB debugging” dekat handheld

## 3) Pilih cara connect (Wi‑Fi atau USB reverse)
Kau kena pastikan handheld boleh reach **Debug Server (PC)**.

### Option A (Recommended): Wi‑Fi (handheld & PC sama Wi‑Fi)
1. Sambung handheld ke Wi‑Fi yang sama dengan PC
2. Nanti kita guna URL IP PC macam `http://192.168.x.x:7777/event`

### Option B: USB only (ADB reverse) — kalau Wi‑Fi susah
Ini buat handheld boleh access port PC guna `127.0.0.1`.

Nanti bila server start kat port (contoh 7777):
```powershell
adb reverse tcp:7777 tcp:7777
```
Lepas tu dalam app, URL debug server guna:
- `http://127.0.0.1:7777/event`

## 4) Start Debug Server di PC
### 4.1 Open PowerShell baru
Open PowerShell biasa (bukan dalam app editor), then:
```powershell
cd "c:\Users\USER\Desktop\DocumentManagementSystem\RFID SDK APK"
node .\.dbg\debug-server.js --remote --session rfid-led-desync --outdir .dbg --clean --idle 1200
```

Expected output (contoh):
- `api_url`: `http://<PC_IP>:7777/event`

Penting:
- Jangan close window ni sampai habis test.

### 4.2 Kalau Windows Firewall block
Kalau guna Wi‑Fi, pastikan Windows allow inbound untuk port 7777 (atau port yang keluar).

## 5) Set URL Debug Server dalam app
Buka fail [App.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/App.tsx) dan cari bahagian `configureDebug`.

### 5.1 Kalau guna Wi‑Fi
Set `url` sama macam `api_url` yang server print.
Contoh:
- `http://192.168.1.20:7777/event`

### 5.2 Kalau guna USB reverse
1. Pastikan kau dah run:
```powershell
adb reverse tcp:7777 tcp:7777
```
2. Set `url`:
- `http://127.0.0.1:7777/event`

## 6) Build & install APK ke handheld
Di project root:
```powershell
cd "c:\Users\USER\Desktop\DocumentManagementSystem\RFID SDK APK\android"
.\gradlew.bat :app:assembleDebug
```

APK output biasanya dekat:
- `android/app/build/outputs/apk/debug/app-debug.apk`

Install ke device:
```powershell
adb install -r "c:\Users\USER\Desktop\DocumentManagementSystem\RFID SDK APK\android\app\build\outputs\apk\debug\app-debug.apk"
```

## 7) Cara test (yang betul) guna LED tag
Goal: buat test yang repeatable dan kurangkan “multi-tag confusion”.

### 7.1 Setup test
- Letak **1 LED tag sahaja** dekat antenna area dulu
- Jangan campur banyak tag masa awal test

### 7.2 Test Scenario A (Inventory + Special LED Mode)
1. Buka app → Tab **Inventory**
2. ON **Special LED Mode** (Special)
3. Pilih scan mode: `continue`
4. Tekan & hold trigger RFID (grip key 250) 2–3 saat, then release
5. Observe:
   - EPC masuk list?
   - LED tag blink?

Repeat 10 kali dan catat:
- `Read OK, No Blink`
- `Blink OK, No Read`
- `Both OK`

### 7.3 Test Scenario B (ReadWrite screen)
1. Tab **ReadWrite**
2. Isi `Target EPC` (boleh copy dari Inventory list)
3. Bank: `USER` (atau mana yang kau nak)
4. Offset/Length: biar default dulu
5. Tekan `Read`
6. Observe:
   - Read success?
   - LED blink (kalau memang expected)?

## 8) Semak log (bukti)
Lepas test, cari file:
- `.dbg/trae-debug-log-rfid-led-desync.ndjson`

Path penuh:
- `c:\Users\USER\Desktop\DocumentManagementSystem\RFID SDK APK\.dbg\trae-debug-log-rfid-led-desync.ndjson`

Kalau file kosong:
- confirm `App.tsx` URL betul
- confirm handheld & PC reachable (Wi‑Fi same network / adb reverse)
- confirm Debug Server window masih running

## 9) Apa yang kau perlu hantar balik
1. File log:
   - `.dbg/trae-debug-log-rfid-led-desync.ndjson`
2. Info ringkas:
   - “Scenario A: berapa kali Read OK No Blink / Blink OK No Read / Both OK”
   - “Scenario B: sama juga”

## Troubleshooting cepat
- **adb devices tak nampak**: tukar kabel/port USB, ON USB debugging, accept prompt.
- **Wi‑Fi tak boleh connect**: guna Option B (adb reverse).
- **Port berubah (7778/7779)**: ikut nombor port yang Debug Server print, dan update `adb reverse` + `App.tsx`.

