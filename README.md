# KALAP Management System v2.2.21

## Perbaikan terfokus v2.2.21
- Grafik garis Dashboard Superadmin kini memiliki filter tanggal awal dan akhir. Grafik donat juga merangkum omzet dan komisi KALAP 20% pada periode yang dipilih; ringkasan stok/omzet harian tetap mengikuti hari berjalan.
- Input manual pemasukan/pengeluaran dan angka terkait arus kas manual di halaman Keuangan dihilangkan. Halaman Keuangan berfokus pada omzet, komisi KALAP 20%, bagian mitra 80%, transaksi, serta pergerakan stok.
- Tidak ada perhitungan atau tampilan HPP pada laporan Keuangan.
- Pengajuan stok Mitra menampilkan seluruh menu aktif dalam daftar berhalaman, maksimal 10 menu per halaman. Mitra cukup mengisi jumlah pada menu yang akan dititipkan; nilai pada halaman lain tetap tersimpan ketika berpindah halaman.
- Penjualan saya Mitra menjadi tabel stok harian live, hanya menampilkan menu yang diajukan atau menerima input stok hari itu. Jumlah terjual dan sisa stok mengikuti pergerakan POS secara realtime.
- Pilihan Bagikan/Jemput setelah closing dinonaktifkan bila tidak ada titipan atau stok masuk yang tercatat pada hari itu.
- Katalog Menu saya hanya menampilkan nama menu dan harga jual; kolom stok dan status dihapus.

## Fitur dan data lain
- Pencatatan transaksi POS, komisi Mitra 20%, penerimaan stok, closing, riwayat transaksi, dan fitur lain tetap dipertahankan.
- Firestore Rules dan konfigurasi proyek tidak diubah.
- Data cashflow historis tidak dihapus; yang dihilangkan adalah input manual dan penggunaannya pada ringkasan Keuangan.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.21.
- `service-worker.js`: cache shell v2.2.21.
- `firestore.rules`, `firestore.indexes.json`, ikon, manifest, dan file pendukung dipertahankan dari paket v2.2.20.

## Pemasangan
1. Cadangkan berkas hosting dan Firestore Rules aktif terlebih dahulu.
2. Ganti `index.html` dan `service-worker.js` di hosting dengan versi paket ini.
3. `firestore.rules` tidak diubah, sehingga tidak perlu dipublikasikan ulang untuk pembaruan ini.
4. Pertahankan folder `icons/` yang sudah ada di hosting; paket ini tidak mengganti ikon.
5. Hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.21.

## Catatan pengujian
JavaScript dan logika lokal diperiksa secara statis. Firebase Rules dan operasi Firestore nyata belum dapat diuji pada Firebase Emulator maupun project produksi dari lingkungan ini. Lakukan uji transaksi, pengajuan beberapa menu, update stok realtime, dan closing pada staging/produksi setelah memasang pembaruan.
