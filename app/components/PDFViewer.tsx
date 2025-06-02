"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker
if (typeof window !== "undefined") {
	pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
}

type PDFViewerProps = {
	pdfUrl: string;
	candidateName: string;
	isOpen: boolean;
	onClose: () => void;
	searchTerm?: string;
};

export default function PDFViewer({
	pdfUrl,
	candidateName,
	isOpen,
	onClose,
	searchTerm,
}: PDFViewerProps) {
	const [numPages, setNumPages] = useState<number>(0);
	const [pageNumber, setPageNumber] = useState<number>(1);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
		setNumPages(numPages);
		setLoading(false);
		setError(null);
	}

	function onDocumentLoadError(error: Error) {
		console.error("PDF load error:", error);
		setError("Failed to load PDF. Please try again.");
		setLoading(false);
	}

	const goToPrevPage = () => {
		setPageNumber((prev) => Math.max(prev - 1, 1));
	};

	const goToNextPage = () => {
		setPageNumber((prev) => Math.min(prev + 1, numPages));
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col">
				{/* Header */}
				<div className="flex justify-between items-center p-4 border-b">
					<div>
						<h2 className="text-xl font-semibold">{candidateName}</h2>
						{searchTerm && (
							<p className="text-sm text-gray-600">
								Searching for: "{searchTerm}"
							</p>
						)}
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
				<div className="flex-1 overflow-auto p-4">
					{loading && (
						<div className="flex items-center justify-center h-64">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
							<span className="ml-2">Loading PDF...</span>
						</div>
					)}

					{error && (
						<div className="flex items-center justify-center h-64">
							<div className="text-red-600 text-center">
								<p className="text-lg font-semibold">
									Error Loading PDF
								</p>
								<p className="text-sm">{error}</p>
								<button
									onClick={() => window.open(pdfUrl, "_blank")}
									className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
								>
									Open in New Tab
								</button>
							</div>
						</div>
					)}

					{!loading && !error && (
						<div className="flex flex-col items-center">
							<Document
								file={pdfUrl}
								onLoadSuccess={onDocumentLoadSuccess}
								onLoadError={onDocumentLoadError}
								className="border border-gray-300"
								loading={
									<div className="flex items-center justify-center h-64">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
										<span className="ml-2">Loading PDF...</span>
									</div>
								}
							>
								<Page
									pageNumber={pageNumber}
									width={
										typeof window !== "undefined"
											? Math.min(800, window.innerWidth - 100)
											: 800
									}
									renderTextLayer={false}
									renderAnnotationLayer={false}
									loading={
										<div className="flex items-center justify-center h-64">
											<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
											<span className="ml-2">Loading page...</span>
										</div>
									}
								/>
							</Document>
						</div>
					)}
				</div>

				{/* Footer with navigation */}
				{!loading && !error && numPages > 0 && (
					<div className="flex justify-between items-center p-4 border-t bg-gray-50">
						<button
							onClick={goToPrevPage}
							disabled={pageNumber <= 1}
							className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
						>
							Previous
						</button>

						<span className="text-sm text-gray-600">
							Page {pageNumber} of {numPages}
						</span>

						<button
							onClick={goToNextPage}
							disabled={pageNumber >= numPages}
							className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
						>
							Next
						</button>
					</div>
				)}

				{/* Alternative link if PDF viewer fails */}
				<div className="p-2 text-center border-t">
					<a
						href={pdfUrl}
						target="_blank"
						rel="noopener noreferrer"
						className="text-sm text-blue-600 hover:text-blue-800"
					>
						Open PDF in new tab
					</a>
				</div>
			</div>
		</div>
	);
}
