# KALAP Management System v2.0.9

## Isi paket
- `index.html`: seluruh HTML, CSS, dan JavaScript aplikasi dalam satu file.
- `firestore.rules`: salinan rules versi sebelumnya; **tidak ada perubahan rules pada v2.0.9**.
- `firestore.indexes.json`: konfigurasi indeks Firestore; tidak berubah.
- `manifest.webmanifest`, `icons/`: identitas PWA dan ikon aplikasi.
- `service-worker.js`: cache shell versi 2.0.9 agar browser mengambil source terbaru.

## Perubahan v2.0.9
- **Pencarian akun pengguna.** Kolom pencarian di halaman Akun Pengguna dapat mencari nama tampilan, nama, email, role (Admin/SPV/Kasir/Mitra), dan status (aktif/nonaktif).
- **Pagination akun pengguna.** Daftar akun menampilkan maksimal 7 baris per halaman, lengkap dengan tombol nomor halaman, sebelumnya, dan berikutnya. Pencarian mengembalikan tampilan ke halaman pertama.
- **Hapus mitra dari halaman Manajemen Mitra.** Tombol Hapus mitra mengarsipkan profil mitra dengan menonaktifkannya, menonaktifkan seluruh menu mitra di POS, membatalkan pengajuan stok yang masih menunggu, menghapus lock pengajuan aktif, dan menonaktifkan akun login Mitra yang terhubung.
- **Arsip tetap aman.** Penghapusan mitra tidak menghapus transaksi penjualan, laporan, riwayat pergerakan stok, maupun dokumen historis yang terhubung. Profil hanya dikeluarkan dari daftar mitra aktif.
- **Pagination Cetak Label.** Hasil pencarian menu berdasarkan nama menu, nama mitra, QR/barcode tidak lagi dipotong pada 12 hasil pertama. Daftar ditampilkan 12 menu per halaman dengan nomor halaman, tombol sebelumnya/berikutnya, dan ringkasan jumlah hasil. Pencarian baru selalu kembali ke halaman pertama.
- Cache PWA diperbarui ke v2.0.9.

## Fitur versi sebelumnya yang tetap dipertahankan
- Halaman Pengajuan dan Stok Harian digabung, dengan formulir pengajuan di atas dan riwayat stok harian di bawah.
- Riwayat stok dapat ditelusuri berdasarkan tanggal dan dicari berdasarkan menu/mitra/sumber.
- Superadmin dapat menyembunyikan catatan stok masuk dari riwayat tanpa mengubah saldo aktual; batch yang memiliki riwayat koreksi dilindungi agar jejak audit tidak terputus.
- Pengajuan tambahan untuk menu dan mitra yang sama digabung selama pengajuan masih menunggu keputusan.
- Koreksi stok yang sudah diterima menggunakan alur pengajuan dan persetujuan Admin/SPV.
- Penghapusan menu tetap menggunakan soft-delete; arsip penjualan dan transaksi tetap dipertahankan.
- Fitur POS, penjualan, pembatalan transaksi/pengembalian stok, input stok manual, closing harian, keuangan, transfer mitra, cetak label, pencarian menu, login Ingat Saya, dan PWA tetap dipertahankan.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP v2.0.9.
3. Upload seluruh isi folder ke root repository GitHub Pages dan replace file lama. Pertahankan folder `icons/`, file tersembunyi `.nojekyll`, dan `.gitignore`.
4. Pastikan GitHub Pages mengarah ke branch dan folder publikasi yang benar.
5. Buka aplikasi dan lakukan hard refresh (`Ctrl + Shift + R`). Untuk PWA yang terpasang, tutup lalu buka kembali agar service worker v2.0.9 aktif.

## Firestore — tidak perlu publish Rules ulang
Pada versi v2.0.9 tidak ada perubahan Firestore Rules maupun indeks. Fitur baru hanya menggunakan operasi update yang memang sudah diizinkan oleh Rules v2.0.7: Superadmin memperbarui status mitra, status akun Mitra, status menu, dan status pengajuan yang terkait.

File `firestore.rules` dan `firestore.indexes.json` tetap disertakan untuk kelengkapan paket, tetapi tidak perlu di-upload atau di-publish ulang untuk perubahan v2.0.9 ini.

## Catatan penghapusan mitra
Tombol Hapus mitra pada halaman Manajemen Mitra adalah pengarsipan/nonaktif, bukan penghapusan permanen dokumen. Sistem menjaga referensi mitra pada arsip penjualan, transaksi, dan pergerakan stok. Semua menu terkait dinonaktifkan, pengajuan yang belum diproses dibatalkan, lock pengajuan dibersihkan, dan akun login yang terhubung dinonaktifkan. Apabila proses terhenti karena koneksi, mitra tetap terlihat pada daftar aktif sampai proses update profil mitranya selesai; Admin dapat mencoba lagi.
