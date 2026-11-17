# KALAP Management System v2.2.5

## Isi paket
- `index.html`: seluruh HTML, CSS, dan JavaScript aplikasi dalam satu file.
- `firestore.rules`: Firebase Firestore Security Rules (tidak berubah pada v2.2.5; tetap gunakan Rules v2.2.3 atau versi yang lebih baru dari repository).
- `firestore.indexes.json`: konfigurasi indeks Firestore (tidak ada indeks tambahan untuk perubahan ini).
- `manifest.webmanifest`, `icons/`: identitas PWA dan ikon aplikasi.
- `service-worker.js`: cache shell versi 2.2.5.

## Perubahan v2.2.5 — dashboard harian, laporan Keuangan, operasional, dan label
- **Dashboard Superadmin:** ringkasan penjualan hanya memakai tanggal berjalan zona waktu Asia/Jakarta. Ketika tanggal berganti, ringkasan kembali dimulai dari hari baru dan menerima data terbaru secara real-time.
- **Stok di dashboard:** ditampilkan stok masuk hari ini, stok terjual hari ini, dan sisa stok terkini seluruh menu aktif.
- **Grafik Superadmin:** grafik menampilkan penjualan per jam untuk hari berjalan. Klik titik grafik membuka tanggal yang sama di halaman Keuangan, bukan lagi query stok historis dari dashboard.
- **Keuangan:** pemilih tanggal dipusatkan di halaman ini untuk memeriksa omzet, jumlah transaksi, unit terjual, pemasukan, pengeluaran, saldo arus kas, bagian KALAP dari menu mitra, transaksi, pengeluaran, serta pergerakan stok dan omzet per menu pada tanggal yang dipilih.
- **Laba bersih:** tidak ditampilkan sebagai angka karena data harga modal/HPP per menu belum tersedia pada model data aplikasi. Saldo arus kas dibedakan secara jelas dari laba bersih.
- **Pengajuan dan Stok Harian:** pencarian khusus nama mitra yang duplikat dihapus. Satu kolom pencarian gabungan tetap bisa mencari nama menu, mitra, status, catatan, dan kode QR/barcode.
- **Pembayaran Operasional KALAP:** kasir wajib menulis catatan penggunaan, misalnya “sedekah”. Catatan disimpan pada transaksi dan catatan pengeluaran, serta terlihat di struk.
- **Cetak label:** ukuran huruf nama menu diperbesar. Ukuran QR dan harga tidak diubah.
- **Firestore:** tidak ada perubahan pada `firestore.rules` maupun `firestore.indexes.json` pada versi ini. Persyaratan publikasi Rules dari versi sebelumnya tetap berlaku.
- **Cache PWA:** versi cache dinaikkan menjadi `kalap-shell-v2.2.5`.

## Perubahan v2.2.0 dan fitur sebelumnya

### Reset harian berdasarkan tanggal
- SPV dan Superadmin dapat memilih tanggal pada bagian Stok Harian lalu menekan **Reset harian**.
- Reset membersihkan transaksi penjualan pada tanggal tersebut, cashflow dan penjualan mitra yang terkait, pergerakan stok hari tersebut, pengajuan yang masih menunggu pada tanggal tersebut, payout serta ringkasan closing hari tersebut. Pengajuan yang sudah Direvisi atau Ditolak tetap dipertahankan dan terlihat oleh Mitra.
- Stok menu disesuaikan dengan membalik dampak stok masuk, koreksi, penjualan, dan pengembalian yang terjadi pada tanggal yang dipilih.
- Reset tidak menghapus transaksi tanggal lain. Sistem menolak reset bila pembalikan akan membuat stok negatif atau bila mendeteksi pengembalian transaksi lintas tanggal yang tidak aman.
- Ada konfirmasi sebelum proses dijalankan. Perubahan reset tidak dapat dibatalkan dari aplikasi.

### Pengelolaan stok harian dan pengajuan
- Bagian bawah halaman Pengajuan dan Stok Harian untuk SPV/Superadmin kini menampilkan stok masuk yang disetujui dan penyesuaian stok, bukan sekadar daftar riwayat.
- Daftar stok harian memiliki pencarian, pemilih tanggal, pagination bernomor, serta aksi **Edit** dan **Hapus** untuk batch stok masuk biasa.
- Edit batch memperbarui saldo stok dan membuat catatan penyesuaian. Penghapusan batch stok masuk yang memenuhi syarat mengurangi saldo lalu menghapus dokumen batch dan pengajuan terkait secara permanen; penghapusan ditolak bila saldo tidak mencukupi.
- Tombol pengajuan **Terima**, **Revisi**, dan **Tolak** kini berupa tombol yang jelas. Terima langsung menyetujui jumlah pada pengajuan tanpa meminta input jumlah penerimaan lagi.
- Pengajuan yang masih menunggu keputusan pada tanggal yang di-reset dihapus permanen dari Firestore tanpa diubah menjadi status **Dibatalkan** dan tanpa pemberitahuan kepada Mitra. Pengajuan yang sudah **Direvisi** atau **Ditolak** tetap tercatat dan terlihat oleh Mitra. Pengajuan stok diterima yang terkait dengan pergerakan stok tanggal itu ikut dihapus bersama pergerakannya.
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


### Perubahan v2.2.1 — reset pengajuan dan formulir mitra
- **Reset pengajuan mitra:** reset harian menghapus permanen pengajuan yang masih berstatus menunggu pada tanggal yang dipilih. Pengajuan tidak diubah menjadi Dibatalkan, sehingga hilang dari riwayat Mitra tanpa pemberitahuan. Pengajuan yang sudah Direvisi atau Ditolak tetap dipertahankan dan terlihat.
- **Deskripsi Manajemen Mitra:** teks deskripsi halaman dan kalimat penjelas pada popup Tambah Mitra dihapus.
- **Popup Tambah Mitra:** formulir hanya berisi Nama lengkap, Email login, Kata sandi, Bank, Norek, dan Nama pemilik. Formulir membuat akun login Mitra sekaligus profil/rekening yang terhubung.
- **Cache PWA:** versi cache service worker dinaikkan ke `kalap-shell-v2.2.1` agar aplikasi mengambil berkas pembaruan.

### Perubahan v2.2.2 — perapian akun, label, POS, dan struk
- **Akun Pengguna:** pilihan jenis akun tetap hanya SPV dan Kasir; akun Mitra dibuat melalui Manajemen Mitra.
- **Cetak label:** petunjuk pemilihan menu dan keterangan ukuran berulang dihilangkan. Ukuran label hanya ditampilkan sekali sebagai **30 × 40 mm**.
- **Stiker:** nama menu diperkecil menjadi 4,5 pt dan otomatis diperkecil lagi untuk nama panjang. Ukuran QR dan harga tetap seperti sebelumnya.
- **POS kasir:** deskripsi instruksi scanner di bawah judul halaman dihilangkan; pencarian nama menu dan input QR/barcode tetap berfungsi.
- **Transaksi POS:** tanggal transaksi tetap mengikuti zona waktu Asia/Jakarta dan halaman POS langsung diperbarui pada pergantian tanggal/bulan, lalu disegarkan kembali setelah snapshot bulan baru diterima.
- **Struk:** tampilan memakai latar putih polos, teks hitam dengan ukuran lebih terbaca, satu area gulir vertikal untuk struk panjang, dan tombol kembali tetap tersedia di bawah struk.
- **Cache PWA:** nama cache dinaikkan menjadi `kalap-shell-v2.2.2` agar berkas terbaru dimuat.

### Perbaikan v2.2.3 — daftar pengajuan mengikuti tanggal dan reset menghapus sisa pembatalan lama
- **Filter tanggal pengajuan:** daftar pengajuan di bagian atas dan stok masuk harian memakai satu pemilih tanggal. Secara default tanggal mengikuti hari ini di zona waktu Asia/Jakarta; ketika hari berganti, daftar otomatis berpindah ke tanggal baru dan kosong bila belum ada pengajuan. Memilih tanggal sebelumnya menampilkan pengajuan yang dibuat pada tanggal tersebut.
- **Catatan Dibatalkan lama:** daftar tidak lagi menampilkan pengajuan berstatus `voided` (Dibatalkan) dari versi reset lama. Reset pada tanggal terpilih juga mencari dan menghapus catatan `voided` berdasarkan tanggal pengajuan maupun `voidedAt`, bukan hanya status `pending`.
- **Reset permanen:** Firestore Rules mengizinkan penghapusan hanya untuk ID pengajuan yang telah dicantumkan dalam otorisasi reset aktif. Pengajuan `rejected` (Ditolak) dan `revised` (Direvisi) tetap dipertahankan dan terlihat oleh Mitra.
- **Koreksi stok:** jika reset menghapus pengajuan koreksi yang sudah diterima, tautan koreksi pada batch induk dilepas agar batch induk tidak terkunci oleh referensi yang sudah dihapus.
- **Pengajuan baru Mitra:** setelah mengirim pengajuan saat sedang melihat tanggal historis, tampilan otomatis kembali ke tanggal hari ini agar pengajuan terbaru langsung terlihat.
- **Cache PWA:** service worker memakai cache `kalap-shell-v2.2.3` agar browser dan aplikasi terpasang memuat file terbaru.

### Perubahan v2.2.4 — perapian akun Mitra
- **Form pengajuan stok:** kolom Cari menu, Jumlah tambahan, dan Catatan pada akun Mitra ditampilkan bertumpuk dari atas ke bawah dengan lebar penuh agar placeholder mudah dibaca.
- **Deskripsi:** deskripsi di bawah Ajukan stok, Menu milik Anda, dan Aktivitas terbaru dihapus tanpa mengubah isi atau fungsi bagian tersebut.
- **Bantuan Mitra:** nomor Admin `087877297446` ditampilkan pada panel Butuh bantuan dan dapat diketuk untuk melakukan panggilan.
- **Cache PWA:** nama cache dinaikkan ke `kalap-shell-v2.2.4` agar pembaruan tampilan dimuat oleh browser dan aplikasi terpasang.
- **Firestore:** tidak ada perubahan pada `firestore.rules` maupun `firestore.indexes.json` di versi ini. Persyaratan publikasi Rules dari v2.2.3 tetap berlaku.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP v2.2.5.
3. Upload seluruh isi folder ke root repository GitHub Pages dan replace file lama. Pertahankan folder `icons/`, file tersembunyi `.nojekyll`, dan `.gitignore`.
4. Pastikan GitHub Pages mengarah ke branch dan folder publikasi yang benar.
5. Lakukan hard refresh (`Ctrl + Shift + R`). Untuk PWA yang terpasang, tutup lalu buka kembali aplikasi agar service worker v2.2.5 mengambil file terbaru.

## Firestore Rules
Versi v2.2.3 **mengubah** `firestore.rules`. Publikasikan Rules v2.2.3 sebelum menggunakan fitur Reset Harian. Buka Firebase Console → **Firestore Database → Rules**, ganti seluruh isinya dengan `firestore.rules` dari paket ini, lalu klik **Publish**.

Rules v2.2.3 di dalam paket ini juga mempertahankan izin untuk fitur Tolak, edit/hapus stok, arsip menu/mitra, dan reset harian dari pembaruan sebelumnya. Tidak ada indeks komposit tambahan yang diperlukan.

## Catatan penting
- Reset tanggal historis hanya bisa dilakukan jika pembalikan stok aman. Bila stok dari tanggal tersebut sudah terpakai pada tanggal berikutnya sehingga tidak cukup untuk membalikkan stok masuk, sistem akan membatalkan reset dan menampilkan alasannya; jangan menghapus dokumen secara manual.
- Penghapusan batch stok ditolak bila stok sudah terpakai sehingga saldo tidak cukup untuk menguranginya. Periksa saldo fisik dan kondisi stok sebelum mencoba menghapus batch tersebut.
- Arsip `menuArchives` dan `partnerArchives` menyimpan snapshot untuk menjaga referensi transaksi lama; keduanya bukan daftar menu/mitra aktif.
- Penghapusan profil `users` dari browser memutus akses aplikasi karena pemeriksaan profil gagal dan sesi akan dikeluarkan. Identitas akun di Firebase Authentication tetap perlu dihapus melalui Admin SDK jika memang ingin dihapus permanen dari daftar Authentication.
- Reset harian menghapus transaksi operasional tanggal yang dipilih. Pastikan tanggal yang benar dipilih sebelum menyetujui konfirmasi.
