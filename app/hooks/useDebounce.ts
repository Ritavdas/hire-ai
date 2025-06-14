import { useState, useEffect, useRef } from "react";

export function useDebounce<T>(value: T, delay: number): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
	callback: T,
	delay: number
): T {
	const callbackRef = useRef<T>(callback);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const delayRef = useRef<number>(delay);

	// Update the callback ref whenever callback changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Update the delay ref whenever delay changes
	useEffect(() => {
		delayRef.current = delay;
	}, [delay]);

	const debouncedCallback = useRef(((...args: Parameters<T>) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			callbackRef.current(...args);
		}, delayRef.current);
	}) as T);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback.current!;
}
