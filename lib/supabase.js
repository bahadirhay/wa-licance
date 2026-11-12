const { createClient } = require("@supabase/supabase-js");

// SUPABASE_SERVICE_ROLE_KEY — gizli anahtar, sadece bu sunucu tarafında kullanılır.
// Bunu asla müşteri tarafına (ajana) veya tarayıcıya göndermiyoruz.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

module.exports = { supabase };
