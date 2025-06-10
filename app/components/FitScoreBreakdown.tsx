"use client";

import React from "react";
import { ChevronDownIcon, ChevronRightIcon, InfoIcon } from "./icons";

interface ScoreComponent {
	score: number;
	weight: number;
	contribution: number;
	details: string;
}

interface FitScoreBreakdownProps {
	candidate: {
		id: string;
		name: string;
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
	};
	isExpanded: boolean;
	onToggle: () => void;
}

export default function FitScoreBreakdown({ 
	candidate, 
	isExpanded, 
	onToggle 
}: FitScoreBreakdownProps) {
	const scoreComponents = [
		{
			name: "Skills Match",
			score: candidate.skill_match_score,
			data: candidate.explanation.skill_match,
			color: "blue",
		},
		{
			name: "Experience",
			score: candidate.experience_score,
			data: candidate.explanation.experience,
			color: "green",
		},
		{
			name: "Timezone",
			score: candidate.timezone_score,
			data: candidate.explanation.timezone,
			color: "purple",
		},
		{
			name: "Availability",
			score: candidate.availability_score,
			data: candidate.explanation.availability,
			color: "orange",
		},
		{
			name: "Salary",
			score: candidate.salary_score,
			data: candidate.explanation.salary,
			color: "indigo",
		},
	];

	const getColorClasses = (color: string) => {
		const colorMap: Record<string, { bg: string; text: string; border: string }> = {
			blue: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
			green: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
			purple: { bg: "bg-purple-100", text: "text-purple-800", border: "border-purple-200" },
			orange: { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" },
			indigo: { bg: "bg-indigo-100", text: "text-indigo-800", border: "border-indigo-200" },
		};
		return colorMap[color] || colorMap.blue;
	};

	const getScoreColor = (score: number) => {
		if (score >= 80) return "text-green-600";
		if (score >= 60) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<div className="border border-gray-200 rounded-lg overflow-hidden">
			{/* Toggle Header */}
			<button
				onClick={onToggle}
				className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-left"
			>
				<div className="flex items-center space-x-2">
					<InfoIcon className="text-gray-500" size={16} />
					<span className="text-sm font-medium text-gray-700">
						Score Breakdown & Explanation
					</span>
				</div>
				<div className="flex items-center space-x-2">
					<span className="text-xs text-gray-500">
						{isExpanded ? "Hide" : "Show"} details
					</span>
					{isExpanded ? (
						<ChevronDownIcon className="text-gray-400" size={16} />
					) : (
						<ChevronRightIcon className="text-gray-400" size={16} />
					)}
				</div>
			</button>

			{/* Expanded Content */}
			{isExpanded && (
				<div className="p-4 bg-white">
					<div className="mb-4">
						<h5 className="text-sm font-semibold text-gray-800 mb-2">
							How we calculated the {candidate.fit_score}% fit score:
						</h5>
						<p className="text-xs text-gray-600 mb-4">
							Each component is weighted based on job requirements. Scores ≥5% contribution are shown below.
						</p>
					</div>

					{/* Score Components */}
					<div className="space-y-3">
						{scoreComponents
							.filter(component => component.data.contribution >= 0.05) // Only show components with ≥5% contribution
							.sort((a, b) => b.data.contribution - a.data.contribution) // Sort by contribution
							.map((component, index) => {
								const colors = getColorClasses(component.color);
								const contributionPercent = Math.round(component.data.contribution * 100);
								
								return (
									<div key={index} className={`border ${colors.border} rounded-lg p-3 ${colors.bg}`}>
										<div className="flex items-center justify-between mb-2">
											<div className="flex items-center space-x-3">
												<span className="text-sm font-medium text-gray-800">
													{component.name}
												</span>
												<span className={`text-sm font-bold ${getScoreColor(component.score)}`}>
													{component.score}%
												</span>
											</div>
											<div className="text-right">
												<div className="text-xs text-gray-600">
													Weight: {Math.round(component.data.weight * 100)}%
												</div>
												<div className={`text-sm font-semibold ${colors.text}`}>
													+{contributionPercent}% to total
												</div>
											</div>
										</div>

										{/* Progress Bar */}
										<div className="mb-2">
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className={`h-2 rounded-full transition-all duration-300 ${
														component.score >= 80 ? "bg-green-500" :
														component.score >= 60 ? "bg-yellow-500" : "bg-red-500"
													}`}
													style={{ width: `${component.score}%` }}
												></div>
											</div>
										</div>

										{/* Details */}
										<div className="text-xs text-gray-700">
											{component.data.details}
										</div>
									</div>
								);
							})}
					</div>

					{/* Summary */}
					<div className="mt-4 pt-4 border-t border-gray-200">
						<div className="flex items-center justify-between text-sm">
							<span className="text-gray-600">Total Weighted Score:</span>
							<span className="font-bold text-blue-600 text-lg">
								{candidate.fit_score}%
							</span>
						</div>
						<div className="mt-2 text-xs text-gray-500">
							This candidate ranks in the top tier for this position based on the weighted criteria.
						</div>
					</div>

					{/* AI Explanation Note */}
					<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<div className="flex items-start space-x-2">
							<InfoIcon className="text-blue-600 mt-0.5" size={14} />
							<div className="text-xs text-blue-800">
								<span className="font-medium">AI Analysis:</span> This breakdown is generated using 
								advanced language models to analyze resume content against job requirements. 
								Scores are continuously refined based on recruiter feedback.
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
