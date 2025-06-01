import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		// Get search query from URL params
		const searchParams = request.nextUrl.searchParams;
		const query = searchParams.get("q");

		// Return empty array if no query provided
		if (!query || query.trim() === "") {
			return NextResponse.json({ results: [] });
		}

		// Execute the FTS search using our custom function
		const results = await db.execute<{
			id: string;
			name: string;
			location: string | null;
			snippet: string;
			rank: number;
		}>(sql`
      SELECT * FROM fts_ranked_search(${query}, 10)
    `);

		// Format results for frontend
		const formattedResults = results.rows.map((result) => ({
			...result,
			// Convert rank to percentage for UI
			relevance: Math.round(result.rank * 100),
		}));

		return NextResponse.json({ results: formattedResults });
	} catch (error) {
		console.error("Search error:", error);
		return NextResponse.json(
			{ error: "Failed to perform search" },
			{ status: 500 }
		);
	}
}
