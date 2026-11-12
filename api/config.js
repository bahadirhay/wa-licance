const { supabase } = require("../lib/supabase");
const { verifyToken } = require("../lib/jwt");

module.exports = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "gecersiz_veya_suresi_gecmis_token" });
  }

  // Once lisansa ozel ayar var mi bak, yoksa global (license_id null) ayari don
  let { data: cfg } = await supabase
    .from("configs")
    .select("*")
    .eq("license_id", payload.license_id)
    .maybeSingle();

  if (!cfg) {
    const { data: globalCfg } = await supabase
      .from("configs")
      .select("*")
      .is("license_id", null)
      .maybeSingle();
    cfg = globalCfg;
  }

  if (!cfg) {
    return res.status(404).json({ error: "ayar_bulunamadi" });
  }

  return res.status(200).json({
    wait_between: cfg.wait_between,
    break_every: cfg.break_every,
    break_wait: cfg.break_wait,
    selectors: cfg.selectors,
    message_template: cfg.message_template,
  });
};
