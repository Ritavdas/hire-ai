"use client";

import { useState, useEffect } from "react";
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

	// Call onSearch when debouncedQuery changes
	useEffect(() => {
		onSearch(debouncedQuery);
	}, [debouncedQuery, onSearch]);

	return (
		<input
			type="text"
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			placeholder={placeholder}
			className={className}
		/>
	);
}
