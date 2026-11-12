# KALAP Management System v1.4

Website satu file (`index.html`, HTML + CSS + JavaScript + Firebase Web SDK) untuk GitHub Pages dengan Firebase Authentication dan Cloud Firestore. Palet brand tetap: `#E00000`, `#FFA97B`, `#FFECCB`, `#9FED72`.

## Pembaruan v1.4
- POS menyediakan pembayaran Tunai, QRIS, Transfer, dan **Beban operasional KALAP**.
- Semua transaksi POS, termasuk transaksi yang ditanggung KALAP, tetap disimpan pada `transactions`, mengurangi stok, masuk total omzet penjualan/grafik penjualan, riwayat transaksi, serta penjualan mitra.
- Pembedanya hanya pencatatan arus kas: pembayaran pelanggan menjadi `income` (`source: sale`), sedangkan transaksi yang ditanggung KALAP menjadi `expense` (`source: operational_sale`, kategori `Beban operasional - penjualan`). Dengan demikian omzet penjualan bruto tetap utuh, sementara nilai yang dibayar KALAP dibukukan sebagai beban.
- Halaman Operasional harian menampilkan catatan operasional biasa dan transaksi POS yang ditanggung KALAP. Kartu ringkasan memisahkan omzet penjualan yang dibayar KALAP dari pengeluaran operasional lain. Akses halaman ini hanya untuk Superadmin dan SPV.
- Sidebar mobile dibuat sebagai area gulir vertikal dengan tinggi viewport yang dibatasi, termasuk dukungan safe-area perangkat.
- Tombol **Hapus akun** pada Akun Pengguna terhubung ke fungsi penghapusan profil Firestore. Klik menampilkan konfirmasi, status proses, dan toast hasil/error. Penghapusan ini menghapus profil akses KALAP, bukan identitas Firebase Authentication secara permanen karena aplikasi tidak memakai backend Admin SDK.
- Cetak label menggunakan satu form: pilih **Nama menu**, **Mitra**, dan **Jumlah**, kemudian klik **Cetak**. Menu otomatis disaring mengikuti mitra. Sistem menyiapkan barcode Code 128 sebanyak jumlah yang diminta.
- Ukuran cetak dideklarasikan sebagai 40 × 30 mm (4 × 3 cm).

## Cara update
1. Ganti `index.html` pada root repository GitHub Pages dengan `index.html` dari paket ini.
2. Buka Firebase Console → Firestore Database → Rules.
3. Salin seluruh isi `firestore.rules` dari paket ini, lalu klik **Publish**. Ini wajib agar transaksi POS yang ditanggung KALAP dapat mencatat transaksi dan beban secara atomik, serta supaya aturan hapus profil akun sesuai dengan versi ini.
4. `firestore.indexes.json` disertakan sebagai referensi indeks. Query cashflows SPV memakai `source in [operational, operational_sale]` dan indeks gabungan `source` ASC + `createdAt` DESC. Jika Firestore menampilkan error indeks, ikuti tautan yang disediakan.
5. Commit perubahan dan muat ulang website dengan Ctrl + Shift + R.

## Cara transaksi yang ditanggung KALAP
1. Tambahkan menu ke keranjang POS seperti biasa.
2. Klik lanjut pembayaran.
3. Pilih **Beban operasional KALAP**.
4. Transaksi tetap masuk omzet penjualan, grafik, riwayat transaksi, stok berkurang, dan penjualan mitra tercatat. Nilai yang sama dibukukan sebagai beban/pengeluaran KALAP, bukan pemasukan dari pelanggan.

## Cara mencetak label thermal 4 × 3 cm
1. Buka Operasional → Cetak label.
2. Pilih nama menu, mitra, dan jumlah label.
3. Klik **Cetak**.
4. Pada dialog print, pilih printer thermal dan ukuran media **40 × 30 mm**, margin None/0, scale 100% atau Actual size, serta nonaktifkan header/footer browser.

> Catatan: halaman meminta ukuran `@page size: 40mm 30mm`; driver printer thermal/browser tetap harus disetel ke media 40 × 30 mm agar hasil fisik tepat. CSS tidak dapat mengganti pengaturan media di driver printer.

## Catatan keamanan
- Password tidak pernah disimpan sebagai teks biasa.
- Penghapusan akun dari menu Superadmin menghapus dokumen profil `users/{uid}` di Firestore. Untuk menghapus identitas permanen dari Firebase Authentication diperlukan backend tepercaya/Admin SDK; fitur ini tidak dijalankan dari browser.
- Firestore Rules adalah kontrol keamanan server dan harus dipublikasikan pada project Firebase yang sama dengan konfigurasi di `index.html`.
