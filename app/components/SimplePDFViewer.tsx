"use client";

import React from "react";

type SimplePDFViewerProps = {
	pdfUrl: string;
	candidateName: string;
	isOpen: boolean;
	onClose: () => void;
};

export default function SimplePDFViewer({
	pdfUrl,
	candidateName,
	isOpen,
	onClose,
}: SimplePDFViewerProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg max-w-6xl max-h-[95vh] w-full mx-4 flex flex-col">
				{/* Header */}
				<div className="flex justify-between items-center p-4 border-b">
					<div>
						<h2 className="text-xl font-semibold">{candidateName}</h2>
						<p className="text-sm text-gray-600">PDF Viewer (Fallback)</p>
					</div>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-2xl"
						aria-label="Close PDF viewer"
					>
						×
					</button>
				</div>

				{/* PDF Content */}
				<div className="flex-1 p-4">
					<iframe
						src={pdfUrl}
						className="w-full h-full border border-gray-300 rounded"
						title={`Resume for ${candidateName}`}
						style={{ minHeight: "600px" }}
					/>
				</div>

				{/* Footer */}
				<div className="p-4 border-t bg-gray-50 text-center">
					<div className="flex justify-center gap-4">
						<a
							href={pdfUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
						>
							Open in New Tab
						</a>
						<a
							href={pdfUrl}
							download={`${candidateName}-resume.pdf`}
							className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
						>
							Download PDF
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
