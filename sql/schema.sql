-- wa-license Supabase şeması
-- Supabase panelinde: SQL Editor -> New query -> bunu yapıştır -> Run

create extension if not exists pgcrypto;

-- Her müşteri/salon için bir lisans kaydı
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  license_key text unique not null,          -- müşteriye verilen anahtar, ör. TCHZ-XXXX-XXXX
  customer_name text not null,                -- "Ayşe Güzellik Salonu" gibi
  status text not null default 'active',      -- active | suspended | expired
  expires_at timestamptz,                     -- null = süresiz
  max_devices int not null default 1,
  created_at timestamptz not null default now()
);

-- Bir lisansın bağlandığı cihazlar (bilgisayarlar)
create table if not exists devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references licenses(id) on delete cascade,
  device_id text not null,                    -- ajanın ürettiği sabit cihaz kimliği
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  unique(license_id, device_id)
);

-- Lisansa (veya varsayılan olarak hepsine) özel ayarlar
create table if not exists configs (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references licenses(id) on delete cascade, -- null = tüm lisanslar için varsayılan
  wait_between int not null default 45,
  break_every int not null default 10,
  break_wait int not null default 180,
  selectors jsonb not null default '{}'::jsonb,   -- WhatsApp DOM seçicileri, güncellenebilir
  message_template text,
  updated_at timestamptz not null default now()
);

-- Her doğrulama/çalışma denemesinin kısa kaydı (opsiyonel ama faydalı)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  license_id uuid references licenses(id) on delete set null,
  device_id text,
  kind text not null,                         -- verify_ok | verify_fail | run_start | run_stop | error
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists idx_devices_license on devices(license_id);
create index if not exists idx_events_license on events(license_id);

-- Örnek: ilk test lisansını oluşturmak için (çalıştırmadan önce anahtarı kendin belirle)
-- insert into licenses (license_key, customer_name, max_devices)
-- values ('TCHZ-TEST-0001', 'Test Salonu', 1);

-- Varsayılan global ayar satırı (license_id = null)
insert into configs (license_id, wait_between, break_every, break_wait, message_template)
select null, 45, 10, 180, null
where not exists (select 1 from configs where license_id is null);
