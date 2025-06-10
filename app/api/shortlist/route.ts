import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { resumes, jobs, candidate_scores } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Scoring weights (can be customized per job)
interface ScoringWeights {
	skills: number;
	experience: number;
	timezone: number;
	availability: number;
	salary: number;
}

// Type definitions
interface Candidate {
	id: string;
	name: string;
	location?: string | null;
	skills?: string[] | null;
	experience_years?: number | null;
	timezone?: string | null;
	availability_status?: string | null;
	preferred_salary_min?: number | null;
	preferred_salary_max?: number | null;
	rawText?: string | null;
	pdfUrl?: string | null;
}

interface Job {
	id: string;
	title: string;
	requirements?: string | null;
	skills_required?: string[] | null;
	skills_preferred?: string[] | null;
	experience_min?: number | null;
	experience_max?: number | null;
	timezone_preference?: string | null;
	salary_min?: number | null;
	salary_max?: number | null;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
	skills: 0.4,
	experience: 0.25,
	timezone: 0.15,
	availability: 0.1,
	salary: 0.1,
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { jobId, weights = DEFAULT_WEIGHTS, limit = 10 } = body;

		if (!jobId) {
			return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
		}

		// Fetch job details
		const jobResults = await db
			.select()
			.from(jobs)
			.where(eq(jobs.id, jobId))
			.limit(1);
		const job = jobResults[0];

		if (!job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		// Fetch all active candidates
		const candidates = await db
			.select()
			.from(resumes)
			.where(sql`availability_status != 'not_looking'`);

		// Calculate scores for each candidate
		const scoredCandidates = await Promise.all(
			candidates.map(async (candidate) => {
				const scores = await calculateFitScore(
					candidate as Candidate,
					job as Job,
					weights
				);
				return {
					...candidate,
					...scores,
				};
			})
		);

		// Sort by fit score and take top N
		const topCandidates = scoredCandidates
			.sort((a, b) => b.fit_score - a.fit_score)
			.slice(0, limit);

		// Store scores in database for future reference
		await Promise.all(
			topCandidates.map(async (candidate) => {
				await db.insert(candidate_scores).values({
					resume_id: candidate.id,
					job_id: jobId,
					fit_score: candidate.fit_score,
					skill_match_score: candidate.skill_match_score,
					experience_score: candidate.experience_score,
					timezone_score: candidate.timezone_score,
					availability_score: candidate.availability_score,
					salary_score: candidate.salary_score,
					explanation: candidate.explanation,
				});
			})
		);

		return NextResponse.json({
			shortlist: topCandidates.map((candidate) => ({
				id: candidate.id,
				name: candidate.name,
				location: candidate.location,
				fit_score: Math.round(candidate.fit_score * 100),
				skill_match_score: Math.round(candidate.skill_match_score * 100),
				experience_score: Math.round(candidate.experience_score * 100),
				timezone_score: Math.round(candidate.timezone_score * 100),
				availability_score: Math.round(candidate.availability_score * 100),
				salary_score: Math.round(candidate.salary_score * 100),
				explanation: candidate.explanation,
				pdfUrl: candidate.pdfUrl,
				availability_status: candidate.availability_status,
				skills: candidate.skills,
				experience_years: candidate.experience_years,
			})),
			job: {
				id: job.id,
				title: job.title,
				requirements: job.requirements,
			},
			weights,
		});
	} catch (error) {
		console.error("Error generating shortlist:", error);
		return NextResponse.json(
			{ error: "Failed to generate shortlist" },
			{ status: 500 }
		);
	}
}

async function calculateFitScore(
	candidate: Candidate,
	job: Job,
	weights: ScoringWeights
) {
	// Skill matching using OpenAI embeddings
	const skillScore = await calculateSkillMatch(candidate, job);

	// Experience scoring
	const experienceScore = calculateExperienceScore(candidate, job);

	// Timezone compatibility
	const timezoneScore = calculateTimezoneScore(candidate, job);

	// Availability scoring
	const availabilityScore = calculateAvailabilityScore(candidate);

	// Salary compatibility
	const salaryScore = calculateSalaryScore(candidate, job);

	// Calculate composite fit score
	const fitScore =
		skillScore * weights.skills +
		experienceScore * weights.experience +
		timezoneScore * weights.timezone +
		availabilityScore * weights.availability +
		salaryScore * weights.salary;

	// Generate explanation
	const explanation = {
		skill_match: {
			score: skillScore,
			weight: weights.skills,
			contribution: skillScore * weights.skills,
			details: "Skills analysis based on job requirements",
		},
		experience: {
			score: experienceScore,
			weight: weights.experience,
			contribution: experienceScore * weights.experience,
			details: `${candidate.experience_years || 0} years vs ${
				job.experience_min || 0
			}-${job.experience_max || 10} required`,
		},
		timezone: {
			score: timezoneScore,
			weight: weights.timezone,
			contribution: timezoneScore * weights.timezone,
			details: `Timezone compatibility: ${candidate.timezone || "Unknown"}`,
		},
		availability: {
			score: availabilityScore,
			weight: weights.availability,
			contribution: availabilityScore * weights.availability,
			details: `Status: ${candidate.availability_status || "unknown"}`,
		},
		salary: {
			score: salaryScore,
			weight: weights.salary,
			contribution: salaryScore * weights.salary,
			details: "Salary expectation alignment",
		},
	};

	return {
		fit_score: fitScore,
		skill_match_score: skillScore,
		experience_score: experienceScore,
		timezone_score: timezoneScore,
		availability_score: availabilityScore,
		salary_score: salaryScore,
		explanation,
	};
}

async function calculateSkillMatch(
	candidate: Candidate,
	job: Job
): Promise<number> {
	try {
		// Use OpenAI to analyze skill match
		const prompt = `
		Job Requirements: ${JSON.stringify(job.skills_required || [])}
		Job Preferred Skills: ${JSON.stringify(job.skills_preferred || [])}
		Candidate Skills: ${JSON.stringify(candidate.skills || [])}
		Candidate Resume Text: ${candidate.rawText?.substring(0, 2000) || ""}
		
		Analyze how well this candidate's skills match the job requirements. 
		Return a score from 0.0 to 1.0 where 1.0 is a perfect match.
		Consider both required and preferred skills, with required skills weighted more heavily.
		`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are an expert technical recruiter. Analyze skill matches and return only a decimal number between 0.0 and 1.0.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 10,
			temperature: 0.1,
		});

		const scoreText = completion.choices[0].message.content?.trim();
		const score = parseFloat(scoreText || "0");
		return Math.max(0, Math.min(1, score));
	} catch (error) {
		console.error("Error calculating skill match:", error);
		// Fallback to simple keyword matching
		return calculateSimpleSkillMatch(candidate, job);
	}
}

function calculateSimpleSkillMatch(candidate: Candidate, job: Job): number {
	const candidateSkills = (candidate.skills || []).map((s: string) =>
		s.toLowerCase()
	);
	const requiredSkills = (job.skills_required || []).map((s: string) =>
		s.toLowerCase()
	);
	const preferredSkills = (job.skills_preferred || []).map((s: string) =>
		s.toLowerCase()
	);

	let matches = 0;
	const total = requiredSkills.length + preferredSkills.length * 0.5;

	// Check required skills (weighted more heavily)
	requiredSkills.forEach((skill) => {
		if (
			candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs))
		) {
			matches += 1;
		}
	});

	// Check preferred skills (weighted less)
	preferredSkills.forEach((skill) => {
		if (
			candidateSkills.some((cs) => cs.includes(skill) || skill.includes(cs))
		) {
			matches += 0.5;
		}
	});

	return total > 0 ? Math.min(1, matches / total) : 0.5;
}

function calculateExperienceScore(candidate: Candidate, job: Job): number {
	const candidateExp = candidate.experience_years || 0;
	const minExp = job.experience_min || 0;
	const maxExp = job.experience_max || 20;

	if (candidateExp < minExp) {
		return Math.max(0, candidateExp / minExp);
	} else if (candidateExp > maxExp) {
		return Math.max(0.7, 1 - (candidateExp - maxExp) / 10);
	} else {
		return 1.0;
	}
}

function calculateTimezoneScore(candidate: Candidate, job: Job): number {
	if (!job.timezone_preference || !candidate.timezone) {
		return 0.5; // Neutral score if timezone info is missing
	}

	// Simple timezone compatibility (can be enhanced with actual timezone logic)
	const jobTz = job.timezone_preference.toLowerCase();
	const candidateTz = candidate.timezone.toLowerCase();

	if (jobTz.includes(candidateTz) || candidateTz.includes(jobTz)) {
		return 1.0;
	}

	// Basic overlap scoring (simplified)
	return 0.3;
}

function calculateAvailabilityScore(candidate: Candidate): number {
	switch (candidate.availability_status) {
		case "actively_looking":
			return 1.0;
		case "open":
			return 0.7;
		case "not_looking":
			return 0.1;
		default:
			return 0.5;
	}
}

function calculateSalaryScore(candidate: Candidate, job: Job): number {
	const candidateMin = candidate.preferred_salary_min;
	const candidateMax = candidate.preferred_salary_max;
	const jobMin = job.salary_min;
	const jobMax = job.salary_max;

	if (!candidateMin || !jobMin) {
		return 0.5; // Neutral if salary info is missing
	}

	// Check for overlap
	if (candidateMin <= (jobMax || 0) && (candidateMax || 0) >= (jobMin || 0)) {
		return 1.0; // Perfect overlap
	} else if (candidateMin > (jobMax || 0)) {
		// Candidate expects more than job offers
		const gap = candidateMin - (jobMax || 0);
		return Math.max(0, 1 - gap / (jobMax || 0));
	} else {
		// Job offers more than candidate expects (good for employer)
		return 0.9;
	}
}
