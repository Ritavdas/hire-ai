"use client";

import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "../hooks/useDebounce";

interface SearchInputProps {
	onSearch: (query: string) => void;
	placeholder?: string;
	debounceMs?: number;
	className?: string;
}

export default function SearchInput({
	onSearch,
	placeholder = "Search resumes...",
	debounceMs = 300,
	className = "w-full border px-4 py-2 rounded-lg",
}: SearchInputProps) {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query, debounceMs);

	// Memoize onSearch to prevent unnecessary effect re-runs
	const stableOnSearch = useCallback(onSearch, [onSearch]);

	// Call onSearch when debouncedQuery changes
	useEffect(() => {
		stableOnSearch(debouncedQuery);
	}, [debouncedQuery, stableOnSearch]);

	return (
		<input
			type="text"
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			placeholder={placeholder}
			className={className}
			aria-label="Search resumes"
			autoComplete="off"
			spellCheck="false"
		/>
	);
}
