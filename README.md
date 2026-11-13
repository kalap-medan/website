# KALAP Management System v2.0.3

## Isi paket
- `index.html`: seluruh HTML, CSS, dan JavaScript aplikasi dalam satu file.
- `firestore.rules`: aturan akses Firestore. Hak penghapusan menu dibatasi di sisi aplikasi dan Firestore untuk role `superadmin` saja.
- `firestore.indexes.json`: indeks Firestore.
- `manifest.webmanifest`, `icons/`: identitas PWA dan ikon aplikasi.
- `service-worker.js`: cache shell versi 2.0.3 agar browser mengambil source terbaru.

## Perubahan v2.0.3
- **Hapus menu hanya untuk Superadmin.** Tombol Hapus hanya dirender untuk role `superadmin`, fungsi penghapusan memeriksa role kembali, dan Firestore Rules mengizinkan perubahan soft-delete hanya untuk Superadmin. SPV, Kasir, dan Mitra tidak mendapat akses penghapusan.
- Penghapusan menu merupakan **soft delete**: menu disembunyikan dari POS, katalog aktif, dan cetak label, sedangkan dokumen menu, stok terakhir, serta hubungan riwayat transaksi tetap tersimpan untuk audit. Menu yang masih memiliki pengajuan stok tertunda tidak dapat dihapus sampai pengajuan diselesaikan.
- **Ukuran cetak label dikunci ke 30 × 40 mm (portrait).** Pilihan 40 × 30 mm dan selector orientasi dihapus dari halaman Cetak Label maupun popup cetak. QR memakai grid 7 dot/modul pada printer 203 DPI.
- **Ingat Saya** ditambahkan di halaman Login. Jika dicentang, Firebase Auth memakai `browserLocalPersistence` sehingga login tetap tersimpan setelah tab/browser ditutup. Jika tidak dicentang, Firebase Auth memakai `browserSessionPersistence`, sehingga sesi berakhir saat tab/window ditutup.
- Sesi yang sudah ada dari versi lama tanpa preferensi Ingat Saya akan dipindahkan ke session persistence pada pembukaan pertama v2.0.3. Centang Ingat Saya dan login kembali untuk mempertahankan sesi lintas penutupan browser.
- Preferensi hanya menyimpan pilihan ingat sesi, bukan email atau kata sandi. Logout manual menghapus preferensi Ingat Saya.
- Cache PWA diperbarui ke v2.0.3.

## Pengaturan cetak ECO80BT
1. Pilih driver Blueprint ECO80BT dan media label GAP khusus 30 × 40 mm (portrait).
2. Atur skala `100% / Actual Size`, margin `None/0`, dan matikan `Fit to page` / `Shrink to fit`.
3. Pastikan kalibrasi sensor gap sesuai dengan roll label.
4. Uji satu label dan pindai QR sebelum mencetak dalam jumlah banyak.

ECO80BT adalah printer label thermal 203 DPI. Aplikasi membuat QR vektor dengan modul yang selaras ke grid dot printer, tetapi hasil akhir juga dipengaruhi density/darkness, kecepatan, kualitas label, kalibrasi gap, dan pengaturan driver. Density/darkness dan kecepatan printhead harus disetel dari driver atau Utility BP-ECO80BT; halaman web tidak dapat mengatur panas printhead secara langsung.

Media GAP membutuhkan feed singkat antar-label agar sensor dapat menemukan awal label berikutnya. Aplikasi mengirim seluruh salinan dalam satu pekerjaan cetak, tetapi tidak dapat menghilangkan feed mekanis sensor GAP.

Halaman bantuan Blueprint: https://www.blueprint-indonesia.com/Bantuan.htm

## Fitur sistem yang dipertahankan
- Menu Baru mendaftarkan katalog dengan stok awal 0 dan ID numerik otomatis.
- Pengajuan Stok mendukung persetujuan, revisi, penolakan, dan input manual Admin/SPV dengan pemeriksaan agar stok tidak ganda.
- POS mendukung pencarian menu, pemindaian QR/kode lama, pagination produk, berbagai metode pembayaran, dan format nominal Rupiah.
- Riwayat transaksi mendukung pembatalan dengan pengembalian stok dan koreksi laporan, sesuai aturan periode closing.
- Cetak label mendukung pencarian menu/mitra/QR dan jumlah salinan, selalu dengan ukuran 30 × 40 mm.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP v2.0.3.
3. Upload seluruh isi folder ke root repository GitHub Pages dan replace file lama. Pertahankan folder `icons/` serta file tersembunyi `.nojekyll`.
4. Pastikan GitHub Pages mengarah ke branch dan folder publikasi yang benar.
5. Buka aplikasi dan lakukan hard refresh (`Ctrl + Shift + R`). Untuk PWA yang terpasang, tutup lalu buka kembali agar service worker terbaru aktif.

## Firestore
Tidak ada perubahan Firestore Rules maupun indeks pada v2.0.3 karena aturan versi sumber sudah membatasi soft-delete menu kepada Superadmin. Pastikan Rules yang dipublikasikan tetap memuat blok `match /menus/{menuId}` dengan kondisi `isSuperadmin()` pada perubahan `deleted`.
