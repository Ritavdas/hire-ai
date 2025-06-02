"use client";

import React, { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
	CloseIcon,
	ChevronLeftIcon,
	ChevronRightIcon,
	ZoomInIcon,
	ZoomOutIcon,
	DocumentIcon,
	ExternalLinkIcon,
} from "./icons";

// Set up PDF.js worker with better error handling
if (typeof window !== "undefined") {
	// Try multiple worker sources for better compatibility
	const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
	pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

	// Enable verbose logging for debugging
	if (process.env.NODE_ENV === "development") {
		console.log("PDF.js version:", pdfjs.version);
		console.log("PDF.js worker source:", workerSrc);
	}
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
	const [scale, setScale] = useState<number>(1.0);
	const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

	// Reset state when pdfUrl or isOpen changes
	useEffect(() => {
		if (isOpen) {
			console.log("PDF Viewer opened with URL:", pdfUrl);
			setPageNumber(1);
			setLoading(true);
			setError(null);
		}
	}, [pdfUrl, isOpen]);

	function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
		console.log("PDF loaded successfully, pages:", numPages);
		setNumPages(numPages);
		setLoading(false);
		setError(null);
	}

	function onDocumentLoadError(error: Error) {
		console.error("PDF load error:", error);
		console.error("PDF URL that failed:", pdfUrl);

		// More specific error messages
		let errorMessage = "Failed to load PDF. ";
		if (error.message.includes("CORS")) {
			errorMessage +=
				"CORS error - PDF server doesn't allow cross-origin requests.";
		} else if (error.message.includes("404")) {
			errorMessage += "PDF file not found.";
		} else if (error.message.includes("403")) {
			errorMessage += "Access denied to PDF file.";
		} else {
			errorMessage += `Error: ${error.message}`;
		}

		setError(errorMessage);
		setLoading(false);
	}

	const goToPrevPage = () => {
		setPageNumber((prev) => Math.max(prev - 1, 1));
	};

	const goToNextPage = () => {
		setPageNumber((prev) => Math.min(prev + 1, numPages));
	};

	const zoomIn = () => {
		setScale((prev) => Math.min(prev + 0.25, 3.0));
	};

	const zoomOut = () => {
		setScale((prev) => Math.max(prev - 0.25, 0.5));
	};

	const resetZoom = () => {
		setScale(1.0);
	};

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen);
	};

	if (!isOpen) return null;

	return (
		<div className="modal-backdrop">
			<div
				className={`modal-content ${
					isFullscreen ? "max-w-full max-h-full" : "max-w-6xl max-h-[95vh]"
				}`}
			>
				{/* Professional Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
					<div className="flex items-center space-x-4">
						<div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
							<DocumentIcon className="text-white" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								{candidateName}
							</h2>
							<div className="flex items-center space-x-4 text-sm text-gray-600">
								{searchTerm && (
									<span>
										Searching:{" "}
										<span className="font-medium text-blue-600">
											&ldquo;{searchTerm}&rdquo;
										</span>
									</span>
								)}
								{numPages > 0 && (
									<span>
										{numPages} page{numPages > 1 ? "s" : ""}
									</span>
								)}
							</div>
						</div>
					</div>
					<button
						onClick={onClose}
						className="btn-ghost p-2"
						aria-label="Close PDF viewer"
					>
						<CloseIcon size={20} />
					</button>
				</div>

				{/* Toolbar */}
				{!loading && !error && numPages > 0 && (
					<div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
						{/* Navigation Controls */}
						<div className="flex items-center space-x-2">
							<button
								onClick={goToPrevPage}
								disabled={pageNumber <= 1}
								className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronLeftIcon size={16} />
							</button>
							<span className="text-sm text-gray-600 min-w-[100px] text-center">
								Page {pageNumber} of {numPages}
							</span>
							<button
								onClick={goToNextPage}
								disabled={pageNumber >= numPages}
								className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
							>
								<ChevronRightIcon size={16} />
							</button>
						</div>

						{/* Zoom Controls */}
						<div className="flex items-center space-x-2">
							<button
								onClick={zoomOut}
								disabled={scale <= 0.5}
								className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
								title="Zoom Out"
							>
								<ZoomOutIcon size={16} />
							</button>
							<span className="text-sm text-gray-600 min-w-[60px] text-center">
								{Math.round(scale * 100)}%
							</span>
							<button
								onClick={zoomIn}
								disabled={scale >= 3.0}
								className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
								title="Zoom In"
							>
								<ZoomInIcon size={16} />
							</button>
							<button
								onClick={resetZoom}
								className="btn-ghost text-xs"
								title="Reset Zoom"
							>
								Reset
							</button>
						</div>

						{/* Action Controls */}
						<div className="flex items-center space-x-2">
							<button
								onClick={toggleFullscreen}
								className="btn-ghost"
								title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
							>
								{isFullscreen ? "Exit" : "Fullscreen"}
							</button>
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="btn-ghost"
								title="Open in New Tab"
							>
								<ExternalLinkIcon size={16} />
							</a>
						</div>
					</div>
				)}

				{/* PDF Content */}
				<div className="flex-1 overflow-auto bg-gray-100">
					{loading && (
						<div className="flex items-center justify-center h-96">
							<div className="text-center">
								<div className="loading-spinner mb-4"></div>
								<p className="text-gray-600 font-medium">
									Loading PDF...
								</p>
								<p className="text-sm text-gray-500 mt-1">
									Please wait while we prepare the document
								</p>
							</div>
						</div>
					)}

					{error && (
						<div className="flex items-center justify-center h-96">
							<div className="text-center max-w-md">
								<div className="text-red-500 mb-4">
									<DocumentIcon size={48} className="mx-auto" />
								</div>
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Unable to Load PDF
								</h3>
								<p className="text-gray-600 mb-4">{error}</p>
								<div className="space-y-2">
									<button
										onClick={() => window.open(pdfUrl, "_blank")}
										className="btn-primary"
									>
										<ExternalLinkIcon className="mr-2" size={16} />
										Open in New Tab
									</button>
									<button
										onClick={() => window.location.reload()}
										className="btn-secondary ml-2"
									>
										Retry
									</button>
								</div>
							</div>
						</div>
					)}

					{!loading && !error && (
						<div className="flex flex-col items-center py-6">
							<Document
								file={pdfUrl}
								options={{
									httpHeaders: {
										Accept: "application/pdf",
									},
									withCredentials: false,
								}}
								onLoadSuccess={onDocumentLoadSuccess}
								onLoadError={onDocumentLoadError}
								onLoadStart={() => console.log("PDF loading started")}
								className="shadow-lg"
								loading={
									<div className="flex items-center justify-center h-96">
										<div className="text-center">
											<div className="loading-spinner mb-4"></div>
											<p className="text-gray-600">
												Loading document...
											</p>
										</div>
									</div>
								}
								error={
									<div className="flex items-center justify-center h-64">
										<div className="text-red-600 text-center">
											<p className="text-lg font-semibold">
												Failed to load PDF
											</p>
											<p className="text-sm">
												The PDF file could not be loaded.
											</p>
										</div>
									</div>
								}
								noData={
									<div className="flex items-center justify-center h-64">
										<div className="text-gray-600 text-center">
											<p className="text-lg font-semibold">
												No PDF data
											</p>
											<p className="text-sm">
												The PDF file appears to be empty.
											</p>
										</div>
									</div>
								}
							>
								<Page
									pageNumber={pageNumber}
									width={
										typeof window !== "undefined"
											? Math.min(
													isFullscreen
														? window.innerWidth - 200
														: 800,
													window.innerWidth - 100
											  ) * scale
											: 800 * scale
									}
									renderTextLayer={true}
									renderAnnotationLayer={true}
									onLoadSuccess={() =>
										console.log(`Page ${pageNumber} loaded`)
									}
									onLoadError={(error) =>
										console.error(
											`Page ${pageNumber} load error:`,
											error
										)
									}
									loading={
										<div className="flex items-center justify-center h-96">
											<div className="text-center">
												<div className="loading-spinner mb-2"></div>
												<p className="text-gray-600 text-sm">
													Loading page {pageNumber}...
												</p>
											</div>
										</div>
									}
									error={
										<div className="flex items-center justify-center h-96">
											<div className="text-center">
												<div className="text-red-500 mb-2">
													<DocumentIcon
														size={32}
														className="mx-auto"
													/>
												</div>
												<p className="text-red-600 font-medium">
													Failed to load page {pageNumber}
												</p>
												<p className="text-sm text-gray-500 mt-1">
													Try refreshing or opening in a new tab
												</p>
											</div>
										</div>
									}
								/>
							</Document>
						</div>
					)}
				</div>

				{/* Footer */}
				<div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-600">
							{!loading && !error && numPages > 0 && (
								<span>
									Document loaded successfully • {numPages} page
									{numPages > 1 ? "s" : ""}
								</span>
							)}
						</div>
						<div className="flex items-center space-x-3">
							<a
								href={pdfUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
							>
								<ExternalLinkIcon className="mr-1" size={14} />
								Open in new tab
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
