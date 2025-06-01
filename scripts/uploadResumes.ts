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

	if (extension === ".pdf") {
		const dataBuffer = fs.readFileSync(filePath);
		const pdfData = await pdfParse(dataBuffer);
		return pdfData.text;
	} else if ([".docx", ".doc"].includes(extension)) {
		const text = await extractFromFile(filePath);
		return text as string;
	} else if (extension === ".txt") {
		// Simply read the text file
		return fs.readFileSync(filePath, "utf8");
	} else {
		throw new Error(`Unsupported file format: ${extension}`);
	}
}

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
