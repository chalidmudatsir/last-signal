LAST SIGNAL PWA — VERSION 0.2.0
=================================

FITUR VERSI INI
- Chat screen memenuhi layar aplikasi.
- Tampilan percakapan bergaya messenger/WhatsApp-inspired.
- Typing indicator dengan jeda sebelum pesan karakter muncul.
- Tiga pilihan balasan terarah pada setiap scene.
- Input manual tetap tersedia.
- Input manual diklasifikasikan ke intent lokal dan diarahkan kembali ke story.
- Story scene dan pilihan disimpan pada file JSON terpisah.
- Progres percakapan tersimpan lokal di browser.
- PWA manifest dan service worker.

BATASAN PENTING
Ini masih prototype frontend tanpa AI online. Respons manual memakai intent
matching berbasis kata kunci, bukan model AI. Story Chapter 01 adalah contoh
alur terstruktur untuk menguji mekanik. Belum ada backend, akun cloud,
recovery token, database, admin dashboard, leaderboard, payment QRIS,
atau sistem Life/Threat final. Jangan gunakan saldo atau transaksi sungguhan.

CARA UPDATE REPOSITORY GITHUB YANG SUDAH ADA
1. Ekstrak ZIP ini di iPhone.
2. Buka repository last-signal di GitHub.
3. Upload file/folder dari paket ini ke root repository.
4. Jika GitHub bertanya apakah file yang sama ditimpa, pilih replace/overwrite.
5. Pastikan folder story berisi chapter-01.json.
6. Pastikan assets/icons berisi icon-192.png dan icon-512.png.
7. Commit changes ke branch main.
8. Tunggu GitHub Pages selesai deploy.
9. Tutup tab game lama, buka ulang URL dan refresh. Jika masih versi lama,
   tutup PWA/browser sepenuhnya lalu buka kembali. Service worker cache name
   versi ini adalah last-signal-v020.

STRUKTUR
index.html
styles.css
app.js
manifest.webmanifest
sw.js
story/chapter-01.json
assets/icons/icon-192.png
assets/icons/icon-512.png

EDIT CERITA
Ubah story/chapter-01.json. Setiap scene memiliki:
- label, contactName, status, notice, opening
- choices: teks pilihan, response, typingMs, effects, next
- manualResponses: respons berdasarkan intent

Jangan menghapus key scene yang dirujuk oleh next. Untuk menambah scene,
buat key baru dan arahkan properti next ke key tersebut.

CATATAN PRODUK
Arsitektur final yang direncanakan: Story Engine mengendalikan scene/flag,
AI hanya menghasilkan variasi dialog dalam batas objective dan lore yang
ditentukan. API key AI kelak hanya berada di backend, tidak di browser.
