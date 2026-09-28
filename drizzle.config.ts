import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./d1/migrations",
  driver: "d1",
  dialect: "sqlite",
} satisfies Config;
