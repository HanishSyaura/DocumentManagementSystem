# Debug Session: master-record-tabs

Status: OPEN

## Scope
- Export gagal untuk tab `New Version Register`
- Export gagal untuk tab `Consolidated Registry`
- Tab `Obsolete Register` blank / tak boleh buka
- Tab `Old Version Register` blank / tak boleh buka

## Initial Hypotheses
- Rujukan util eksport atau pembinaan dataset menggunakan simbol global yang tidak wujud di build production.
- Salah satu mapper untuk tab tertentu akses pemboleh ubah yang tidak diisytiharkan, menyebabkan render/export crash.
- Data response API bagi obsolete/old version tak dipetakan mengikut shape sebenar lalu melempar error semasa render.
- Konfigurasi kolum atau filter untuk tab tertentu guna helper yang undefined hanya bila tab tersebut aktif.
- Satu dependency pihak ketiga untuk eksport dipanggil secara tidak serasi dalam komponen `MasterRecord`.

## Evidence Log
- Pending

## Fix Log
- Pending

## Verification
- Pending
