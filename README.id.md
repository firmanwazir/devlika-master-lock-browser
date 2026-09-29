# Devlika Master Lock

Ekstensi pengunci browser berbasis Chromium (Chrome, Brave, Edge, Opera) menggunakan Master Password. Dapat mengunci seluruh browser saat dibuka atau idle, serta mengunci tab tertentu atau website tertentu.

[English](README.md) | [Bahasa Indonesia](README.id.md)

---

## Fitur

- **Kunci Saat Browser Dibuka**: Meminta master password setiap kali browser dibuka sebelum bisa mengakses tab.
- **Kunci Tab Tertentu**: Mengunci tab tertentu lewat klik kanan atau menu popup.
- **Kunci Website / Link**: Memblokir domain (contoh: `youtube.com`), subdomain (`web.whatsapp.com`), atau URL tertentu (`facebook.com/messages`).
- **Isolasi Per Tab (Tab-Scoped)**: Membuka website di satu tab hanya berlaku untuk tab tersebut. Membuka website yang sama di tab baru tetap meminta password.
- **Toggle Aktif / Nonaktif**: Mengaktifkan atau menonaktifkan aturan website langsung dari menu popup tanpa perlu menghapus daftar.
- **Auto-Lock Saat Idle**: Pilihan jeda waktu (1 - 60 menit) untuk mengunci browser otomatis jika komputer tidak digunakan.
- **Keamanan Sandi**: Menggunakan Web Crypto API PBKDF2 (SHA-256) dengan salt 128-bit. Kata sandi tidak disimpan dalam bentuk teks biasa.
- **Proteksi Brute-Force**: Cooldown 30 detik jika salah memasukkan password 5 kali berturut-turut.
- **Shortcut Keyboard**: `Ctrl + Shift + L` (atau `Cmd + Shift + L` di Mac) untuk mengunci seketika.

---

## Cara Pasang

1. Buka halaman ekstensi di browser:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
2. Aktifkan **Mode Pengembang** (toggle di pojok kanan atas).
3. Klik **Muat belum dibongkar** (Load unpacked) lalu pilih folder ekstensi ini.
4. *(Disarankan)* Buka **Detail** ekstensi lalu aktifkan **Izinkan dalam mode Samaran** agar tidak bisa di-bypass lewat mode incognito.

---

## Cara Pakai

1. **Setup Awal**: Masukkan master password (minimal 4 karakter) dan petunjuk sandi opsional saat pertama kali dipasang.
2. **Mengunci Tab**: Klik kanan di halaman tab -> pilih **"Kunci Tab Ini Saja"**, atau klik **"Kunci Tab Ini"** di popup.
3. **Mengunci Website**:
   - Klik kanan di halaman web -> pilih **"Kunci Seluruh Website Ini (Domain)"**, atau
   - Buka tab **Website** di popup ekstensi, masukkan domain/link, lalu klik **+ Tambah**.
4. **Mengatur Toggle Website**: Di tab **Website** popup, geser switch ON/OFF untuk mengaktifkan atau mematikan proteksi website tertentu.
5. **Mengunci Browser**: Tekan `Ctrl + Shift + L` atau klik **"Kunci Seluruh Browser"** di popup.

---

## Struktur File

```
├── manifest.json       # Konfigurasi Manifest V3
├── background.js      # Service worker kontrol navigasi dan tab
├── crypto.js          # Helper hashing PBKDF2
├── lock.html / .js    # Tampilan dan logika layar kunci
├── popup.html / .js   # Menu toolbar popup dan manajemen aturan
├── lock.css / popup.css
└── icons/             # Ikon ekstensi
```

---

Author: devlika
