import React, { useState } from "react";

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
			<button
				onClick={generateSummary}
				disabled={isLoading}
				className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center"
			>
				{isLoading ? (
					<>
						<div className="h-4 w-4 mr-2 border-t-2 border-b-2 border-blue-600 rounded-full animate-spin"></div>
						Generating AI summary...
					</>
				) : (
					<>
						<span className="mr-1">🔍</span> Summarize CV with AI
					</>
				)}
			</button>
		);
	}

	if (error) {
		return (
			<div className="mt-3">
				<button
					onClick={() => setIsExpanded(false)}
					className="text-sm text-gray-600 mb-2"
				>
					← Hide
				</button>
				<div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
					{error}
				</div>
			</div>
		);
	}

	if (!summary) {
		return null;
	}

	return (
		<div className="mt-3 bg-blue-50 p-3 rounded-lg">
			<div className="flex justify-between items-center mb-2">
				<h4 className="text-sm font-medium text-blue-800">AI Summary</h4>
				<button
					onClick={() => setIsExpanded(false)}
					className="text-xs text-gray-600"
				>
					Hide
				</button>
			</div>

			<div className="text-sm">
				<div className="mb-2">
					<span className="font-medium">Skills:</span>{" "}
					{summary.skills.join(", ")}
				</div>

				<div className="mb-2">
					<span className="font-medium">Experience:</span>{" "}
					{summary.experience}
				</div>

				<div className="mb-2">
					<span className="font-medium">Education:</span>{" "}
					{summary.education}
				</div>

				<div>
					<span className="font-medium">Key Highlights:</span>
					<ul className="list-disc list-inside mt-1">
						{summary.keyHighlights.map((highlight, index) => (
							<li key={index}>{highlight}</li>
						))}
					</ul>
				</div>
			</div>
		</div>
	);
}
