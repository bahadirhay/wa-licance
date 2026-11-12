const { supabase } = require("../lib/supabase");
const { issueToken } = require("../lib/jwt");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { license_key, device_id } = req.body || {};
  if (!license_key || !device_id) {
    return res.status(400).json({ error: "license_key ve device_id gerekli" });
  }

  const { data: license, error } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key", license_key)
    .single();

  if (error || !license) {
    return res.status(403).json({ error: "gecersiz_lisans" });
  }
  if (license.status !== "active") {
    await logEvent(license.id, device_id, "verify_fail", `status=${license.status}`);
    return res.status(403).json({ error: "lisans_aktif_degil" });
  }
  if (license.expires_at && new Date(license.expires_at) < new Date()) {
    await logEvent(license.id, device_id, "verify_fail", "expired");
    return res.status(403).json({ error: "lisans_suresi_dolmus" });
  }

  // Cihaz zaten kayıtlı mı?
  const { data: existingDevice } = await supabase
    .from("devices")
    .select("*")
    .eq("license_id", license.id)
    .eq("device_id", device_id)
    .maybeSingle();

  if (existingDevice) {
    await supabase
      .from("devices")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", existingDevice.id);
  } else {
    const { count } = await supabase
      .from("devices")
      .select("*", { count: "exact", head: true })
      .eq("license_id", license.id);

    if ((count || 0) >= license.max_devices) {
      await logEvent(license.id, device_id, "verify_fail", "device_limit");
      return res.status(403).json({ error: "cihaz_limiti_asildi" });
    }
    await supabase.from("devices").insert({ license_id: license.id, device_id });
  }

  await logEvent(license.id, device_id, "verify_ok", null);

  const token = issueToken({ license_id: license.id, device_id });
  return res.status(200).json({ ok: true, token, customer_name: license.customer_name });
};

async function logEvent(license_id, device_id, kind, detail) {
  try {
    await supabase.from("events").insert({ license_id, device_id, kind, detail });
  } catch (e) {
    // loglama basarisiz olsa da akisi bozma
  }
}
