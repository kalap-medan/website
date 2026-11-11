# KALAP Management System v1.1 — GitHub Pages + Firebase

Versi ini tetap memakai **satu file website `index.html`** (HTML, CSS, JavaScript, dan Firebase Web Config menjadi satu). GitHub Pages menjadi hosting; Firebase hanya untuk Authentication dan Cloud Firestore.

## File

- `index.html` — seluruh website KALAP dalam satu file.
- `firestore.rules` — aturan keamanan Firestore terbaru. WAJIB dipublikasikan setelah mengganti versi lama.
- `firestore.indexes.json` — referensi indeks komposit Firestore.
- `.nojekyll` — dukungan GitHub Pages.
- `.gitignore` — menghindari unggahan file lokal/rahasia.

Konfigurasi Firebase di dalam `index.html` sudah diarahkan ke project `kalap-63628`. Jangan memasukkan password pengguna, service-account JSON, ataupun private key ke GitHub.

## Fitur baru v1.1

1. Tema merah marun/coral dengan aksen pastel (blush, peach, mint, dan lavender).
2. Superadmin dan SPV dapat melihat semua menu, stok, status, barcode, mencari menu, dan mengekspor daftar menu ke CSV.
3. Data mitra hanya meminta nama. Nomor telepon dan catatan kontak tidak lagi diminta atau ditampilkan.
4. Mitra mengajukan produk dengan nama menu, harga jual, kategori opsional, dan jumlah unit yang diajukan.
5. Superadmin/SPV melihat pengajuan secara realtime, menyetujui, menolak, atau mengoreksi nama produk, harga, dan jumlah sebelum persetujuan.
6. Saat disetujui, sistem membuat menu, barcode Code 128, dan pergerakan stok awal dalam satu transaksi Firestore.
7. SPV dapat memasukkan produk secara manual dengan memilih mitra, nama menu, harga, dan stok awal. Produk langsung terlihat di dashboard mitra yang terkait.
8. Dashboard mitra memantau status pengajuan, stok berjalan, jumlah terjual, dan catatan penjualan terbaru melalui `onSnapshot` Firestore.
9. Menu **Cetak label** menghasilkan label thermal ukuran 40 × 30 mm: nama menu di atas, barcode di tengah, harga di bawah.
10. Firestore menggunakan persistent browser cache bila browser mendukungnya untuk mempercepat pembukaan ulang. Listener onSnapshot mengalirkan perubahan menu, stok, pengajuan, dan penjualan secara realtime. Data tetap bergantung pada koneksi internet dan sinkronisasi server.

## PENTING: perbarui Firestore Rules

Karena versi ini menambah koleksi `productSubmissions` serta mengizinkan SPV membuat produk, aturan Firestore lama harus diganti. Tanpa langkah ini, pengajuan/approval produk akan mendapat `permission-denied`.

1. Buka Firebase Console project `kalap-63628`.
2. Masuk ke **Firestore Database → Rules**.
3. Buka file `firestore.rules` dari paket ini.
4. Salin seluruh isinya dan ganti seluruh isi Rules lama.
5. Klik **Publish**.

Jangan memakai aturan uji coba `allow read, write: if true`.

## Deploy website ke GitHub Pages

1. Ekstrak paket ZIP.
2. Di repository GitHub, ganti `index.html` lama dengan `index.html` dari paket ini.
3. Ganti juga `firestore.rules` dan `firestore.indexes.json` pada repository (file Rules tetap dipasang melalui Firebase Console, bukan dijalankan oleh GitHub Pages).
4. Commit perubahan ke branch `main`.
5. Tunggu GitHub Pages selesai menerbitkan perubahan, lalu buka website dan tekan `Ctrl + Shift + R`.

## Alur produk dan stok

- **Mitra:** mengajukan nama produk, harga, kategori (opsional), dan jumlah yang akan diserahkan.
- **SPV/Superadmin:** memeriksa pengajuan. Nama, harga jual, dan jumlah dapat dikoreksi sebelum disetujui; pengajuan juga dapat ditolak.
- **Setujui:** produk dibuat di `menus`, stok awal masuk, `stockMovements` mencatat stok masuk, dan barcode otomatis dibuat.
- **Input manual SPV:** menghasilkan data menu dan stok awal yang sama, tetapi tanpa pengajuan mitra.
- **Kasir/SPV:** transaksi mengurangi stok melalui Firestore transaction. Data `partnerSales` ditulis dalam transaksi yang sama.
- **Mitra:** listener realtime pada menu dan penjualan memperlihatkan stok saat ini dan produk yang baru terjual.

Koleksi `productSubmissions` akan dibuat otomatis Firestore saat pengajuan produk pertama dikirim. Tidak perlu membuat collection tersebut secara manual.

## Cetak label thermal 4 × 3 cm

1. Buka website KALAP sebagai Superadmin atau SPV.
2. Buka **Operasional → Cetak label**.
3. Pilih menu dan jumlah label.
4. Pada dialog cetak browser, pilih printer thermal dan ukuran kertas/stiker **40 × 30 mm**.
5. Atur margin **None/Tanpa margin**, scale **100%**, dan matikan header/footer browser.

Barcode Code 128 dibuat memakai JsBarcode dari CDN jsDelivr. Koneksi internet dibutuhkan ketika library barcode belum tersimpan di cache browser.

## Catatan data yang sudah ada

- Menu lama yang belum memiliki field `barcode` tetap bisa dicetak; website membuat kode deterministik dari ID dokumen menu.
- Dokumen mitra lama yang masih menyimpan field `phone` tidak perlu dihapus. Versi website ini tidak lagi meminta atau menampilkannya.
- Pengajuan produk lama yang belum pernah ada tidak otomatis dibuat; mitra mengirim pengajuan baru dari dashboard.
- Pastikan akun Mitra di `users/{uid}` memiliki `partnerId` sesuai ID dokumen pada collection `partners`.

## Batasan hosting/database

- Tidak menggunakan Firebase Hosting, Cloud Functions, Node.js, Firebase CLI, ataupun paket Blaze.
- Authentication memakai Email/Password.
- Superadmin tetap membuat akun pengguna dari dashboard menggunakan sesi Authentication sekunder.
- Firestore Rules menjadi kontrol keamanan utama di server. Jangan hanya mengandalkan menu yang disembunyikan pada browser.

## Pembaruan keamanan dan performa

- Setelah memperbarui paket, **wajib ganti isi Firestore Rules** dengan file `firestore.rules` dari paket ini, lalu klik Publish.
- Browser cache menggunakan IndexedDB bila didukung; login pertama atau perangkat/browser baru tetap perlu mengambil profil dari server. Cache mengurangi waktu tunggu berikutnya, tetapi tidak dapat menghilangkan latensi jaringan.
- Produk yang diajukan mitra dan belum disetujui tidak masuk katalog kasir dan tidak menambah stok.
- Setelah penjualan tersimpan, stok menu dan catatan `partnerSales` diperbarui dalam transaksi Firestore yang sama, kemudian dipancarkan ke dashboard mitra melalui snapshot listener.
