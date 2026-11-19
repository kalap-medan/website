# KALAP Management System v2.2.18

## Pembaruan terfokus: penghapusan/pembatalan batch stok disetujui
- Tombol hapus batch tetap mengurangi saldo melalui movement koreksi negatif dalam satu transaksi.
- Batch movement asli disembunyikan dari daftar harian tetapi tidak dihapus atau di-void, agar rekonstruksi saldo tidak menghitung pengurangan dua kali.
- Pengajuan Mitra yang terhubung ditandai `voided` alih-alih dihapus permanen. Status ini tidak ditampilkan di daftar pengajuan aktif, tetapi jejak audit tetap tersedia.
- Firestore Rules mengizinkan pasangan perubahan tersebut secara atomik untuk staf aktif (Superadmin termasuk di dalamnya), dengan kecocokan requestId/menuId, status received, tidak ada riwayat koreksi, tidak ada lock aktif, serta validasi timestamp dan pelaku.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.18.
- `firestore.rules`: Firestore Rules v2.2.18.
- `service-worker.js`: cache shell v2.2.18.
- `manifest.webmanifest` dan `firestore.indexes.json`: dipertahankan dari arsip sumber.
- `RELEASE_NOTES_v2.2.18.txt`: rincian perubahan.

## Pemasangan
1. Ganti `index.html` dan `service-worker.js` di hosting.
2. Publikasikan `firestore.rules` ke Firebase Console untuk project `kalap-63628`.
3. Pertahankan folder `icons/` serta berkas konfigurasi hosting yang sudah digunakan.
4. Hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.18.

## Catatan
Pengajuan yang dibatalkan tidak dihapus permanen. Dokumen berstatus `voided` disembunyikan dari daftar pengajuan aktif dan dipertahankan sebagai jejak audit. Tidak ada perubahan pada fitur selain alur pembatalan batch stok dan penanda versi/cache.
