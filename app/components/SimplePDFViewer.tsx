"use client";

import React from "react";
import { CloseIcon, DocumentIcon, ExternalLinkIcon } from "./icons";

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
		<div className="modal-backdrop">
			<div className="modal-content max-w-7xl max-h-[95vh]">
				{/* Professional Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
					<div className="flex items-center space-x-4">
						<div className="flex items-center justify-center w-10 h-10 bg-green-600 rounded-lg">
							<DocumentIcon className="text-white" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								{candidateName}
							</h2>
							<p className="text-sm text-gray-600">Simple PDF Viewer</p>
						</div>
					</div>
					<div className="flex items-center space-x-3">
						<a
							href={pdfUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="btn-ghost"
							title="Open in New Tab"
						>
							<ExternalLinkIcon size={16} />
						</a>
						<button
							onClick={onClose}
							className="btn-ghost p-2"
							aria-label="Close PDF viewer"
						>
							<CloseIcon size={20} />
						</button>
					</div>
				</div>

				{/* PDF Content */}
				<div className="flex-1 p-6 bg-gray-50">
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
						<iframe
							src={pdfUrl}
							className="w-full h-full"
							title={`Resume for ${candidateName}`}
							style={{ minHeight: "700px" }}
							loading="lazy"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
					<div className="flex items-center justify-between">
						<div className="text-sm text-gray-600">
							<span>
								Fallback PDF viewer • Compatible with all browsers
							</span>
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
