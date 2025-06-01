"use client";

import { useState, useEffect } from "react";
import CandidateCard from "./components/CandidateCard";

type SearchResult = {
	id: string;
	name: string;
	location: string | null;
	snippet: string;
	relevance: number;
};

export default function Home() {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<SearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

			{results.length > 0 && (
				<section>
					<h2 className="text-xl font-semibold mb-4">Search Results</h2>
					<div className="space-y-4">
						{results.map((result) => (
							<CandidateCard
								key={result.id}
								id={result.id}
								name={result.name}
								location={result.location}
								snippet={result.snippet}
								relevance={result.relevance}
							/>
						))}
					</div>
				</section>
			)}
		</main>
	);
}
