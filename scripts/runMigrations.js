import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
dotenv.config();

async function runMigrations() {
	if (!process.env.SUPABASE_DATABASE_URL) {
		console.error("SUPABASE_DATABASE_URL is not defined in .env.local");
		process.exit(1);
	}

	const pool = new Pool({
		connectionString: process.env.SUPABASE_DATABASE_URL,
		ssl: { rejectUnauthorized: false },
	});

	const db = drizzle(pool);

	console.log("Running migrations...");

	try {
		await migrate(db, { migrationsFolder: "./drizzle" });
		console.log("Migrations completed successfully");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

runMigrations();
