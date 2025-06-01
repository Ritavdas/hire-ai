interface AIButtonProps {
	onClick: () => void;
	disabled?: boolean;
	loading?: boolean;
	children?: React.ReactNode;
}

export default function AIButton({
	onClick,
	disabled = false,
	loading = false,
	children = "AI Summarize",
}: AIButtonProps) {
	return (
		<button
			onClick={onClick}
			disabled={disabled || loading}
			type="button"
			className="ai-button"
			aria-label="Generate AI summary of candidate"
		>
			{loading ? "Generating..." : children}
		</button>
	);
}
