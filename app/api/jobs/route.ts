import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { jobs } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const status = searchParams.get("status") || "active";
		const offset = (page - 1) * limit;

		// Validate pagination parameters
		if (page < 1 || limit < 1 || limit > 100) {
			return NextResponse.json(
				{ error: "Invalid pagination parameters" },
				{ status: 400 }
			);
		}

		// Fetch jobs with pagination
		const allJobs = await db
			.select()
			.from(jobs)
			.where(eq(jobs.status, status))
			.orderBy(desc(jobs.created_at))
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const totalCountResult = await db
			.select({ count: sql`count(*)` })
			.from(jobs)
			.where(eq(jobs.status, status));
		const totalCount = Number(totalCountResult[0]?.count || 0);

		return NextResponse.json({
			jobs: allJobs,
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
		console.error("Error fetching jobs:", error);
		return NextResponse.json(
			{ error: "Failed to fetch jobs" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			title,
			description,
			requirements,
			location,
			remote_friendly = true,
			salary_min,
			salary_max,
			experience_min,
			experience_max,
			skills_required,
			skills_preferred,
			timezone_preference,
			created_by,
		} = body;

		// Validate required fields
		if (!title || !description || !requirements) {
			return NextResponse.json(
				{
					error: "Missing required fields: title, description, requirements",
				},
				{ status: 400 }
			);
		}

		// Create new job
		const newJob = await db
			.insert(jobs)
			.values({
				title,
				description,
				requirements,
				location,
				remote_friendly,
				salary_min,
				salary_max,
				experience_min,
				experience_max,
				skills_required,
				skills_preferred,
				timezone_preference,
				created_by,
			})
			.returning();

		return NextResponse.json({
			job: newJob[0],
			message: "Job created successfully",
		});
	} catch (error) {
		console.error("Error creating job:", error);
		return NextResponse.json(
			{ error: "Failed to create job" },
			{ status: 500 }
		);
	}
}
