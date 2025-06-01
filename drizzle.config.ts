import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

export default {
	schema: "./db/schema.ts",
	out: "./drizzle",
	driver: "pg",
	dbCredentials: {
		connectionString:
			process.env.SUPABASE_DATABASE_URL ||
			(() => {
				throw new Error(
					"SUPABASE_DATABASE_URL environment variable is required"
				);
			})(),
	},
} satisfies Config;
