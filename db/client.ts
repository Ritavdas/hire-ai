import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { resumes } from "./schema";

const pool = new Pool({
	connectionString: process.env.SUPABASE_DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema: { resumes } });
