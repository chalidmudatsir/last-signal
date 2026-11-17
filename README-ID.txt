LAST SIGNAL — PWA STARTER 0.1.0
================================

ISI PAKET
- index.html            Halaman utama game
- styles.css            Desain responsif
- app.js                Interaksi menu, nama lokal, demo chat
- manifest.webmanifest  Konfigurasi PWA
- sw.js                 Cache app shell/offline
- offline.html          Halaman saat tidak ada koneksi
- assets/icons/         Ikon aplikasi

PENTING
Ini adalah fondasi PWA / Phase 01, belum game lengkap.
Belum ada backend, akun server, recovery token, AI sungguhan,
cloud save, leaderboard global, database, QRIS, atau admin dashboard.
Nama pemain dan demo chat saat ini hanya tersimpan/lokal di browser.

CARA UPLOAD KE GITHUB (iPhone)
1. Ekstrak ZIP.
2. Buka github.com dan masuk ke akun GitHub.
3. Buat repository baru, misalnya: last-signal
4. Atur repository Public (agar GitHub Pages gratis dapat digunakan).
5. Upload seluruh ISI folder LAST_SIGNAL_PWA_STARTER ke root repository.
   Pastikan index.html berada langsung di root, bukan di subfolder.
6. Buka Settings > Pages.
7. Pada Build and deployment, pilih Deploy from a branch.
8. Pilih branch main dan folder /(root), lalu Save.
9. Tunggu proses deployment selesai. Buka URL GitHub Pages yang diberikan.

CATATAN PATH
File menggunakan path relatif (./) agar bisa berjalan di alamat GitHub Pages
berformat username.github.io/nama-repository/.

CARA INSTALL DI iPHONE
1. Buka URL GitHub Pages menggunakan Safari (bukan browser Instagram).
2. Tekan Share/Bagikan.
3. Pilih Add to Home Screen / Tambah ke Layar Utama.
4. Aktifkan Open as Web App bila opsi itu muncul.
5. Tekan Add/Tambah, lalu buka ikon LAST SIGNAL dari Home Screen.

CARA INSTALL DI ANDROID
Buka URL menggunakan Chrome. Gunakan menu browser > Install app
atau Add to Home screen. Tombol install di halaman akan muncul jika browser
memenuhi kriteria dan mengirimkan beforeinstallprompt.

UPDATE KODE
Upload file pengganti ke lokasi yang sama di repository. Service worker memakai
versi cache. Jika kelak mengubah aset besar, naikkan CACHE_NAME di sw.js
(misalnya last-signal-shell-v2) agar cache lama dibersihkan.

PENGUJIAN
- GitHub Pages harus menggunakan HTTPS.
- Service worker tidak berjalan dari file:// atau preview file lokal.
- Tes install dari Safari/Chrome, bukan browser in-app Instagram.
- Tes offline setelah pertama kali membuka game saat online.

LANGKAH DEVELOPMENT BERIKUTNYA
Phase 02: Game UI + smartphone/investigation interfaces.
Phase 03: Story engine dan chapter data.
Phase 04: Backend Cloudflare Workers + D1 untuk akun dan cloud save.
Phase 05: AI melalui backend (API key tidak boleh berada di frontend).
Phase 06: leaderboard, admin dashboard, QRIS dan webhook.
