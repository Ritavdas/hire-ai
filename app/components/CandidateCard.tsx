interface CandidateCardProps {
	candidate: {
		id: string;
		name: string;
		email: string;
		summary?: string;
		skills?: string[];
		// Add other relevant candidate fields
	};
}

export default function CandidateCard({ candidate }: CandidateCardProps) {
	return (
		<article className="candidate-card">
			<h3>{candidate.name}</h3>
			<p>{candidate.email}</p>
			{candidate.summary && <p>{candidate.summary}</p>}
			{/* Add more candidate details */}
		</article>
	);
}
