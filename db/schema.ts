import {
	pgTable,
	uuid,
	text,
	timestamp,
	integer,
	real,
	boolean,
	jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customType } from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({
	dataType() {
		return "tsvector";
	},
});

export const resumes = pgTable("resumes", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	name: text("name").notNull(),
	location: text("location"),
	rawText: text("raw_text").notNull(),
	pdfUrl: text("pdf_url"), // Supabase Storage URL
	tsv: tsvector("tsv"),
	// New fields for enhanced features
	skills: jsonb("skills"), // Extracted skills array
	experience_years: integer("experience_years"), // Years of experience
	availability_status: text("availability_status").default("unknown"), // actively_looking, open, not_looking, unknown
	availability_updated: timestamp("availability_updated").defaultNow(),
	timezone: text("timezone"), // Candidate timezone
	preferred_salary_min: integer("preferred_salary_min"),
	preferred_salary_max: integer("preferred_salary_max"),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow(),
});

// Job Requirements Table
export const jobs = pgTable("jobs", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	requirements: jsonb("requirements").notNull(), // Must-have and nice-to-have criteria
	location: text("location"),
	remote_friendly: boolean("remote_friendly").default(true),
	salary_min: integer("salary_min"),
	salary_max: integer("salary_max"),
	experience_min: integer("experience_min"),
	experience_max: integer("experience_max"),
	skills_required: jsonb("skills_required"), // Required skills array
	skills_preferred: jsonb("skills_preferred"), // Preferred skills array
	timezone_preference: text("timezone_preference"),
	created_by: text("created_by"), // Recruiter ID
	status: text("status").default("active"), // active, paused, closed
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow(),
});

// Candidate Scoring Table
export const candidate_scores = pgTable("candidate_scores", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	resume_id: uuid("resume_id")
		.references(() => resumes.id)
		.notNull(),
	job_id: uuid("job_id")
		.references(() => jobs.id)
		.notNull(),
	fit_score: real("fit_score").notNull(), // Overall composite score 0-1
	skill_match_score: real("skill_match_score").notNull(),
	experience_score: real("experience_score").notNull(),
	timezone_score: real("timezone_score").notNull(),
	availability_score: real("availability_score").notNull(),
	salary_score: real("salary_score").notNull(),
	explanation: jsonb("explanation"), // Breakdown of scoring factors
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow(),
});

// Skill Assessments Table
export const assessments = pgTable("assessments", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	name: text("name").notNull(),
	skill_category: text("skill_category").notNull(), // e.g., "React", "Python", "System Design"
	difficulty_level: text("difficulty_level").notNull(), // beginner, intermediate, advanced, expert
	description: text("description"),
	duration_minutes: integer("duration_minutes").notNull(),
	passing_score: integer("passing_score").notNull(), // Minimum score to pass (0-100)
	questions: jsonb("questions"), // Assessment questions/tasks
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow(),
});

// Candidate Assessment Results Table
export const assessment_results = pgTable("assessment_results", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	resume_id: uuid("resume_id")
		.references(() => resumes.id)
		.notNull(),
	assessment_id: uuid("assessment_id")
		.references(() => assessments.id)
		.notNull(),
	score: integer("score").notNull(), // Score achieved (0-100)
	percentile: integer("percentile"), // Percentile ranking
	time_taken_minutes: integer("time_taken_minutes"),
	passed: boolean("passed").notNull(),
	badge_earned: boolean("badge_earned").default(false),
	badge_expires_at: timestamp("badge_expires_at"), // Badges expire after 18 months
	results_data: jsonb("results_data"), // Detailed results
	taken_at: timestamp("taken_at").defaultNow(),
});

// Job Ad Templates Table
export const job_ad_templates = pgTable("job_ad_templates", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	name: text("name").notNull(),
	category: text("category").notNull(), // e.g., "tech", "marketing", "sales"
	template_content: text("template_content").notNull(),
	tone: text("tone").default("professional"), // professional, casual, enthusiastic
	includes_dei: boolean("includes_dei").default(true),
	created_at: timestamp("created_at").defaultNow(),
});

// Job Board Postings Table
export const job_board_postings = pgTable("job_board_postings", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	job_id: uuid("job_id")
		.references(() => jobs.id)
		.notNull(),
	board_name: text("board_name").notNull(), // "linkedin", "remote_ok", "hacker_news"
	external_post_id: text("external_post_id"), // ID from the job board
	post_url: text("post_url"),
	status: text("status").default("pending"), // pending, posted, failed, expired
	impressions: integer("impressions").default(0),
	clicks: integer("clicks").default(0),
	applications: integer("applications").default(0),
	cost_per_click: real("cost_per_click"),
	posted_at: timestamp("posted_at"),
	expires_at: timestamp("expires_at"),
	created_at: timestamp("created_at").defaultNow(),
	updated_at: timestamp("updated_at").defaultNow(),
});

// Recruiter Feedback Table (for improving AI rankings)
export const recruiter_feedback = pgTable("recruiter_feedback", {
	id: uuid("id")
		.default(sql`uuid_generate_v4()`)
		.notNull()
		.primaryKey(),
	job_id: uuid("job_id")
		.references(() => jobs.id)
		.notNull(),
	resume_id: uuid("resume_id")
		.references(() => resumes.id)
		.notNull(),
	recruiter_id: text("recruiter_id").notNull(),
	feedback_type: text("feedback_type").notNull(), // thumbs_up, thumbs_down, hired, interviewed
	relevance_rating: integer("relevance_rating"), // 1-5 rating
	notes: text("notes"),
	created_at: timestamp("created_at").defaultNow(),
});
