# KALAP Management System v2.2.22

## Perbaikan terfokus v2.2.22
- Halaman Cetak Stiker akun Mitra kini menampilkan daftar menu aktif milik Mitra dalam tabel; Mitra cukup mengisi jumlah stiker per menu tanpa perlu mencari atau memilih nama menu satu per satu.
- Daftar menu cetak stiker memakai pagination 10 menu per halaman. Jumlah yang sudah diisi tetap tersimpan saat Mitra berpindah halaman.
- Satu kali pengajuan dapat mengirim jumlah stiker untuk beberapa menu sekaligus ke antrean Cetak Label Superadmin. Tiap menu tetap menjadi item antrean terpisah agar proses QR dan status pencetakan Superadmin yang sudah ada tetap berjalan.
- Status cetak ditampilkan di bagian atas tabel sebagai ringkasan "Menunggu dicetak", "Sudah dicetak", atau "Belum ada pengajuan", disertai jumlah pengajuan yang menunggu dan yang telah dicetak. Tabel riwayat pengajuan di akun Mitra dihilangkan.
- Navigasi akun Mitra diurutkan sehingga Cetak Stiker berada tepat di bawah Pengajuan dan Stok Harian.

## Fitur dan data lain
- Alur antrean cetak Superadmin, ukuran label 30 × 40 mm, pencetakan QR, serta pembaruan status setelah dialog cetak selesai tetap menggunakan mekanisme yang sudah ada.
- Firestore Rules, indeks, konfigurasi Firebase, dan aset aplikasi tidak diubah.
- Pembuatan beberapa permintaan stiker menggunakan batch Firestore dengan ukuran aman; jumlah per menu dibatasi 0–500 dan baris bernilai 0/kosong tidak diajukan.

## Berkas paket
- `index.html`: aplikasi KALAP v2.2.22.
- `service-worker.js`: cache shell v2.2.22.
- `firestore.rules`, `firestore.indexes.json`, ikon, manifest, dan file pendukung dipertahankan dari paket v2.2.21.

## Pemasangan
1. Cadangkan berkas hosting dan data Firestore aktif terlebih dahulu.
2. Ganti `index.html` dan `service-worker.js` di hosting dengan versi paket ini.
3. `firestore.rules` tidak diubah, sehingga tidak perlu dipublikasikan ulang untuk pembaruan ini.
4. Pertahankan folder `icons/`, `manifest.webmanifest`, dan berkas pendukung yang sudah ada di hosting; paket ini menyertakan semuanya tanpa modifikasi selain versi aplikasi/cache.
5. Hard refresh (`Ctrl + Shift + R`) dan pastikan aplikasi menampilkan v2.2.22.

## Catatan pengujian
Sintaks JavaScript, hasil render daftar 10 menu per halaman, ringkasan status, dan pembuatan beberapa dokumen antrean diuji secara lokal dengan mock. Operasi Firestore nyata dan dialog printer belum dapat diuji pada project produksi dari lingkungan ini. Lakukan uji dengan akun Mitra dan Superadmin setelah memasang pembaruan.
