import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { fileURLToPath } from "url";

// Add these lines to define __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCustomMigrations() {
	if (!process.env.SUPABASE_DATABASE_URL) {
		console.error("SUPABASE_DATABASE_URL is not defined in .env.local");
		process.exit(1);
	}

	const pool = new Pool({
		connectionString: process.env.SUPABASE_DATABASE_URL,
		ssl: { rejectUnauthorized: false },
	});

	try {
		// Read the custom SQL file
		const sqlPath = path.join(__dirname, "..", "db", "customMigrations.sql");
		const sqlContent = fs.readFileSync(sqlPath, "utf8");

		console.log("Running custom migrations...");
		await pool.query(sqlContent);
		console.log("Custom migrations completed successfully");
	} catch (error) {
		console.error("Custom migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

runCustomMigrations();
