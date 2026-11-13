# KALAP Management System v2.0.1

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

## Perubahan v2.0.1 — barcode lebih ringkas dan pengaturan cetak ECO80BT
- Label cetak hanya berisi tiga elemen: nama menu, simbol barcode Code 128, dan harga. Angka/kode barcode tidak dicetak sebagai teks di bawah simbol.
- Menu baru memperoleh barcode numerik unik 12 digit. Karena seluruh payload berupa angka genap, simbol dibuat dengan Code 128C yang mengodekan angka berpasangan sehingga lebih ringkas dibanding kode alfanumerik lama.
- Barcode menu lama yang tersimpan dengan awalan `KLP-` mendapat alias numerik 12 digit yang stabil berdasarkan ID dokumen. Nilai barcode lama tetap diterima sebagai alias pencarian agar label lama tidak langsung kehilangan fungsi scan.
- Lebar modul/bar diatur sekitar 2 titik printer pada orientasi landscape dan sedikit di bawah 2 titik pada portrait, dengan quiet zone di kiri dan kanan. Tinggi area barcode diperbesar tanpa memaksa SVG melebar horizontal.
- Pengaturan orientasi tersedia pada halaman Cetak Label dan popup cetak: `Landscape` memakai ukuran fisik 40 × 30 mm, sedangkan `Portrait` memakai 30 × 40 mm. Preview dan ukuran halaman mengikuti orientasi yang dipilih.
- Semua salinan dipersiapkan dalam satu dokumen dan memanggil dialog cetak satu kali. Tiap stiker GAP tetap menjadi satu halaman fisik agar sensor printer dapat membaca jeda label.
- Tidak ada perubahan pada Firestore Rules atau struktur data. Kode numerik baru disimpan di field `barcode` yang sudah tersedia.

## Pengaturan hasil cetak ECO80BT
- Untuk stiker fisik 40 × 30 mm, pilih `Landscape`. Untuk stiker fisik 30 × 40 mm, pilih `Portrait`. Orientasi di aplikasi harus sama dengan ukuran fisik stiker yang benar-benar terpasang; jangan memilih 30 × 40 mm saat roll yang terpasang 40 × 30 mm.
- Pada dialog cetak, pilih driver Blueprint ECO80BT dan ukuran kertas khusus yang sama dengan label, skala `100% / Actual Size`, margin `None/0`, serta matikan `Fit to page` / `Shrink to fit`.
- Setiap label GAP akan memerlukan feed singkat saat printer berpindah ke label berikutnya. Itu perilaku sensor media normal. Aplikasi hanya dapat mengirim satu pekerjaan cetak gabungan; aplikasi web tidak dapat menghapus jeda mekanis sensor GAP atau menjamin printer tidak berhenti sesaat.
- Ketebalan/kepekatan panas (print darkness/heat) dan kecepatan motor berada pada driver atau utility printer, bukan CSS/browser. Jika hasil masih terlalu gelap, turunkan level density/darkness sedikit demi sedikit di driver/utility (bila opsinya tersedia), lalu uji satu label. Jangan menebak angka level karena rentang driver bisa berbeda.
- Aplikasi mengirim satu batch `window.print()` untuk seluruh label, bukan satu job per label. Printer tetap akan melakukan feed singkat antar-label karena ECO80BT membaca gap dan tidak mendukung continuous; jeda mekanis ini tidak dapat dihilangkan oleh aplikasi web. Aplikasi tidak menambahkan timer/jeda manual antar-label.
- Halaman bantuan resmi Blueprint mencantumkan Utility Tools Printer BP-ECO80BT dan materi driver: https://www.blueprint-indonesia.com/Bantuan.htm.

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
- Blueprint ECO80BT adalah printer label thermal GAP; spesifikasi pabrikan menyebut resolusi 203 DPI, kecepatan hingga 80 mm/s, lebar cetak 78 mm, command set TSPL/CPCL, dan media tidak mendukung mode continuous. Detail kecepatan dan feed tetap diatur melalui driver/utility printer, bukan dari CSS halaman web.
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
- Orientasi default adalah landscape `40 × 30 mm`; tersedia portrait `30 × 40 mm`. Setelan harus cocok dengan ukuran stiker fisik yang sedang dipasang. Barcode dihasilkan sebagai Code 128C numerik untuk menu KALAP.
- Setiap label adalah satu halaman fisik karena ECO80BT menggunakan media GAP (bukan continuous). Browser/driver dapat mengabaikan ukuran CSS bila ukuran media khusus belum tersedia atau dipaksa ke ukuran kertas lain.

## Catatan operasional
- Penerimaan pengajuan menambahkan stok berdasarkan jumlah final yang disetujui Admin/SPV dan mencatat stock movement pada transaksi Firestore yang sama.
- Tombol manual tidak akan menerima stok jika pengajuan untuk menu yang sama masih berstatus menunggu atau direvisi.
- Penghapusan profil mitra tidak menghapus transaksi, pembayaran, atau riwayat penjualan lama; data historis tetap disimpan sebagai arsip.
- Firebase Web Config tetap berada di frontend seperti versi sebelumnya. Keamanan akses data bergantung pada Firebase Authentication dan Firestore Rules yang dipublikasikan.
