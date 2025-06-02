import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumes } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = (page - 1) * limit;

		// Validate pagination parameters
		if (page < 1 || limit < 1 || limit > 100) {
			return NextResponse.json(
				{ error: "Invalid pagination parameters" },
				{ status: 400 }
			);
		}

		// Fetch resumes with pagination
		const allResumes = await db
			.select({
				id: resumes.id,
				name: resumes.name,
				location: resumes.location,
				pdfUrl: resumes.pdfUrl,
				// Include a preview of the raw text (first 200 characters)
				preview: resumes.rawText,
			})
			.from(resumes)
			.orderBy(desc(resumes.name))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const totalCountResult = await db
			.select({ count: sql`count(*)` })
			.from(resumes);
		const totalCount = Number(totalCountResult[0]?.count || 0);

		// Format results for frontend
		const formattedResults = allResumes.map((resume) => ({
			id: resume.id,
			name: resume.name,
			location: resume.location,
			pdfUrl: resume.pdfUrl,
			preview: resume.preview
				? resume.preview.substring(0, 200) + "..."
				: "",
		}));

		return NextResponse.json({
			resumes: formattedResults,
			pagination: {
				page,
				limit,
				totalCount,
				totalPages: Math.ceil(totalCount / limit),
				hasNext: page * limit < totalCount,
				hasPrev: page > 1,
			},
		});
	} catch (error) {
		console.error("Error fetching resumes:", error);
		return NextResponse.json(
			{ error: "Failed to fetch resumes" },
			{ status: 500 }
		);
	}
}
