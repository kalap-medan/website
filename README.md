# KALAP Management System v1.9.0

## Isi paket
- `index.html`: seluruh HTML, CSS, JavaScript, dan Firebase Web Config dalam satu file.
- `firestore.rules`: aturan akses Firestore, termasuk penguncian satu pengajuan stok aktif per menu.
- `firestore.indexes.json`: indeks yang digunakan aplikasi. Perubahan v1.8.0 tidak menambah composite index.
- `manifest.webmanifest` + `icons/`: identitas PWA KALAP.
- `service-worker.js`: cache shell PWA dengan versi baru agar aplikasi memperbarui file.

## Perubahan v1.9.0
- Cetak label memakai barcode Code 128 (1D), bukan QR. Kode barcode yang dicetak untuk menu lama dipersingkat secara deterministik menjadi 9 karakter ID setelah awalan `KLP-` agar modul barcode lebih lebar pada label 40 × 30 mm; barcode lama tetap diterima sebagai kode pencarian saat pemindaian.
- Satu barcode SVG dibuat sekali lalu digunakan ulang pada seluruh salinan, dan semua label dikirim dalam satu pekerjaan cetak browser. Halaman setiap label dipisahkan mengikuti media label GAP 40 × 30 mm.
- Profil cetak diarahkan untuk Blueprint ECO80BT: label GAP 40 × 30 mm, skala 100%, margin 0, dan tanpa fit-to-page. Model ini memakai TSPL/CPCL, sehingga aplikasi menggunakan driver printer untuk merender halaman; tidak mengirim perintah ESC/POS mentah.

## Perubahan sebelumnya (v1.8.0)
- Halaman Menu & Persediaan menyediakan aksi Hapus bagi Superadmin. Penghapusan bersifat arsip (soft delete): menu disembunyikan dari POS, katalog aktif, dan label, sedangkan stok serta jejak transaksi tetap dipertahankan. Menu dengan pengajuan stok aktif harus diselesaikan lebih dahulu.
- Cetak Label menggunakan satu kolom pencarian terpadu untuk nama menu, nama mitra, atau scan barcode. Pilih hasil yang cocok, lalu atur jumlah cetak.
- Pilihan pembayaran memakai ikon SVG yang konsisten; Operasional KALAP tampil tanpa deskripsi tambahan.
- Riwayat transaksi menyediakan pembatalan. Pembatalan mengembalikan stok per menu, menandai catatan arus kas dan penjualan mitra sebagai batal, serta mencegah pembatalan kedua kali. Transaksi pada tanggal yang sudah closing tidak dapat dibatalkan.
- Transaksi lama yang belum memiliki tautan catatan otomatis dapat dibatalkan oleh Admin/SPV; sistem mencari catatan keuangan dan penjualan mitra berdasarkan ID transaksi.
- Nominal harga menu, input keuangan, dan uang tunai diformat ribuan Rupiah saat diketik. Label Ingat Saya pada login dihapus; persistensi login lokal browser yang telah digunakan sebelumnya tetap dipertahankan.
- Popup pembayaran tunai dirapikan dengan jarak terpisah untuk total, uang diterima, dan kembalian.
- Grid menu POS menampilkan empat produk per baris pada desktop/tablet, dilanjutkan ke baris berikutnya, dengan nomor halaman untuk navigasi. Pada layar ponsel sempit, grid menjadi dua kolom agar tetap terbaca.
- Menu Baru hanya meminta nama mitra, nama menu, dan harga. Tombol `Simpan` mendaftarkan menu sebagai katalog dengan stok awal 0; barcode unik dibuat otomatis.
- Menu & Persediaan menampilkan total seluruh menu, menu aktif, dan total stok tersedia saat ini. Form pencatatan stok langsung di halaman tersebut dihapus.
- Permintaan Stok diganti menjadi Pengajuan Stok. Admin/SPV dapat menerima, merevisi jumlah, atau menolak pengajuan mitra.
- Admin/SPV dapat memakai tombol `Input` untuk mencari nama menu atau memindai barcode, memilih jumlah stok yang masuk, serta menyimpan penerimaan manual.
- Penerimaan manual diblokir bila menu masih memiliki pengajuan aktif, termasuk pengajuan lama yang belum memiliki lock, untuk mengurangi risiko stok ganda.
- Daftar pengajuan dapat dicari berdasarkan nama menu, mitra, catatan, status, atau barcode dan difilter berdasarkan mitra.
- Profil mitra yang ditinggalkan oleh proses hapus akun versi lama direkonsiliasi menjadi nonaktif; menu terkait juga dinonaktifkan dan pengajuan yang belum diproses dibatalkan. Mitra manual yang tidak pernah ditautkan ke akun tidak ikut dihapus.
- Label menggunakan barcode dan layout cetak 4 × 3 cm.

## Informasi printer
- Blueprint ECO80BT adalah printer label thermal GAP; spesifikasi yang dipublikasikan menyebut resolusi 203 DPI, kecepatan hingga 80 mm/s, lebar cetak 78 mm, dan command set TSPL/CPCL. Detail kecepatan dan feed tetap diatur melalui driver/utility printer, bukan dari CSS halaman web.
- Untuk Windows, gunakan koneksi USB dan driver ECO80BT. Untuk Android, produsen mencantumkan koneksi Bluetooth; browser/web print dapat berbeda dukungannya antar perangkat.
- Utility printer ECO80BT disediakan pada halaman bantuan Blueprint: https://www.blueprint-indonesia.com/Bantuan.htm

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP ini, lalu upload seluruh isi folder ke root repository GitHub Pages. Replace file lama sesuai nama dan pertahankan folder `icons/`.
3. Pastikan GitHub Pages mengarah ke branch `main` dan root folder.
4. Buka situs KALAP lalu lakukan hard refresh (`Ctrl+Shift+R`). Pada aplikasi PWA yang sudah terpasang, tutup dan buka kembali aplikasi agar service worker versi baru aktif.

## Firestore Rules dan indeks
- Tidak ada perubahan Firestore Rules atau indeks pada v1.9.0 karena pembaruan ini hanya mengubah pembuatan barcode dan jalur cetak label. Jika sistem sudah menggunakan Rules v1.8.0, tidak perlu publish Rules ulang.
- Bila instalasi masih memakai Rules sebelum v1.8.0, terapkan Rules dari paket v1.8.0 terlebih dahulu untuk mendapatkan perlindungan pengajuan stok dan pembatalan transaksi.

## Pengaturan cetak barcode ECO80BT
- Aplikasi mengirim ukuran halaman cetak `40 mm × 30 mm` (4 × 3 cm) untuk laptop maupun tablet. Setiap label adalah satu halaman fisik karena ECO80BT menggunakan media GAP (bukan continuous).
- Pada driver Blueprint ECO80BT, pilih media label/GAP dengan ukuran `40 × 30 mm`, orientasi portrait, skala `100%` atau `Actual size`, dan margin `None/0`. Matikan `Fit to page`/`Shrink to fit`. Setelah mengganti ukuran atau jenis label, jalankan kalibrasi gap/media dari driver atau utility Blueprint agar sensor membaca jarak antar-label. Jika ukuran 40 × 30 mm tidak tersedia, buat ukuran media khusus di driver terlebih dahulu. Browser atau driver printer dapat mengabaikan ukuran dari CSS bila ukuran label tidak tersedia atau dipaksa ke ukuran kertas lain.

## Catatan operasional
- Penerimaan pengajuan menambahkan stok berdasarkan jumlah final yang disetujui Admin/SPV dan mencatat stock movement pada transaksi Firestore yang sama.
- Tombol manual tidak akan menerima stok jika pengajuan untuk menu yang sama masih berstatus menunggu atau direvisi.
- Penghapusan profil mitra tidak menghapus transaksi, pembayaran, atau riwayat penjualan lama; data historis tetap disimpan sebagai arsip.
- Firebase Web Config tetap berada di frontend seperti versi sebelumnya. Keamanan akses data bergantung pada Firebase Authentication dan Firestore Rules yang dipublikasikan.
