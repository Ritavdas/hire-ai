import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import path from "path";
import { Pool } from "pg";
import { fileURLToPath } from "url";

// Add these lines to define __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runPdfUrlMigration() {
	if (!process.env.SUPABASE_DATABASE_URL) {
		console.error("SUPABASE_DATABASE_URL is not defined in .env.local");
		process.exit(1);
	}

	const pool = new Pool({
		connectionString: process.env.SUPABASE_DATABASE_URL,
		ssl:
			process.env.NODE_ENV === "production"
				? { rejectUnauthorized: true }
				: { rejectUnauthorized: false },
	});

	console.log("Running PDF URL migration...");

	try {
		// Read the migration file
		const migrationPath = path.join(
			__dirname,
			"../db/migrations/add_pdf_url.sql"
		);
		const migrationSQL = fs.readFileSync(migrationPath, "utf8");

		// Execute the migration within a transaction
		const client = await pool.connect();
		try {
			await client.query("BEGIN");
			await client.query(migrationSQL);
			await client.query("COMMIT");
			console.log("PDF URL migration completed successfully");
		} catch (error) {
			await client.query("ROLLBACK");
			throw error;
		} finally {
			client.release();
		}
		console.log("PDF URL migration completed successfully");
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	} finally {
		await pool.end();
	}
}

runPdfUrlMigration();
