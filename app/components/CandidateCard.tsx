import React, { useState } from "react";
import DOMPurify from "dompurify";
import AISummary from "./AISummary";
import PDFViewer from "./PDFViewer";
import SimplePDFViewer from "./SimplePDFViewer";
import PDFDebugger from "./PDFDebugger";

type CandidateCardProps = {
	id: string;
	name: string;
	location: string | null;
	snippet: string;
	relevance?: number;
	pdfUrl?: string;
	preview?: string;
	searchTerm?: string;
};

export default function CandidateCard({
	id,
	name,
	location,
	snippet,
	relevance,
	pdfUrl,
	preview,
	searchTerm,
}: CandidateCardProps) {
	const [isPDFViewerOpen, setIsPDFViewerOpen] = useState(false);
	const [useSimpleViewer, setUseSimpleViewer] = useState(false);
	return (
		<>
			<div className="border rounded-lg p-4 mb-4 bg-white shadow-sm hover:shadow-md transition-shadow">
				<div className="flex justify-between items-start mb-2">
					<h3 className="text-lg font-semibold">{name}</h3>
					{relevance && (
						<span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
							{relevance}% match
						</span>
					)}
				</div>

				{location && (
					<p className="text-gray-600 text-sm mb-2">
						<span className="inline-block mr-1">📍</span> {location}
					</p>
				)}

				{/* Show snippet for search results or preview for all resumes */}
				<div className="mt-3">
					{snippet ? (
						<>
							<h4 className="text-sm font-medium text-gray-700 mb-1">
								Matching content:
							</h4>
							<div
								className="text-sm text-gray-800 bg-yellow-50 p-2 rounded"
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(snippet),
								}}
							/>
						</>
					) : preview ? (
						<>
							<h4 className="text-sm font-medium text-gray-700 mb-1">
								Preview:
							</h4>
							<div className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
								{preview}
							</div>
						</>
					) : null}
				</div>

				{/* Action buttons */}
				<div className="mt-4 flex gap-2 flex-wrap">
					<button
						onClick={() => {
							if (pdfUrl) {
								setUseSimpleViewer(false);
								setIsPDFViewerOpen(true);
							} else {
								alert(
									"PDF not available for this resume. Only text content is stored."
								);
							}
						}}
						className={`text-sm flex items-center ${
							pdfUrl
								? "text-blue-600 hover:text-blue-800"
								: "text-gray-400 cursor-not-allowed"
						}`}
					>
						<span className="mr-1">📄</span>
						{pdfUrl ? "View Resume" : "PDF Not Available"}
					</button>

					{pdfUrl && (
						<>
							<button
								onClick={() => {
									setUseSimpleViewer(true);
									setIsPDFViewerOpen(true);
								}}
								className="text-sm text-green-600 hover:text-green-800 flex items-center"
							>
								<span className="mr-1">🔧</span> Simple Viewer
							</button>
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
							>
								<span className="mr-1">🔗</span> Open in Tab
							</a>
						</>
					)}
				</div>

				<AISummary resumeId={id} />

				{/* PDF Debugger - only show for resumes with PDF URLs in development */}
				{pdfUrl && process.env.NODE_ENV === "development" && (
					<PDFDebugger pdfUrl={pdfUrl} candidateName={name} />
				)}
			</div>

			{/* PDF Viewer Modals */}
			{pdfUrl && isPDFViewerOpen && (
				<>
					{useSimpleViewer ? (
						<SimplePDFViewer
							pdfUrl={pdfUrl}
							candidateName={name}
							isOpen={isPDFViewerOpen}
							onClose={() => setIsPDFViewerOpen(false)}
						/>
					) : (
						<PDFViewer
							pdfUrl={pdfUrl}
							candidateName={name}
							isOpen={isPDFViewerOpen}
							onClose={() => setIsPDFViewerOpen(false)}
							searchTerm={searchTerm}
						/>
					)}
				</>
			)}
		</>
	);
}
