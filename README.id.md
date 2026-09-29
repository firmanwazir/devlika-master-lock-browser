# 🛡️ Devlika Master Lock - Proteksi Kunci Browser Universal
> **Developer:** `devlika`  
> **Kompatibilitas:** Google Chrome, Brave Browser, Microsoft Edge, Opera, Vivaldi (Chromium Manifest V3)  
> **Bahasa:** [English](README.md) • **Bahasa Indonesia**

Ekstensi keamanan universal yang secara otomatis mengunci browser dengan **Master Password** setiap kali browser dibuka. Seluruh tab baru, website, dan navigasi diblokir sampai Anda memasukkan kata sandi yang benar.

---

## ✨ Fitur Utama

1. **Auto-Lock Saat Browser Dibuka**:
   - Begitu browser dibuka, ekstensi langsung mengarahkan Anda ke layar kunci Master Password.
   - Tidak ada tab atau website lain yang bisa dibuka sebelum Anda login.
2. **🔒 Kunci Tab Tertentu (Specific Tab Lock)**:
   - Ingin meninggalkan laptop sebentar tapi ada 1 tab sensitif (misal: email kantor atau chat)? Kunci tab tersebut secara individual!
   - Cukup klik kanan di halaman mana saja lalu pilih **"🔒 Kunci Tab Ini Saja"**, atau klik tombol **"Kunci Tab Ini"** di menu popup ekstensi.
   - Tab tersebut akan langsung terlindungi layar kunci tanpa mengganggu tab lain yang sedang Anda gunakan.
   - Masukkan Master Password untuk membuka kembali tab ke halaman aslinya, atau klik **"Batal & Tutup Tab"**.
3. **🌐 Kunci Link / Website Tertentu (Domain & URL Path Lock)**:
   - Proteksi untuk website atau tautan tertentu (seperti `web.whatsapp.com`, `youtube.com`, `instagram.com`, atau halaman spesifik seperti `facebook.com/messages`).
   - **Proteksi Ketat Per Tab (Tab-Scoped Isolation)**:
     - Membuka kunci website di suatu tab **hanya berlaku untuk tab tersebut saja**.
     - Jika link website tersebut dibuka di tab baru (`Ctrl+T` atau tab terpisah), tab baru tersebut **tetap terkunci dan wajib memasukkan Master Password kembali**.
     - Di dalam tab yang sama, Anda bebas bernavigasi dan mengklik tautan tanpa perlu mengetik ulang sandi.
   - **Tombol Toggle Aktif / Nonaktif (Switch ON/OFF)**:
     - Setiap website yang didaftarkan memiliki **saklar switch toggle (Aktif / Nonaktif)**.
     - Anda bisa mendaftarkan banyak website sekaligus dan membiarkannya dalam status *Nonaktif* (standby). Kapan pun ingin membatasi akses, cukup geser switch menjadi *Aktif* tanpa perlu mengetik ulang!
     - Saat menambah website baru, tersedia opsi checkbox *"Langsung Aktifkan"*.
   - **Format Link / Website yang Didukung**:
     - **Domain Penuh (Full Domain)**: `youtube.com` $\rightarrow$ Mengunci seluruh website `youtube.com`, `www.youtube.com`, `m.youtube.com`, dan semua video/halamannya.
     - **Subdomain Tertentu**: `web.whatsapp.com` $\rightarrow$ Hanya mengunci web app WhatsApp, situs landing `whatsapp.com` tetap bisa diakses.
     - **Link / Halaman Spesifik (Path)**: `facebook.com/messages` $\rightarrow$ Hanya mengunci halaman pesan, beranda Facebook tetap bisa dibuka bebas.
     - **Paste Bebas dari Browser**: Anda bisa langsung copy-paste URL dari address bar seperti `https://www.instagram.com/direct/`, sistem otomatis membersihkan `https://`, `http://`, `www.`, dan tanda slash di akhir.
   - **Cara Mendaftarkan**:
     - **Lewat Menu Popup (Tab Website)**: Ketik nama domain / link lalu klik **+ Tambah**.
     - **Lewat Menu Popup (Dashboard)**: Klik tombol **"Kunci Website Ini"**.
     - **Lewat Klik Kanan (Context Menu)**: Klik kanan di halaman web mana saja -> pilih **"🌐 Kunci Seluruh Website Ini (Domain)"**.
4. **Pemulihan Tab Otomatis (No Data Loss)**:
   - Jika Anda memiliki tab yang sedang dibuka sebelum browser ditutup atau dikunci, tab-tab tersebut disimpan secara aman dan otomatis dipulihkan setelah Anda berhasil memasukkan kata sandi.
5. **Anti-Bypass & Proteksi Navigasi**:
   - Membuka tab baru (`Ctrl+T` atau tombol `+`) saat browser terkunci akan langsung menutup tab tersebut dan mengembalikan fokus ke layar kunci.
   - Mengetik URL di address bar akan langsung dialihkan kembali ke layar kunci.
6. **Keamanan Kriptografi Standar Militer**:
   - Menggunakan algoritma **PBKDF2 (SHA-256) 100.000 iterasi** dengan **salt acak 128-bit** via Web Crypto API.
   - Kata sandi teks asli tidak pernah disimpan di storage.
7. **Proteksi Serangan Brute-Force**:
   - Jika kata sandi salah 5 kali berturut-turut, ekstensi mengaktifkan jeda keamanan (*cooldown*) 30 detik.
8. **Kunci Cepat Manual (Shortcut Keyboard)**:
   - Tekan `Ctrl + Shift + L` (atau `Cmd + Shift + L` di Mac) kapan saja untuk mengunci seluruh browser seketika saat meninggalkan meja.
9. **Kunci Otomatis (Auto-Lock Saat Idle)**:
   - Bisa diatur di menu popup ekstensi (1 menit, 5 menit, 15 menit, 30 menit, atau 1 jam tidak ada aktivitas).
10. **Petunjuk Sandi (Password Hint) & Ganti Sandi**:
    - Tersedia opsi melihat petunjuk jika lupa kata sandi.
    - Ganti sandi kapan saja melalui ikon ekstensi di toolbar.

---

## 🚀 Panduan Instalasi ke Browser (Chrome, Brave, Edge, Opera)

Ikuti langkah mudah berikut untuk memasang ekstensi ini ke browser pilihan Anda:

### Langkah 1: Buka Menu Ekstensi
- **Google Chrome**: Buka `chrome://extensions`
- **Brave Browser**: Buka `brave://extensions`
- **Microsoft Edge**: Buka `edge://extensions`
- **Opera**: Buka `opera://extensions`

Di pojok kanan atas halaman, aktifkan toggle **"Mode pengembang" (Developer mode)**.

### Langkah 2: Muat Ekstensi
1. Di pojok kiri atas, klik tombol **"Muat belum dibongkar" (Load unpacked)**.
2. Cari dan pilih folder ekstensi ini:
   ```
   d:\WebServer\www\extensions\devlika-master-lock
   ```
3. Klik **Select Folder** (Pilih Folder).
4. Ekstensi **Devlika Master Lock** sekarang berhasil terpasang! 🎉

### Langkah 3 (PENTING): Aktifkan di Mode Pribadi / Samaran (Incognito)
Agar browser tidak bisa dibobol dengan membuka tab *Private / Incognito Window*:
1. Di halaman ekstensi, cari kartu **Devlika Master Lock**.
2. Klik tombol **"Detail" (Details)**.
3. Gulir ke bawah dan aktifkan opsi toggle **"Izinkan dalam mode Samaran" (Allow in Incognito / Private)**.

---

## 🔒 Cara Menggunakan

1. **Pengaturan Pertama Kali**:
   - Saat ekstensi baru dipasang atau browser dibuka pertama kali, tab **Setup Master Password** akan otomatis muncul.
   - Masukkan kata sandi yang Anda inginkan (minimal 4 karakter).
   - Masukkan konfirmasi kata sandi dan petunjuk (*hint*) bila diinginkan.
   - Klik **"Aktifkan & Buka Browser"**.

2. **Membuka Kunci Browser**:
   - Setiap kali membuka browser, masukkan Master Password Anda lalu tekan **Enter** atau klik **"Buka Kunci Browser"**.
   - Tab-tab Anda yang sebelumnya langsung kembali terbuka!

3. **Cara Mengunci Tab Tertentu**:
   - Buka tab yang ingin Anda kunci.
   - **Cara A**: Klik kanan di sembarang tempat pada halaman tab tersebut -> pilih **"🔒 Kunci Tab Ini Saja"**.
   - **Cara B**: Klik ikon ekstensi di toolbar -> pada kartu tab aktif, klik **"Kunci Tab Ini"**.
   - Tab akan langsung terkunci. Masukkan Master Password untuk membuka kembali tab tersebut.

4. **Cara Mengunci & Mengatur Link / Website Tertentu**:
   - **Mendaftarkan Website Baru**:
     - Klik ikon ekstensi -> buka tab **"Website"**.
     - Ketik domain atau paste link (contoh: `youtube.com`, `web.whatsapp.com`, atau `facebook.com/messages`).
     - Centang **"Langsung Aktifkan"** jika ingin langsung terkunci, atau hilangkan centang jika ingin disimpan sebagai cadangan/standby terlebih dahulu.
     - Klik tombol **+ Tambah**.
   - **Mengatur Aktif / Nonaktif (Toggle Switch)**:
     - Di tab **"Website"**, setiap baris memiliki saklar toggle switch ON/OFF.
     - Klik toggle untuk mengaktifkan ("Aktif" berwarna hijau) atau menonaktifkan ("Nonaktif" berwarna abu-abu).
   - **Mendaftarkan Instan Lewat Klik Kanan**:
     - Buka website yang ingin dikunci -> klik kanan di halaman -> pilih **"🌐 Kunci Seluruh Website Ini (Domain)"**.
   - **Menghapus Website**:
     - Klik ikon tempat sampah di samping nama website untuk menghapusnya secara permanen dari daftar.

5. **Mengunci Seluruh Browser Manual Kapan Saja**:
   - Tekan tombol `Ctrl + Shift + L`, **ATAU**
   - Klik ikon gembok **Devlika Master Lock** di toolbar kanan atas browser, lalu klik tombol **"Kunci Seluruh Browser"**.

6. **Mengubah Pengaturan Auto-Lock & Kata Sandi**:
   - Klik ikon **Devlika Master Lock** di toolbar -> pilih tab **"Setelan"**.
   - Anda dapat memilih waktu jeda kunci otomatis saat komputer ditinggal diam.
   - Klik **"Ganti Master Password"** untuk memperbarui kata sandi.

---

## 📁 Struktur File Ekstensi

```
d:\WebServer\www\extensions\devlika-master-lock/
├── manifest.json              # Konfigurasi Chromium Manifest V3
├── background.js             # Background Service Worker (Frameless Popup Lock, Tab-scoped rules & navigasi)
├── crypto.js                 # Modul Web Crypto API (PBKDF2 + SHA-256 + Salt)
├── lock.html                 # Antarmuka layar kunci & wizard setup
├── lock.css                  # Desain dark-mode glassmorphism modern
├── lock.js                   # Logika input, validasi, & feedback layar kunci
├── popup.html                # Menu kontrol cepat di toolbar
├── popup.css                 # Styling menu popup
├── popup.js                  # Logika menu popup, toggle switch, & ganti sandi
├── icons/                    # Ikon gembok resolusi tinggi (16, 32, 48, 128 px)
├── README.md                 # Dokumentasi Bahasa Inggris (English Documentation)
└── README.id.md              # Dokumentasi Bahasa Indonesia
```

---
**Created & Maintained by devlika** 🚀
