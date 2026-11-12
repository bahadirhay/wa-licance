# wa-license Kurulumu

## 1) Supabase projesi

1. supabase.com → yeni proje aç (ya da Vercel panelinden Integrations → Supabase ile bağla).
2. Sol menüden **SQL Editor** → New query → `sql/schema.sql` dosyasının içeriğini yapıştır → Run.
3. **Project Settings → API** sayfasından şunları not al:
   - `Project URL` → bu `SUPABASE_URL`
   - `service_role` anahtarı (anon değil, service_role!) → bu `SUPABASE_SERVICE_ROLE_KEY`
   - **Bu service_role anahtarı gizlidir, asla müşteri tarafına veya tarayıcıya gitmez — yalnızca Vercel ortam değişkeni olarak kalır.**

## 2) Vercel projesi

1. Bu klasörü (`wa-license/`) bir GitHub reposuna koy veya doğrudan `vercel` CLI ile deploy et.
2. Vercel'de yeni proje oluştur, bu repoyu bağla.
3. Project Settings → Environment Variables içine ekle:
   - `SUPABASE_URL` = (yukarıdaki)
   - `SUPABASE_SERVICE_ROLE_KEY` = (yukarıdaki)
   - `JWT_SECRET` = aşağıdaki rastgele değer (istersen kendi üret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
     ```
     6207164302576ac0302e04fda23b0073be7db9978efa69e96f136cd71ccae8d4
     ```
4. Deploy et. Sana bir adres verecek, örn. `https://wa-license.vercel.app`.

## 3) İlk lisansı oluşturma

Supabase SQL Editor'de:

```sql
insert into licenses (license_key, customer_name, max_devices, expires_at)
values ('TCHZ-A1B2-C3D4', 'Örnek Salon', 1, null);
```

- `license_key`: müşteriye vereceğin anahtar. İstediğin formatta üretebilirsin (örn. `TCHZ-` + rastgele 8 karakter).
- `expires_at`: süresiz ise `null`, süreli ise örn. `'2027-01-01'`.
- `max_devices`: kaç bilgisayarda aynı anda çalışabileceği (genelde 1).

Lisansı iptal etmek istersen:
```sql
update licenses set status = 'suspended' where license_key = 'TCHZ-A1B2-C3D4';
```

Ayarları (bekleme süreleri vb.) tüm müşteriler için değiştirmek istersen:
```sql
update configs set wait_between = 60, break_every = 8, break_wait = 240 where license_id is null;
```

Belirli bir müşteriye özel ayar tanımlamak istersen (önce licenses tablosundan id'sini bul):
```sql
insert into configs (license_id, wait_between, break_every, break_wait)
values ('<licenses.id degeri>', 60, 8, 240);
```

## 4) Müşteri bilgisayarında kurulum

Müşteri klasörüne şu dosyaları koy:
- `wa_server.py`
- `license_client.py`
- `wa_panel/` klasörü
- `chromedriver.exe`
- **`license.key`** adında düz metin bir dosya, içine sadece lisans anahtarını yaz (örn. `TCHZ-A1B2-C3D4`), başka hiçbir şey yazma.

`wa_server.py` çalıştırılmadan önce ortam değişkeni olarak sunucu adresini ver, ya da `license_client.py` içindeki `LICENSE_SERVER_URL` satırını kendi Vercel adresinle değiştir:

```
LICENSE_SERVER_URL = "https://wa-license.vercel.app"
```

Müşteri "Gönderimi Başlat" dediğinde program otomatik olarak lisansı doğrular, geçerliyse devam eder. İnternet yoksa ya da lisans geçersizse gönderim başlamaz ve panelde hata gösterilir.

## 5) Ne değişti, neden

- Bekleme süreleri (`wait_between`, `break_every`, `break_wait`) artık panelden değil, Supabase'teki `configs` tablosundan geliyor. Panel kaydırıcıları hâlâ çalışır ama sunucu ayarı varsa o esas alınır — böylece sen uzaktan bir satır güncelleyerek tüm müşterilerin ayarını değiştirebilirsin, dosya göndermene gerek kalmaz.
- Her doğrulama ve her gönderim başlangıcı/bitişi `events` tablosuna düşer, böylece hangi müşterinin ne zaman çalıştığını Supabase'ten görebilirsin.
- Lisansı sen `status = 'suspended'` yaparak anında durdurabilirsin; müşterideki dosyalara dokunmana gerek yok.
