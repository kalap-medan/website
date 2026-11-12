# KALAP Management System v1.6.1

## Isi paket
- `index.html`: seluruh HTML, CSS, JavaScript, dan Firebase Web Config dalam satu file.
- `firestore.rules`: aturan akses terbaru.
- `firestore.indexes.json`: tidak memerlukan composite index tambahan pada query utama versi ini.
- `manifest.webmanifest` + `icons/`: identitas PWA KALAP (K. putih, latar merah).
- `service-worker.js`: dukungan instalasi dan cache shell dasar.

## Update GitHub Pages
1. Upload seluruh isi ZIP ke root repository GitHub Pages.
2. Replace `index.html` dan tambahkan file/folder pendukung lainnya.
3. Pastikan GitHub Pages mengarah ke branch `main` dan root folder.
4. Buka `https://<username>.github.io/<repository>/` lalu tekan Ctrl+Shift+R.

## Firebase
1. Gunakan project Firebase KALAP yang sudah ada.
2. Di Firestore Database > Rules, replace seluruh aturan dengan `firestore.rules`, lalu Publish.
3. Tidak perlu mengaktifkan Firebase Hosting, Cloud Functions, Node.js, atau Blaze untuk paket ini.
4. Pastikan domain `<username>.github.io` ada di Authentication > Settings > Authorized domains.

## Fitur v1.6.1
- POS: pembayaran Tunai/QRIS/Transfer/Operasional KALAP; tunai meminta nominal diterima dan menghitung kembalian. Tidak ada halaman operasional terpisah.
- Dashboard Superadmin/SPV: rentang tanggal dari/sampai, grafik multi-hari, klik grafik untuk detail harian.
- Closing: total penjualan, unit terjual, sisa stok, jumlah transaksi, rincian metode bayar dan daftar menu yang ditanggung KALAP.
- Transferan mitra: perhitungan bagian KALAP 20% dan transfer bersih 80%, dengan rekening mitra. Status transfer ditandai manual setelah transfer bank benar-benar dilakukan.
- Drawer navigasi hamburger di desktop dan mobile.
- Form mitra saat input produk manual mendukung ketik-cari (datalist), bukan dropdown panjang.
- PWA: nama aplikasi KALAP dan ikon K. putih dengan titik pada latar merah.

## Catatan penting
- Pengiriman transfer bank tetap dilakukan melalui aplikasi bank. Tombol `Tandai transfer` hanya menyimpan status pembayaran di sistem.
- Riwayat stok historis pada dialog grafik diambil dari catatan `stockMovements`; batas query histori 12.000 catatan terakhir. Jika bisnis melampaui batas tersebut, perlu strategi arsip/pagination historis.
- Firebase Rules melindungi akses data; jangan menonaktifkan rules atau menggunakan `allow read, write: if true`.
- PWA memerlukan HTTPS (GitHub Pages sudah HTTPS) dan file manifest, icon, serta service worker disimpan pada root repository.


## Catatan QA v1.6.1
- Memperbaiki deklarasi variabel ganda pada halaman Closing yang membuat script module gagal diparse.
- Menghapus handler dan halaman operasional lama yang tidak lagi dipakai; Operasional KALAP tetap menjadi metode pembayaran POS.
- Memperbaiki event pemilih mitra pada formulir Menu Baru agar datalist input tidak diperlakukan sebagai elemen select.
- Tombol Edit rekening tersedia dari kartu mitra.
- Aturan payout memvalidasi jumlah transfer + potongan = penjualan kotor. Potongan 20% dibulatkan ke Rupiah terdekat di aplikasi.
