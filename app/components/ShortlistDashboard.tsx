"use client";

import React, { useState, useEffect } from "react";
import FitScoreBreakdown from "./FitScoreBreakdown";
import {
	StarIcon,
	UserIcon,
	LocationIcon,
	EyeIcon,
	ThumbsUpIcon,
	ThumbsDownIcon,
	AdjustmentsIcon,
	ClockIcon,
} from "./icons";

interface ScoringWeights {
	skills: number;
	experience: number;
	timezone: number;
	availability: number;
	salary: number;
}

interface ScoreComponent {
	score: number;
	weight: number;
	contribution: number;
	details: string;
}

interface ShortlistCandidate {
	id: string;
	name: string;
	location: string | null;
	fit_score: number;
	skill_match_score: number;
	experience_score: number;
	timezone_score: number;
	availability_score: number;
	salary_score: number;
	explanation: {
		skill_match: ScoreComponent;
		experience: ScoreComponent;
		timezone: ScoreComponent;
		availability: ScoreComponent;
		salary: ScoreComponent;
	};
	pdfUrl?: string;
	availability_status: string;
	skills: string[];
	experience_years: number;
}

interface ShortlistDashboardProps {
	jobId: string;
	jobTitle: string;
	onCandidateSelect?: (candidate: ShortlistCandidate) => void;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
	skills: 0.4,
	experience: 0.25,
	timezone: 0.15,
	availability: 0.1,
	salary: 0.1,
};

export default function ShortlistDashboard({
	jobId,
	jobTitle,
	onCandidateSelect,
}: ShortlistDashboardProps) {
	const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
	const [weights, setWeights] = useState<ScoringWeights>(DEFAULT_WEIGHTS);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showWeightControls, setShowWeightControls] = useState(false);
	const [selectedCandidate, setSelectedCandidate] = useState<string | null>(
		null
	);

	const generateShortlist = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/shortlist", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
					weights,
					limit: 10,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate shortlist");
			}

			const data = await response.json();
			setCandidates(data.shortlist);
		} catch (err) {
			console.error("Error generating shortlist:", err);
			setError("Failed to generate shortlist. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		if (jobId) {
			generateShortlist();
		}
	}, [jobId]);

	const handleWeightChange = (
		category: keyof ScoringWeights,
		value: number
	) => {
		setWeights((prev) => ({
			...prev,
			[category]: value,
		}));
	};

	const handleFeedback = async (
		candidateId: string,
		feedbackType: "thumbs_up" | "thumbs_down"
	) => {
		try {
			await fetch("/api/feedback", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
					resumeId: candidateId,
					feedbackType,
					recruiterId: "current_user", // TODO: Replace with actual user ID
				}),
			});

			// Optionally refresh shortlist based on feedback
		} catch (err) {
			console.error("Error submitting feedback:", err);
		}
	};

	const getAvailabilityColor = (status: string) => {
		switch (status) {
			case "actively_looking":
				return "bg-green-100 text-green-800";
			case "open":
				return "bg-yellow-100 text-yellow-800";
			case "not_looking":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getAvailabilityText = (status: string) => {
		switch (status) {
			case "actively_looking":
				return "Actively Looking";
			case "open":
				return "Open to Opportunities";
			case "not_looking":
				return "Not Looking";
			default:
				return "Unknown";
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="card">
				<div className="card-header">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								AI-Powered Shortlist
							</h2>
							<p className="text-sm text-gray-600">
								Top candidates for:{" "}
								<span className="font-medium">{jobTitle}</span>
							</p>
						</div>
						<div className="flex items-center space-x-3">
							<button
								onClick={() =>
									setShowWeightControls(!showWeightControls)
								}
								className="btn-secondary"
							>
								<AdjustmentsIcon className="mr-2" size={16} />
								Adjust Weights
							</button>
							<button
								onClick={generateShortlist}
								disabled={isLoading}
								className="btn-primary"
							>
								{isLoading ? (
									<>
										<div className="loading-spinner mr-2"></div>
										Generating...
									</>
								) : (
									<>
										<StarIcon className="mr-2" size={16} />
										Refresh Shortlist
									</>
								)}
							</button>
						</div>
					</div>
				</div>

				{/* Weight Controls */}
				{showWeightControls && (
					<div className="card-body border-t border-gray-200">
						<h3 className="text-sm font-semibold text-gray-700 mb-4">
							Scoring Weights
						</h3>
						<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
							{Object.entries(weights).map(([category, weight]) => (
								<div key={category}>
									<label className="block text-xs font-medium text-gray-600 mb-2 capitalize">
										{category.replace("_", " ")} (
										{Math.round(weight * 100)}%)
									</label>
									<input
										type="range"
										min="0"
										max="1"
										step="0.05"
										value={weight}
										onChange={(e) =>
											handleWeightChange(
												category as keyof ScoringWeights,
												parseFloat(e.target.value)
											)
										}
										className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
									/>
								</div>
							))}
						</div>
						<div className="mt-4 flex justify-end">
							<button
								onClick={generateShortlist}
								className="btn-primary"
								disabled={isLoading}
							>
								Apply Changes
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Loading State */}
			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<div className="loading-spinner mr-3"></div>
					<span className="text-gray-600">
						Analyzing candidates and generating shortlist...
					</span>
				</div>
			)}

			{/* Error State */}
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

			{/* Shortlist Results */}
			{!isLoading && candidates.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900">
							Top {candidates.length} Candidates
						</h3>
						<div className="text-sm text-gray-600">
							<ClockIcon className="inline mr-1" size={14} />
							Generated in &lt;60s
						</div>
					</div>

					{candidates.map((candidate, index) => (
						<div
							key={candidate.id}
							className="card hover:shadow-lg transition-all duration-200"
						>
							<div className="card-body">
								<div className="flex items-start justify-between">
									<div className="flex items-start space-x-4 flex-1">
										{/* Rank Badge */}
										<div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-bold">
											{index + 1}
										</div>

										{/* Candidate Info */}
										<div className="flex-1">
											<div className="flex items-start justify-between mb-3">
												<div>
													<h4 className="text-lg font-semibold text-gray-900 mb-1">
														{candidate.name}
													</h4>
													{candidate.location && (
														<div className="flex items-center text-gray-600 text-sm mb-2">
															<LocationIcon
																className="mr-1.5"
																size={14}
															/>
															{candidate.location}
														</div>
													)}
													<div className="flex items-center space-x-3">
														<span
															className={`badge ${getAvailabilityColor(
																candidate.availability_status
															)}`}
														>
															{getAvailabilityText(
																candidate.availability_status
															)}
														</span>
														<span className="text-sm text-gray-600">
															{candidate.experience_years} years
															experience
														</span>
													</div>
												</div>

												{/* Fit Score */}
												<div className="text-right">
													<div className="flex items-center space-x-2 mb-2">
														<StarIcon
															className="text-yellow-500"
															size={16}
														/>
														<span className="text-2xl font-bold text-blue-600">
															{candidate.fit_score}%
														</span>
													</div>
													<div className="text-xs text-gray-500">
														Fit Score
													</div>
												</div>
											</div>

											{/* Skills */}
											{candidate.skills &&
												candidate.skills.length > 0 && (
													<div className="mb-4">
														<div className="text-xs font-medium text-gray-600 mb-2">
															KEY SKILLS
														</div>
														<div className="flex flex-wrap gap-1">
															{candidate.skills
																.slice(0, 6)
																.map((skill, skillIndex) => (
																	<span
																		key={skillIndex}
																		className="badge badge-primary text-xs"
																	>
																		{skill}
																	</span>
																))}
															{candidate.skills.length > 6 && (
																<span className="badge bg-gray-100 text-gray-600 text-xs">
																	+
																	{candidate.skills.length - 6}{" "}
																	more
																</span>
															)}
														</div>
													</div>
												)}

											{/* Score Breakdown */}
											<FitScoreBreakdown
												candidate={candidate}
												isExpanded={
													selectedCandidate === candidate.id
												}
												onToggle={() =>
													setSelectedCandidate(
														selectedCandidate === candidate.id
															? null
															: candidate.id
													)
												}
											/>
										</div>
									</div>
								</div>

								{/* Actions */}
								<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
									<div className="flex items-center space-x-2">
										<button
											onClick={() =>
												handleFeedback(candidate.id, "thumbs_up")
											}
											className="btn-ghost text-green-600 hover:bg-green-50"
										>
											<ThumbsUpIcon size={16} />
										</button>
										<button
											onClick={() =>
												handleFeedback(candidate.id, "thumbs_down")
											}
											className="btn-ghost text-red-600 hover:bg-red-50"
										>
											<ThumbsDownIcon size={16} />
										</button>
									</div>

									<div className="flex items-center space-x-3">
										{candidate.pdfUrl && (
											<button
												onClick={() =>
													onCandidateSelect?.(candidate)
												}
												className="btn-secondary"
											>
												<EyeIcon className="mr-2" size={16} />
												View Resume
											</button>
										)}
										<button className="btn-primary">
											<UserIcon className="mr-2" size={16} />
											Contact Candidate
										</button>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Empty State */}
			{!isLoading && !error && candidates.length === 0 && (
				<div className="card">
					<div className="card-body text-center py-12">
						<StarIcon className="mx-auto text-gray-400 mb-4" size={48} />
						<h3 className="text-lg font-medium text-gray-900 mb-2">
							No shortlist generated yet
						</h3>
						<p className="text-gray-600 mb-4">
							Click &quot;Generate Shortlist&quot; to find the best
							candidates for this job.
						</p>
						<button onClick={generateShortlist} className="btn-primary">
							<StarIcon className="mr-2" size={16} />
							Generate Shortlist
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
