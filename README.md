# KALAP Management System v2.2.16

## Isi paket
- `index.html`: aplikasi KALAP satu berkas.
- `firestore.rules`: Firestore Rules v2.2.16, termasuk otorisasi khusus sinkronisasi saldo harian Mitra dan reset seluruh sistem.
- `firestore.indexes.json`: konfigurasi indeks yang sudah ada.
- `manifest.webmanifest`: identitas PWA.
- `service-worker.js`: cache shell v2.2.16.
- `RELEASE_NOTES_v2.2.16.txt`: rincian pembaruan.

## Sinkronisasi saldo stok Mitra
- Sinkronisasi saldo harian menggunakan aturan Firestore khusus yang diletakkan sebelum cabang reset dan pergerakan stok.
- Pembaruan saldo dibagi menjadi batch 8 dokumen untuk mengurangi risiko melewati batas document-access-call Firestore pada atomic batch.
- Jika penolakan tetap terjadi, aplikasi menunjukkan sub-tahap yang gagal: membaca closing, membaca menu, membaca pergerakan stok, atau kelompok pembaruan saldo.
- Sinkronisasi mempertahankan pembatasan staf aktif (`superadmin`/`spv`), partnerId string tidak kosong, saldo integer non-negatif, tanggal bisnis yang valid, dan daftar field yang boleh berubah.

## Reset Seluruh Sistem
- Tersedia pada halaman **Menu & Persediaan** untuk Superadmin aktif.
- Data katalog menu, mitra, dan akun dipertahankan; data operasional yang menjadi cakupan reset diproses melalui manifest sementara `systemResetAuthorizations/active`.
- Proses batch dan otorisasi tetap mengikuti aturan yang ada pada versi 2.2.15.

## Pemasangan
1. Publikasikan `firestore.rules` dari paket ini ke Firebase project `kalap-63628`.
2. Ganti `index.html` dan `service-worker.js` di root hosting.
3. Pertahankan `manifest.webmanifest`, `firestore.indexes.json`, folder `icons/`, dan konfigurasi hosting yang sudah ada.
4. Hard refresh dengan `Ctrl + Shift + R`, lalu pastikan versi aplikasi menampilkan v2.2.16.

## Status verifikasi
Sintaks JavaScript, struktur kurung Rules, dan integritas arsip diperiksa secara lokal. Publikasi rules dan uji operasi ke Firebase produksi tidak dapat dilakukan dari lingkungan penyuntingan ini tanpa akses ke project/kredensial pemilik.
