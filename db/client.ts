import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { resumes } from "./schema";

if (!process.env.SUPABASE_DATABASE_URL) {
	throw new Error("SUPABASE_DATABASE_URL environment variable is required");
}

const pool = new Pool({
	connectionString: process.env.SUPABASE_DATABASE_URL,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false } // TODO: Remove this once we have a valid certificate
			: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema: { resumes } });
