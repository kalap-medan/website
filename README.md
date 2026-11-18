# KALAP Management System v2.2.13

## Isi paket
- `index.html`: aplikasi KALAP satu berkas.
- `firestore.rules`: Firestore Rules v2.2.13 dengan otorisasi reset seluruh sistem khusus Superadmin aktif.
- `firestore.indexes.json`: konfigurasi indeks yang sudah ada.
- `manifest.webmanifest`: identitas PWA.
- `service-worker.js`: cache shell v2.2.13.
- `RELEASE_NOTES_v2.2.13.txt`: rincian pembaruan.

## Reset Seluruh Sistem
Tombol tersedia pada halaman **Menu & Persediaan** untuk Superadmin aktif. Pengguna harus mengetik `RESET SEMUA` untuk mengonfirmasi. Data operasional transaksi, keuangan, penjualan mitra, pergerakan stok, pengajuan dan lock, payout, closing, serta ringkasan closing dihapus. Saldo operasional menu diatur menjadi 0, tetapi katalog menu tetap dipertahankan. Data mitra dan akun login juga dipertahankan. Arsip katalog tetap disimpan.

Proses berjalan per batch dan menggunakan dokumen `systemResetAuthorizations/active` sebagai manifest sementara. Bila koneksi terputus sesudah sejumlah batch, aplikasi menandai hasil parsial; jalankan ulang setelah memeriksa hasil agar operasi yang tersisa terselesaikan.

## Pemasangan
1. Publikasikan `firestore.rules` ke project Firebase `kalap-63628`.
2. Ganti `index.html` dan `service-worker.js` di root GitHub Pages.
3. Pertahankan folder `icons/` dan `manifest.webmanifest`.
4. Hard refresh dengan `Ctrl + Shift + R`.
