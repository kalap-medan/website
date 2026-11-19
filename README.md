# KALAP Management System v2.2.19

## Perbaikan terfokus: hapus batch yang telah dikoreksi dan revisi koreksi

### Penghapusan batch stok disetujui
- Penghapusan mengikuti rantai `latestAdjustmentRequestId` untuk seluruh koreksi yang sudah diterima.
- Pembacaan di dalam transaksi menggunakan `DocumentReference`, bukan `Transaction.get(query)`.
- Jumlah yang dibalik adalah jumlah akhir batch (`editedQty` bila ada) ditambah seluruh `adjustmentDelta` koreksi yang telah diterima. Satu movement pembalikan dibuat agar saldo berkurang tepat satu kali.
- Batch sumber disembunyikan dari daftar operasional dan pengajuan sumber serta pengajuan koreksi turunannya ditandai `voided`.
- Movement koreksi dan edit dipertahankan sebagai jejak audit. Daftar operasional menyaring movement yang request-nya sudah `voided` dan edit yang batch sumbernya dibatalkan.
- Penghapusan tetap ditolak bila masih ada pengajuan lain yang mengunci menu, stok tidak mencukupi, batch bukan stok masuk aktif, atau closing hari itu sudah dilakukan.

### Revisi koreksi
- Nilai `previousQty` dipertahankan persis seperti nilai tersimpan agar pemeriksaan Firestore cocok dengan dokumen lama.
- Validasi profil akun server tetap mewajibkan `users/{UID}.active == true` dan role `superadmin` atau `spv`.

### Firestore Rules
- `latestAdjustmentRequestId` kosong (`''`), `null`, atau tidak tersedia diperlakukan sebagai belum memiliki koreksi, konsisten dengan kode aplikasi.
- Saat batch dibatalkan, Rules memvalidasi bahwa setiap koreksi turunan ikut menjadi `voided`. Movement koreksi tetap dipertahankan sebagai audit.
- Hak staff tidak diperluas di luar Superadmin/SPV aktif.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.19.
- `firestore.rules`: Firestore Rules v2.2.19.
- `service-worker.js`: cache shell v2.2.19.
- `manifest.webmanifest` dan `firestore.indexes.json`: dipertahankan.
- `RELEASE_NOTES_v2.2.19.txt`: ringkasan perubahan.

## Pemasangan
1. Cadangkan berkas hosting dan Firestore Rules aktif terlebih dahulu.
2. Ganti `index.html` dan `service-worker.js` di hosting dengan versi paket ini.
3. Publikasikan `firestore.rules` ke Firebase Console pada project `kalap-63628`.
4. Pertahankan folder `icons/` yang sudah ada di hosting; paket ini tidak mengganti ikon.
5. Hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.19.

## Catatan pengujian
JavaScript dan berkas konfigurasi diperiksa secara lokal. Firestore Rules belum dapat diuji pada Firebase Emulator maupun project produksi dari lingkungan ini. Karena itu, validasi transaksi nyata tetap perlu dilakukan setelah Rules dipublikasikan.
