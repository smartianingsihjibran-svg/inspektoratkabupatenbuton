-- ============================================================
--  schema.sql — Struktur Database Supabase
--  Inspektorat Kabupaten Buton
--
--  Jalankan SELURUH isi file ini di:
--  Supabase Dashboard  ->  SQL Editor  ->  New query  ->  Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. Tabel LHP  (Laporan Hasil Pemeriksaan — modul SiLHP)
-- ────────────────────────────────────────────────────────────
create table if not exists public.lhp (
  id           uuid primary key default gen_random_uuid(),
  nomor        text,
  judul        text,
  surat_tugas  text,
  tahun        text,
  maksud       text,
  jenis        text,
  tanggal      date,
  drive_folder text,
  created_at   timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 2. Tabel KV STORE  (penyimpanan umum key-value)
--    Dipakai oleh: BOS Reviu, JKN Reviu, TGR/SiTLT,
--    Pengaturan SiLHP, Progress SiAI, daftar user, dll.
-- ────────────────────────────────────────────────────────────
create table if not exists public.kv_store (
  id         text primary key,        -- contoh: "bos_users", "sitlt_data"
  data       jsonb,                   -- isi data (apa saja)
  updated_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────
-- 3. KEAMANAN (Row Level Security)
--
--    Kedua tabel kita kunci total: TIDAK ADA akses dari browser
--    (anon / authenticated). Semua baca-tulis HANYA lewat
--    Netlify Function yang memakai SERVICE ROLE KEY (server-side),
--    sehingga data aman dari manipulasi langsung.
--
--    Service role secara otomatis melewati (bypass) RLS,
--    jadi cukup AKTIFKAN RLS tanpa membuat policy apa pun.
-- ────────────────────────────────────────────────────────────
alter table public.lhp      enable row level security;
alter table public.kv_store enable row level security;

-- (Sengaja TIDAK membuat policy apa pun = default tertutup untuk publik.)

-- ────────────────────────────────────────────────────────────
-- 4. Indeks bantu (opsional, untuk performa)
-- ────────────────────────────────────────────────────────────
create index if not exists lhp_tahun_idx   on public.lhp (tahun);
create index if not exists lhp_jenis_idx   on public.lhp (jenis);
create index if not exists lhp_tanggal_idx on public.lhp (tanggal desc);

-- Selesai. Anda akan melihat dua tabel: "lhp" dan "kv_store".
