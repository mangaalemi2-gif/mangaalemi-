import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

// Next.js Edge runtime'da D1'e erişmek için global bağlamı alır
export function getDb(env: any) {
  return drizzle(env.DB, { schema });
}
