import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { jobs, job_ad_templates, job_board_postings } from "@/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Job board configurations
const JOB_BOARDS = {
	remote_ok: {
		name: "Remote OK",
		tags: ["#remote", "#async", "#equity", "#startup", "#tech"],
		maxLength: 2000,
		requiresLocation: false,
	},
	linkedin: {
		name: "LinkedIn",
		tags: ["#hiring", "#jobs", "#career", "#opportunity"],
		maxLength: 3000,
		requiresLocation: true,
	},
	hacker_news: {
		name: "Hacker News",
		tags: ["#ycombinator", "#startup", "#engineering"],
		maxLength: 1500,
		requiresLocation: false,
	},
	angel_list: {
		name: "AngelList",
		tags: ["#startup", "#equity", "#remote", "#growth"],
		maxLength: 2500,
		requiresLocation: false,
	},
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { 
			jobId, 
			tone = "professional", 
			includeDEI = true, 
			targetBoards = ["remote_ok"], 
			customPrompt 
		} = body;

		if (!jobId) {
			return NextResponse.json(
				{ error: "Missing jobId" },
				{ status: 400 }
			);
		}

		// Fetch job details
		const job = await db.query.jobs.findFirst({
			where: eq(jobs.id, jobId),
		});

		if (!job) {
			return NextResponse.json(
				{ error: "Job not found" },
				{ status: 404 }
			);
		}

		// Generate job ads for each target board
		const generatedAds = await Promise.all(
			targetBoards.map(async (boardKey: string) => {
				const board = JOB_BOARDS[boardKey as keyof typeof JOB_BOARDS];
				if (!board) {
					throw new Error(`Unsupported job board: ${boardKey}`);
				}

				const jobAd = await generateJobAd(job, board, tone, includeDEI, customPrompt);
				return {
					board: boardKey,
					boardName: board.name,
					content: jobAd.content,
					title: jobAd.title,
					tags: jobAd.tags,
					estimatedReach: jobAd.estimatedReach,
				};
			})
		);

		return NextResponse.json({
			jobId,
			jobTitle: job.title,
			generatedAds,
			message: "Job ads generated successfully",
		});
	} catch (error) {
		console.error("Error generating job ads:", error);
		return NextResponse.json(
			{ error: "Failed to generate job ads" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { jobId, ads, publishToBoards = [] } = body;

		if (!jobId || !ads) {
			return NextResponse.json(
				{ error: "Missing jobId or ads" },
				{ status: 400 }
			);
		}

		const publishResults = await Promise.all(
			publishToBoards.map(async (boardKey: string) => {
				const ad = ads.find((a: any) => a.board === boardKey);
				if (!ad) {
					return { board: boardKey, status: "error", message: "Ad not found" };
				}

				try {
					// Simulate publishing to job board (replace with actual API calls)
					const result = await publishToJobBoard(boardKey, ad, jobId);
					
					// Store posting record in database
					await db.insert(job_board_postings).values({
						job_id: jobId,
						board_name: boardKey,
						external_post_id: result.postId,
						post_url: result.url,
						status: "posted",
						posted_at: new Date(),
						expires_at: result.expiresAt,
					});

					return {
						board: boardKey,
						status: "success",
						postId: result.postId,
						url: result.url,
						message: "Successfully posted",
					};
				} catch (error) {
					console.error(`Error publishing to ${boardKey}:`, error);
					
					// Store failed posting record
					await db.insert(job_board_postings).values({
						job_id: jobId,
						board_name: boardKey,
						status: "failed",
					});

					return {
						board: boardKey,
						status: "error",
						message: error instanceof Error ? error.message : "Publishing failed",
					};
				}
			})
		);

		return NextResponse.json({
			jobId,
			publishResults,
			message: "Job ad publishing completed",
		});
	} catch (error) {
		console.error("Error publishing job ads:", error);
		return NextResponse.json(
			{ error: "Failed to publish job ads" },
			{ status: 500 }
		);
	}
}

async function generateJobAd(
	job: any,
	board: any,
	tone: string,
	includeDEI: boolean,
	customPrompt?: string
) {
	const basePrompt = customPrompt || `
		Create a compelling job advertisement for the following position:
		
		Title: ${job.title}
		Description: ${job.description}
		Required Skills: ${JSON.stringify(job.skills_required || [])}
		Preferred Skills: ${JSON.stringify(job.skills_preferred || [])}
		Experience: ${job.experience_min || 0}-${job.experience_max || 10} years
		Location: ${job.location || "Remote"}
		Remote Friendly: ${job.remote_friendly ? "Yes" : "No"}
		Salary Range: ${job.salary_min ? `$${job.salary_min}` : "Competitive"} - ${job.salary_max ? `$${job.salary_max}` : ""}
		
		Platform: ${board.name}
		Tone: ${tone}
		Max Length: ${board.maxLength} characters
		Include DEI Language: ${includeDEI}
		
		Requirements:
		1. Create an engaging title (max 80 characters)
		2. Write compelling job description highlighting key benefits
		3. Include relevant tags from: ${board.tags.join(", ")}
		4. ${includeDEI ? "Include inclusive language and DEI commitment" : ""}
		5. Optimize for ${board.name} audience
		6. Stay within ${board.maxLength} character limit
		
		Return as JSON with: title, content, tags (array), estimatedReach (number)
	`;

	const completion = await openai.chat.completions.create({
		model: "gpt-4o-mini",
		messages: [
			{
				role: "system",
				content: "You are an expert job ad copywriter specializing in remote-friendly tech positions. Create engaging, inclusive job posts that attract top talent.",
			},
			{
				role: "user",
				content: basePrompt,
			},
		],
		response_format: { type: "json_object" },
		temperature: 0.7,
	});

	const result = JSON.parse(completion.choices[0].message.content || "{}");
	
	// Ensure we have all required fields
	return {
		title: result.title || job.title,
		content: result.content || job.description,
		tags: result.tags || board.tags.slice(0, 3),
		estimatedReach: result.estimatedReach || Math.floor(Math.random() * 10000) + 1000,
	};
}

async function publishToJobBoard(boardKey: string, ad: any, jobId: string) {
	// This is a simulation - replace with actual job board API integrations
	
	switch (boardKey) {
		case "remote_ok":
			return await publishToRemoteOK(ad);
		case "linkedin":
			return await publishToLinkedIn(ad);
		case "hacker_news":
			return await publishToHackerNews(ad);
		case "angel_list":
			return await publishToAngelList(ad);
		default:
			throw new Error(`Unsupported job board: ${boardKey}`);
	}
}

// Simulated job board publishing functions
// In production, these would make actual API calls to job boards

async function publishToRemoteOK(ad: any) {
	// Simulate Remote OK API call
	await new Promise(resolve => setTimeout(resolve, 1000));
	
	return {
		postId: `ro_${Date.now()}`,
		url: `https://remoteok.io/remote-jobs/${ad.title.toLowerCase().replace(/\s+/g, '-')}`,
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
	};
}

async function publishToLinkedIn(ad: any) {
	// Simulate LinkedIn API call
	await new Promise(resolve => setTimeout(resolve, 1500));
	
	return {
		postId: `li_${Date.now()}`,
		url: `https://linkedin.com/jobs/view/${Date.now()}`,
		expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
	};
}

async function publishToHackerNews(ad: any) {
	// Simulate Hacker News posting
	await new Promise(resolve => setTimeout(resolve, 800));
	
	return {
		postId: `hn_${Date.now()}`,
		url: `https://news.ycombinator.com/item?id=${Date.now()}`,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
	};
}

async function publishToAngelList(ad: any) {
	// Simulate AngelList API call
	await new Promise(resolve => setTimeout(resolve, 1200));
	
	return {
		postId: `al_${Date.now()}`,
		url: `https://angel.co/company/jobs/${Date.now()}`,
		expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
	};
}
