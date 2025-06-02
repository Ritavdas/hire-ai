import React, { useState } from "react";
import DOMPurify from "dompurify";
import AISummary from "./AISummary";
import PDFViewer from "./PDFViewer";
import SimplePDFViewer from "./SimplePDFViewer";
import PDFDebugger from "./PDFDebugger";
import {
	DocumentIcon,
	EyeIcon,
	ExternalLinkIcon,
	LocationIcon,
	UserIcon,
	StarIcon,
} from "./icons";

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
			<div className="card group hover:shadow-lg transition-all duration-300">
				{/* Card Header */}
				<div className="card-header">
					<div className="flex items-start justify-between">
						<div className="flex items-start space-x-4">
							<div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
								<UserIcon className="text-white" size={24} />
							</div>
							<div className="flex-1">
								<h3 className="text-xl font-bold text-gray-900 mb-1">
									{name}
								</h3>
								{location && (
									<div className="flex items-center text-gray-600 text-sm">
										<LocationIcon className="mr-1.5" size={16} />
										{location}
									</div>
								)}
							</div>
						</div>
						{relevance && (
							<div className="flex items-center space-x-2">
								<StarIcon className="text-yellow-500" size={16} />
								<span className="badge badge-primary font-semibold">
									{relevance}% match
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Card Body */}
				<div className="card-body">
					{/* Content Preview */}
					{snippet ? (
						<div className="mb-6">
							<h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
								Matching Content
							</h4>
							<div
								className="text-sm text-gray-800 bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400 p-4 rounded-r-lg"
								dangerouslySetInnerHTML={{
									__html: DOMPurify.sanitize(snippet),
								}}
							/>
						</div>
					) : preview ? (
						<div className="mb-6">
							<h4 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
								Profile Summary
							</h4>
							<div className="text-sm text-gray-800 bg-gray-50 border border-gray-200 p-4 rounded-lg leading-relaxed">
								{preview}
							</div>
						</div>
					) : null}

					{/* AI Summary */}
					<AISummary resumeId={id} />
				</div>

				{/* Card Footer */}
				<div className="card-footer">
					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-3">
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
								className={`btn-primary ${
									!pdfUrl ? "opacity-50 cursor-not-allowed" : ""
								}`}
								disabled={!pdfUrl}
							>
								<EyeIcon className="mr-2" size={16} />
								{pdfUrl ? "View Resume" : "PDF Not Available"}
							</button>

							{pdfUrl && (
								<>
									<button
										onClick={() => {
											setUseSimpleViewer(true);
											setIsPDFViewerOpen(true);
										}}
										className="btn-secondary"
									>
										<DocumentIcon className="mr-2" size={16} />
										Simple View
									</button>
									<a
										href={pdfUrl}
										target="_blank"
										rel="noopener noreferrer"
										className="btn-ghost"
									>
										<ExternalLinkIcon className="mr-2" size={16} />
										Open in Tab
									</a>
								</>
							)}
						</div>

						{/* Status Indicator */}
						<div className="flex items-center space-x-2">
							<div
								className={`w-2 h-2 rounded-full ${
									pdfUrl ? "bg-green-500" : "bg-gray-400"
								}`}
							></div>
							<span className="text-xs text-gray-500">
								{pdfUrl ? "PDF Available" : "Text Only"}
							</span>
						</div>
					</div>

					{/* PDF Debugger - only show for resumes with PDF URLs in development */}
					{pdfUrl && process.env.NODE_ENV === "development" && (
						<div className="mt-4 pt-4 border-t border-gray-200">
							<PDFDebugger pdfUrl={pdfUrl} candidateName={name} />
						</div>
					)}
				</div>
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
