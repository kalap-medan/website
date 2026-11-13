# KALAP Management System v2.0.2

## Isi paket
- `index.html`: seluruh HTML, CSS, dan JavaScript aplikasi dalam satu file.
- `firestore.rules`: aturan akses Firestore yang sama dengan versi 2.0.1; tidak ada perubahan rules pada revisi QR ini.
- `firestore.indexes.json`: indeks Firestore.
- `manifest.webmanifest`, `icons/`: identitas PWA.
- `service-worker.js`: cache shell dengan versi baru agar browser mengambil file aplikasi terbaru.

## Perubahan v2.0.2 — QR label untuk Blueprint ECO80BT
- Label sekarang menggunakan QR Code Model 2 versi 1 dengan error correction level M dan payload numerik 12 digit. Matriks QR inti berukuran 21 × 21 modul.
- QR digambar sebagai SVG hitam-putih dengan tepi tajam dan quiet zone empat modul pada seluruh sisi. QR tidak diregangkan memenuhi kotak; ukuran fisiknya tetap mengikuti grid dot printer.
- Ukuran modul menggunakan bilangan bulat dot pada printer 203 DPI: 6 dot/modul untuk Landscape dan 7 dot/modul untuk Portrait. Ukuran keseluruhan termasuk quiet zone sekitar 21,775 mm (Landscape) dan 25,4 mm (Portrait).
- Label hanya mencetak nama menu, QR Code, dan harga. Angka ID QR tidak ikut dicetak.
- Menu baru memakai barcode numerik 12 digit pada field `barcode`; nilai ini juga menjadi payload QR. Menu lama dengan kode nonnumerik mendapatkan alias QR numerik deterministik dari ID dokumen. Pencarian kasir, cetak label, dan input stok menerima payload QR sekaligus kode lama yang tersimpan.
- QR dibuat sekali sebagai template SVG, lalu digandakan ke seluruh label dalam satu dialog/job cetak browser. Setiap label tetap satu halaman agar sensor GAP printer dapat membaca pergantian label.
- Orientasi Landscape: label 40 × 30 mm. Orientasi Portrait: label 30 × 40 mm.
- Tidak ada perubahan skema data, Firestore Rules, atau indeks pada versi ini.

## Pengaturan cetak ECO80BT
1. Pilih orientasi aplikasi yang sama dengan label fisik: Landscape 40 × 30 mm atau Portrait 30 × 40 mm.
2. Pada dialog cetak pilih driver Blueprint ECO80BT serta ukuran media khusus yang sesuai.
3. Atur skala `100% / Actual Size`, margin `None/0`, dan matikan `Fit to page` / `Shrink to fit`.
4. Pastikan jenis media adalah label GAP dan kalibrasi sensor gap sudah benar.
5. Uji satu label dan pindai hasil cetak sebelum mencetak banyak.

ECO80BT adalah printer label thermal 203 DPI. Aplikasi membuat bentuk QR vektor dengan modul yang selaras ke grid dot printer, tetapi hasil akhir juga dipengaruhi density/darkness, kecepatan, kualitas label, kalibrasi gap, serta pengaturan driver. Density/darkness dan kecepatan printhead harus disetel dari driver atau Utility BP-ECO80BT; CSS/JavaScript halaman web tidak dapat mengatur panas printhead secara langsung. Turunkan darkness sedikit demi sedikit bila hasil terlalu pekat.

Media GAP membutuhkan feed singkat antar-label agar sensor dapat menemukan awal label berikutnya. Aplikasi mengirim semua salinan dalam satu pekerjaan cetak dan tidak menambahkan timer/jeda manual, tetapi tidak dapat menghilangkan feed mekanis sensor GAP.

Halaman bantuan Blueprint: https://www.blueprint-indonesia.com/Bantuan.htm

## Fitur sistem yang dipertahankan
- Menu & Persediaan menyediakan daftar menu dan penghapusan arsip (soft delete) untuk Superadmin. Riwayat transaksi tetap dipertahankan.
- Menu Baru mendaftarkan katalog dengan stok awal 0 dan ID numerik otomatis.
- Pengajuan Stok mendukung persetujuan, revisi, penolakan, dan input manual Admin/SPV dengan pemeriksaan agar stok tidak ganda.
- POS mendukung pencarian menu, pemindaian kode, pagination produk, berbagai metode pembayaran, dan format nominal Rupiah.
- Riwayat transaksi mendukung pembatalan dengan pengembalian stok dan koreksi laporan, sesuai aturan periode closing.
- Cetak label menyediakan pencarian menu/mitra/ID, jumlah salinan, serta orientasi Landscape/Portrait.

## Cara memperbarui GitHub Pages
1. Cadangkan repository yang sedang berjalan.
2. Ekstrak ZIP v2.0.2.
3. Upload seluruh isi folder ke root repository GitHub Pages dan replace file lama. Pertahankan folder `icons/` serta file tersembunyi `.nojekyll`.
4. Pastikan GitHub Pages mengarah ke branch dan folder publikasi yang benar.
5. Buka aplikasi dan lakukan hard refresh (`Ctrl + Shift + R`). Untuk PWA yang terpasang, tutup lalu buka kembali agar service worker terbaru aktif.

## Firestore
Tidak ada perubahan Firestore Rules maupun indeks pada v2.0.2. Jika instalasi sebelumnya menggunakan Firestore Rules v1.8.0 atau versi yang lebih baru, Rules tidak perlu dipublikasikan ulang untuk revisi QR ini.
