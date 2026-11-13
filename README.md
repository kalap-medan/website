# KALAP Management System v1.8.0

## Isi paket
- `index.html`: seluruh HTML, CSS, JavaScript, dan Firebase Web Config dalam satu file.
- `firestore.rules`: aturan akses Firestore, termasuk penguncian satu pengajuan stok aktif per menu.
- `firestore.indexes.json`: indeks yang digunakan aplikasi. Perubahan v1.8.0 tidak menambah composite index.
- `manifest.webmanifest` + `icons/`: identitas PWA KALAP.
- `service-worker.js`: cache shell PWA dengan versi baru agar aplikasi memperbarui file.

## Perubahan v1.8.0
- Halaman Menu & Persediaan menyediakan aksi Hapus bagi Superadmin. Penghapusan bersifat arsip (soft delete): menu disembunyikan dari POS, katalog aktif, dan label, sedangkan stok serta jejak transaksi tetap dipertahankan. Menu dengan pengajuan stok aktif harus diselesaikan lebih dahulu.
- Cetak Label menggunakan satu kolom pencarian terpadu untuk nama menu, nama mitra, atau scan QR. Pilih hasil yang cocok, lalu atur jumlah cetak.
- Pilihan pembayaran memakai ikon SVG yang konsisten; Operasional KALAP tampil tanpa deskripsi tambahan.
- Riwayat transaksi menyediakan pembatalan. Pembatalan mengembalikan stok per menu, menandai catatan arus kas dan penjualan mitra sebagai batal, serta mencegah pembatalan kedua kali. Transaksi pada tanggal yang sudah closing tidak dapat dibatalkan.
- Transaksi lama yang belum memiliki tautan catatan otomatis dapat dibatalkan oleh Admin/SPV; sistem mencari catatan keuangan dan penjualan mitra berdasarkan ID transaksi.
- Nominal harga menu, input keuangan, dan uang tunai diformat ribuan Rupiah saat diketik. Label Ingat Saya pada login dihapus; persistensi login lokal browser yang telah digunakan sebelumnya tetap dipertahankan.
- Popup pembayaran tunai dirapikan dengan jarak terpisah untuk total, uang diterima, dan kembalian.
- Grid menu POS menampilkan empat produk per baris pada desktop/tablet, dilanjutkan ke baris berikutnya, dengan nomor halaman untuk navigasi. Pada layar ponsel sempit, grid menjadi dua kolom agar tetap terbaca.
- Menu Baru hanya meminta nama mitra, nama menu, dan harga. Tombol `Simpan` mendaftarkan menu sebagai katalog dengan stok awal 0; kode QR unik dibuat otomatis.
- Menu & Persediaan menampilkan total seluruh menu, menu aktif, dan total stok tersedia saat ini. Form pencatatan stok langsung di halaman tersebut dihapus.
- Permintaan Stok diganti menjadi Pengajuan Stok. Admin/SPV dapat menerima, merevisi jumlah, atau menolak pengajuan mitra.
- Admin/SPV dapat memakai tombol `Input` untuk mencari nama menu atau memindai QR, memilih jumlah stok yang masuk, serta menyimpan penerimaan manual.
- Penerimaan manual diblokir bila menu masih memiliki pengajuan aktif, termasuk pengajuan lama yang belum memiliki lock, untuk mengurangi risiko stok ganda.
- Daftar pengajuan dapat dicari berdasarkan nama menu, mitra, catatan, status, atau kode QR dan difilter berdasarkan mitra.
- Profil mitra yang ditinggalkan oleh proses hapus akun versi lama direkonsiliasi menjadi nonaktif; menu terkait juga dinonaktifkan dan pengajuan yang belum diproses dibatalkan. Mitra manual yang tidak pernah ditautkan ke akun tidak ikut dihapus.
- Label menggunakan kode QR dan layout cetak 4 × 3 cm.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP ini, lalu upload seluruh isi folder ke root repository GitHub Pages. Replace file lama sesuai nama dan pertahankan folder `icons/`.
3. Pastikan GitHub Pages mengarah ke branch `main` dan root folder.
4. Buka situs KALAP lalu lakukan hard refresh (`Ctrl+Shift+R`). Pada aplikasi PWA yang sudah terpasang, tutup dan buka kembali aplikasi agar service worker versi baru aktif.

## Wajib: perbarui Firestore Rules
1. Buka Firebase Console → Firestore Database → Rules.
2. Replace seluruh isi Rules dengan file `firestore.rules` dari paket ini, lalu klik **Publish**.
3. Rules baru mengatur hubungan atomik antara pengajuan stok dan dokumen lock `stockRequestLocks`, serta pembatalan transaksi dan pengembalian stok. Jangan hanya mengunggah `index.html`; perubahan ini memerlukan rules baru.
4. Tidak perlu menambah composite index berdasarkan query yang digunakan versi ini.

## Pengaturan cetak QR
- Aplikasi mengirim ukuran halaman cetak `40 mm × 30 mm` (4 × 3 cm) untuk laptop maupun tablet.
- Pada dialog/driver printer, pilih ukuran media/label `40 × 30 mm`, skala `100%` atau `Actual size`, dan margin `None/0`. Browser atau driver printer dapat mengabaikan ukuran dari CSS bila ukuran label tidak tersedia atau dipaksa ke ukuran kertas lain.

## Catatan operasional
- Penerimaan pengajuan menambahkan stok berdasarkan jumlah final yang disetujui Admin/SPV dan mencatat stock movement pada transaksi Firestore yang sama.
- Tombol manual tidak akan menerima stok jika pengajuan untuk menu yang sama masih berstatus menunggu atau direvisi.
- Penghapusan profil mitra tidak menghapus transaksi, pembayaran, atau riwayat penjualan lama; data historis tetap disimpan sebagai arsip.
- Firebase Web Config tetap berada di frontend seperti versi sebelumnya. Keamanan akses data bergantung pada Firebase Authentication dan Firestore Rules yang dipublikasikan.
