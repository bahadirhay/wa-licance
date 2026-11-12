const { supabase } = require("../lib/supabase");
const { verifyToken } = require("../lib/jwt");

// Ajan, run_start / run_stop / error gibi durumları buraya kısaca bildirir.
// Bu, hangi lisansın ne zaman çalıştığını Supabase'ten takip etmeni sağlar.
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "gecersiz_veya_suresi_gecmis_token" });
  }

  const { kind, detail } = req.body || {};
  if (!kind) return res.status(400).json({ error: "kind gerekli" });

  await supabase.from("events").insert({
    license_id: payload.license_id,
    device_id: payload.device_id,
    kind,
    detail: detail || null,
  });

  return res.status(200).json({ ok: true });
};
