import React, { useState } from "react";
import { StarIcon, EyeIcon, ChevronLeftIcon } from "./icons";

type SummaryData = {
	skills: string[];
	experience: string;
	education: string;
	keyHighlights: string[];
};

type AISummaryProps = {
	resumeId: string;
};

export default function AISummary({ resumeId }: AISummaryProps) {
	const [summary, setSummary] = useState<SummaryData | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	const generateSummary = async () => {
		setIsLoading(true);
		setError(null);

		try {
			const response = await fetch("/api/summarize", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ id: resumeId }),
			});

			if (!response.ok) {
				throw new Error("Failed to generate summary");
			}

			const data = await response.json();
			setSummary(data.summary);
			setIsExpanded(true);
		} catch (err) {
			console.error("Error generating summary:", err);
			setError("Failed to generate summary. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	if (!isExpanded) {
		return (
			<div className="mt-4">
				<button
					onClick={generateSummary}
					disabled={isLoading}
					className="btn-secondary w-full justify-center"
				>
					{isLoading ? (
						<>
							<div className="loading-spinner mr-2"></div>
							Generating AI Summary...
						</>
					) : (
						<>
							<StarIcon className="mr-2" size={16} />
							Generate AI Summary
						</>
					)}
				</button>
			</div>
		);
	}

	if (error) {
		return (
			<div className="mt-4">
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center justify-between mb-2">
						<h4 className="text-sm font-semibold text-red-800">
							AI Summary Error
						</h4>
						<button
							onClick={() => setIsExpanded(false)}
							className="btn-ghost p-1"
						>
							<ChevronLeftIcon size={14} />
						</button>
					</div>
					<p className="text-red-700 text-sm">{error}</p>
					<button
						onClick={generateSummary}
						className="btn-secondary mt-3 text-xs"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	if (!summary) {
		return null;
	}

	return (
		<div className="mt-4">
			<div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center space-x-2">
						<StarIcon className="text-blue-600" size={16} />
						<h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wide">
							AI-Generated Summary
						</h4>
					</div>
					<button
						onClick={() => setIsExpanded(false)}
						className="btn-ghost p-1"
					>
						<ChevronLeftIcon size={14} />
					</button>
				</div>

				<div className="space-y-4 text-sm">
					{/* Skills */}
					<div>
						<h5 className="font-semibold text-gray-800 mb-2">
							Core Skills
						</h5>
						<div className="flex flex-wrap gap-2">
							{summary.skills.map((skill, index) => (
								<span
									key={index}
									className="badge badge-primary text-xs"
								>
									{skill}
								</span>
							))}
						</div>
					</div>

					{/* Experience */}
					<div>
						<h5 className="font-semibold text-gray-800 mb-2">
							Experience Level
						</h5>
						<p className="text-gray-700 leading-relaxed">
							{summary.experience}
						</p>
					</div>

					{/* Education */}
					<div>
						<h5 className="font-semibold text-gray-800 mb-2">
							Education Background
						</h5>
						<p className="text-gray-700 leading-relaxed">
							{summary.education}
						</p>
					</div>

					{/* Key Highlights */}
					<div>
						<h5 className="font-semibold text-gray-800 mb-2">
							Key Highlights
						</h5>
						<ul className="space-y-1">
							{summary.keyHighlights.map((highlight, index) => (
								<li key={index} className="flex items-start">
									<span className="text-blue-600 mr-2 mt-1">•</span>
									<span className="text-gray-700 leading-relaxed">
										{highlight}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</div>
	);
}
