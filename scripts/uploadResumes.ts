import fs from "fs";
import path from "path";
import { db } from "../db/client.js";
import { resumes } from "../db/schema";
import pdfParse from "pdf-parse";
import textract from "textract";
import { promisify } from "util";

// Convert textract.fromFileWithPath to Promise-based
const extractFromFile = promisify(textract.fromFileWithPath);

/**
 * Extract text from a file based on its extension
 */
async function extractTextFromFile(filePath: string): Promise<string> {
	const extension = path.extname(filePath).toLowerCase();

	// Validate file path to prevent directory traversal attacks
	const resolvedPath = path.resolve(filePath);
	const resumeDir = path.resolve(process.cwd(), "resumes");
	if (!resolvedPath.startsWith(resumeDir)) {
		throw new Error(`Invalid file path: ${filePath}`);
	}

	// Check file exists and is readable
	if (!fs.existsSync(resolvedPath)) {
		throw new Error(`File not found: ${filePath}`);
	}

	if (extension === ".pdf") {
		const dataBuffer = fs.readFileSync(filePath);
		if (dataBuffer.length === 0) {
			throw new Error(`Empty PDF file: ${filePath}`);
		}
		const pdfData = await pdfParse(dataBuffer);
		return pdfData.text;
	} else if ([".docx", ".doc"].includes(extension)) {
		const text = await extractFromFile(filePath);
		return typeof text === "string" ? text : String(text);
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

	for (const filename of files) {
		try {
			const fullPath = path.join(RESUME_DIR, filename);
			console.log(`Extracting text from ${filename}...`);
			const rawText = await extractTextFromFile(fullPath);

			// Validate extracted text
			if (!rawText || rawText.trim().length === 0) {
				throw new Error("No text content extracted");
			}

			const nameOnly = path.basename(filename, path.extname(filename));

			// Validate name length
			if (nameOnly.length > 255) {
				throw new Error("Filename too long for database field");
			}

			await db.insert(resumes).values({
				name: nameOnly,
				location: "",
				rawText: rawText.trim(),
			});
			console.log(`✓ Inserted ${filename}`);
			successCount++;
		} catch (err) {
			console.error(
				`✗ Failed to process ${filename}:`,
				err instanceof Error ? err.message : String(err)
			);
			errorCount++;
		}
	}

	console.log(
		`\nProcessing complete: ${successCount} successful, ${errorCount} failed.`
	);
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
