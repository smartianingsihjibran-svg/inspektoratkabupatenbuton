# Website Inspektorat Kabupaten Buton — Backend Permanen

Paket ini membuat **database permanen** untuk website Inspektorat Kabupaten Buton.
Setelah dipasang, **semua data yang diinput akan tersimpan di server** dan
**muncul di semua perangkat** (tidak lagi hanya tersimpan di browser/`localStorage`).

Modul yang datanya kini tersimpan permanen di database:

- **SiLHP** — Laporan Hasil Pemeriksaan (Input/Rekap LHP) + Pengaturan folder Drive
- **TGR / SiTLT** — data tindak lanjut & notifikasi
- **BOS Reviu** — daftar user, data tim, info sekolah
- **JKN Reviu** — daftar user, data tim
- **SiAI Investigatif** — progress/kemajuan
- **Pemeriksaan (APIP)** — halaman dengan login

> **Cara kerja singkat:** Browser tidak lagi memegang kunci database.
> Semua data lewat **Netlify Function** (`/api/*`) yang berjalan di server dan
> memakai *Service Role Key* Supabase yang rahasia. Aman dari manipulasi langsung.

---

## Isi Paket

```
.
├── index.html              ← website (sudah disambungkan ke backend)
├── netlify.toml            ← konfigurasi Netlify + pengalihan /api/*
├── package.json            ← metadata proyek (Node 18+)
├── schema.sql              ← struktur tabel untuk Supabase
├── README.md               ← panduan ini
└── netlify/
    └── functions/
        └── api.js          ← fungsi serverless (penghubung ke Supabase)
```

---

## Yang Perlu Disiapkan (gratis)

1. Akun **GitHub** — https://github.com
2. Akun **Supabase** — https://supabase.com (database gratis)
3. Akun **Netlify** — https://netlify.com (hosting gratis)

---

## LANGKAH 1 — Buat Database di Supabase

1. Masuk ke https://supabase.com → **New project**.
2. Isi **Name** (mis. `inspektorat-buton`), buat **Database Password** (catat),
   pilih Region terdekat (mis. *Southeast Asia (Singapore)*) → **Create new project**.
   Tunggu ± 2 menit sampai proyek siap.
3. Di menu kiri pilih **SQL Editor** → **New query**.
4. Buka file **`schema.sql`**, salin **seluruh isinya**, tempel ke editor, lalu klik **Run**.
   Jika berhasil akan muncul "Success". (Cek menu **Table Editor** — ada 2 tabel:
   `lhp` dan `kv_store`.)
5. Ambil kunci yang dibutuhkan: menu **Project Settings** (ikon gerigi) → **API**.
   Catat dua hal ini:
   - **Project URL** → contoh: `https://xxxxxxxx.supabase.co`
   - **service_role** key (di bagian *Project API keys*, klik *Reveal*) →
     **INI RAHASIA, jangan pernah ditaruh di `index.html` atau dibagikan.**

---

## LANGKAH 2 — Unggah ke GitHub

**Cara mudah (lewat website GitHub):**

1. Buka https://github.com/new → beri nama repo (mis. `website-inspektorat-buton`)
   → pilih **Public** atau **Private** → **Create repository**.
2. Di halaman repo, klik **uploading an existing file**.
3. Seret-lepas **semua isi paket ini** (termasuk folder `netlify`) ke area unggah.
   Pastikan struktur folder ikut terunggah (`netlify/functions/api.js`).
4. Klik **Commit changes**.

**Cara lewat Git (opsional, bila terbiasa terminal):**

```bash
git init
git add .
git commit -m "Backend permanen Inspektorat Buton"
git branch -M main
git remote add origin https://github.com/USERNAME/website-inspektorat-buton.git
git push -u origin main
```

---

## LANGKAH 3 — Hosting di Netlify

1. Masuk ke https://app.netlify.com → **Add new site** → **Import an existing project**.
2. Pilih **GitHub**, izinkan akses, lalu pilih repo yang tadi dibuat.
3. Bagian **Build settings** biarkan default (sudah dibaca dari `netlify.toml`):
   - Build command: *(kosong)*
   - Publish directory: `.`
   - Functions directory: `netlify/functions`
4. Klik **Deploy site**. Tunggu sampai status **Published**.

---

## LANGKAH 4 — Masukkan Kunci Rahasia (WAJIB)

Tanpa langkah ini, database tidak akan jalan.

1. Di dashboard situs Netlify → **Site configuration** → **Environment variables**
   → **Add a variable** → **Add a single variable**. Tambahkan **dua** variabel:

   | Key                          | Value                                   |
   |------------------------------|-----------------------------------------|
   | `SUPABASE_URL`               | Project URL dari Supabase (Langkah 1.5) |
   | `SUPABASE_SERVICE_ROLE_KEY`  | service_role key dari Supabase          |

2. Setelah disimpan, lakukan **redeploy** agar variabel terbaca:
   menu **Deploys** → **Trigger deploy** → **Deploy site**.

Selesai. Situs Anda sudah online dengan database permanen 🎉

---

## LANGKAH 5 — Uji Coba

1. Buka alamat situs Netlify Anda (mis. `https://namasitus.netlify.app`).
2. Masuk ke menu **LHP** → login (default **admin** / **admin1**) → tambah satu LHP.
3. Buka situs yang sama di **HP atau browser lain** → data LHP tadi **harus muncul**.
   Jika muncul, sinkronisasi antar-perangkat sudah berhasil.

---

## Akun Login Default

| Modul                | Username      | Password               |
|----------------------|---------------|------------------------|
| SiLHP (menu LHP)     | `admin`       | `admin1`               |
| Pemeriksaan (APIP)   | `inspektorat` | `inspektoratkabbuton`  |

> Modul BOS Reviu & JKN Reviu memakai daftar user sendiri yang kini juga
> tersimpan di database. **Disarankan mengganti password default** dengan
> mengubahnya di kode (`index.html`) lalu commit & redeploy.

---

## Pemecahan Masalah

- **Data tetap tidak muncul di perangkat lain**
  Pastikan kedua *environment variable* sudah benar dan situs sudah **di-redeploy**
  sesudah variabel ditambahkan. Buka **Console** browser (F12) — bila ada error
  `Server belum dikonfigurasi`, berarti variabel belum terbaca.
- **Halaman tampil tapi tombol simpan gagal**
  Cek menu **Functions** di Netlify → klik fungsi `api` → lihat **Logs** untuk pesan error.
  Error `Supabase error 401/403` biasanya berarti `SUPABASE_SERVICE_ROLE_KEY` salah.
- **Tabel tidak ada / error relasi**
  Ulangi **Langkah 1.4** (jalankan `schema.sql`) di Supabase SQL Editor.
- **Mengganti database**
  Cukup ubah kedua environment variable di Netlify ke proyek Supabase yang baru,
  lalu redeploy. Tidak perlu mengubah kode.

---

## Keamanan

- Kunci `service_role` **hanya** disimpan sebagai *environment variable* di Netlify
  (sisi server). Browser **tidak pernah** menerimanya.
- Tabel `lhp` dan `kv_store` diaktifkan **Row Level Security** tanpa policy publik,
  sehingga **tidak bisa** diakses langsung dari luar — hanya lewat fungsi `/api`.
