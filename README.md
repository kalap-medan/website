# KALAP Management System v2.2.17

Pembaruan terbatas untuk memperbaiki penghapusan batch stok masuk yang berasal dari pengajuan Mitra dan sudah disetujui.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.17.
- `firestore.rules`: Rules v2.2.17 dengan kompatibilitas penanda koreksi untuk dokumen pengajuan stok lama.
- `service-worker.js`: cache shell v2.2.17.
- `manifest.webmanifest` dan `firestore.indexes.json`: dipertahankan dari v2.2.16.
- `RELEASE_NOTES_v2.2.17.txt`: catatan perubahan.

## Pemasangan
1. Ganti `index.html` dan `service-worker.js` di hosting menggunakan versi paket ini.
2. Publikasikan `firestore.rules` ke Firebase Console untuk project `kalap-63628`.
3. Pertahankan `icons/` dan berkas konfigurasi hosting yang sudah digunakan.
4. Lakukan hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.17.

## Ruang lingkup
Tidak ada fitur baru. Perubahan Rules hanya menyamakan interpretasi `latestAdjustmentRequestId` kosong (`''`), `null`, atau tidak tersedia sebagai belum ada riwayat koreksi, konsisten dengan validasi di aplikasi. Izin penghapusan tetap mensyaratkan status pengajuan `received`, relasi `movementId` dan `menuId` yang cocok, tidak ada pengajuan aktif, serta batch asli disembunyikan dalam transaksi pembalikan saldo yang sama.
