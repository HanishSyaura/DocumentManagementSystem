# Production Architecture Plan

Dokumen ni cadangkan cara susun semula repo RFID ni supaya:
- app boleh terus dibina atas SDK sedia ada
- logic hardware tak bercampur dengan UI
- senang tambah feature baru macam LED tag, read/write, parameter, logging
- senang support device/model lain nanti

## 1) Prinsip utama

Untuk project ni, **tak perlu asingkan jadi dua app berbeza**.

Yang lebih penting ialah asingkan **layer dalam code**:
- `Vendor SDK layer`
- `Native adapter layer`
- `JS bridge/service layer`
- `Business/use-case layer`
- `UI layer`

Kalau layer ni kemas, kau masih boleh kekalkan satu app React Native yang sama, tapi codebase jadi jauh lebih scalable.

## 2) Struktur semasa

### Yang dah elok
- Vendor JAR duduk dalam [android/app/libs](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/android/app/libs)
- Native bridge dah ada dalam [EvolveRFIDPackage.kt](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/android/app/src/main/java/com/evolverfidapp/EvolveRFIDPackage.kt)
- RFID wrapper JS dah ada dalam [RFIDService.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/services/RFIDService.ts)
- UI inventory dah guna hook/service pattern melalui [useInventory.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/hooks/useInventory.ts)

### Yang masih bercampur
- [InventoryScreen.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/screens/InventoryScreen.tsx) masih dengar `DeviceEventEmitter` terus
- `Special LED Mode` masih UI state, belum ada use-case/hardware contract yang jelas
- [RFIDModule.java](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/android/app/src/main/java/com/evolverfidapp/RFIDModule.java) pegang terlalu banyak tanggungjawab sekali gus:
  - open/close hardware
  - inventory
  - read/write/lock/kill
  - debug reporting
  - event emission
- Business rule masih banyak tersebar dekat screen

## 3) Architecture target

### Layer 1: Vendor SDK
Ini layer paling bawah.

Contoh:
- `uhf.jar`
- `scankey.jar`
- `ScannerAPI.jar`

Rules:
- UI tak boleh tahu pasal class vendor macam `UHFService`
- JS/TS tak boleh tahu detail vendor API

### Layer 2: Native Adapter
Ini layer Android yang balut vendor SDK jadi API yang konsisten untuk app.

Cadangan pecahan:
- `RfidHardwareManager`
- `BarcodeHardwareManager`
- `TriggerManager`
- `DebugReporter`

Peranan:
- translate vendor method ke method yang lebih stabil
- normalize error/result
- handle lifecycle hardware
- prevent race condition inventory vs LED vs read/write

Contoh tanggungjawab:
- `RfidHardwareManager`
  - `open()`
  - `startInventory()`
  - `stopInventory()`
  - `readMemory(...)`
  - `writeMemory(...)`
  - `blinkLed(...)`
  - `lockTag(...)`
  - `killTag(...)`

### Layer 3: React Native Bridge
Layer ni expose function native ke JS.

Contoh current file:
- [RFIDModule.java](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/android/app/src/main/java/com/evolverfidapp/RFIDModule.java)
- `BarcodeModule.java`

Future rule:
- module ni sepatutnya **nipis**
- dia cuma terima parameter dari JS, call native manager, return Promise/event
- dia tak patut simpan terlalu banyak business logic

### Layer 4: JS Service / Repository
Ini contract utama untuk app React Native.

Contoh current file:
- [RFIDService.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/services/RFIDService.ts)

Role sebenar layer ni:
- hide `NativeModules`
- map enum / bank / mode
- expose function yang mudah guna oleh app

Target API contoh:

```ts
RFIDService.startInventory({ mode: 'continuous' })
RFIDService.stopInventory()
RFIDService.readTagMemory({ epc, bank, offset, length })
RFIDService.writeTagMemory({ epc, bank, offset, dataHex })
RFIDService.blinkLedTag({ epc })
RFIDService.lockTag({ epc, bank, mode, accessPassword })
RFIDService.onInventoryTags(...)
RFIDService.onTrigger(...)
RFIDService.onError(...)
```

### Layer 5: Use Case / Domain
Ini layer yang sekarang belum jelas dalam repo, tapi paling penting kalau app nak jadi production-ready.

Cadangan folder:
- `src/features/inventory`
- `src/features/readwrite`
- `src/features/led-tag`
- `src/features/settings`

Contoh fungsi/use-case:
- `startInventoryUseCase`
- `stopInventoryUseCase`
- `findAndBlinkLedTagUseCase`
- `readSelectedTagUseCase`
- `writeSelectedTagUseCase`

Peranan:
- gabungkan beberapa service call jadi flow sebenar app
- letak business rules di satu tempat
- elakkan screen jadi terlalu “pintar”

### Layer 6: UI
UI hanya buat 3 benda:
- papar state
- trigger action
- render feedback/error/loading

Screen tak patut tahu vendor detail.

Contoh sekarang:
- [InventoryScreen.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/screens/InventoryScreen.tsx)
- [ReadWriteScreen.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/screens/ReadWriteScreen.tsx)

Target:
- screen call hook / use-case sahaja
- tak terus subscribe low-level event kalau boleh

## 4) Struktur folder yang dicadangkan

```text
src/
  app/
    navigation/
    providers/
  features/
    inventory/
      hooks/
      services/
      useCases/
      types/
      components/
    readwrite/
      hooks/
      services/
      useCases/
      types/
      components/
    led-tag/
      hooks/
      services/
      useCases/
      types/
    settings/
      hooks/
      services/
      useCases/
  shared/
    components/
    utils/
    types/
    constants/
  infrastructure/
    native/
      RFIDService.ts
      BarcodeService.ts
```

Android native:

```text
android/app/src/main/java/com/evolverfidapp/
  bridge/
    RFIDModule.java
    BarcodeModule.java
  hardware/
    RfidHardwareManager.java
    BarcodeHardwareManager.java
    TriggerManager.java
  debug/
    DebugReporter.java
  EvolveRFIDPackage.kt
```

## 5) Flow yang disyorkan

### Inventory flow
- UI button / trigger
- `useInventoryController()`
- `startInventoryUseCase()`
- `RFIDService.startInventory()`
- `RFIDModule.startScanContinue()`
- `RfidHardwareManager.startInventory()`
- `UHFService.inventoryStart()`

### Read/Write flow
- UI submit form
- `readTagUseCase()`
- validate input
- stop inventory kalau sedang berjalan
- call `RFIDService.readMemory()`
- return normalized result ke UI

### LED tag flow
LED tak patut cuma jadi toggle UI.

Target flow:
- user ON LED mode
- app set current inventory strategy = `inventory+led`
- bila tag dipilih / ditemui, use-case tentukan sama ada:
  - hanya inventory
  - inventory + blink
  - search then blink

Ini penting sebab bug semasa sangat mungkin datang daripada flow LED yang belum dijadikan “first-class feature”.

## 6) Contract yang patut diwujudkan

### RFID types
Wujudkan shared type supaya semua layer guna shape yang sama.

Contoh:

```ts
export type TagRead = {
  epc: string;
  rssi?: number;
  count?: number;
};

export type InventoryMode = 'once' | 'continuous';
export type MemoryBank = 'PASSWORD' | 'EPC' | 'TID' | 'USER';
```

### Result type
Jangan return campur-campur `boolean`, `string`, `throw raw error`.

Contoh:

```ts
type Result<T> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };
```

Ini akan senangkan UI handle error secara konsisten.

## 7) Improvement yang paling penting untuk repo ni

### A. Pisahkan `RFIDModule.java`
Sekarang terlalu gemuk. Pecahkan kepada:
- bridge
- hardware manager
- debug reporter

### B. Buang direct `DeviceEventEmitter` dari screen
Contoh [InventoryScreen.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/screens/InventoryScreen.tsx) patut guna hook/controller sahaja.

### C. Jadikan LED tag sebagai feature rasmi
Sekarang LED mode hanya text/UI state.
Perlu ada:
- `LedTagService`
- `BlinkLedUseCase`
- state machine untuk mode inventory vs led-search

### D. Wujudkan centralized error handling
Semua error native normalize ke shape yang sama:
- `RFID_NOT_INITIALIZED`
- `RFID_SCAN_IN_PROGRESS`
- `RFID_LED_FAILED`
- `RFID_READ_FAILED`

### E. Tambah operation guard / queue
Untuk elak bug race:
- inventory scan
- blink LED
- read/write
- trigger down/up

Semua operation hardware patut lalu satu queue / mutex.

## 8) Cadangan state machine minimum

Untuk elak banyak bug hardware, guna state machine ringkas:

- `idle`
- `inventorying`
- `reading`
- `writing`
- `blinking`
- `locking`
- `killing`
- `error`

Rules contoh:
- kalau `inventorying`, jangan terus `readMemory` tanpa stop atau pause
- kalau `blinking`, jangan start inventory baru
- kalau trigger `UP`, jangan force stop kalau current op ialah write/lock yang belum selesai

Ini sangat penting untuk isu LED tag yang kadang read tapi tak blink / blink tapi tak read.

## 9) Pelan migrasi practical

### Fasa 1: Refactor tanpa ubah UI banyak
- pindahkan low-level logic dari `RFIDModule` ke `RfidHardwareManager`
- kekalkan API JS lama supaya UI tak pecah

### Fasa 2: Perkenalkan feature folders
- pindahkan inventory/readwrite/led logic ke `src/features/*`
- `services/` jadi infrastructure sahaja

### Fasa 3: Introduce use-cases
- semua screen call hook/use-case
- screen tak lagi call raw service event sendiri

### Fasa 4: LED workflow stabilization
- tambah dedicated LED operation API
- tambah queue/state machine
- tambah targeted runtime logging untuk LED flow

## 10) Keputusan untuk current project

Kalau soalan dia:
**“Boleh terus build app based on SDK ni atau kena asingkan app dengan SDK?”**

Jawapan production-ready:
- **boleh terus build atas SDK ni**
- **tak perlu jadikan dua app berasingan**
- tapi **mesti asingkan layer dalam codebase**

Model terbaik untuk repo ni:
- satu app React Native
- satu native adapter layer
- satu vendor SDK layer
- feature/use-case yang jelas di JS/TS

Itu dah cukup kuat untuk production dan cukup fleksibel untuk masa depan.

## 11) Recommendation paling sesuai untuk kau sekarang

Kalau ikut priority:

1. Stabilkan `RFIDModule` jadi bridge nipis
2. Wujudkan `RfidHardwareManager`
3. Wujudkan `LedTag` feature/use-case
4. Pindahkan inventory logic keluar dari screen
5. Tambah queue/state guard untuk semua operasi hardware

Kalau kau nak, next step aku boleh terus bantu buat **refactor plan by file**:
- file mana kena pecah dulu
- folder baru apa nak create
- function mana pindah ke mana
- dan urutan paling selamat supaya app tak rosak masa refactor
