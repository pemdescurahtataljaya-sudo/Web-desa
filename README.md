# 🏘️ Website Resmi Desa Curah Tatal

**Sistem Informasi & Profil Digital Desa Curah Tatal, Kecamatan Arjasa, Kabupaten Situbondo, Jawa Timur**

> Dibangun dengan ❤️ untuk mendukung transparansi, digitalisasi, dan kemajuan Desa Curah Tatal.

---

## 📋 Deskripsi Project

Website Desa Curah Tatal adalah platform digital lengkap yang mencakup **website publik** untuk warga dan pengunjung, **panel admin** untuk pengelolaan konten oleh perangkat desa, serta **backend API** sebagai penghubung data. Seluruh sistem dirancang agar mudah dikelola tanpa keahlian teknis khusus.

---

## 🏗️ Arsitektur Sistem

```
┌──────────────────────┐     ┌──────────────────────┐     ┌──────────────────────┐
│   PUBLIC WEBSITE     │     │    ADMIN PANEL        │     │    BACKEND API       │
│   (React + Vite)     │     │    (React + Vite)     │     │    (Node.js Express) │
│                      │     │                      │     │                      │
│  curahtatal.com      │────▶│  admin.curahtatal.com │────▶│  data.curahtatal.com │
│                      │     │                      │     │         │            │
│  - Landing Page      │     │  - Dashboard CRUD    │     │         ▼            │
│  - Profil Desa       │     │  - Upload Media      │     │   ┌──────────┐      │
│  - Infografis        │     │  - Pengaturan Web    │     │   │  MySQL   │      │
│  - Peta & Lokasi     │     │  - Manajemen Data    │     │   │ Database │      │
│  - Berita/Kegiatan   │     │                      │     │   └──────────┘      │
└──────────────────────┘     └──────────────────────┘     └──────────────────────┘
```

---

## ✨ Scope & Fitur Lengkap

### 🌐 Website Publik (`public-web/`)

| Fitur | Deskripsi |
|-------|-----------|
| **Landing Page** | Hero slider dinamis, sambutan kepala desa, statistik penduduk, berita terbaru |
| **Profil Desa** | Visi & Misi, Sejarah & Asal Usul, Geografis & Batas Wilayah, Data Dusun |
| **Perangkat Desa** | Kartu aparat pemerintah desa (foto 3x4, jabatan, kontak WA & email) |
| **Infografis Penduduk** | Grafik interaktif (Chart.js) — piramida umur, pie chart pekerjaan, bar chart agama & pendidikan |
| **APB Desa** | Tabel Anggaran Pendapatan & Belanja Desa per tahun (Pendapatan, Belanja, Pembiayaan) |
| **Laporan Realisasi** | Narasi realisasi anggaran, galeri foto dokumentasi bukti realisasi |
| **RKP Desa** | Rencana Kerja Pemerintah Desa — narasi & dokumen lampiran (PDF) |
| **Kegiatan & Berita** | Daftar kegiatan/berita desa dengan thumbnail, deskripsi, dan galeri dokumentasi |
| **Peta & Lokasi** | Daftar titik lokasi penting desa (kantor desa, masjid, wisata, dll) dengan link Google Street View & Navigasi |
| **Data Desa** | Ringkasan seluruh data desa dalam format tabel terstruktur |
| **Footer Dinamis** | Alamat, email, kontak WhatsApp (klik langsung buka WA) |
| **Tema Warna Dinamis** | Warna tema website dapat diubah dari Admin Panel |
| **SEO Optimized** | Meta tags, semantic HTML, responsive design |

### 🔐 Panel Admin (`admin-web/`)

| Fitur | Deskripsi |
|-------|-----------|
| **Login & Autentikasi** | Proteksi akses admin dengan username & password |
| **Tata Kelola Penduduk** | Edit data total penduduk, KK, jenis kelamin, umur, pekerjaan, agama, pendidikan |
| **APB Desa** | Input anggaran per tahun — detail kategori pendapatan, belanja, pembiayaan |
| **Laporan Realisasi** | Upload narasi & galeri foto realisasi anggaran per tahun |
| **RKP Desa** | Upload dokumen RKP per tahun dengan narasi pengantar |
| **Kegiatan Lainnya** | CRUD berita/kegiatan — thumbnail crop 16:9, upload dokumentasi (maks 10 foto), animasi loading saat simpan |
| **Profil Desa** | Edit Visi Misi, Sejarah, Geografis, Dusun, Sejarah Kepala Desa, Perangkat Desa, BPD, Sarana & Prasarana |
| **Kartu Aparat** | Upload foto 3x4 (auto-crop 3:4), nama, jabatan, kontak WA & email |
| **Peta & Lokasi** | Tambah/edit/hapus titik lokasi desa — nama, deskripsi, foto utama (crop 16:9), link Street View & rute |
| **Pengaturan Web** | Ubah warna tema, hero slider, deskripsi footer, alamat, email, kontak WhatsApp |
| **Kontak & WhatsApp** | Kelola daftar kontak WA desa (nama + nomor), otomatis generate link `wa.me` di website publik |
| **Backup & Restore** | Export seluruh data website ke file JSON & import kembali dari backup |

### ⚙️ Backend API (`backend/`)

| Fitur | Deskripsi |
|-------|-----------|
| **RESTful API** | Endpoint lengkap untuk semua fitur CRUD |
| **Upload & Kompresi Gambar** | Otomatis konversi ke WebP, resize maks 1200px, kompresi cepat via `sharp` |
| **Upload Paralel** | Pemrosesan multi-foto secara bersamaan (`Promise.all`) untuk kecepatan optimal |
| **Auto-Repair MySQL Schema** | Otomatis menambahkan kolom database yang hilang tanpa error saat update |
| **Backup & Restore API** | Export/import seluruh database dalam format JSON |
| **CORS Enabled** | Mendukung akses cross-origin dari domain admin & publik |

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | React 19, Vite, Lucide Icons, Chart.js, Leaflet, React Easy Crop |
| **Backend** | Node.js, Express.js, Multer, Sharp (image processing) |
| **Database** | MySQL (mysql2/promise) |
| **Hosting** | Shared Hosting cPanel (Phusion Passenger untuk Node.js) |
| **Domain** | `curahtatal.com` (publik), `admin.curahtatal.com` (admin), `data.curahtatal.com` (API) |

---

## 📁 Struktur Direktori

```
Curahtatal/
├── public-web/              # Website publik (React + Vite)
│   ├── src/
│   │   ├── components/      # Navbar, Footer, TypewriterText
│   │   ├── pages/           # Home, Profil, Infografis, MapPage, dll
│   │   └── utils/           # Helper URL, cropImage
│   └── dist/                # Build production
│
├── admin-web/               # Panel admin (React + Vite)
│   ├── src/
│   │   ├── pages/           # Dashboard, Login, PetaTab
│   │   └── utils/           # Helper URL, cropImage
│   └── dist/                # Build production
│
├── backend/                 # API server (Node.js + Express)
│   ├── server.js            # Seluruh endpoint API
│   ├── db.js                # Koneksi MySQL
│   ├── .env                 # Konfigurasi database (JANGAN commit!)
│   └── uploads/             # Folder file gambar yang diupload
│
├── SIAP_UPLOAD_HOSTING/     # File ZIP siap upload ke cPanel
│   ├── 1_public_web_dist.zip
│   ├── 2_admin_web_dist.zip
│   └── 3_backend.zip
│
├── create_hosting_zips.js   # Script pembuat ZIP hosting
└── README.md                # Dokumentasi ini
```

---

## 🚀 Deployment ke Hosting

### Prasyarat
- Shared Hosting dengan cPanel
- Node.js App (Phusion Passenger) aktif
- Database MySQL sudah dibuat
- 3 subdomain/domain terkonfigurasi

### Langkah Deploy
1. **Backend**: Upload & extract `3_backend.zip` ke `~/backend_app/`, setup Node.js App di cPanel, konfigurasi `.env`
2. **Admin Web**: Upload & extract `2_admin_web_dist.zip` ke `~/admin.curahtatal.com/`
3. **Public Web**: Upload & extract `1_public_web_dist.zip` ke `~/public_html/`
4. **Restart Backend**: `touch ~/backend_app/tmp/restart.txt`

---

## 🔧 Development Lokal

```bash
# Clone repository
git clone https://github.com/pemdescurahtataljaya-sudo/Web-desa.git
cd Web-desa

# Backend
cd backend
npm install
cp .env.example .env  # Sesuaikan konfigurasi database
node server.js

# Public Web (terminal baru)
cd public-web
npm install
npm run dev

# Admin Web (terminal baru)
cd admin-web
npm install
npm run dev
```

---

> [!CAUTION]
> ## ⚠️ PERINGATAN PENTING: BATASAN SHARED HOSTING & KEAMANAN DATA
>
> ### 🏠 Status Hosting Saat Ini
> Website ini saat ini di-hosting menggunakan **Shared Hosting cPanel** (bukan VPS/Cloud/Dedicated Server). Shared hosting memiliki **keterbatasan serius** dalam hal keamanan, performa, dan skalabilitas.
>
> ### 🔒 Jika Di Kemudian Hari Ingin Menambahkan Fitur Data Kependudukan Sensitif
> Apabila di masa mendatang website ini akan ditambahkan fitur yang mengelola **data kependudukan penting** seperti:
> - 📄 **Kartu Keluarga (KK)**
> - 🪪 **KTP / NIK**
> - 📋 **Data DTKS (Data Terpadu Kesejahteraan Sosial)**
> - 🏥 **Data Kesehatan Warga**
> - 📊 **Data Bantuan Sosial (PKH, BPNT, BLT)**
> - 💰 **Data Pajak & Retribusi**
>
> **MAKA WAJIB DILAKUKAN HAL-HAL BERIKUT:**
>
> 1. **🔄 GANTI METODE HOSTING** — Migrasi dari Shared Hosting ke **VPS (Virtual Private Server)** atau **Cloud Server** (contoh: DigitalOcean, AWS, Google Cloud, IDCloudHost, Biznet Gio). Shared hosting **TIDAK AMAN** untuk menyimpan data pribadi warga karena:
>    - Server dipakai bersama ratusan pengguna lain
>    - Tidak ada isolasi penuh antar akun
>    - Akses root/sudo tidak tersedia untuk hardening keamanan
>    - Tidak bisa memasang firewall kustom
>
> 2. **🔐 TINGKATKAN KEAMANAN** — Implementasikan standar keamanan berikut:
>    - **SSL/TLS** wajib (sudah ada, pertahankan)
>    - **Enkripsi database** (AES-256) untuk data sensitif
>    - **Hashing password** dengan bcrypt (salt rounds ≥ 12)
>    - **Rate limiting** untuk mencegah brute force
>    - **Input validation & sanitization** ketat
>    - **RBAC (Role-Based Access Control)** — multi-level admin
>    - **Audit log** — pencatatan siapa mengakses/mengubah data apa
>    - **Backup otomatis terenkripsi** ke lokasi terpisah
>    - **WAF (Web Application Firewall)** — Cloudflare Pro atau sejenisnya
>
> 3. **📜 KEPATUHAN REGULASI** — Pastikan mematuhi:
>    - **UU PDP (Perlindungan Data Pribadi)** No. 27 Tahun 2022
>    - **Peraturan BSSN** tentang keamanan sistem elektronik
>    - **Standar keamanan data pemerintah desa** dari Kemendes PDTT
>
> ### ⚡ Untuk Fitur Saat Ini, Shared Hosting AMAN
> Data yang saat ini dikelola (profil desa, berita, APB Desa, infografis statistik umum, foto kegiatan) bersifat **informasi publik** dan **tidak mengandung data pribadi warga**, sehingga shared hosting masih memadai.

---

## 📝 Lisensi

Hak Cipta © 2024-2026 **Pemerintah Desa Curah Tatal**, Kecamatan Arjasa, Kabupaten Situbondo, Jawa Timur.

Dikembangkan untuk kepentingan pelayanan publik dan transparansi pemerintahan desa.

---

## 👥 Kontak

- **Website**: [curahtatal.com](https://curahtatal.com)
- **Admin**: [admin.curahtatal.com](https://admin.curahtatal.com)
- **Email**: pemdes@curahtatal.desa.id
