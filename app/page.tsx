"use client";

import { useState, useEffect } from "react";
import CandidateCard from "./components/CandidateCard";

type SearchResult = {
	id: string;
	name: string;
	location: string | null;
	snippet: string;
	relevance: number;
	pdfUrl?: string | null;
};

type Resume = {
	id: string;
	name: string;
	location: string | null;
	pdfUrl: string | null;
	preview: string;
};

type PaginationInfo = {
	page: number;
	limit: number;
	totalCount: number;
	totalPages: number;
	hasNext: boolean;
	hasPrev: boolean;
};

export default function Home() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [allResumes, setAllResumes] = useState<Resume[]>([]);
	const [pagination, setPagination] = useState<PaginationInfo | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isLoadingResumes, setIsLoadingResumes] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [currentPage, setCurrentPage] = useState(1);

	// Fetch all resumes on page load
	useEffect(() => {
		const fetchAllResumes = async () => {
			setIsLoadingResumes(true);
			setError(null);

			try {
				const response = await fetch(
					`/api/resumes?page=${currentPage}&limit=20`
				);

				if (!response.ok) {
					throw new Error("Failed to fetch resumes");
				}

				const data = await response.json();
				setAllResumes(data.resumes);
				setPagination(data.pagination);
			} catch (err) {
				console.error("Error fetching resumes:", err);
				setError("Failed to load resumes. Please try again.");
			} finally {
				setIsLoadingResumes(false);
			}
		};

		fetchAllResumes();
	}, [currentPage]);

	// Debounced search effect
	useEffect(() => {
		if (!query.trim()) {
			setResults([]);
			return;
		}

		const timer = setTimeout(async () => {
			setIsLoading(true);
			setError(null);

			try {
				const response = await fetch(
					`/api/search?q=${encodeURIComponent(query)}`
				);

				if (!response.ok) {
					throw new Error("Search failed");
				}

				const data = await response.json();
				setResults(data.results);
			} catch (err) {
				console.error("Error searching resumes:", err);
				setError("Failed to search resumes. Please try again.");
			} finally {
				setIsLoading(false);
			}
		}, 300); // 300ms debounce

		return () => clearTimeout(timer);
	}, [query]);

	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">
				HireAI - CV Search & Screening
			</h1>
			<p className="text-lg mb-8">
				Upload and search through candidate resumes with ease.
			</p>

			<section className="p-4 border rounded-lg bg-white shadow-sm mb-8">
				<div className="mb-4">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search skills, job titles, or keywords..."
						className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						aria-label="Search resumes"
					/>
				</div>

				{isLoading && (
					<div className="text-center py-4">
						<div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
						<p className="mt-2 text-gray-600">Searching resumes...</p>
					</div>
				)}

				{error && (
					<div className="bg-red-50 text-red-700 p-3 rounded-lg">
						{error}
					</div>
				)}

				{!isLoading && !error && query.trim() && results.length === 0 && (
					<div className="text-center py-4 text-gray-600">
						No matching resumes found. Try different keywords.
					</div>
				)}
			</section>

			{/* Search Results */}
			{query.trim() && results.length > 0 && (
				<section>
					<h2 className="text-xl font-semibold mb-4">
						Search Results ({results.length} found)
					</h2>
					<div className="space-y-4">
						{results.map((result) => (
							<CandidateCard
								key={result.id}
								id={result.id}
								name={result.name}
								location={result.location}
								snippet={result.snippet}
								relevance={result.relevance}
								pdfUrl={result.pdfUrl || undefined}
								searchTerm={query}
							/>
						))}
					</div>
				</section>
			)}

			{/* All Resumes (shown when not searching) */}
			{!query.trim() && (
				<section>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							All Resumes
							{pagination && ` (${pagination.totalCount} total)`}
						</h2>
					</div>

					{isLoadingResumes ? (
						<div className="text-center py-8">
							<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
							<p className="mt-2 text-gray-600">Loading resumes...</p>
						</div>
					) : allResumes.length > 0 ? (
						<>
							<div className="space-y-4">
								{allResumes.map((resume) => (
									<CandidateCard
										key={resume.id}
										id={resume.id}
										name={resume.name}
										location={resume.location}
										snippet=""
										preview={resume.preview}
										pdfUrl={resume.pdfUrl || undefined}
									/>
								))}
							</div>

							{/* Pagination */}
							{pagination && pagination.totalPages > 1 && (
								<div className="flex justify-center items-center mt-8 space-x-4">
									<button
										onClick={() => setCurrentPage(currentPage - 1)}
										disabled={!pagination.hasPrev}
										className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
									>
										Previous
									</button>
									<span className="text-gray-600">
										Page {pagination.page} of {pagination.totalPages}
									</span>
									<button
										onClick={() => setCurrentPage(currentPage + 1)}
										disabled={!pagination.hasNext}
										className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-700"
									>
										Next
									</button>
								</div>
							)}
						</>
					) : (
						<div className="text-center py-8 text-gray-600">
							No resumes found. Upload some resumes to get started.
						</div>
					)}
				</section>
			)}
		</main>
	);
}
