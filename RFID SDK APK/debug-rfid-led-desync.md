[OPEN] Debug session: rfid-led-desync

Context
- Symptom: Kadang-kadang tag LED boleh dibaca tapi tak blink, atau blink tapi tak boleh read.
- Target: Dapatkan bukti runtime, kenal pasti punca sebenar, dan buat fix yang stabil (tak berulang).

Hypotheses (falsifiable)
- H1: Inventory scan dan arahan LED (readTagLED/IOControl) bertembung (concurrency/state conflict) → salah satu operasi gagal.
- H2: Password/lock state tag menyebabkan arahan LED gagal secara intermittent walaupun EPC masih boleh dibaca.
- H3: EPC yang digunakan untuk blink bukan EPC yang sama dengan yang dibaca (multi-tag / stale selection) → nampak blink tapi “read” target lain.
- H4: Timing/RF power: read dan blink ialah 2 command berasingan; bila RSSI rendah atau tag bergerak, salah satu terlepas.
- H5: Race start/stop scan (trigger DOWN/UP terlalu cepat) → command drop / listener unregister timing.

Evidence plan
- Tambah instrumentation log (ke Debug Server) untuk:
  - Trigger DOWN/UP, inventoryStart/Stop result, isScanning state transitions
  - tagsRead (EPC, RSSI, count) dan masa
  - (Jika ada) panggilan LED command + result + EPC target
  - open/isOpen status UHFService bila berlaku mismatch

Runbook
- Start Debug Server (remote) di PC
- Build & run app di device
- Reproduce issue 5-10 kali (scenario read-only vs read+blink)
- Export logs dari Debug Server untuk analysis (pre-fix)

Notes
- Jangan tutup Debug Server sampai user confirm fix.
