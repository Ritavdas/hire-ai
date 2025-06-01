export default function Home() {
	return (
		<main className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">
				HireAI - CV Search & Screening
			</h1>
			<p className="text-lg mb-8">
				Upload and search through candidate resumes with ease.
			</p>

			{/* Search component will go here */}
			<section
				className="p-4 border rounded-lg bg-white shadow-sm"
				aria-label="Search functionality"
			>
				<p className="text-gray-600">Search functionality coming soon...</p>
			</section>
		</main>
	);
}
