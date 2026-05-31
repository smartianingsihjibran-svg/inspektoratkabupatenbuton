/* ============================================================
   api.js — Netlify Serverless Function
   Inspektorat Kabupaten Buton — Backend API

   Satu fungsi ini menangani SEMUA kebutuhan database:
     • KV store  (untuk modul BOS Reviu, JKN Reviu, TGR/SiTLT,
                  Pengaturan SiLHP, Progress SiAI, dll.)
     • LHP CRUD  (untuk modul SiLHP — Input/Rekap LHP)

   Kunci Supabase SERVICE ROLE disimpan di sini (sisi server),
   TIDAK PERNAH terkirim ke browser. Aman.

   Endpoint (lewat redirect /api/* di netlify.toml):
     GET    /api/kv/:key            -> ambil 1 nilai kv
     PUT    /api/kv/:key   {value}  -> simpan 1 nilai kv
     GET    /api/lhp                -> daftar semua LHP
     POST   /api/lhp       {record} -> tambah LHP
     PUT    /api/lhp/:id   {record} -> ubah LHP
     DELETE /api/lhp/:id            -> hapus LHP
   ============================================================ */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Content-Type": "application/json",
};

function reply(statusCode, body) {
  return { statusCode, headers: CORS, body: JSON.stringify(body) };
}

/* Pemanggil REST Supabase (pakai fetch bawaan Node 18+ di Netlify) */
async function sb(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!res.ok) {
    const msg = (data && data.message) ? data.message : `Supabase error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* Pemetaan kolom DB <-> field aplikasi untuk tabel lhp */
function fromDB(r) {
  return {
    id: r.id, nomor: r.nomor, judul: r.judul, suratTugas: r.surat_tugas,
    tahun: r.tahun, maksud: r.maksud, jenis: r.jenis, tanggal: r.tanggal,
    driveFolder: r.drive_folder, createdAt: r.created_at,
  };
}
function toDB(rec) {
  return {
    nomor: rec.nomor || null,
    judul: rec.judul || null,
    surat_tugas: rec.suratTugas || null,
    tahun: rec.tahun || null,
    maksud: rec.maksud || null,
    jenis: rec.jenis || null,
    tanggal: (rec.tanggal && rec.tanggal.length) ? rec.tanggal : null,
    drive_folder: rec.driveFolder || null,
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return reply(200, {});

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return reply(500, { error: "Server belum dikonfigurasi. Set SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY di Netlify." });
  }

  // Ambil path setelah /api/  (mis. "kv/bos_users" atau "lhp/123")
  let route = (event.path || "").replace(/^.*\/api\//, "").replace(/\/+$/, "");
  const parts = route.split("/").filter(Boolean);
  const resource = parts[0];           // "kv" | "lhp"
  const idOrKey  = parts.slice(1).join("/"); // sisa
  const method   = event.httpMethod;
  let payload = {};
  try { payload = event.body ? JSON.parse(event.body) : {}; } catch (_) {}

  try {
    /* ───────── KV STORE ───────── */
    if (resource === "kv") {
      const key = decodeURIComponent(idOrKey || "");
      if (!key) return reply(400, { error: "Key kosong." });

      if (method === "GET") {
        const rows = await sb(`kv_store?id=eq.${encodeURIComponent(key)}&select=data`);
        const val = (rows && rows[0]) ? rows[0].data : null;
        return reply(200, { value: val });
      }
      if (method === "PUT" || method === "POST") {
        await sb(`kv_store?on_conflict=id`, {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({ id: key, data: payload.value, updated_at: new Date().toISOString() }),
        });
        return reply(200, { ok: true });
      }
      return reply(405, { error: "Metode tidak didukung." });
    }

    /* ───────── LHP CRUD ───────── */
    if (resource === "lhp") {
      if (method === "GET") {
        const rows = await sb(`lhp?select=*&order=tanggal.desc.nullslast`);
        return reply(200, { data: (rows || []).map(fromDB) });
      }
      if (method === "POST") {
        const rows = await sb(`lhp`, {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(toDB(payload)),
        });
        return reply(200, { data: fromDB(rows[0]) });
      }
      if (method === "PUT") {
        if (!idOrKey) return reply(400, { error: "ID kosong." });
        await sb(`lhp?id=eq.${encodeURIComponent(idOrKey)}`, {
          method: "PATCH",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(toDB(payload)),
        });
        return reply(200, { ok: true });
      }
      if (method === "DELETE") {
        if (!idOrKey) return reply(400, { error: "ID kosong." });
        await sb(`lhp?id=eq.${encodeURIComponent(idOrKey)}`, { method: "DELETE", headers: { Prefer: "return=minimal" } });
        return reply(200, { ok: true });
      }
      return reply(405, { error: "Metode tidak didukung." });
    }

    return reply(404, { error: "Endpoint tidak ditemukan: " + route });
  } catch (e) {
    return reply(e.status || 500, { error: e.message || "Kesalahan server." });
  }
};
