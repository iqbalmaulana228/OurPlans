// Public guest portal API. Secrets remain on the server; guests never receive service-role credentials.
const cleanText = (v, n = 500) => String(v ?? "").trim().slice(0, n);
const send = (res, status, body) => res.status(status).setHeader("Cache-Control", "no-store").json(body);
function config() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !service || !anon) throw new Error("Supabase guest API belum dikonfigurasi.");
  return { url, service, anon };
}
async function db(c, path, options = {}) {
  const r = await fetch(c.url + path, { ...options, headers: { apikey: c.service, Authorization: "Bearer " + c.service, "Content-Type": "application/json", ...(options.headers || {}) } });
  const raw = await r.text(); let data = null; try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!r.ok) throw new Error(data?.message || data?.hint || raw || "Supabase request failed");
  return data;
}
async function getRecord(c, id) {
  const rows = await db(c, "/rest/v1/wedding_guest_data?wedding_id=eq." + encodeURIComponent(id) + "&select=payload,owner_id");
  return rows?.[0] || null;
}
async function saveRecord(c, id, ownerId, payload) {
  await db(c, "/rest/v1/wedding_guest_data", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify({ wedding_id: id, owner_id: ownerId, payload, updated_at: new Date().toISOString() }) });
}
async function verifyUser(c, req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("Silakan login sebagai pemilik wedding untuk publish portal.");
  const r = await fetch(c.url + "/auth/v1/user", { headers: { apikey: c.anon, Authorization: "Bearer " + token } });
  if (!r.ok) throw new Error("Sesi login tidak valid. Login ulang lalu publish portal.");
  const user = await r.json(); if (!user?.id) throw new Error("User tidak valid.");
  return user.id;
}
function publicPayload(payload = {}) {
  const guests = Array.isArray(payload.guests) ? payload.guests : [];
  return {
    couple: cleanText(payload.couple, 120), bride: cleanText(payload.bride, 80), groom: cleanText(payload.groom, 80),
    date: cleanText(payload.date, 30), venue: cleanText(payload.venue, 180), address: cleanText(payload.address, 400),
    ceremony: cleanText(payload.ceremony, 180), reception: cleanText(payload.reception, 180),
    timeline: (Array.isArray(payload.timeline) ? payload.timeline : []).slice(0, 80).map(x => ({ time: cleanText(x.time, 10), event: cleanText(x.event, 120), location: cleanText(x.location, 180) })),
    menu: {
      starters: (payload.menu?.starters || []).slice(0, 20).map(x => ({ name: cleanText(x.name, 100), description: cleanText(x.description, 240) })),
      mains: (payload.menu?.mains || []).slice(0, 20).map(x => ({ name: cleanText(x.name, 100), description: cleanText(x.description, 240) })),
      desserts: (payload.menu?.desserts || []).slice(0, 20).map(x => ({ name: cleanText(x.name, 100), description: cleanText(x.description, 240) }))
    },
    guests: guests.slice(0, 2000).map(g => ({ name: cleanText(g.name, 100), table: cleanText(g.table, 40), inviteToken: cleanText(g.inviteToken, 100), rsvp: cleanText(g.rsvp, 30), message: cleanText(g.message, 500) })),
    gallery: (Array.isArray(payload.gallery) ? payload.gallery : []).slice(-80).map(g => ({ id: cleanText(g.id, 100), url: cleanText(g.url, 1000), caption: cleanText(g.caption, 180) }))
  };
}
module.exports = async function handler(req, res) {
  try {
    const c = config();
    if (req.method === "GET") {
      const id = cleanText(req.query.id, 80);
      if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return send(res, 400, { error: "Wedding ID tidak valid." });
      const row = await getRecord(c, id);
      if (!row) return send(res, 404, { error: "Portal belum dipublish oleh pemilik wedding." });
      // Never expose personal invitation tokens in the public wedding directory.
      const payload = publicPayload(row.payload);
      const token = cleanText(req.query.token, 100);
      const current = token ? (row.payload.guests || []).find(g => g.inviteToken === token) : null;
      payload.guests = (payload.guests || []).map(({ inviteToken, ...guest }) => guest);
      payload.currentGuest = current ? { name: cleanText(current.name, 100), rsvp: cleanText(current.rsvp, 30), message: cleanText(current.message, 500) } : null;
      return send(res, 200, { payload });
    }
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
    const body = req.body || {}, id = cleanText(body.weddingId, 80);
    if (!/^[a-zA-Z0-9_-]{8,80}$/.test(id)) return send(res, 400, { error: "Wedding ID tidak valid." });
    if (body.action === "publish") {
      const ownerId = await verifyUser(c, req);
      const payload = publicPayload(body.payload);
      await saveRecord(c, id, ownerId, payload);
      return send(res, 200, { ok: true, url: "/guest.html?id=" + encodeURIComponent(id) });
    }
    if (body.action === "sync") {
      const ownerId = await verifyUser(c, req);
      const row = await getRecord(c, id);
      if (!row) return send(res, 404, { error: "Portal wedding belum tersedia." });
      if (row.owner_id !== ownerId) return send(res, 403, { error: "Akses workspace ditolak." });
      return send(res, 200, { payload: row.payload });
    }
    const row = await getRecord(c, id);
    if (!row) return send(res, 404, { error: "Portal wedding belum tersedia." });
    if (body.action === "rsvp") {
      const token = cleanText(body.token, 100), answer = cleanText(body.answer, 30);
      if (!["Hadir", "Tidak hadir"].includes(answer)) return send(res, 400, { error: "Pilihan RSVP tidak valid." });
      const guest = (row.payload.guests || []).find(g => g.inviteToken === token);
      if (!guest) return send(res, 403, { error: "Tautan undangan tidak valid." });
      guest.rsvp = answer; guest.message = cleanText(body.message, 500);
      await saveRecord(c, id, row.owner_id, row.payload);
      return send(res, 200, { ok: true });
    }
    if (body.action === "gallery") {
      const dataUrl = String(body.image || "");
      const match = dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) return send(res, 400, { error: "Format gambar harus JPG, PNG, atau WebP." });
      const buffer = Buffer.from(match[2], "base64");
      if (!buffer.length || buffer.length > 2 * 1024 * 1024) return send(res, 413, { error: "Ukuran gambar maksimal 2 MB." });
      const ext = match[1].split("/")[1].replace("jpeg", "jpg"), objectPath = id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2) + "." + ext;
      const upload = await fetch(c.url + "/storage/v1/object/wedding-gallery/" + objectPath, { method: "POST", headers: { apikey: c.service, Authorization: "Bearer " + c.service, "Content-Type": match[1], "x-upsert": "false" }, body: buffer });
      if (!upload.ok) return send(res, 502, { error: "Upload gagal. Pastikan bucket wedding-gallery sudah dibuat." });
      const url = c.url + "/storage/v1/object/public/wedding-gallery/" + objectPath;
      row.payload.gallery = row.payload.gallery || [];
      row.payload.gallery.push({ id: objectPath, url, caption: cleanText(body.caption, 180) });
      row.payload.gallery = row.payload.gallery.slice(-80);
      await saveRecord(c, id, row.owner_id, row.payload);
      return send(res, 200, { ok: true, image: { id: objectPath, url, caption: cleanText(body.caption, 180) } });
    }
    return send(res, 400, { error: "Action tidak dikenal." });
  } catch (error) {
    return send(res, 500, { error: error.message || "Guest API error" });
  }
};
