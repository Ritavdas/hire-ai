import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumes } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const resumeId = searchParams.get("resumeId");
		const status = searchParams.get("status");
		const freshOnly = searchParams.get("freshOnly") === "true";

		let query = db.select({
			id: resumes.id,
			name: resumes.name,
			location: resumes.location,
			availability_status: resumes.availability_status,
			availability_updated: resumes.availability_updated,
			timezone: resumes.timezone,
		}).from(resumes);

		// Filter by specific resume
		if (resumeId) {
			query = query.where(eq(resumes.id, resumeId));
		}

		// Filter by availability status
		if (status) {
			query = query.where(eq(resumes.availability_status, status));
		}

		// Filter for fresh status updates (within last 14 days)
		if (freshOnly) {
			const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
			query = query.where(gte(resumes.availability_updated, fourteenDaysAgo));
		}

		const results = await query;

		// Add engagement metrics
		const enrichedResults = results.map(candidate => ({
			...candidate,
			statusAge: getStatusAge(candidate.availability_updated),
			engagementLevel: getEngagementLevel(candidate.availability_status, candidate.availability_updated),
			responseTimeEstimate: getResponseTimeEstimate(candidate.availability_status),
		}));

		return NextResponse.json({
			candidates: enrichedResults,
			summary: {
				total: results.length,
				actively_looking: results.filter(c => c.availability_status === "actively_looking").length,
				open: results.filter(c => c.availability_status === "open").length,
				not_looking: results.filter(c => c.availability_status === "not_looking").length,
				unknown: results.filter(c => c.availability_status === "unknown").length,
			},
		});
	} catch (error) {
		console.error("Error fetching availability data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch availability data" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { 
			resumeId, 
			availability_status, 
			timezone, 
			preferred_interview_times,
			notice_period_weeks,
			preferred_salary_min,
			preferred_salary_max 
		} = body;

		if (!resumeId || !availability_status) {
			return NextResponse.json(
				{ error: "Missing required fields: resumeId, availability_status" },
				{ status: 400 }
			);
		}

		// Validate availability status
		const validStatuses = ["actively_looking", "open", "not_looking", "unknown"];
		if (!validStatuses.includes(availability_status)) {
			return NextResponse.json(
				{ error: "Invalid availability status" },
				{ status: 400 }
			);
		}

		// Update candidate availability
		const updateData: any = {
			availability_status,
			availability_updated: new Date(),
		};

		if (timezone) updateData.timezone = timezone;
		if (preferred_salary_min !== undefined) updateData.preferred_salary_min = preferred_salary_min;
		if (preferred_salary_max !== undefined) updateData.preferred_salary_max = preferred_salary_max;

		const updatedCandidate = await db
			.update(resumes)
			.set(updateData)
			.where(eq(resumes.id, resumeId))
			.returning();

		if (updatedCandidate.length === 0) {
			return NextResponse.json(
				{ error: "Candidate not found" },
				{ status: 404 }
			);
		}

		// TODO: Trigger real-time update via WebSocket
		// await broadcastAvailabilityUpdate(resumeId, availability_status);

		return NextResponse.json({
			candidate: updatedCandidate[0],
			message: "Availability updated successfully",
			engagementLevel: getEngagementLevel(availability_status, new Date()),
		});
	} catch (error) {
		console.error("Error updating availability:", error);
		return NextResponse.json(
			{ error: "Failed to update availability" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { action } = body;

		if (action === "decay_stale_status") {
			// Auto-decay stale availability statuses
			const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
			
			const decayedCandidates = await db
				.update(resumes)
				.set({
					availability_status: "unknown",
					availability_updated: new Date(),
				})
				.where(
					and(
						gte(resumes.availability_updated, thirtyDaysAgo),
						sql`availability_status != 'unknown'`
					)
				)
				.returning({ id: resumes.id, name: resumes.name });

			return NextResponse.json({
				message: `Decayed ${decayedCandidates.length} stale availability statuses`,
				decayedCandidates,
			});
		}

		if (action === "bulk_update") {
			const { updates } = body;
			
			if (!Array.isArray(updates)) {
				return NextResponse.json(
					{ error: "Updates must be an array" },
					{ status: 400 }
				);
			}

			const results = await Promise.all(
				updates.map(async (update: any) => {
					try {
						const result = await db
							.update(resumes)
							.set({
								availability_status: update.availability_status,
								availability_updated: new Date(),
								timezone: update.timezone,
							})
							.where(eq(resumes.id, update.resumeId))
							.returning();
						
						return { success: true, resumeId: update.resumeId, result: result[0] };
					} catch (error) {
						return { success: false, resumeId: update.resumeId, error: error.message };
					}
				})
			);

			const successful = results.filter(r => r.success);
			const failed = results.filter(r => !r.success);

			return NextResponse.json({
				message: `Bulk update completed: ${successful.length} successful, ${failed.length} failed`,
				successful,
				failed,
			});
		}

		return NextResponse.json(
			{ error: "Invalid action" },
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error in availability batch operation:", error);
		return NextResponse.json(
			{ error: "Failed to process batch operation" },
			{ status: 500 }
		);
	}
}

// Helper functions
function getStatusAge(updatedAt: Date | null): string {
	if (!updatedAt) return "Unknown";
	
	const now = new Date();
	const diffTime = now.getTime() - new Date(updatedAt).getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
	if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
	return `${Math.floor(diffDays / 365)} years ago`;
}

function getEngagementLevel(status: string, updatedAt: Date | null): "high" | "medium" | "low" | "unknown" {
	if (!updatedAt) return "unknown";
	
	const daysSinceUpdate = Math.floor(
		(new Date().getTime() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24)
	);
	
	switch (status) {
		case "actively_looking":
			if (daysSinceUpdate <= 7) return "high";
			if (daysSinceUpdate <= 14) return "medium";
			return "low";
		case "open":
			if (daysSinceUpdate <= 14) return "medium";
			if (daysSinceUpdate <= 30) return "low";
			return "unknown";
		case "not_looking":
			return "low";
		default:
			return "unknown";
	}
}

function getResponseTimeEstimate(status: string): string {
	switch (status) {
		case "actively_looking":
			return "< 24 hours";
		case "open":
			return "2-3 days";
		case "not_looking":
			return "1-2 weeks";
		default:
			return "Unknown";
	}
}

// TODO: Implement WebSocket broadcasting
// async function broadcastAvailabilityUpdate(resumeId: string, status: string) {
//   // This would integrate with a WebSocket service like Pusher or Socket.io
//   // to send real-time updates to connected recruiters
//   console.log(`Broadcasting availability update: ${resumeId} -> ${status}`);
// }
