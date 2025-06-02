"use client";

import React, { useState } from "react";

type PDFDebuggerProps = {
	pdfUrl: string;
	candidateName: string;
};

export default function PDFDebugger({ pdfUrl, candidateName }: PDFDebuggerProps) {
	const [testResults, setTestResults] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const runTests = async () => {
		setIsLoading(true);
		const results: string[] = [];

		try {
			// Test 1: Check if URL is accessible
			results.push("🔍 Testing PDF URL accessibility...");
			const response = await fetch(pdfUrl, { 
				method: 'HEAD',
				mode: 'cors'
			});
			
			if (response.ok) {
				results.push(`✅ URL accessible (${response.status})`);
				results.push(`📄 Content-Type: ${response.headers.get('content-type')}`);
				results.push(`📏 Content-Length: ${response.headers.get('content-length')} bytes`);
			} else {
				results.push(`❌ URL not accessible (${response.status} ${response.statusText})`);
			}

			// Test 2: Check CORS headers
			const corsHeaders = [
				'access-control-allow-origin',
				'access-control-allow-methods',
				'access-control-allow-headers'
			];
			
			results.push("\n🌐 CORS Headers:");
			corsHeaders.forEach(header => {
				const value = response.headers.get(header);
				results.push(`  ${header}: ${value || 'not set'}`);
			});

			// Test 3: Try to fetch actual content
			results.push("\n📥 Testing content fetch...");
			try {
				const contentResponse = await fetch(pdfUrl);
				if (contentResponse.ok) {
					const blob = await contentResponse.blob();
					results.push(`✅ Content fetched successfully (${blob.size} bytes)`);
					results.push(`📄 Blob type: ${blob.type}`);
				} else {
					results.push(`❌ Content fetch failed (${contentResponse.status})`);
				}
			} catch (fetchError) {
				results.push(`❌ Content fetch error: ${fetchError}`);
			}

		} catch (error) {
			results.push(`❌ Test failed: ${error}`);
		}

		setTestResults(results);
		setIsLoading(false);
	};

	return (
		<div className="bg-gray-50 border rounded-lg p-4 mt-4">
			<h4 className="font-semibold text-gray-700 mb-2">PDF Debug Info</h4>
			<p className="text-sm text-gray-600 mb-2">
				<strong>Candidate:</strong> {candidateName}
			</p>
			<p className="text-sm text-gray-600 mb-3 break-all">
				<strong>PDF URL:</strong> {pdfUrl}
			</p>
			
			<button
				onClick={runTests}
				disabled={isLoading}
				className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
			>
				{isLoading ? 'Testing...' : 'Run PDF Tests'}
			</button>

			{testResults.length > 0 && (
				<div className="mt-3 p-3 bg-white border rounded text-xs font-mono">
					<pre className="whitespace-pre-wrap">
						{testResults.join('\n')}
					</pre>
				</div>
			)}

			<div className="mt-3 flex gap-2">
				<a
					href={pdfUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="text-xs text-blue-600 hover:text-blue-800"
				>
					Open in New Tab
				</a>
				<button
					onClick={() => navigator.clipboard.writeText(pdfUrl)}
					className="text-xs text-gray-600 hover:text-gray-800"
				>
					Copy URL
				</button>
			</div>
		</div>
	);
}
