import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { recruiter_feedback } from "@/db/schema";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { 
			jobId, 
			resumeId, 
			recruiterId, 
			feedbackType, 
			relevanceRating, 
			notes 
		} = body;

		if (!jobId || !resumeId || !recruiterId || !feedbackType) {
			return NextResponse.json(
				{ error: "Missing required fields: jobId, resumeId, recruiterId, feedbackType" },
				{ status: 400 }
			);
		}

		// Validate feedback type
		const validFeedbackTypes = ["thumbs_up", "thumbs_down", "hired", "interviewed", "contacted", "not_interested"];
		if (!validFeedbackTypes.includes(feedbackType)) {
			return NextResponse.json(
				{ error: "Invalid feedback type" },
				{ status: 400 }
			);
		}

		// Store feedback
		const feedback = await db
			.insert(recruiter_feedback)
			.values({
				job_id: jobId,
				resume_id: resumeId,
				recruiter_id: recruiterId,
				feedback_type: feedbackType,
				relevance_rating: relevanceRating,
				notes: notes,
			})
			.returning();

		// TODO: Use this feedback to improve future AI rankings
		// This could trigger a background job to retrain the ranking model

		return NextResponse.json({
			feedback: feedback[0],
			message: "Feedback recorded successfully",
		});
	} catch (error) {
		console.error("Error recording feedback:", error);
		return NextResponse.json(
			{ error: "Failed to record feedback" },
			{ status: 500 }
		);
	}
}
