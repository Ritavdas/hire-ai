import fs from "fs";
import path from "path";
import pdf from "pdf-parse/lib/pdf-parse.js";
import textract from "textract";
import { promisify } from "util";
import { resumes } from "../db/schema.js";
import { db } from "../db/client.js";
import { eq } from "drizzle-orm";

// Convert textract.fromFileWithPath to Promise-based
const extractFromFile = promisify(textract.fromFileWithPath);
/**
 * Extract text from a file based on its extension
 */
async function extractTextFromFile(filePath) {
	// Check file size (limit to 50MB)
	const stats = fs.statSync(filePath);
	if (stats.size > 50 * 1024 * 1024) {
		throw new Error(`File too large: ${stats.size} bytes (max 50MB)`);
	}

	const extension = path.extname(filePath).toLowerCase();

	if (extension === ".pdf") {
		const dataBuffer = await fs.promises.readFile(filePath);
		const pdfData = await pdf(dataBuffer);
		return pdfData.text;
	} else if ([".docx", ".doc"].includes(extension)) {
		const text = await extractFromFile(filePath);
		return text;
	} else if (extension === ".txt") {
		return await fs.promises.readFile(filePath, "utf8");
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

			// Check if resume already exists
			const existing = await db
				.select()
				.from(resumes)
				.where(eq(resumes.name, nameOnly))
				.limit(1);
			if (existing.length > 0) {
				console.log(`Skipping ${filename} - already exists`);
				continue;
			}

			await db.insert(resumes).values({
				name: nameOnly,
				location: null, // Use null instead of empty string
				rawText,
			});
			console.log(`Inserted ${filename}`);
		} catch (err) {
			console.error(
				`Failed to process ${filename}:`,
				err instanceof Error ? err.message : String(err)
			);
		}
	}

	console.log("All done.");
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
