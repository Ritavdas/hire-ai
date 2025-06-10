import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { assessments, assessment_results, resumes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

// Predefined assessment templates
const ASSESSMENT_TEMPLATES = {
	react: {
		name: "React Development Assessment",
		skill_category: "React",
		difficulty_level: "intermediate",
		duration_minutes: 45,
		passing_score: 70,
		description: "Comprehensive React assessment covering hooks, state management, and best practices",
		questions: [
			{
				type: "multiple_choice",
				question: "What is the correct way to update state in a functional component?",
				options: ["setState()", "useState()", "this.setState()", "updateState()"],
				correct: 1,
				points: 10,
			},
			{
				type: "code_completion",
				question: "Complete the useEffect hook to fetch data on component mount:",
				code_template: "useEffect(() => {\n  // Your code here\n}, []);",
				expected_keywords: ["fetch", "async", "await", "then"],
				points: 20,
			},
			{
				type: "debugging",
				question: "Fix the infinite re-render issue in this component:",
				buggy_code: "const [count, setCount] = useState(0);\nuseEffect(() => {\n  setCount(count + 1);\n});",
				points: 15,
			},
		],
	},
	python: {
		name: "Python Development Assessment",
		skill_category: "Python",
		difficulty_level: "intermediate",
		duration_minutes: 60,
		passing_score: 75,
		description: "Python assessment covering data structures, algorithms, and best practices",
		questions: [
			{
				type: "multiple_choice",
				question: "Which of the following is the most efficient way to check if a key exists in a dictionary?",
				options: ["key in dict", "dict.has_key(key)", "try/except KeyError", "dict.get(key) is not None"],
				correct: 0,
				points: 10,
			},
			{
				type: "coding_challenge",
				question: "Write a function to find the two numbers in a list that sum to a target value:",
				function_signature: "def two_sum(nums: List[int], target: int) -> List[int]:",
				test_cases: [
					{ input: "([2, 7, 11, 15], 9)", expected: "[0, 1]" },
					{ input: "([3, 2, 4], 6)", expected: "[1, 2]" },
				],
				points: 25,
			},
		],
	},
	system_design: {
		name: "System Design Assessment",
		skill_category: "System Design",
		difficulty_level: "advanced",
		duration_minutes: 90,
		passing_score: 80,
		description: "Advanced system design assessment for senior engineers",
		questions: [
			{
				type: "design_question",
				question: "Design a URL shortening service like bit.ly. Consider scalability, reliability, and performance.",
				evaluation_criteria: [
					"Database design",
					"Scalability considerations",
					"Caching strategy",
					"Load balancing",
					"Security measures",
				],
				points: 40,
			},
		],
	},
};

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const category = searchParams.get("category");
		const difficulty = searchParams.get("difficulty");

		let query = db.select().from(assessments);

		if (category) {
			query = query.where(eq(assessments.skill_category, category));
		}

		if (difficulty) {
			query = query.where(eq(assessments.difficulty_level, difficulty));
		}

		const allAssessments = await query.orderBy(desc(assessments.created_at));

		return NextResponse.json({
			assessments: allAssessments,
		});
	} catch (error) {
		console.error("Error fetching assessments:", error);
		return NextResponse.json(
			{ error: "Failed to fetch assessments" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { templateKey, customAssessment } = body;

		let assessmentData;

		if (templateKey && ASSESSMENT_TEMPLATES[templateKey as keyof typeof ASSESSMENT_TEMPLATES]) {
			// Use predefined template
			assessmentData = ASSESSMENT_TEMPLATES[templateKey as keyof typeof ASSESSMENT_TEMPLATES];
		} else if (customAssessment) {
			// Use custom assessment data
			assessmentData = customAssessment;
		} else {
			return NextResponse.json(
				{ error: "Either templateKey or customAssessment is required" },
				{ status: 400 }
			);
		}

		// Create new assessment
		const newAssessment = await db
			.insert(assessments)
			.values({
				name: assessmentData.name,
				skill_category: assessmentData.skill_category,
				difficulty_level: assessmentData.difficulty_level,
				description: assessmentData.description,
				duration_minutes: assessmentData.duration_minutes,
				passing_score: assessmentData.passing_score,
				questions: assessmentData.questions,
			})
			.returning();

		return NextResponse.json({
			assessment: newAssessment[0],
			message: "Assessment created successfully",
		});
	} catch (error) {
		console.error("Error creating assessment:", error);
		return NextResponse.json(
			{ error: "Failed to create assessment" },
			{ status: 500 }
		);
	}
}

// Take assessment endpoint
export async function PUT(request: NextRequest) {
	try {
		const body = await request.json();
		const { assessmentId, resumeId, answers, timeSpent } = body;

		if (!assessmentId || !resumeId || !answers) {
			return NextResponse.json(
				{ error: "Missing required fields: assessmentId, resumeId, answers" },
				{ status: 400 }
			);
		}

		// Fetch assessment details
		const assessment = await db.query.assessments.findFirst({
			where: eq(assessments.id, assessmentId),
		});

		if (!assessment) {
			return NextResponse.json(
				{ error: "Assessment not found" },
				{ status: 404 }
			);
		}

		// Grade the assessment
		const gradingResult = await gradeAssessment(assessment, answers);

		// Calculate percentile (simplified - in production, use historical data)
		const percentile = calculatePercentile(gradingResult.score, assessment.skill_category);

		// Determine if badge is earned
		const passed = gradingResult.score >= assessment.passing_score;
		const badgeEarned = passed && gradingResult.score >= 85; // High performers get badges

		// Calculate badge expiry (18 months from now)
		const badgeExpiresAt = badgeEarned 
			? new Date(Date.now() + 18 * 30 * 24 * 60 * 60 * 1000) 
			: null;

		// Store assessment result
		const result = await db
			.insert(assessment_results)
			.values({
				resume_id: resumeId,
				assessment_id: assessmentId,
				score: gradingResult.score,
				percentile,
				time_taken_minutes: timeSpent,
				passed,
				badge_earned: badgeEarned,
				badge_expires_at: badgeExpiresAt,
				results_data: {
					answers,
					grading_details: gradingResult.details,
					feedback: gradingResult.feedback,
				},
			})
			.returning();

		return NextResponse.json({
			result: result[0],
			score: gradingResult.score,
			passed,
			badgeEarned,
			percentile,
			feedback: gradingResult.feedback,
			message: passed ? "Assessment passed successfully!" : "Assessment completed. Keep practicing!",
		});
	} catch (error) {
		console.error("Error processing assessment:", error);
		return NextResponse.json(
			{ error: "Failed to process assessment" },
			{ status: 500 }
		);
	}
}

async function gradeAssessment(assessment: any, answers: any[]) {
	const questions = assessment.questions;
	let totalScore = 0;
	let maxScore = 0;
	const details: any[] = [];
	const feedback: string[] = [];

	for (let i = 0; i < questions.length; i++) {
		const question = questions[i];
		const answer = answers[i];
		maxScore += question.points;

		let questionScore = 0;
		let questionFeedback = "";

		switch (question.type) {
			case "multiple_choice":
				if (answer.selected === question.correct) {
					questionScore = question.points;
					questionFeedback = "Correct!";
				} else {
					questionFeedback = `Incorrect. The correct answer was: ${question.options[question.correct]}`;
				}
				break;

			case "code_completion":
			case "coding_challenge":
				// Use AI to grade coding questions
				questionScore = await gradeCodeQuestion(question, answer);
				questionFeedback = await generateCodeFeedback(question, answer, questionScore);
				break;

			case "debugging":
				questionScore = await gradeDebuggingQuestion(question, answer);
				questionFeedback = await generateDebuggingFeedback(question, answer, questionScore);
				break;

			case "design_question":
				questionScore = await gradeDesignQuestion(question, answer);
				questionFeedback = await generateDesignFeedback(question, answer, questionScore);
				break;

			default:
				questionScore = 0;
				questionFeedback = "Question type not supported";
		}

		totalScore += questionScore;
		details.push({
			question_index: i,
			question_type: question.type,
			max_points: question.points,
			earned_points: questionScore,
			feedback: questionFeedback,
		});
		feedback.push(questionFeedback);
	}

	const finalScore = Math.round((totalScore / maxScore) * 100);

	return {
		score: finalScore,
		details,
		feedback,
	};
}

async function gradeCodeQuestion(question: any, answer: any): Promise<number> {
	try {
		const prompt = `
		Grade this coding answer on a scale of 0-${question.points}:
		
		Question: ${question.question}
		${question.function_signature ? `Expected signature: ${question.function_signature}` : ''}
		${question.expected_keywords ? `Should include: ${question.expected_keywords.join(', ')}` : ''}
		
		Student Answer: ${answer.code || answer.text}
		
		Consider:
		- Correctness of logic
		- Code quality and style
		- Use of appropriate data structures
		- Edge case handling
		
		Return only a number between 0 and ${question.points}.
		`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: "You are an expert programming instructor. Grade code fairly and consistently.",
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
		return Math.max(0, Math.min(question.points, score));
	} catch (error) {
		console.error("Error grading code question:", error);
		return 0;
	}
}

async function generateCodeFeedback(question: any, answer: any, score: number): Promise<string> {
	try {
		const prompt = `
		Provide constructive feedback for this coding answer (scored ${score}/${question.points}):
		
		Question: ${question.question}
		Answer: ${answer.code || answer.text}
		
		Give specific, actionable feedback in 1-2 sentences.
		`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content: "You are a helpful programming mentor. Provide encouraging but honest feedback.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: 100,
			temperature: 0.3,
		});

		return completion.choices[0].message.content || "Good effort!";
	} catch (error) {
		console.error("Error generating feedback:", error);
		return "Assessment completed.";
	}
}

async function gradeDebuggingQuestion(question: any, answer: any): Promise<number> {
	// Simplified grading for debugging questions
	const answerText = (answer.code || answer.text || "").toLowerCase();
	const hasCorrectFix = answerText.includes("dependency") || answerText.includes("[]");
	return hasCorrectFix ? question.points : Math.floor(question.points * 0.3);
}

async function generateDebuggingFeedback(question: any, answer: any, score: number): Promise<string> {
	if (score === question.points) {
		return "Excellent! You correctly identified and fixed the infinite re-render issue.";
	}
	return "The issue was an infinite re-render caused by missing dependency array in useEffect.";
}

async function gradeDesignQuestion(question: any, answer: any): Promise<number> {
	// Simplified grading for design questions
	const answerText = (answer.text || "").toLowerCase();
	const criteria = question.evaluation_criteria || [];
	let score = 0;
	
	criteria.forEach((criterion: string) => {
		if (answerText.includes(criterion.toLowerCase().split(' ')[0])) {
			score += question.points / criteria.length;
		}
	});
	
	return Math.round(score);
}

async function generateDesignFeedback(question: any, answer: any, score: number): Promise<string> {
	return `Good system design approach! Consider elaborating on scalability and caching strategies.`;
}

function calculatePercentile(score: number, category: string): number {
	// Simplified percentile calculation
	// In production, this would use historical assessment data
	if (score >= 90) return 95;
	if (score >= 80) return 85;
	if (score >= 70) return 70;
	if (score >= 60) return 55;
	return 30;
}
