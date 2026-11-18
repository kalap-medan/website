# KALAP Management System v2.2.12

## Isi paket
- `index.html`: aplikasi KALAP satu berkas.
- `firestore.rules`: Firestore Rules v2.2.12. Ada izin staf aktif untuk menyembunyikan batch stok masuk manual dalam transaksi koreksi yang sama.
- `firestore.indexes.json`: konfigurasi indeks (tidak ada indeks tambahan untuk pembaruan ini).
- `manifest.webmanifest`: identitas PWA. Folder `icons/` tetap gunakan folder yang sudah ada di repository.
- `service-worker.js`: cache shell v2.2.12.

## Perubahan v2.2.12 — perbaikan tombol Hapus pada “Stok masuk disetujui”
- Memperbaiki fungsi yang benar-benar dipanggil tabel Stok masuk disetujui: `deleteDailyStockMovement`. Perbaikan v2.2.11 sebelumnya hanya menyentuh hapus riwayat pengajuan, bukan jalur tabel stok harian.
- Tombol Hapus kini menggunakan satu transaksi atomik: saldo menu dikurangi, pergerakan masuk asli ditandai `hiddenFromDaily`, pengajuan terkait dihapus dari daftar bila berasal dari pengajuan mitra, dan satu pergerakan koreksi negatif dicatat.
- Catatan movement asli tetap ada dan tidak ditandai voided agar perhitungan rollover stok harian tetap menghitung input asli + koreksi negatif tepat satu kali. Catatan asli hanya disembunyikan dari daftar operasional, sedangkan koreksinya tetap terlihat untuk audit.
- Firestore Rules menambahkan izin khusus bagi staf aktif untuk menyembunyikan batch input manual yang tidak mempunyai `requestId`; jalur batch dari pengajuan mitra tetap memakai validasi pengajuan dan pencocokan movement yang sudah ada.
- Jika saldo tersedia kurang dari jumlah batch yang ingin dibatalkan, aplikasi menolak dengan pesan yang menyebut jumlah yang sudah terpakai. Ini mencegah saldo negatif; transaksi penjualan terkait perlu direkonsiliasi terlebih dahulu.
- Tidak ada hard-delete movement; jejak audit tetap disimpan. Cache PWA dinaikkan menjadi `kalap-shell-v2.2.12`.

## Pemasangan
- Ganti `index.html` dan `service-worker.js` di root GitHub Pages. Pertahankan folder `icons/`.
- **Publikasikan `firestore.rules` v2.2.12** ke project Firebase yang sama karena ada izin tambahan untuk batch stok masuk manual.
