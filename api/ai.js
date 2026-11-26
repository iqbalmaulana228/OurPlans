// Vercel Function: secure Gemini proxy for the OurPlans AI planner.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
function send(res, status, body) { return res.status(status).setHeader("Cache-Control", "no-store").json(body); }
function clean(value, max = 180) { return String(value || "").trim().slice(0, max); }
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed" });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return send(res, 503, { error: "AI belum dikonfigurasi. Tambahkan GEMINI_API_KEY di Vercel Environment Variables." });
  const body = req.body || {};
  const action = body.action;
  let prompt = "";
  let json = false;
  if (action === "wisdom") {
    prompt = "You are a calm, practical wedding planning concierge. Give one useful, kind, concrete piece of wedding-planning advice in Bahasa Indonesia. Maximum 2 sentences. Avoid clichés.";
  } else if (action === "palette") {
    json = true;
    const theme = clean(body.theme, 120), skin = clean(body.skinTone), hair = clean(body.hairColor), eyes = clean(body.eyeColor), preferences = clean(body.preferences, 300), avoids = clean(body.avoids, 300);
    prompt = `Act as an expert personal color analyst and wedding stylist. Inputs: wedding theme=${theme}; skin tone=${skin}; hair=${hair}; eyes=${eyes}; preferences=${preferences}; avoid=${avoids}. Infer a tentative 12-season color family from the supplied descriptions and explain uncertainty; do not claim medical or scientific certainty. Propose exactly 5 distinct bridesmaid dress colors compatible with the theme and complexion. Unless explicitly requested, exclude bridal white/ivory/cream, pure black and vivid signal red. Return only JSON: {"season":"...","analysis":"...","palette":[{"name":"...","hex":"#RRGGBB","reason":"..."}]}. Valid hex codes only.`;
  } else return send(res, 400, { error: "Unknown action" });
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: json ? { responseMimeType: "application/json", temperature: 0.65 } : { temperature: 0.75 } })
    });
    const data = await response.json();
    if (!response.ok) return send(res, 502, { error: data.error?.message || "Gemini API request failed" });
    const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("").trim();
    if (!text) return send(res, 502, { error: "AI tidak mengembalikan jawaban." });
    if (json) {
      const parsed = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/,"").trim());
      if (!Array.isArray(parsed.palette) || parsed.palette.length !== 5) return send(res, 502, { error: "Format hasil palet tidak valid." });
      parsed.palette = parsed.palette.map(p => ({ name: clean(p.name, 80), hex: /^#[0-9a-f]{6}$/i.test(p.hex) ? p.hex : "#879985", reason: clean(p.reason, 240) }));
      return send(res, 200, parsed);
    }
    return send(res, 200, { text });
  } catch (error) {
    return send(res, 500, { error: error.message || "AI request failed" });
  }
};
