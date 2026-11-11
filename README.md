# KALAP Management System — GitHub Pages + Firebase Database

Versi sederhana: **website di-host di GitHub Pages**. Firebase hanya dipakai untuk **Authentication (login)** dan **Cloud Firestore (database)**. Tidak memakai Firebase Hosting, Cloud Functions, Node.js, Firebase CLI, service account, atau file backend.

## File yang dipakai

- `index.html` — halaman website.
- `styles.css` — tampilan responsif.
- `app.js` — fitur dashboard, POS, stok, mitra, keuangan, dan akun.
- `firebase-config.js` — konfigurasi Firebase Web App.
- `firestore.rules` — aturan keamanan database (salin ke Firebase Console).
- `firestore.indexes.json` — referensi indeks gabungan bila Firebase memintanya.

## A. Siapkan Firebase (sekali saja)

1. Buka https://console.firebase.google.com/ dan buat project KALAP.
2. Buka **Build → Authentication → Get started → Sign-in method**. Aktifkan **Email/Password**.
3. Pada Authentication → Settings → Authorized domains, pastikan domain GitHub Pages nanti ditambahkan, misalnya `USERNAME.github.io` (ganti dengan username GitHub-mu).
4. Buka **Build → Firestore Database → Create database**. Pilih **Production mode** dan lokasi `asia-southeast2` (Jakarta) bila tersedia.
5. Buka **Project settings → General → Your apps → Web app**. Daftarkan aplikasi Web, lalu salin konfigurasi Firebase.
6. Buka `firebase-config.js` dan ganti nilai placeholder dengan nilai konfigurasi Web App yang diberikan Firebase.
7. Buka **Firestore Database → Rules**. Ganti seluruh isi Rules dengan isi file `firestore.rules`, lalu klik **Publish**.

> Penting: Firebase Web API key bukan password administrator dan memang muncul di website. Keamanan data diatur oleh Firestore Rules. Jangan pernah menaruh service-account JSON atau private key di repository.

## B. Upload website ke GitHub Pages

1. Buka https://github.com/ dan buat repository baru, misalnya `kalap-management-system`.
2. Pilih **Public** (GitHub Pages tersedia gratis untuk repository publik pada GitHub Free).
3. Upload isi folder ini ke bagian paling atas/root repository. Pastikan `index.html`, `app.js`, `styles.css`, dan `firebase-config.js` berada di root, bukan di dalam folder bertingkat.
4. Buka repository → **Settings → Pages**.
5. Di bagian **Build and deployment**, pilih **Deploy from a branch**.
6. Pilih branch `main` dan folder `/(root)`, lalu klik **Save**.
7. Tunggu hingga alamat GitHub Pages muncul. Bentuknya `https://USERNAME.github.io/kalap-management-system/`.
8. Kembali ke Firebase Console → Authentication → Settings → Authorized domains. Tambahkan `USERNAME.github.io` (tanpa `https://` dan tanpa nama repository).
9. Buka website GitHub Pages dan coba login.

## C. Buat akun superadmin pertama

Belum ada pendaftaran publik. Buat pemilik pertama secara manual sekali saja:

1. Firebase Console → Authentication → Users → **Add user**. Masukkan email dan password superadmin.
2. Salin **User UID** yang dibuat Firebase.
3. Firestore Database → **Data** → **Start collection**. Nama collection: `users`.
4. Untuk Document ID, tempel User UID tadi (harus sama persis).
5. Tambahkan field berikut:

| Field | Type | Value |
|---|---|---|
| `uid` | string | UID yang sama |
| `displayName` | string | Nama superadmin |
| `email` | string | Email login superadmin |
| `role` | string | `superadmin` |
| `active` | boolean | `true` |
| `createdAt` | timestamp | waktu saat dibuat |
| `partnerId` | null | `null` |
| `partnerName` | null | `null` |

6. Simpan. Login ke website menggunakan email dan password tersebut.
7. Setelah login, buka **Akun pengguna** untuk membuat SPV, Kasir, dan Mitra. Sistem membuat akun Auth lewat sesi sekunder agar akun superadmin tidak ter-logout.

## D. Catatan penggunaan dan keamanan

- Role disimpan pada dokumen `users/{uid}` dan Firestore Rules memeriksa role tersebut. Pengguna biasa tidak dapat membuat atau mengubah dokumen profil role sendiri.
- Role `superadmin` tidak tersedia pada form pembuatan akun. Akun superadmin pertama dibuat hanya melalui langkah manual di Firebase Console.
- Akun staf dibuat dengan Firebase Authentication dari sesi sekunder. Jika penulisan profil Firestore gagal sesudah akun Auth terbentuk, hapus akun yatim tersebut dari Authentication → Users.
- Penjualan dan penerimaan stok menggunakan Firestore transactions supaya perubahan stok, transaksi, mutasi, serta catatan terkait disimpan atomik.
- Transaksi dibatasi maksimal 10 jenis menu per sekali checkout untuk menjaga transaksi Firestore tetap dalam batas evaluasi aturan keamanan.
- Jangan pernah menghapus atau melonggarkan Firestore Rules untuk mengatasi error izin. Periksa role akun dan query yang digunakan.
- Saat Firebase menampilkan pesan **The query requires an index**, ikuti link yang diberikan Firebase untuk membuat indeks. File `firestore.indexes.json` disediakan sebagai daftar indeks yang diperlukan.
- Paket Spark dapat digunakan karena proyek ini tidak menggunakan Cloud Functions. Firestore dan Authentication tetap mengikuti kuota dan ketentuan Firebase.

## E. Jika website tidak dapat login

1. Pastikan semua nilai di `firebase-config.js` berasal dari Web App pada project Firebase yang benar.
2. Pastikan Email/Password Authentication aktif.
3. Pastikan domain `USERNAME.github.io` ada di Authorized domains.
4. Pastikan dokumen `users/{uid}` ada, ID dokumen sama persis dengan UID Authentication, `active` bernilai `true`, dan `role` benar.
5. Buka Developer Tools browser (F12) → Console untuk melihat pesan error.
