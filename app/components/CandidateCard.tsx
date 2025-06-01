import React from "react";
import DOMPurify from "dompurify";
import AISummary from "./AISummary";

type CandidateCardProps = {
	id: string;
	name: string;
	location: string | null;
	snippet: string;
	relevance: number;
};

export default function CandidateCard({
	id,
	name,
	location,
	snippet,
	relevance,
}: CandidateCardProps) {
	return (
		<div className="border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
			<div className="flex justify-between items-start mb-2">
				<h3 className="text-lg font-semibold">{name}</h3>
				<span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
					{relevance}% match
				</span>
			</div>

			{location && (
				<p className="text-gray-600 text-sm mb-2">
					<span className="inline-block mr-1">📍</span> {location}
				</p>
			)}

			<div className="mt-3">
				<h4 className="text-sm font-medium text-gray-700 mb-1">
					Matching content:
				</h4>
				<div
					className="text-sm text-gray-800 bg-yellow-50 p-2 rounded"
					dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(snippet) }}
				/>
			</div>

			<AISummary resumeId={id} />
		</div>
	);
}
