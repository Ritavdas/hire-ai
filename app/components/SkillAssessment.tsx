/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
	ClockIcon,
	CheckIcon,
	CodeBracketIcon,
	AcademicCapIcon,
	TrophyIcon,
	PlayIcon,
} from "./icons";

interface Question {
	type: string;
	question: string;
	options?: string[];
	correct?: number;
	points: number;
	code_template?: string;
	function_signature?: string;
	expected_keywords?: string[];
	buggy_code?: string;
	evaluation_criteria?: string[];
}

interface Assessment {
	id: string;
	name: string;
	skill_category: string;
	difficulty_level: string;
	description: string;
	duration_minutes: number;
	passing_score: number;
	questions: Question[];
}

interface SkillAssessmentProps {
	assessmentId?: string;
	resumeId: string;
	onComplete?: (result: any) => void;
	onCancel?: () => void;
}

export default function SkillAssessment({
	assessmentId,
	resumeId,
	onComplete,
	onCancel,
}: SkillAssessmentProps) {
	const [assessment, setAssessment] = useState<Assessment | null>(null);
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [answers, setAnswers] = useState<any[]>([]);
	const [timeRemaining, setTimeRemaining] = useState(0);
	const [isStarted, setIsStarted] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (assessmentId) {
			fetchAssessment();
		}
	}, [assessmentId]);

	useEffect(() => {
		let timer: NodeJS.Timeout;
		if (isStarted && timeRemaining > 0) {
			timer = setInterval(() => {
				setTimeRemaining((prev) => {
					if (prev <= 1) {
						handleSubmit(); // Auto-submit when time runs out
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		}
		return () => clearInterval(timer);
	}, [isStarted, timeRemaining]);

	const fetchAssessment = async () => {
		try {
			const response = await fetch(`/api/assessments?id=${assessmentId}`);
			if (!response.ok) throw new Error("Failed to fetch assessment");

			const data = await response.json();
			setAssessment(data.assessment);
			setAnswers(new Array(data.assessment.questions.length).fill({}));
		} catch (err) {
			console.error("Error fetching assessment:", err);
			setError("Failed to load assessment");
		}
	};

	const startAssessment = () => {
		if (!assessment) return;
		setIsStarted(true);
		setTimeRemaining(assessment.duration_minutes * 60);
	};

	const handleAnswerChange = (questionIndex: number, answer: any) => {
		setAnswers((prev) => {
			const newAnswers = [...prev];
			newAnswers[questionIndex] = answer;
			return newAnswers;
		});
	};

	const handleSubmit = async () => {
		if (!assessment) return;

		setIsSubmitting(true);
		const timeSpent =
			assessment.duration_minutes - Math.floor(timeRemaining / 60);

		try {
			const response = await fetch("/api/assessments", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					assessmentId: assessment.id,
					resumeId,
					answers,
					timeSpent,
				}),
			});

			if (!response.ok) throw new Error("Failed to submit assessment");

			const result = await response.json();
			onComplete?.(result);
		} catch (err) {
			console.error("Error submitting assessment:", err);
			setError("Failed to submit assessment");
		} finally {
			setIsSubmitting(false);
		}
	};

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const getDifficultyColor = (level: string) => {
		switch (level) {
			case "beginner":
				return "bg-green-100 text-green-800";
			case "intermediate":
				return "bg-yellow-100 text-yellow-800";
			case "advanced":
				return "bg-orange-100 text-orange-800";
			case "expert":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	if (!assessment) {
		return (
			<div className="card">
				<div className="card-body text-center py-12">
					<div className="loading-spinner mx-auto mb-4"></div>
					<p className="text-gray-600">Loading assessment...</p>
				</div>
			</div>
		);
	}

	if (!isStarted) {
		return (
			<div className="card max-w-2xl mx-auto">
				<div className="card-header">
					<div className="flex items-center space-x-3">
						<div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
							<AcademicCapIcon className="text-white" size={24} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								{assessment.name}
							</h2>
							<p className="text-sm text-gray-600">
								{assessment.description}
							</p>
						</div>
					</div>
				</div>

				<div className="card-body space-y-6">
					{/* Assessment Details */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<ClockIcon
								className="mx-auto text-gray-600 mb-2"
								size={24}
							/>
							<div className="text-lg font-semibold text-gray-900">
								{assessment.duration_minutes} min
							</div>
							<div className="text-sm text-gray-600">Duration</div>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<CodeBracketIcon
								className="mx-auto text-gray-600 mb-2"
								size={24}
							/>
							<div className="text-lg font-semibold text-gray-900">
								{assessment.questions.length}
							</div>
							<div className="text-sm text-gray-600">Questions</div>
						</div>
						<div className="text-center p-4 bg-gray-50 rounded-lg">
							<TrophyIcon
								className="mx-auto text-gray-600 mb-2"
								size={24}
							/>
							<div className="text-lg font-semibold text-gray-900">
								{assessment.passing_score}%
							</div>
							<div className="text-sm text-gray-600">Passing Score</div>
						</div>
					</div>

					{/* Difficulty Badge */}
					<div className="flex justify-center">
						<span
							className={`badge ${getDifficultyColor(
								assessment.difficulty_level
							)} text-sm px-4 py-2`}
						>
							{assessment.difficulty_level.charAt(0).toUpperCase() +
								assessment.difficulty_level.slice(1)}{" "}
							Level
						</span>
					</div>

					{/* Instructions */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h3 className="font-semibold text-blue-900 mb-2">
							Instructions
						</h3>
						<ul className="text-sm text-blue-800 space-y-1">
							<li>
								• You have {assessment.duration_minutes} minutes to
								complete the assessment
							</li>
							<li>• Answer all questions to the best of your ability</li>
							<li>
								• You can navigate between questions but cannot pause
								the timer
							</li>
							<li>
								• Your assessment will auto-submit when time expires
							</li>
							<li>
								• Achieve {assessment.passing_score}% or higher to earn
								a verified badge
							</li>
						</ul>
					</div>

					{/* Start Button */}
					<div className="flex items-center justify-between pt-4">
						{onCancel && (
							<button onClick={onCancel} className="btn-secondary">
								Cancel
							</button>
						)}
						<button
							onClick={startAssessment}
							className="btn-primary ml-auto"
						>
							<PlayIcon className="mr-2" size={16} />
							Start Assessment
						</button>
					</div>
				</div>
			</div>
		);
	}

	const question = assessment.questions[currentQuestion];
	const answer = answers[currentQuestion] || {};

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Header with Timer */}
			<div className="card">
				<div className="card-body">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-lg font-semibold text-gray-900">
								{assessment.name}
							</h2>
							<p className="text-sm text-gray-600">
								Question {currentQuestion + 1} of{" "}
								{assessment.questions.length}
							</p>
						</div>
						<div className="flex items-center space-x-4">
							<div
								className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
									timeRemaining < 300
										? "bg-red-100 text-red-800"
										: "bg-blue-100 text-blue-800"
								}`}
							>
								<ClockIcon size={16} />
								<span className="font-mono font-semibold">
									{formatTime(timeRemaining)}
								</span>
							</div>
						</div>
					</div>

					{/* Progress Bar */}
					<div className="mt-4">
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style={{
									width: `${
										((currentQuestion + 1) /
											assessment.questions.length) *
										100
									}%`,
								}}
							></div>
						</div>
					</div>
				</div>
			</div>

			{/* Question */}
			<div className="card">
				<div className="card-body space-y-6">
					<div>
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-lg font-semibold text-gray-900">
								Question {currentQuestion + 1}
							</h3>
							<span className="badge badge-primary">
								{question.points} points
							</span>
						</div>
						<p className="text-gray-800 leading-relaxed">
							{question.question}
						</p>
					</div>

					{/* Question Content Based on Type */}
					{question.type === "multiple_choice" && (
						<div className="space-y-3">
							{question.options?.map((option, index) => (
								<label
									key={index}
									className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
								>
									<input
										type="radio"
										name={`question-${currentQuestion}`}
										value={index}
										checked={answer.selected === index}
										onChange={(e) =>
											handleAnswerChange(currentQuestion, {
												selected: parseInt(e.target.value),
											})
										}
										className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
									/>
									<span className="text-gray-800">{option}</span>
								</label>
							))}
						</div>
					)}

					{(question.type === "code_completion" ||
						question.type === "coding_challenge") && (
						<div className="space-y-4">
							{question.function_signature && (
								<div className="bg-gray-100 p-3 rounded-lg">
									<code className="text-sm text-gray-800">
										{question.function_signature}
									</code>
								</div>
							)}
							<textarea
								value={answer.code || question.code_template || ""}
								onChange={(e) =>
									handleAnswerChange(currentQuestion, {
										code: e.target.value,
									})
								}
								className="input-primary h-48 font-mono text-sm"
								placeholder="Write your code here..."
							/>
						</div>
					)}

					{question.type === "debugging" && (
						<div className="space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Buggy Code:
								</label>
								<div className="bg-red-50 border border-red-200 p-3 rounded-lg">
									<pre className="text-sm text-gray-800">
										{question.buggy_code}
									</pre>
								</div>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Your Fix:
								</label>
								<textarea
									value={answer.code || ""}
									onChange={(e) =>
										handleAnswerChange(currentQuestion, {
											code: e.target.value,
										})
									}
									className="input-primary h-32 font-mono text-sm"
									placeholder="Provide the corrected code..."
								/>
							</div>
						</div>
					)}

					{question.type === "design_question" && (
						<div className="space-y-4">
							{question.evaluation_criteria && (
								<div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
									<h4 className="font-medium text-blue-900 mb-2">
										Consider these aspects:
									</h4>
									<ul className="text-sm text-blue-800 space-y-1">
										{question.evaluation_criteria.map(
											(criterion, index) => (
												<li key={index}>• {criterion}</li>
											)
										)}
									</ul>
								</div>
							)}
							<textarea
								value={answer.text || ""}
								onChange={(e) =>
									handleAnswerChange(currentQuestion, {
										text: e.target.value,
									})
								}
								className="input-primary h-64"
								placeholder="Describe your system design approach..."
							/>
						</div>
					)}
				</div>
			</div>

			{/* Navigation */}
			<div className="card">
				<div className="card-body">
					<div className="flex items-center justify-between">
						<button
							onClick={() =>
								setCurrentQuestion(Math.max(0, currentQuestion - 1))
							}
							disabled={currentQuestion === 0}
							className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Previous
						</button>

						<div className="flex items-center space-x-2">
							{assessment.questions.map((_, index) => (
								<button
									key={index}
									onClick={() => setCurrentQuestion(index)}
									className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
										index === currentQuestion
											? "bg-blue-600 text-white"
											: answers[index] &&
											  Object.keys(answers[index]).length > 0
											? "bg-green-100 text-green-800"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{index + 1}
								</button>
							))}
						</div>

						{currentQuestion === assessment.questions.length - 1 ? (
							<button
								onClick={handleSubmit}
								disabled={isSubmitting}
								className="btn-primary"
							>
								{isSubmitting ? (
									<>
										<div className="loading-spinner mr-2"></div>
										Submitting...
									</>
								) : (
									<>
										<CheckIcon className="mr-2" size={16} />
										Submit Assessment
									</>
								)}
							</button>
						) : (
							<button
								onClick={() =>
									setCurrentQuestion(
										Math.min(
											assessment.questions.length - 1,
											currentQuestion + 1
										)
									)
								}
								className="btn-primary"
							>
								Next
							</button>
						)}
					</div>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div className="card">
					<div className="card-body">
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="text-red-700 font-medium">Error</div>
							<div className="text-red-600 text-sm mt-1">{error}</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
