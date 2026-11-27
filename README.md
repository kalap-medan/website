# KALAP Management System v2.2.23

## Optimasi pembacaan Firebase v2.2.23
- Listener data utama kini mengikuti halaman yang sedang dibuka. Daftar menu, mitra, akun, riwayat pengajuan, riwayat cetak label, data transaksi, data keuangan, pergerakan stok, dan riwayat closing tidak lagi seluruhnya dimuat bersamaan saat login.
- Pembacaan riwayat pengajuan stok dan cetak label dilakukan ketika halaman terkait dibuka; listener ringkas untuk status antrean navbar tetap aktif agar notifikasi jumlah pengajuan tetap diperbarui.
- Data transaksi dan pergerakan stok Dashboard hari ini memakai hasil query rentang Dashboard ketika tanggal hari ini sudah tercakup, sehingga query khusus hari ini tidak berjalan ganda dalam kondisi tersebut.
- Pemindaian massal pergerakan stok untuk rollover dan pemindaian seluruh riwayat pengajuan kedaluwarsa tidak lagi dijalankan otomatis saat login atau pergantian tanggal. Pemeriksaan pengajuan kedaluwarsa menggunakan antrean berstatus aktif ketika halaman Pengajuan Stok dibuka. Rekonsiliasi data menu, mitra, dan akun lama tetap tersedia, tetapi dijalankan pada halaman pengelolaannya masing-masing.
- Cache lokal Firestore dan mekanisme tulis/transaksi yang sudah ada dipertahankan. Struktur koleksi, Firestore Rules, indeks, tampilan, serta alur transaksi, stok, keuangan, dan closing tidak sengaja diubah.

## Perbaikan terfokus v2.2.23
- Halaman Cetak Stiker akun Mitra kini menampilkan daftar menu aktif milik Mitra dalam tabel; Mitra cukup mengisi jumlah stiker per menu tanpa perlu mencari atau memilih nama menu satu per satu.
- Daftar menu cetak stiker memakai pagination 10 menu per halaman. Jumlah yang sudah diisi tetap tersimpan saat Mitra berpindah halaman.
- Satu kali pengajuan dapat mengirim jumlah stiker untuk beberapa menu sekaligus ke antrean Cetak Label Superadmin. Tiap menu tetap menjadi item antrean terpisah agar proses QR dan status pencetakan Superadmin yang sudah ada tetap berjalan.
- Status cetak ditampilkan di bagian atas tabel sebagai ringkasan "Menunggu dicetak", "Sudah dicetak", atau "Belum ada pengajuan", disertai jumlah pengajuan yang menunggu dan yang telah dicetak. Tabel riwayat pengajuan di akun Mitra dihilangkan.
- Navigasi akun Mitra diurutkan sehingga Cetak Stiker berada tepat di bawah Pengajuan dan Stok Harian.

## Fitur dan data lain (dipertahankan)
- Alur antrean cetak Superadmin, ukuran label 30 × 40 mm, pencetakan QR, serta pembaruan status setelah dialog cetak selesai tetap menggunakan mekanisme yang sudah ada.
- Firestore Rules, indeks, konfigurasi Firebase, dan aset aplikasi tidak diubah.
- Pembuatan beberapa permintaan stiker menggunakan batch Firestore dengan ukuran aman; jumlah per menu dibatasi 0–500 dan baris bernilai 0/kosong tidak diajukan.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.23.
- `service-worker.js`: cache shell v2.2.23.
- `firestore.rules`, `firestore.indexes.json`, ikon, manifest, dan file pendukung dipertahankan dari paket v2.2.21.

## Pemasangan
1. Cadangkan berkas hosting dan data Firestore aktif terlebih dahulu.
2. Ganti `index.html` dan `service-worker.js` di hosting dengan versi paket ini.
3. `firestore.rules` tidak diubah, sehingga tidak perlu dipublikasikan ulang untuk pembaruan ini.
4. Pertahankan folder `icons/`, `manifest.webmanifest`, dan berkas pendukung yang sudah ada di hosting; aset, konfigurasi, Rules, dan indeks di dalam paket ini dipertahankan tanpa perubahan.
5. Hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.23.

## Catatan pengujian
Sintaks JavaScript pada `index.html` diperiksa dengan Node.js dan lolos. Perubahan diverifikasi secara statis terhadap pemetaan halaman dan pemanggilan listener. Operasi Firestore nyata, perhitungan kuota pada project produksi, dan alur transaksi lintas-role belum dapat dijalankan dari lingkungan ini. Uji login, Dashboard, POS, pengajuan stok, cetak label, keuangan, dan closing setelah memasang pembaruan.
