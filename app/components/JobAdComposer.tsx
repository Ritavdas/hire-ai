/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
	SparklesIcon,
	ExternalLinkIcon,
	ShareIcon,
	CheckIcon,
	TrendingUpIcon,
} from "./icons";

interface JobAd {
	board: string;
	boardName: string;
	content: string;
	title: string;
	tags: string[];
	estimatedReach: number;
}

interface JobAdComposerProps {
	jobId: string;
	jobTitle: string;
	onPublished?: (results: any[]) => void;
}

const JOB_BOARDS = [
	{
		key: "remote_ok",
		name: "Remote OK",
		icon: "🌍",
		color: "bg-green-100 text-green-800",
	},
	{
		key: "linkedin",
		name: "LinkedIn",
		icon: "💼",
		color: "bg-blue-100 text-blue-800",
	},
	{
		key: "hacker_news",
		name: "Hacker News",
		icon: "🔶",
		color: "bg-orange-100 text-orange-800",
	},
	{
		key: "angel_list",
		name: "AngelList",
		icon: "👼",
		color: "bg-purple-100 text-purple-800",
	},
];

const TONE_OPTIONS = [
	{
		value: "professional",
		label: "Professional",
		description: "Formal and corporate tone",
	},
	{
		value: "casual",
		label: "Casual",
		description: "Friendly and approachable",
	},
	{
		value: "enthusiastic",
		label: "Enthusiastic",
		description: "Energetic and exciting",
	},
];

export default function JobAdComposer({
	jobId,
	jobTitle,
	onPublished,
}: JobAdComposerProps) {
	const [selectedBoards, setSelectedBoards] = useState<string[]>([
		"remote_ok",
	]);
	const [tone, setTone] = useState("professional");
	const [includeDEI, setIncludeDEI] = useState(true);
	const [customPrompt, setCustomPrompt] = useState("");
	const [generatedAds, setGeneratedAds] = useState<JobAd[]>([]);
	const [isGenerating, setIsGenerating] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [publishResults, setPublishResults] = useState<any[]>([]);
	const [error, setError] = useState<string | null>(null);

	const handleBoardToggle = (boardKey: string) => {
		setSelectedBoards((prev) =>
			prev.includes(boardKey)
				? prev.filter((b) => b !== boardKey)
				: [...prev, boardKey]
		);
	};

	const generateJobAds = async () => {
		if (selectedBoards.length === 0) {
			setError("Please select at least one job board");
			return;
		}

		setIsGenerating(true);
		setError(null);

		try {
			const response = await fetch("/api/job-ads", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
					tone,
					includeDEI,
					targetBoards: selectedBoards,
					customPrompt: customPrompt.trim() || undefined,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to generate job ads");
			}

			const data = await response.json();
			setGeneratedAds(data.generatedAds);
		} catch (err) {
			console.error("Error generating job ads:", err);
			setError("Failed to generate job ads. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	const publishAds = async () => {
		setIsPublishing(true);
		setError(null);

		try {
			const response = await fetch("/api/job-ads", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jobId,
					ads: generatedAds,
					publishToBoards: selectedBoards,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to publish job ads");
			}

			const data = await response.json();
			setPublishResults(data.publishResults);
			onPublished?.(data.publishResults);
		} catch (err) {
			console.error("Error publishing job ads:", err);
			setError("Failed to publish job ads. Please try again.");
		} finally {
			setIsPublishing(false);
		}
	};

	const getTotalReach = () => {
		return generatedAds.reduce((total, ad) => total + ad.estimatedReach, 0);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="card">
				<div className="card-header">
					<div className="flex items-center space-x-3">
						<div className="flex items-center justify-center w-10 h-10 bg-purple-600 rounded-lg">
							<SparklesIcon className="text-white" size={20} />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">
								Smart Job Ad Composer
							</h2>
							<p className="text-sm text-gray-600">
								AI-powered job ads for:{" "}
								<span className="font-medium">{jobTitle}</span>
							</p>
						</div>
					</div>
				</div>

				<div className="card-body space-y-6">
					{/* Job Board Selection */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Target Job Boards
						</label>
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
							{JOB_BOARDS.map((board) => (
								<button
									key={board.key}
									onClick={() => handleBoardToggle(board.key)}
									className={`p-3 border-2 rounded-lg transition-all duration-200 ${
										selectedBoards.includes(board.key)
											? "border-blue-500 bg-blue-50"
											: "border-gray-200 hover:border-gray-300"
									}`}
								>
									<div className="text-center">
										<div className="text-2xl mb-1">{board.icon}</div>
										<div className="text-sm font-medium text-gray-900">
											{board.name}
										</div>
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Tone Selection */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Tone & Style
						</label>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-3">
							{TONE_OPTIONS.map((option) => (
								<button
									key={option.value}
									onClick={() => setTone(option.value)}
									className={`p-3 border-2 rounded-lg text-left transition-all duration-200 ${
										tone === option.value
											? "border-blue-500 bg-blue-50"
											: "border-gray-200 hover:border-gray-300"
									}`}
								>
									<div className="font-medium text-gray-900">
										{option.label}
									</div>
									<div className="text-sm text-gray-600">
										{option.description}
									</div>
								</button>
							))}
						</div>
					</div>

					{/* Options */}
					<div className="space-y-3">
						<div className="flex items-center space-x-3">
							<input
								type="checkbox"
								id="includeDEI"
								checked={includeDEI}
								onChange={(e) => setIncludeDEI(e.target.checked)}
								className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
							/>
							<label
								htmlFor="includeDEI"
								className="text-sm font-medium text-gray-700"
							>
								Include diversity, equity & inclusion language
							</label>
						</div>
					</div>

					{/* Custom Prompt */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Custom Instructions (Optional)
						</label>
						<textarea
							value={customPrompt}
							onChange={(e) => setCustomPrompt(e.target.value)}
							className="input-primary h-24 resize-none"
							placeholder="Add specific requirements, company culture details, or special instructions for the AI..."
						/>
					</div>

					{/* Generate Button */}
					<div className="flex justify-end">
						<button
							onClick={generateJobAds}
							disabled={isGenerating || selectedBoards.length === 0}
							className="btn-primary"
						>
							{isGenerating ? (
								<>
									<div className="loading-spinner mr-2"></div>
									Generating Ads...
								</>
							) : (
								<>
									<SparklesIcon className="mr-2" size={16} />
									Generate Job Ads
								</>
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Error Display */}
			{error && (
				<div className="card">
					<div className="card-body">
						<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
							<div className="text-red-700 font-medium">Error</div>
							<div className="text-red-600 text-sm mt-1">{error}</div>
						</div>
					</div>
				</div>
			)}

			{/* Generated Ads */}
			{generatedAds.length > 0 && (
				<div className="space-y-4">
					{/* Summary */}
					<div className="card">
						<div className="card-body">
							<div className="flex items-center justify-between">
								<div>
									<h3 className="text-lg font-semibold text-gray-900">
										Generated Job Ads
									</h3>
									<p className="text-sm text-gray-600">
										{generatedAds.length} ads created for{" "}
										{selectedBoards.length} platforms
									</p>
								</div>
								<div className="text-right">
									<div className="flex items-center space-x-2 text-sm text-gray-600">
										<TrendingUpIcon size={16} />
										<span>
											Est. reach: {getTotalReach().toLocaleString()}
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Individual Ads */}
					{generatedAds.map((ad, index) => {
						const board = JOB_BOARDS.find((b) => b.key === ad.board);
						const publishResult = publishResults.find(
							(r) => r.board === ad.board
						);

						return (
							<div key={index} className="card">
								<div className="card-header">
									<div className="flex items-center justify-between">
										<div className="flex items-center space-x-3">
											<span className="text-2xl">{board?.icon}</span>
											<div>
												<h4 className="font-semibold text-gray-900">
													{ad.boardName}
												</h4>
												<div className="flex items-center space-x-4 text-sm text-gray-600">
													<span>
														Est. reach:{" "}
														{ad.estimatedReach.toLocaleString()}
													</span>
													<span>•</span>
													<span>
														{ad.content.length} characters
													</span>
												</div>
											</div>
										</div>
										{publishResult && (
											<div
												className={`badge ${
													publishResult.status === "success"
														? "badge-success"
														: "badge-error"
												}`}
											>
												{publishResult.status === "success" ? (
													<>
														<CheckIcon
															className="mr-1"
															size={12}
														/>
														Published
													</>
												) : (
													"Failed"
												)}
											</div>
										)}
									</div>
								</div>

								<div className="card-body space-y-4">
									{/* Title */}
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-1">
											TITLE
										</label>
										<div className="font-semibold text-gray-900">
											{ad.title}
										</div>
									</div>

									{/* Content */}
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-1">
											CONTENT
										</label>
										<div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
											{ad.content}
										</div>
									</div>

									{/* Tags */}
									<div>
										<label className="block text-xs font-medium text-gray-600 mb-2">
											TAGS
										</label>
										<div className="flex flex-wrap gap-1">
											{ad.tags.map((tag, tagIndex) => (
												<span
													key={tagIndex}
													className="badge badge-primary text-xs"
												>
													{tag}
												</span>
											))}
										</div>
									</div>

									{/* Published URL */}
									{publishResult?.status === "success" &&
										publishResult.url && (
											<div>
												<label className="block text-xs font-medium text-gray-600 mb-1">
													PUBLISHED URL
												</label>
												<a
													href={publishResult.url}
													target="_blank"
													rel="noopener noreferrer"
													className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 text-sm"
												>
													<ExternalLinkIcon size={14} />
													<span>{publishResult.url}</span>
												</a>
											</div>
										)}
								</div>
							</div>
						);
					})}

					{/* Publish Actions */}
					{publishResults.length === 0 && (
						<div className="card">
							<div className="card-body">
								<div className="flex items-center justify-between">
									<div>
										<h4 className="font-medium text-gray-900">
											Ready to publish?
										</h4>
										<p className="text-sm text-gray-600">
											Your job ads will be posted to the selected
											platforms
										</p>
									</div>
									<button
										onClick={publishAds}
										disabled={isPublishing}
										className="btn-primary"
									>
										{isPublishing ? (
											<>
												<div className="loading-spinner mr-2"></div>
												Publishing...
											</>
										) : (
											<>
												<ShareIcon className="mr-2" size={16} />
												Publish All Ads
											</>
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Publish Results */}
					{publishResults.length > 0 && (
						<div className="card">
							<div className="card-header">
								<h4 className="font-semibold text-gray-900">
									Publishing Results
								</h4>
							</div>
							<div className="card-body">
								<div className="space-y-3">
									{publishResults.map((result, index) => {
										const board = JOB_BOARDS.find(
											(b) => b.key === result.board
										);
										return (
											<div
												key={index}
												className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
											>
												<div className="flex items-center space-x-3">
													<span className="text-lg">
														{board?.icon}
													</span>
													<div>
														<div className="font-medium text-gray-900">
															{board?.name}
														</div>
														<div className="text-sm text-gray-600">
															{result.message}
														</div>
													</div>
												</div>
												<div
													className={`badge ${
														result.status === "success"
															? "badge-success"
															: "badge-error"
													}`}
												>
													{result.status === "success"
														? "Success"
														: "Failed"}
												</div>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
