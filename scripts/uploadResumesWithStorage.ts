import fs from "fs";
import path from "path";
import { db } from "../db/client";
import { resumes } from "../db/schema";
import pdfParse from "pdf-parse";
import textract from "textract";
import { promisify } from "util";
import { supabaseAdmin } from "../lib/supabase";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Convert textract.fromFileWithPath to Promise-based
const extractFromFile = promisify(textract.fromFileWithPath);

/**
 * Upload file to Supabase Storage
 */
async function uploadToSupabaseStorage(
	filePath: string,
	fileName: string
): Promise<string> {
	try {
		const fileBuffer = fs.readFileSync(filePath);
		const fileExt = path.extname(fileName);
		const uniqueFileName = `${Date.now()}-${fileName}`;

		const { data, error } = await supabaseAdmin.storage
			.from("resumes")
			.upload(uniqueFileName, fileBuffer, {
				contentType: getContentType(fileExt),
				upsert: false,
			});

		if (error) {
			throw new Error(`Supabase upload error: ${error.message}`);
		}

		// Get public URL
		const { data: urlData } = supabaseAdmin.storage
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
function getContentType(extension: string): string {
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
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
