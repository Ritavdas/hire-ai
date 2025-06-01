import fs from "fs";
import path from "path";
import pdf from "pdf-parse/lib/pdf-parse.js";
import textract from "textract";
import { promisify } from "util";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { pgTable, uuid, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";
import dotenv from "dotenv";

// Convert textract.fromFileWithPath to Promise-based
const extractFromFile = promisify(textract.fromFileWithPath);

// Load environment variables
dotenv.config();

// Define the schema inline (copied from db/schema.ts)
const tsvector = customType({
	dataType() {
		return "tsvector";
	},
});

const resumes = pgTable("resumes", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	name: text("name").notNull(),
	location: text("location"),
	rawText: text("raw_text").notNull(),
	tsv: tsvector("tsv"),
});

// Check if the database URL is available
if (!process.env.SUPABASE_DATABASE_URL) {
	console.error(
		"Error: SUPABASE_DATABASE_URL environment variable is not set"
	);
	process.exit(1);
}

// Log connection attempt
console.log("Attempting to connect to database...");

// Create the database connection
const pool = new Pool({
	connectionString: process.env.SUPABASE_DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

// Test the connection before proceeding
pool
	.connect()
	.then(() => console.log("Database connection successful"))
	.catch((err) => {
		console.error("Database connection failed:", err);
		process.exit(1);
	});

const db = drizzle(pool, { schema: { resumes } });

/**
 * Extract text from a file based on its extension
 */
async function extractTextFromFile(filePath) {
	const extension = path.extname(filePath).toLowerCase();

	if (extension === ".pdf") {
		try {
			const dataBuffer = fs.readFileSync(filePath);
			console.log(
				`Read file ${filePath}, buffer size: ${dataBuffer.length} bytes`
			);

			// Use pdf-parse correctly
			const pdfData = await pdf(dataBuffer);
			return pdfData.text;
		} catch (err) {
			console.error(`Error parsing PDF ${filePath}:`, err);
			throw err;
		}
	} else if ([".docx", ".doc"].includes(extension)) {
		const text = await extractFromFile(filePath);
		return text;
	} else if (extension === ".txt") {
		// Simply read the text file
		return fs.readFileSync(filePath, "utf8");
	} else {
		throw new Error(`Unsupported file format: ${extension}`);
	}
}

/**
 * Main function to process and upload resumes
 */
async function main() {
	const RESUME_DIR = path.join(process.cwd(), "resumes");
	const files = fs
		.readdirSync(RESUME_DIR)
		.filter((f) =>
			[".pdf", ".docx", ".doc", ".txt"].includes(
				path.extname(f).toLowerCase()
			)
		);

	console.log(`Found ${files.length} resume(s). Processing...`);

	for (const filename of files) {
		try {
			const fullPath = path.join(RESUME_DIR, filename);
			console.log(`Extracting text from ${filename}...`);
			const rawText = await extractTextFromFile(fullPath);

			const nameOnly = path.basename(filename, path.extname(filename));
			await db.insert(resumes).values({
				name: nameOnly,
				location: "",
				rawText,
			});
			console.log(`Inserted ${filename}`);
		} catch (err) {
			console.error(
				`Failed to process ${filename}:`,
				err instanceof Error ? err.stack || err.message : String(err)
			);
		}
	}

	console.log("All done.");
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
