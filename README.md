# KALAP Management System v2.0.6

## Isi paket
- `index.html`: seluruh HTML, CSS, dan JavaScript aplikasi dalam satu file.
- `firestore.rules`: aturan keamanan Firestore **versi baru wajib dipublikasikan** untuk fitur pengajuan edit, penggabungan jumlah pengajuan, dan penghapusan riwayat stok diterima.
- `firestore.indexes.json`: konfigurasi indeks Firestore.
- `manifest.webmanifest`, `icons/`: identitas PWA dan ikon aplikasi.
- `service-worker.js`: cache shell versi 2.0.6 agar browser mengambil source terbaru.

## Perubahan v2.0.6
- **Pengajuan stok menu yang sama digabung.** Jika mitra mengajukan 5 unit lalu menambahkan 2 unit saat pengajuan masih menunggu, sistem memperbarui satu pengajuan menjadi 7 unit dan menampilkan keterangan “Ditambah 5 → 7 (+2)”.
- **Koreksi stok yang sudah diterima.** Mitra dapat mengajukan jumlah total yang benar untuk satu penerimaan yang sudah disetujui. Admin/SPV harus menyetujui; sistem mencatat pergerakan koreksi bertanda `ditambah` atau `dikurang`, lalu menyesuaikan saldo stok dengan selisihnya. Pengurangan ditolak apabila stok tersedia tidak mencukupi. Batch yang sudah dikoreksi tidak dapat dikoreksi lagi lewat catatan lama; gunakan catatan koreksi terbaru.
- **Hapus riwayat diterima oleh Superadmin.** Superadmin dapat menghapus dokumen riwayat pengajuan berstatus diterima. Saldo stok dan catatan pergerakan stok tetap dipertahankan. Penghapusan diblokir ketika ada pengajuan lain yang sedang terkunci untuk menu tersebut.
- **Pencarian pengajuan stok.** Pemilihan menu mitra dan pencarian nama mitra pada halaman pengajuan menggunakan kolom pencarian, bukan dropdown.
- Cache PWA diperbarui ke v2.0.6.

## Perubahan yang tetap dipertahankan dari v2.0.5
- **Pendapatan mitra dipotong 20% secara otomatis.** Dokumen penjualan mitra menyimpan `grossTotal`, `kalapShare`, dan `netTotal`. Dashboard mitra, aktivitas terbaru, serta halaman Penjualan Saya menampilkan nominal bersih setelah potongan 20% untuk KALAP. Riwayat lama yang belum memiliki field tersebut dihitung dengan rumus yang sama saat ditampilkan.
- **Transferan mitra diselaraskan dengan perhitungan dashboard.** Rekap transfer dan konfirmasi transfer menjumlahkan nilai kotor, potongan, dan bersih pada basis per catatan penjualan, sehingga nominal yang terlihat di dashboard mitra cocok dengan perhitungan admin.
- **Badge Pengajuan Stok realtime.** Navbar Superadmin dan SPV menampilkan jumlah menu/pengajuan yang masih berstatus `pending` atau `revised`. Menu unik yang masih diajukan dihitung satu kali, bukan jumlah unit stok atau duplikasi dokumen lama. Badge bertambah dan berkurang mengikuti snapshot Firestore.
- **Pencarian Cetak Label.** Daftar hasil tidak ditampilkan saat kolom kosong. Menu baru muncul ketika pengguna mengetik, mencari nama mitra/menu, atau melakukan scan QR; setelah menu dipilih hasil pencarian menutup dan ringkasan menu terpilih tetap terlihat.
- **Menu & Persediaan Superadmin menjadi katalog saja.** Keterangan stok dan kolom stok dihilangkan dari tampilan serta ekspor CSV Superadmin. Pemantauan stok untuk SPV tetap dipertahankan.
- Keterangan stok awal di halaman pendaftaran Menu Baru dihapus dari tampilan; stok awal sistem tetap nol sampai ada pengajuan stok yang diterima.
- Cache PWA diperbarui ke v2.0.5.

## Perhitungan pendapatan mitra
- Penjualan kotor mitra dihitung dari subtotal item milik mitra dalam satu transaksi.
- Bagian KALAP = `Math.round(penjualanKotor × 20%)`.
- Pendapatan bersih mitra = `penjualanKotor − bagianKALAP`.
- Perhitungan per catatan penjualan digunakan konsisten di portal mitra, rekap transfer, dan penandaan transfer.
- Transaksi yang dibatalkan tetap dikeluarkan dari total pendapatan, karena status catatan partner sales ikut diubah menjadi `cancelled` saat pembatalan transaksi.

## Perilaku badge Pengajuan Stok
- Hanya terlihat di navbar Superadmin dan SPV.
- Menghitung dokumen berstatus `pending` dan `revised`.
- Tidak menghitung pengajuan yang sudah `received` atau `rejected`.

## Fitur yang dipertahankan
- Hapus menu hanya untuk Superadmin melalui soft-delete dan Firestore Rules v2.0.4.
- Label QR 30 × 40 mm portrait untuk Blueprint ECO80BT 203 DPI.
- Login `Ingat Saya` memakai Firebase Auth local/session persistence.
- POS, pembatalan transaksi dan pengembalian stok, pengajuan stok dan input manual, closing harian, keuangan, manajemen mitra, serta PWA.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP v2.0.6.
3. Upload seluruh isi folder ke root repository GitHub Pages dan replace file lama. Pertahankan folder `icons/` serta file tersembunyi `.nojekyll`.
4. Pastikan GitHub Pages mengarah ke branch dan folder publikasi yang benar.
5. Buka aplikasi dan lakukan hard refresh (`Ctrl + Shift + R`). Untuk PWA yang terpasang, tutup lalu buka kembali agar service worker v2.0.6 aktif.

## Firestore — wajib diperbarui
1. Buka Firebase Console → Firestore Database → Rules.
2. Ganti seluruh isi Rules dengan file `firestore.rules` dari paket v2.0.6.
3. Klik **Publish**. Pembaruan rules wajib dilakukan karena mitra sekarang dapat menambah jumlah pengajuan pending dan membuat pengajuan koreksi, serta Superadmin dapat menghapus riwayat yang sudah diterima. Rules baru juga memvalidasi movement koreksi `adjustment`.
4. Tidak ada perubahan pada `firestore.indexes.json`, jadi indeks tidak perlu diunggah ulang.

Jangan hanya mengunggah `index.html`: aplikasi dan Firestore Rules harus sama-sama diperbarui agar fitur baru tidak ditolak oleh izin Firestore.
