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
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Convert textract.fromFileWithPath to Promise-based
const extractFromFile = promisify(textract.fromFileWithPath);

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
	pdfUrl: text("pdf_url"), // Supabase Storage URL
	tsv: tsvector("tsv"),
});

// Check if the required environment variables are available
if (!process.env.SUPABASE_DATABASE_URL) {
	console.error(
		"Error: SUPABASE_DATABASE_URL environment variable is not set"
	);
	process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
	console.error(
		"Error: NEXT_PUBLIC_SUPABASE_URL environment variable is not set"
	);
	process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
	console.error(
		"Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set"
	);
	process.exit(1);
}

// Create the database connection
const pool = new Pool({
	connectionString: process.env.SUPABASE_DATABASE_URL,
	ssl: { rejectUnauthorized: false },
});

const db = drizzle(pool, { schema: { resumes } });

// Create Supabase client for storage
const supabase = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
	{
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
		global: {
			headers: {
				Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
			},
		},
	}
);

/**
 * Upload file to Supabase Storage
 */
async function uploadToSupabaseStorage(filePath, fileName) {
	try {
		const fileBuffer = fs.readFileSync(filePath);
		const fileExt = path.extname(fileName);
		const uniqueFileName = `${Date.now()}-${fileName}`;

		console.log(
			`    Uploading ${uniqueFileName} (${fileBuffer.length} bytes)`
		);
		console.log(`    Content type: ${getContentType(fileExt)}`);

		const { data, error } = await supabase.storage
			.from("resumes")
			.upload(uniqueFileName, fileBuffer, {
				contentType: getContentType(fileExt),
				upsert: false,
			});

		if (error) {
			console.error(`    Upload error details:`, error);
			throw new Error(`Supabase upload error: ${error.message}`);
		}

		console.log(`    Upload successful, path: ${data.path}`);

		// Get public URL
		const { data: urlData } = supabase.storage
			.from("resumes")
			.getPublicUrl(data.path);

		return urlData.publicUrl;
	} catch (error) {
		console.error(`Failed to upload ${fileName} to Supabase Storage:`, error);
		throw error;
	}
}

/**
 * Get content type based on file extension
 */
function getContentType(extension) {
	switch (extension.toLowerCase()) {
		case ".pdf":
			return "application/pdf";
		case ".docx":
			return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
		case ".doc":
			return "application/msword";
		case ".txt":
			return "text/plain";
		default:
			return "application/octet-stream";
	}
}

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

async function main() {
	const RESUME_DIR = path.join(process.cwd(), "resumes");

	// Validate resume directory exists
	if (!fs.existsSync(RESUME_DIR)) {
		throw new Error(`Resume directory not found: ${RESUME_DIR}`);
	}

	const files = fs
		.readdirSync(RESUME_DIR)
		.filter((f) =>
			[".pdf", ".docx", ".doc", ".txt"].includes(
				path.extname(f).toLowerCase()
			)
		);

	console.log(`Found ${files.length} resume(s). Processing...`);

	if (files.length === 0) {
		console.log("No supported resume files found. Exiting.");
		return;
	}

	let successCount = 0;
	let errorCount = 0;

	// Process all files
	const filesToProcess = files;
	console.log(`Processing all ${filesToProcess.length} files...`);

	for (const filename of filesToProcess) {
		try {
			const fullPath = path.join(RESUME_DIR, filename);
			console.log(`Processing ${filename}...`);

			// Extract text content
			console.log(`  - Extracting text from ${filename}...`);
			const rawText = await extractTextFromFile(fullPath);

			// Validate extracted text
			if (!rawText || rawText.trim().length === 0) {
				throw new Error("No text content extracted");
			}

			// Upload to Supabase Storage
			console.log(`  - Uploading ${filename} to Supabase Storage...`);
			const pdfUrl = await uploadToSupabaseStorage(fullPath, filename);

			const nameOnly = path.basename(filename, path.extname(filename));

			// Validate name length
			if (nameOnly.length > 255) {
				throw new Error("Filename too long for database field");
			}

			// Insert into database
			console.log(`  - Saving to database...`);
			await db.insert(resumes).values({
				name: nameOnly,
				location: "",
				rawText: rawText.trim(),
				pdfUrl: pdfUrl,
			});

			console.log(`✓ Successfully processed ${filename}`);
			console.log(`  PDF URL: ${pdfUrl}`);
			successCount++;
		} catch (err) {
			console.error(
				`✗ Failed to process ${filename}:`,
				err instanceof Error ? err.message : String(err)
			);
			errorCount++;
		}
	}

	console.log(`\nProcessing complete:`);
	console.log(`  ✓ Success: ${successCount} files`);
	console.log(`  ✗ Errors: ${errorCount} files`);

	if (errorCount > 0) {
		console.log(`\nSome files failed to process. Check the errors above.`);
	}

	// Close the database connection
	await pool.end();
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
