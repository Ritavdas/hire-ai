import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { assessment_results, assessments } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const resumeId = searchParams.get("resumeId");
		const includeExpired = searchParams.get("includeExpired") === "true";

		if (!resumeId) {
			return NextResponse.json(
				{ error: "Missing resumeId parameter" },
				{ status: 400 }
			);
		}

		// Fetch assessment results with badge information
		let query = db
			.select({
				id: assessment_results.id,
				assessment_name: assessments.name,
				skill_category: assessments.skill_category,
				difficulty_level: assessments.difficulty_level,
				score: assessment_results.score,
				percentile: assessment_results.percentile,
				badge_earned: assessment_results.badge_earned,
				badge_expires_at: assessment_results.badge_expires_at,
				taken_at: assessment_results.taken_at,
			})
			.from(assessment_results)
			.innerJoin(assessments, eq(assessment_results.assessment_id, assessments.id))
			.where(
				and(
					eq(assessment_results.resume_id, resumeId),
					eq(assessment_results.badge_earned, true)
				)
			)
			.orderBy(desc(assessment_results.taken_at));

		const results = await query;

		// Filter out expired badges if not requested
		const badges = includeExpired 
			? results 
			: results.filter(badge => 
				badge.badge_expires_at && new Date(badge.badge_expires_at) > new Date()
			);

		return NextResponse.json({
			badges,
			summary: {
				total: badges.length,
				active: badges.filter(badge => 
					badge.badge_expires_at && new Date(badge.badge_expires_at) > new Date()
				).length,
				expired: badges.filter(badge => 
					badge.badge_expires_at && new Date(badge.badge_expires_at) <= new Date()
				).length,
			},
		});
	} catch (error) {
		console.error("Error fetching badges:", error);
		return NextResponse.json(
			{ error: "Failed to fetch badges" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { badgeId, action } = body;

		if (action === "verify") {
			// Verify badge authenticity
			const badge = await db.query.assessment_results.findFirst({
				where: eq(assessment_results.id, badgeId),
				with: {
					assessment: true,
				},
			});

			if (!badge) {
				return NextResponse.json(
					{ error: "Badge not found" },
					{ status: 404 }
				);
			}

			// Check if badge is still valid
			const isValid = badge.badge_expires_at && new Date(badge.badge_expires_at) > new Date();
			
			return NextResponse.json({
				valid: isValid,
				badge: {
					id: badge.id,
					skill_category: badge.assessment.skill_category,
					difficulty_level: badge.assessment.difficulty_level,
					score: badge.score,
					percentile: badge.percentile,
					taken_at: badge.taken_at,
					expires_at: badge.badge_expires_at,
				},
				verification: {
					verified_at: new Date().toISOString(),
					verification_id: `verify_${Date.now()}`,
				},
			});
		}

		return NextResponse.json(
			{ error: "Invalid action" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error processing badge request:", error);
		return NextResponse.json(
			{ error: "Failed to process badge request" },
			{ status: 500 }
		);
	}
}
