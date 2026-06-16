# Backend Handoff Guide

Dokumen ni explain backend layer yang dah disediakan supaya lepas ni kau boleh bagi design page-by-page, dan kita cuma sambungkan UI ke contract yang sama.

## 1) Apa yang dah siap

Backend baru sekarang duduk dekat:

- [RfidBackend.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/backend/RfidBackend.ts)
- [rfidSettingsStore.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/backend/config/rfidSettingsStore.ts)
- [nativeRfidAdapter.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/backend/adapters/nativeRfidAdapter.ts)
- [rfid.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/backend/types/rfid.ts)
- [index.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/backend/index.ts)

Current UI yang dah mula guna backend layer:
- [useInventory.ts](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/hooks/useInventory.ts)
- [InventoryScreen.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/screens/InventoryScreen.tsx)
- [ReadWriteScreen.tsx](file:///c:/Users/USER/Desktop/DocumentManagementSystem/RFID%20SDK%20APK/src/screens/ReadWriteScreen.tsx)

## 2) Konsep backend yang dah di-setup

Frontend tak perlu terus call `RFIDService` atau `NativeModules`.

Frontend sepatutnya hanya bercakap dengan:
- `RfidBackend`

Dan config mode disimpan dekat:
- `rfidSettingsStore`

## 3) Mode yang disokong sekarang

Current mode:
- `standard`
- `led-special`

Disimpan dalam:
- `RfidSettings.activeMode` (dan profile setting disimpan dalam `RfidSettings.profiles`)

Contoh settings shape:

```ts
{
  activeMode: 'standard',
  profiles: {
    standard: {
      inventoryScanMode: 'continue',
      preferSingleTagForLed: false
    },
    'led-special': {
      inventoryScanMode: 'continue',
      preferSingleTagForLed: true
    }
  }
}
```

## 4) API utama untuk frontend nanti

### Settings

```ts
await RfidBackend.initialize()

RfidBackend.getSettings()
RfidBackend.setActiveMode('led-special')
await RfidBackend.switchActiveMode('led-special')
RfidBackend.updateProfile('standard', { inventoryScanMode: 'once' })
RfidBackend.updateProfile('led-special', { preferSingleTagForLed: true })
RfidBackend.onSettingsChange((settings) => {})
```

### Inventory

```ts
RfidBackend.startInventory({
  scanMode: 'continue',
})

RfidBackend.stopInventory()
RfidBackend.isScanning()
RfidBackend.onTags((tags) => {})
RfidBackend.onTrigger((state) => {})
RfidBackend.onError((error) => {})
```

### Read / Write

```ts
RfidBackend.readTagMemory({
  targetEpc,
  bank: 'USER',
  offset: 0,
  length: 2,
  accessPassword: '',
})

RfidBackend.writeTagMemory({
  targetEpc,
  bank: 'USER',
  offset: 0,
  dataHex: '1122AABB',
  accessPassword: '',
})
```

### Lock / Kill

```ts
RfidBackend.lockTag({
  targetEpc,
  lockType,
  accessPassword,
})

RfidBackend.killTag({
  targetEpc,
  killPassword,
})
```

## 5) Macam mana page design nanti patut connect

### Inventory page
Page inventory nanti hanya perlu:
- render tag list
- start/stop inventory
- tunjuk current mode
- maybe tukar filter/search state

Jangan terus tahu pasal native SDK.

### Settings page
Page settings nanti patut jadi tempat untuk:
- pilih `RFID Operation Mode`
  - `standard`
  - `led-special`
- pilih default inventory mode
  - `once`
  - `continue`

Frontend hanya update settings:

```ts
RfidBackend.setActiveMode('led-special')
RfidBackend.updateProfile('led-special', { inventoryScanMode: 'continue' })
```

### Search page / LED page
Bila kau bagi design nanti, page tu patut call backend based on mode semasa.

Current backend sudah siap tempat untuk branch behavior:
- `startStandardInventory()`
- `startLedSpecialInventory()`

So nanti bila design LED flow confirm, kita akan isi logic LED special dekat branch tu tanpa ubah semua UI.

## 6) Apa yang belum dibuat lagi

Ini memang sengaja ditinggalkan untuk fasa seterusnya:

- persistence settings ke storage (gunakan `@react-native-async-storage/async-storage`)
- LED-specific workflow sebenar
- search-target use case
- operation queue/state machine
- API integration ke web/backend luar

## 7) Apa yang kau boleh bagi next

Bila kau ready, kau boleh bagi:

1. design page by page
2. page mana guna mode `standard`
3. page mana guna mode `led-special`
4. web/API mana nak connect
5. field apa yang user isi dan apa result yang kau nak papar

## 8) Next implementation direction

Lepas kau bagi design:

- aku akan map setiap page kepada method dalam `RfidBackend`
- kalau method belum cukup, aku tambah dekat backend dulu
- lepas tu baru wire UI page satu per satu

Itu akan buat frontend kau kemas dan tak bercampur dengan SDK logic.
