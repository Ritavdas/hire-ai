"use client";

import { useState, useEffect } from "react";
import CandidateCard from "./components/CandidateCard";
import { SearchIcon, FilterIcon, BriefcaseIcon } from "./components/icons";

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
	const [sortBy, setSortBy] = useState<"relevance" | "name" | "recent">(
		"relevance"
	);

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
		<div className="min-h-screen bg-gray-50">
			{/* Professional Header */}
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-3">
							<div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
								<BriefcaseIcon className="text-white" size={24} />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-900">
									HireAI
								</h1>
								<p className="text-sm text-gray-500">
									Talent Acquisition Platform
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<div className="text-sm text-gray-600">
								{pagination && (
									<span>{pagination.totalCount} candidates</span>
								)}
							</div>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Search Section */}
				<div className="mb-8">
					<div className="text-center mb-6">
						<h2 className="text-3xl font-bold text-gray-900 mb-2">
							Find Your Next Hire
						</h2>
						<p className="text-lg text-gray-600 max-w-2xl mx-auto">
							Search through our database of qualified candidates using
							AI-powered matching
						</p>
					</div>

					<div className="card max-w-4xl mx-auto">
						<div className="card-body">
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
									<SearchIcon className="text-gray-400" size={20} />
								</div>
								<input
									type="text"
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search by skills, job titles, experience, or keywords..."
									className="input-primary pl-12 pr-4 py-4 text-lg"
									aria-label="Search resumes"
								/>
							</div>

							{/* Search Filters */}
							<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
								<div className="flex items-center space-x-4">
									<div className="flex items-center space-x-2">
										<FilterIcon className="text-gray-400" size={16} />
										<span className="text-sm text-gray-600">
											Sort by:
										</span>
									</div>
									<select
										value={sortBy}
										onChange={(e) =>
											setSortBy(
												e.target.value as
													| "relevance"
													| "name"
													| "recent"
											)
										}
										className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
									>
										<option value="relevance">Relevance</option>
										<option value="name">Name</option>
										<option value="recent">Most Recent</option>
									</select>
								</div>
								{query.trim() && (
									<div className="text-sm text-gray-500">
										{isLoading
											? "Searching..."
											: `${results.length} results found`}
									</div>
								)}
							</div>

							{/* Loading State */}
							{isLoading && (
								<div className="flex items-center justify-center py-8">
									<div className="loading-spinner"></div>
									<span className="ml-3 text-gray-600">
										Searching candidates...
									</span>
								</div>
							)}

							{/* Error State */}
							{error && (
								<div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
									<div className="flex items-center">
										<div className="text-red-600 font-medium">
											Search Error
										</div>
									</div>
									<div className="text-red-700 text-sm mt-1">
										{error}
									</div>
								</div>
							)}

							{/* No Results */}
							{!isLoading &&
								!error &&
								query.trim() &&
								results.length === 0 && (
									<div className="text-center py-8">
										<div className="text-gray-400 mb-2">
											<SearchIcon size={48} className="mx-auto" />
										</div>
										<h3 className="text-lg font-medium text-gray-900 mb-1">
											No candidates found
										</h3>
										<p className="text-gray-600">
											Try adjusting your search terms or filters
										</p>
									</div>
								)}
						</div>
					</div>
				</div>

				{/* Search Results */}
				{query.trim() && results.length > 0 && (
					<section className="mb-8">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">
								Search Results
							</h2>
							<div className="badge badge-primary">
								{results.length} candidates found
							</div>
						</div>
						<div className="grid gap-6">
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
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">
								All Candidates
							</h2>
							{pagination && (
								<div className="text-sm text-gray-600">
									Showing{" "}
									{(pagination.page - 1) * pagination.limit + 1}-
									{Math.min(
										pagination.page * pagination.limit,
										pagination.totalCount
									)}{" "}
									of {pagination.totalCount}
								</div>
							)}
						</div>

						{isLoadingResumes ? (
							<div className="flex items-center justify-center py-16">
								<div className="loading-spinner"></div>
								<span className="ml-3 text-gray-600">
									Loading candidates...
								</span>
							</div>
						) : allResumes.length > 0 ? (
							<>
								<div className="grid gap-6">
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

								{/* Professional Pagination */}
								{pagination && pagination.totalPages > 1 && (
									<div className="flex items-center justify-center mt-12">
										<nav className="flex items-center space-x-2">
											<button
												onClick={() =>
													setCurrentPage(currentPage - 1)
												}
												disabled={!pagination.hasPrev}
												className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Previous
											</button>
											<div className="flex items-center space-x-1">
												{Array.from(
													{
														length: Math.min(
															5,
															pagination.totalPages
														),
													},
													(_, i) => {
														const pageNum = i + 1;
														return (
															<button
																key={pageNum}
																onClick={() =>
																	setCurrentPage(pageNum)
																}
																className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
																	pageNum === pagination.page
																		? "bg-blue-600 text-white"
																		: "text-gray-700 hover:bg-gray-100"
																}`}
															>
																{pageNum}
															</button>
														);
													}
												)}
											</div>
											<button
												onClick={() =>
													setCurrentPage(currentPage + 1)
												}
												disabled={!pagination.hasNext}
												className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
											>
												Next
											</button>
										</nav>
									</div>
								)}
							</>
						) : (
							<div className="text-center py-16">
								<div className="text-gray-400 mb-4">
									<BriefcaseIcon size={64} className="mx-auto" />
								</div>
								<h3 className="text-xl font-medium text-gray-900 mb-2">
									No candidates yet
								</h3>
								<p className="text-gray-600">
									Upload some resumes to get started with your talent
									search
								</p>
							</div>
						)}
					</section>
				)}
			</main>
		</div>
	);
}
