# KALAP Management System v2.2.0

## Isi paket
- `index.html`: seluruh HTML, CSS, dan JavaScript aplikasi dalam satu file.
- `firestore.rules`: Firebase Firestore Security Rules yang wajib dipublikasikan bersama pembaruan ini.
- `firestore.indexes.json`: konfigurasi indeks Firestore (tidak ada indeks tambahan untuk perubahan ini).
- `manifest.webmanifest`, `icons/`: identitas PWA dan ikon aplikasi.
- `service-worker.js`: cache shell versi 2.2.0.

## Perubahan v2.2.0 dan fitur sebelumnya

### Reset harian berdasarkan tanggal
- SPV dan Superadmin dapat memilih tanggal pada bagian Stok Harian lalu menekan **Reset harian**.
- Reset membersihkan transaksi penjualan pada tanggal tersebut, cashflow dan penjualan mitra yang terkait, pergerakan stok hari tersebut, pengajuan stok yang terkait, payout serta ringkasan closing hari tersebut.
- Stok menu disesuaikan dengan membalik dampak stok masuk, koreksi, penjualan, dan pengembalian yang terjadi pada tanggal yang dipilih.
- Reset tidak menghapus transaksi tanggal lain. Sistem menolak reset bila pembalikan akan membuat stok negatif atau bila mendeteksi pengembalian transaksi lintas tanggal yang tidak aman.
- Ada konfirmasi sebelum proses dijalankan. Perubahan reset tidak dapat dibatalkan dari aplikasi.

### Pengelolaan stok harian dan pengajuan
- Bagian bawah halaman Pengajuan dan Stok Harian untuk SPV/Superadmin kini menampilkan stok masuk yang disetujui dan penyesuaian stok, bukan sekadar daftar riwayat.
- Daftar stok harian memiliki pencarian, pemilih tanggal, pagination bernomor, serta aksi **Edit** dan **Hapus** untuk batch stok masuk biasa.
- Edit batch memperbarui saldo stok dan membuat catatan penyesuaian. Penghapusan batch stok masuk yang memenuhi syarat mengurangi saldo lalu menghapus dokumen batch dan pengajuan terkait secara permanen; penghapusan ditolak bila saldo tidak mencukupi.
- Tombol pengajuan **Terima**, **Revisi**, dan **Tolak** kini berupa tombol yang jelas. Terima langsung menyetujui jumlah pada pengajuan tanpa meminta input jumlah penerimaan lagi.
- Status pengajuan yang dibatalkan saat reset ditampilkan sebagai **Dibatalkan**. Pengajuan yang dihapus bersama batch stok tidak lagi ditampilkan.
- Firestore Rules menambahkan izin penolakan untuk SPV/Superadmin, memperbaiki error permission pada tindakan Tolak, dan membatasi perubahan pengajuan/stok sesuai role serta status.

### Sinkronisasi penghapusan mitra dan menu
- Menu yang dihapus dari katalog dihapus dari koleksi aktif `menus` dan salinan lengkapnya disimpan di `menuArchives`.
- Mitra yang dihapus dari pengelolaan dihapus dari koleksi aktif `partners`; profil serta menu operasionalnya disimpan di koleksi arsip.
- Pada saat Superadmin membuka sistem, aplikasi merekonsiliasi mitra yang memiliki tautan akun tetapi profil pengguna terkait sudah tidak ada/tidak lagi cocok. Mitra dan menu operasional yatim akan diarsipkan lalu dihapus dari koleksi aktif.
- Profil akun Mitra di `users` yang menunjuk ke dokumen mitra yang sudah tidak ada juga dibersihkan otomatis dari Firestore. Pembuatan akun baru diurutkan agar pemeriksaan ini tidak menghapus relasi yang sedang dibuat.
- Data historis transaksi tetap dipertahankan. Pembatalan transaksi lama yang merujuk menu yang sudah diarsipkan tetap dapat mengembalikan saldo di arsip, bukan menghidupkan kembali menu di POS.
- Partner manual yang tidak pernah ditautkan ke akun login tidak dihapus otomatis.
- Pembersihan otomatis di sisi aplikasi hanya memeriksa dokumen Firestore (`users` dan `partners`). Penghapusan identitas Firebase Authentication yang tidak memiliki profil Firestore memerlukan Admin SDK/server dan tidak dapat dilakukan langsung oleh browser.

### Cetak label dan POS
- Halaman cetak label mendukung beberapa menu dalam satu pekerjaan cetak. Menu dapat ditambahkan satu per satu, jumlah salinan tiap menu dapat diatur, lalu semua label dicetak sekaligus.
- Maksimum gabungan satu pekerjaan cetak adalah 500 label.
- Tombol X tambahan di pencarian POS dihapus; tombol clear bawaan input pencarian tetap tersedia.


### Perbaikan dan penambahan v2.2.0
- **Reset harian:** pencarian transaksi legacy hanya dijalankan bila terdapat ID transaksi. Ini mencegah query Firestore `in` dengan array kosong saat tanggal yang dipilih tidak memiliki transaksi.
- **Pengajuan stok:** jumlah data per halaman menjadi 7 dan nomor halaman ditampilkan saat data melebihi satu halaman. Tombol Terima, Revisi, dan Tolak tetap sejajar kiri-kanan pada tampilan mobile.
- **Persetujuan massal:** mencentang **Terima semua stok** langsung meminta konfirmasi untuk menyetujui seluruh pengajuan pending/revised yang cocok dengan filter saat ini, lalu memprosesnya satu per satu; kegagalan pada satu pengajuan tidak menghentikan pengajuan lain.
- **Input stok manual:** informasi pengajuan diringkas menjadi **Pengajuan stok: [jumlah]** dan tombol tindakan cukup bertuliskan **Setuju**.
- **Hapus stok diterima:** SPV dan Superadmin dapat menghapus batch stok masuk yang aman dibalik. Saldo stok dikurangi, dokumen pergerakan stok dan pengajuan terkait dihapus dari Firestore sehingga tidak lagi muncul di riwayat maupun akun mitra. Penghapusan ditolak bila saldo tidak cukup, ada pengajuan lain yang masih terkunci, atau batch memiliki riwayat koreksi. Tidak dibuat catatan pembalikan baru.

**Penting:** v2.2.0 memperbarui `firestore.rules`. Publikasikan Rules terbaru sebelum menggunakan fitur hapus permanen stok.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP v2.2.0.
3. Upload seluruh isi folder ke root repository GitHub Pages dan replace file lama. Pertahankan folder `icons/`, file tersembunyi `.nojekyll`, dan `.gitignore`.
4. Pastikan GitHub Pages mengarah ke branch dan folder publikasi yang benar.
5. Lakukan hard refresh (`Ctrl + Shift + R`). Untuk PWA yang terpasang, tutup lalu buka kembali aplikasi agar service worker v2.2.0 mengambil file terbaru.

## WAJIB — Publikasikan Firestore Rules
Versi ini mengubah aturan keamanan Firestore. **Jangan hanya mengganti `index.html`** karena fitur Tolak, edit/hapus stok, arsip menu/mitra, dan reset harian akan ditolak oleh database bila Rules lama masih aktif.

Cara publikasi:
1. Buka Firebase Console dan pilih project KALAP.
2. Masuk ke **Firestore Database → Rules**.
3. Ganti isi Rules dengan seluruh isi file `firestore.rules` dari paket ini.
4. Periksa lalu klik **Publish**.
5. Setelah Rules berhasil dipublikasikan, upload file aplikasi dan aset PWA dari paket ini ke GitHub Pages.

Tidak ada indeks komposit tambahan yang diperlukan untuk perubahan ini. Bila project menggunakan Firebase CLI, Rules juga dapat dipublikasikan dari direktori proyek dengan `firebase deploy --only firestore:rules` setelah memastikan Firebase CLI menunjuk ke project KALAP yang benar.

## Catatan penting
- Reset tanggal historis hanya bisa dilakukan jika pembalikan stok aman. Bila stok dari tanggal tersebut sudah terpakai pada tanggal berikutnya sehingga tidak cukup untuk membalikkan stok masuk, sistem akan membatalkan reset dan menampilkan alasannya; jangan menghapus dokumen secara manual.
- Penghapusan batch stok ditolak bila stok sudah terpakai sehingga saldo tidak cukup untuk menguranginya. Periksa saldo fisik dan kondisi stok sebelum mencoba menghapus batch tersebut.
- Arsip `menuArchives` dan `partnerArchives` menyimpan snapshot untuk menjaga referensi transaksi lama; keduanya bukan daftar menu/mitra aktif.
- Penghapusan profil `users` dari browser memutus akses aplikasi karena pemeriksaan profil gagal dan sesi akan dikeluarkan. Identitas akun di Firebase Authentication tetap perlu dihapus melalui Admin SDK jika memang ingin dihapus permanen dari daftar Authentication.
- Reset harian menghapus transaksi operasional tanggal yang dipilih. Pastikan tanggal yang benar dipilih sebelum menyetujui konfirmasi.
