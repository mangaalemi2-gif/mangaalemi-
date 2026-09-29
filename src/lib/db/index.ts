import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export function getDb(envOverride?: any) {
  // Eğer parametre verilmemişse veya undefined/null ise Cloudflare Context'i kullan
  let env = envOverride;
  if (!env || !env.DB) {
    try {
      const ctx = getCloudflareContext();
      env = ctx.env;
    } catch (e) {
      console.warn("Cloudflare context bulunamadı, process.env deneniyor");
      env = process.env;
    }
  }

  // D1 bindingi env.DB altında olmalı
  if (!env || !env.DB) {
    throw new Error("DB bindingi bulunamadı. Lütfen wrangler.jsonc dosyasını veya bağlamı kontrol edin.");
  }
  
  return drizzle(env.DB, { schema });
}
