/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import JobCreator from "../components/JobCreator";
import ShortlistDashboard from "../components/ShortlistDashboard";
import JobAdComposer from "../components/JobAdComposer";
import {
	BriefcaseIcon,
	PlusIcon,
	SparklesIcon,
	EyeIcon,
	ShareIcon,
	UsersIcon,
} from "../components/icons";

type Job = {
	id: string;
	title: string;
	description: string;
	requirements: string;
	location: string | null;
	remote_friendly: boolean;
	salary_min: number | null;
	salary_max: number | null;
	experience_min: number | null;
	experience_max: number | null;
	skills_required: string[];
	skills_preferred: string[];
	status: string;
	created_at: string;
	updated_at: string;
};

export default function JobsPage() {
	const [jobs, setJobs] = useState<Job[]>([]);
	const [selectedJob, setSelectedJob] = useState<Job | null>(null);
	const [activeTab, setActiveTab] = useState<"overview" | "shortlist" | "ads">(
		"overview"
	);
	const [showJobCreator, setShowJobCreator] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		console.log("fetching jobs");
		fetchJobs();
	}, []);

	const fetchJobs = async () => {
		try {
			const response = await fetch("/api/jobs");
			if (!response.ok) throw new Error("Failed to fetch jobs");

			const data = await response.json();
			setJobs(data.jobs);
		} catch (err) {
			setError("Failed to load jobs");
		} finally {
			setIsLoading(false);
		}
	};

	const handleJobCreated = (newJob: Job) => {
		setJobs((prev) => [newJob, ...prev]);
		setShowJobCreator(false);
		setSelectedJob(newJob);
		setActiveTab("shortlist");
	};

	const formatSalary = (min: number | null, max: number | null) => {
		if (!min && !max) return "Competitive";
		if (!min) return `Up to $${max?.toLocaleString()}`;
		if (!max) return `From $${min.toLocaleString()}`;
		return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "paused":
				return "bg-yellow-100 text-yellow-800";
			case "closed":
				return "bg-gray-100 text-gray-800";
			default:
				return "bg-blue-100 text-blue-800";
		}
	};

	if (showJobCreator) {
		return (
			<div className="min-h-screen bg-gray-50">
				<header className="bg-white border-b border-gray-200 shadow-sm">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
						<div className="flex items-center justify-between h-16">
							<div className="flex items-center space-x-3">
								<button
									onClick={() => setShowJobCreator(false)}
									className="btn-ghost"
								>
									← Back to Jobs
								</button>
							</div>
						</div>
					</div>
				</header>

				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<JobCreator
						onJobCreated={handleJobCreated}
						onCancel={() => setShowJobCreator(false)}
					/>
				</main>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Header */}
			<header className="bg-white border-b border-gray-200 shadow-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						<div className="flex items-center space-x-3">
							<div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
								<BriefcaseIcon className="text-white" size={24} />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-900">
									Job Management
								</h1>
								<p className="text-sm text-gray-500">
									AI-powered recruitment pipeline
								</p>
							</div>
						</div>
						<div className="flex items-center space-x-4">
							<button
								onClick={() => setShowJobCreator(true)}
								className="btn-primary"
							>
								<PlusIcon className="mr-2" size={16} />
								Create Job
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Jobs List */}
					<div className="lg:col-span-1">
						<div className="card">
							<div className="card-header">
								<h2 className="text-lg font-semibold text-gray-900">
									Active Jobs
								</h2>
								<p className="text-sm text-gray-600">
									{jobs.length} total positions
								</p>
							</div>
							<div className="card-body p-0">
								{isLoading ? (
									<div className="flex items-center justify-center py-8">
										<div className="loading-spinner mr-2"></div>
										<span className="text-gray-600">
											Loading jobs...
										</span>
									</div>
								) : error ? (
									<div className="p-6 text-center">
										<div className="text-red-600 mb-2">Error</div>
										<div className="text-sm text-gray-600">
											{error}
										</div>
									</div>
								) : jobs.length === 0 ? (
									<div className="p-6 text-center">
										<BriefcaseIcon
											className="mx-auto text-gray-400 mb-4"
											size={48}
										/>
										<h3 className="text-lg font-medium text-gray-900 mb-2">
											No jobs yet
										</h3>
										<p className="text-gray-600 mb-4">
											Create your first job to start finding
											candidates
										</p>
										<button
											onClick={() => setShowJobCreator(true)}
											className="btn-primary"
										>
											<PlusIcon className="mr-2" size={16} />
											Create Job
										</button>
									</div>
								) : (
									<div className="divide-y divide-gray-200">
										{jobs.map((job) => (
											<button
												key={job.id}
												onClick={() => {
													setSelectedJob(job);
													setActiveTab("overview");
												}}
												className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
													selectedJob?.id === job.id
														? "bg-blue-50 border-r-2 border-blue-500"
														: ""
												}`}
											>
												<div className="space-y-2">
													<div className="flex items-start justify-between">
														<h3 className="font-semibold text-gray-900 text-sm">
															{job.title}
														</h3>
														<span
															className={`badge ${getStatusColor(
																job.status
															)} text-xs`}
														>
															{job.status}
														</span>
													</div>
													<div className="text-xs text-gray-600">
														{job.location || "Remote"} •{" "}
														{formatSalary(
															job.salary_min,
															job.salary_max
														)}
													</div>
													<div className="flex items-center space-x-4 text-xs text-gray-500">
														<span>
															{job.skills_required?.length || 0}{" "}
															required skills
														</span>
														<span>•</span>
														<span>
															{new Date(
																job.created_at
															).toLocaleDateString()}
														</span>
													</div>
												</div>
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Job Details */}
					<div className="lg:col-span-2">
						{selectedJob ? (
							<div className="space-y-6">
								{/* Job Header */}
								<div className="card">
									<div className="card-header">
										<div className="flex items-start justify-between">
											<div>
												<h2 className="text-xl font-bold text-gray-900">
													{selectedJob.title}
												</h2>
												<div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
													<span>
														{selectedJob.location || "Remote"}
													</span>
													<span>•</span>
													<span>
														{formatSalary(
															selectedJob.salary_min,
															selectedJob.salary_max
														)}
													</span>
													<span>•</span>
													<span
														className={`badge ${getStatusColor(
															selectedJob.status
														)}`}
													>
														{selectedJob.status}
													</span>
												</div>
											</div>
										</div>
									</div>

									{/* Tabs */}
									<div className="border-b border-gray-200">
										<nav className="flex space-x-8 px-6">
											{[
												{
													key: "overview",
													label: "Overview",
													icon: EyeIcon,
												},
												{
													key: "shortlist",
													label: "AI Shortlist",
													icon: SparklesIcon,
												},
												{
													key: "ads",
													label: "Job Ads",
													icon: ShareIcon,
												},
											].map((tab) => (
												<button
													key={tab.key}
													onClick={() =>
														// eslint-disable-next-line @typescript-eslint/no-explicit-any
														setActiveTab(tab.key as any)
													}
													className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
														activeTab === tab.key
															? "border-blue-500 text-blue-600"
															: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
													}`}
												>
													<tab.icon size={16} />
													<span>{tab.label}</span>
												</button>
											))}
										</nav>
									</div>
								</div>

								{/* Tab Content */}
								{activeTab === "overview" && (
									<div className="card">
										<div className="card-body space-y-6">
											<div>
												<h3 className="text-lg font-semibold text-gray-900 mb-3">
													Job Description
												</h3>
												<p className="text-gray-800 leading-relaxed">
													{selectedJob.description}
												</p>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
												<div>
													<h4 className="font-semibold text-gray-900 mb-3">
														Required Skills
													</h4>
													<div className="flex flex-wrap gap-2">
														{selectedJob.skills_required?.map(
															(skill, index) => (
																<span
																	key={index}
																	className="badge badge-primary"
																>
																	{skill}
																</span>
															)
														) || (
															<span className="text-gray-500">
																None specified
															</span>
														)}
													</div>
												</div>

												<div>
													<h4 className="font-semibold text-gray-900 mb-3">
														Preferred Skills
													</h4>
													<div className="flex flex-wrap gap-2">
														{selectedJob.skills_preferred?.map(
															(skill, index) => (
																<span
																	key={index}
																	className="badge badge-warning"
																>
																	{skill}
																</span>
															)
														) || (
															<span className="text-gray-500">
																None specified
															</span>
														)}
													</div>
												</div>
											</div>

											<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
												<div>
													<h4 className="font-semibold text-gray-900 mb-2">
														Experience
													</h4>
													<p className="text-gray-600">
														{selectedJob.experience_min || 0} -{" "}
														{selectedJob.experience_max || 10}{" "}
														years
													</p>
												</div>
												<div>
													<h4 className="font-semibold text-gray-900 mb-2">
														Remote Work
													</h4>
													<p className="text-gray-600">
														{selectedJob.remote_friendly
															? "Remote-friendly"
															: "On-site only"}
													</p>
												</div>
												<div>
													<h4 className="font-semibold text-gray-900 mb-2">
														Created
													</h4>
													<p className="text-gray-600">
														{new Date(
															selectedJob.created_at
														).toLocaleDateString()}
													</p>
												</div>
											</div>
										</div>
									</div>
								)}

								{activeTab === "shortlist" && (
									<ShortlistDashboard
										jobId={selectedJob.id}
										jobTitle={selectedJob.title}
									/>
								)}

								{activeTab === "ads" && (
									<JobAdComposer
										jobId={selectedJob.id}
										jobTitle={selectedJob.title}
									/>
								)}
							</div>
						) : (
							<div className="card">
								<div className="card-body text-center py-16">
									<UsersIcon
										className="mx-auto text-gray-400 mb-4"
										size={64}
									/>
									<h3 className="text-xl font-medium text-gray-900 mb-2">
										Select a job to get started
									</h3>
									<p className="text-gray-600 mb-6">
										Choose a job from the list to view details,
										generate AI shortlists, and create job ads
									</p>
									{jobs.length === 0 && (
										<button
											onClick={() => setShowJobCreator(true)}
											className="btn-primary"
										>
											<PlusIcon className="mr-2" size={16} />
											Create Your First Job
										</button>
									)}
								</div>
							</div>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
