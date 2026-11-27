# KALAP Management System v2.2.24

## Perubahan akun Mitra v2.2.24
- **Pengajuan stok masuk:** daftar menu tidak lagi memakai kolom input jumlah di dalam tabel. Mitra mengetuk menu, lalu popup menampilkan nama dan harga menu untuk konfirmasi serta satu kolom jumlah stok.
- **Pengajuan cetak stiker:** pola yang sama diterapkan. Mitra mengetuk menu, lalu popup menampilkan nama dan harga menu serta satu kolom jumlah stiker.
- Daftar menu memakai kartu responsif tanpa tabel melebar, sehingga pada tampilan mobile tidak perlu digeser ke samping. Pagination 10 menu per halaman tetap dipertahankan.
- **Aktivitas terbaru** pada Dashboard Mitra kini hanya menampilkan maksimal 8 penjualan terbaru untuk tanggal hari ini menurut zona waktu Asia/Jakarta. Pemeriksaan pergantian tanggal yang sudah ada memperbarui halaman saat hari berganti, sehingga daftar harian otomatis dimulai kembali tanpa menghapus riwayat transaksi.
- Pengajuan stok tetap menggunakan API `createStockRequest`. Pengajuan stiker tetap memvalidasi ulang profil dan kepemilikan menu dari Firestore sebelum membuat dokumen antrean cetak.
- Riwayat transaksi, riwayat stok, dan antrean cetak tidak dihapus oleh perubahan ini.

## Optimasi pembacaan Firebase v2.2.23 (dipertahankan)
- Listener data utama mengikuti halaman yang sedang dibuka. Daftar menu, mitra, akun, riwayat pengajuan, riwayat cetak label, data transaksi, data keuangan, pergerakan stok, dan riwayat closing tidak seluruhnya dimuat bersamaan saat login.
- Riwayat pengajuan stok dan cetak label dimuat ketika halaman terkait dibuka; listener ringkas untuk status antrean navbar tetap aktif agar notifikasi diperbarui.
- Data transaksi dan pergerakan stok Dashboard hari ini memakai hasil query rentang Dashboard ketika tanggal hari ini sudah tercakup.
- Pemindaian massal pergerakan stok untuk rollover dan pemindaian seluruh riwayat pengajuan kedaluwarsa tidak dijalankan otomatis saat login atau pergantian tanggal. Rekonsiliasi data menu, mitra, dan akun lama tetap tersedia pada halaman pengelolaannya masing-masing.
- Cache lokal Firestore dan mekanisme tulis/transaksi dipertahankan.

## Fitur sebelumnya yang dipertahankan
- Daftar menu Cetak Stiker Mitra memakai pagination 10 menu per halaman dan ringkasan status pengajuan di bagian atas.
- Antrean cetak Superadmin, ukuran label 30 × 40 mm, pencetakan QR, dan pembaruan status setelah dialog cetak selesai tetap menggunakan mekanisme yang sudah ada.
- Alur transaksi POS, pembagian komisi 20%, stok, pengajuan, keuangan, closing, dan pembatalan closing tidak sengaja diubah.
- Firestore Rules, indeks, konfigurasi Firebase, manifest, ikon, dan aset aplikasi dipertahankan tanpa perubahan.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.24.
- `service-worker.js`: cache shell v2.2.24.
- `firestore.rules`, `firestore.indexes.json`, `manifest.webmanifest`, ikon, dan berkas pendukung dipertahankan dari paket sebelumnya.

## Pemasangan
1. Cadangkan berkas hosting dan data Firestore aktif terlebih dahulu.
2. Ganti `index.html` dan `service-worker.js` di hosting dengan versi paket ini.
3. `firestore.rules` tidak diubah, sehingga tidak perlu dipublikasikan ulang.
4. Pertahankan folder `icons/`, `manifest.webmanifest`, dan berkas pendukung yang sudah ada di hosting.
5. Lakukan hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.24.

## Catatan pengujian
- Sintaks JavaScript pada `index.html` diperiksa menggunakan Node.js dan lolos.
- Perubahan UI, handler popup, pembatasan jumlah, filter aktivitas berdasarkan tanggal Jakarta, serta versi cache Service Worker diverifikasi secara statis.
- Operasi Firestore nyata dan pengujian lintas-role belum dapat dijalankan dari lingkungan ini. Setelah pemasangan, uji pengajuan stok, pengajuan cetak stiker, tampilan mobile, pergantian tanggal, dan proses cetak Superadmin.
