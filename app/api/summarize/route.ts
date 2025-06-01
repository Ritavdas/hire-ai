import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resumes } from "@/db/schema";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return NextResponse.json(
				{ error: "Missing resume ID" },
				{ status: 400 }
			);
		}

		// Fetch the resume text from the database
		const resume = await db.query.resumes.findFirst({
			where: eq(resumes.id, id),
			columns: {
				name: true,
				rawText: true,
			},
		});

		if (!resume) {
			return NextResponse.json(
				{ error: "Resume not found" },
				{ status: 404 }
			);
		}

		// Generate a summary using OpenAI
		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are a helpful assistant that summarizes resumes for recruiters. Extract the key skills, experience, and qualifications from the resume text.",
				},
				{
					role: "user",
					content: `Please provide a concise summary of this candidate's resume. Include their top 3-5 technical skills, years of experience, and most relevant qualifications. Format the response as JSON with the following fields: skills (array), experience (string), education (string), and keyHighlights (array of 2-3 items). Resume text: ${resume.rawText}`,
				},
			],
			response_format: { type: "json_object" },
		});

		// Parse the response
		const summary = JSON.parse(completion.choices[0].message.content || "{}");

		return NextResponse.json({
			id,
			name: resume.name,
			summary,
		});
	} catch (error) {
		console.error("Error summarizing resume:", error);
		return NextResponse.json(
			{ error: "Failed to summarize resume" },
			{ status: 500 }
		);
	}
}
