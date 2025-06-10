"use client";

import React, { useState } from "react";
import { PlusIcon, BriefcaseIcon, LocationIcon, DollarSignIcon } from "./icons";

interface JobRequirements {
	must_have: string[];
	nice_to_have: string[];
}

interface JobFormData {
	title: string;
	description: string;
	requirements: JobRequirements;
	location: string;
	remote_friendly: boolean;
	salary_min: number | null;
	salary_max: number | null;
	experience_min: number | null;
	experience_max: number | null;
	skills_required: string[];
	skills_preferred: string[];
	timezone_preference: string;
}

interface JobCreatorProps {
	onJobCreated?: (job: any) => void;
	onCancel?: () => void;
}

export default function JobCreator({ onJobCreated, onCancel }: JobCreatorProps) {
	const [formData, setFormData] = useState<JobFormData>({
		title: "",
		description: "",
		requirements: {
			must_have: [],
			nice_to_have: [],
		},
		location: "",
		remote_friendly: true,
		salary_min: null,
		salary_max: null,
		experience_min: null,
		experience_max: null,
		skills_required: [],
		skills_preferred: [],
		timezone_preference: "",
	});

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Temporary input states for adding skills/requirements
	const [newRequiredSkill, setNewRequiredSkill] = useState("");
	const [newPreferredSkill, setNewPreferredSkill] = useState("");
	const [newMustHave, setNewMustHave] = useState("");
	const [newNiceToHave, setNewNiceToHave] = useState("");

	const handleInputChange = (field: keyof JobFormData, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
	};

	const addSkill = (type: 'required' | 'preferred') => {
		const skill = type === 'required' ? newRequiredSkill : newPreferredSkill;
		if (!skill.trim()) return;

		const field = type === 'required' ? 'skills_required' : 'skills_preferred';
		setFormData(prev => ({
			...prev,
			[field]: [...prev[field], skill.trim()],
		}));

		if (type === 'required') {
			setNewRequiredSkill("");
		} else {
			setNewPreferredSkill("");
		}
	};

	const removeSkill = (type: 'required' | 'preferred', index: number) => {
		const field = type === 'required' ? 'skills_required' : 'skills_preferred';
		setFormData(prev => ({
			...prev,
			[field]: prev[field].filter((_, i) => i !== index),
		}));
	};

	const addRequirement = (type: 'must_have' | 'nice_to_have') => {
		const requirement = type === 'must_have' ? newMustHave : newNiceToHave;
		if (!requirement.trim()) return;

		setFormData(prev => ({
			...prev,
			requirements: {
				...prev.requirements,
				[type]: [...prev.requirements[type], requirement.trim()],
			},
		}));

		if (type === 'must_have') {
			setNewMustHave("");
		} else {
			setNewNiceToHave("");
		}
	};

	const removeRequirement = (type: 'must_have' | 'nice_to_have', index: number) => {
		setFormData(prev => ({
			...prev,
			requirements: {
				...prev.requirements,
				[type]: prev.requirements[type].filter((_, i) => i !== index),
			},
		}));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);
		setError(null);

		try {
			const response = await fetch("/api/jobs", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...formData,
					created_by: "current_user", // TODO: Replace with actual user ID
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to create job");
			}

			const data = await response.json();
			onJobCreated?.(data.job);
		} catch (err) {
			console.error("Error creating job:", err);
			setError("Failed to create job. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="card max-w-4xl mx-auto">
			<div className="card-header">
				<div className="flex items-center space-x-3">
					<div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
						<BriefcaseIcon className="text-white" size={20} />
					</div>
					<div>
						<h2 className="text-xl font-bold text-gray-900">Create New Job</h2>
						<p className="text-sm text-gray-600">Define requirements for AI-powered candidate matching</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="card-body space-y-6">
				{/* Basic Information */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Job Title *
						</label>
						<input
							type="text"
							value={formData.title}
							onChange={(e) => handleInputChange('title', e.target.value)}
							className="input-primary"
							placeholder="e.g., Senior React Developer"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Location
						</label>
						<div className="relative">
							<LocationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
							<input
								type="text"
								value={formData.location}
								onChange={(e) => handleInputChange('location', e.target.value)}
								className="input-primary pl-10"
								placeholder="e.g., San Francisco, CA"
							/>
						</div>
					</div>
				</div>

				{/* Description */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Job Description *
					</label>
					<textarea
						value={formData.description}
						onChange={(e) => handleInputChange('description', e.target.value)}
						className="input-primary h-32 resize-none"
						placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
						required
					/>
				</div>

				{/* Remote Work */}
				<div className="flex items-center space-x-3">
					<input
						type="checkbox"
						id="remote_friendly"
						checked={formData.remote_friendly}
						onChange={(e) => handleInputChange('remote_friendly', e.target.checked)}
						className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
					/>
					<label htmlFor="remote_friendly" className="text-sm font-medium text-gray-700">
						Remote-friendly position
					</label>
				</div>

				{/* Salary Range */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Salary Range (USD)
					</label>
					<div className="grid grid-cols-2 gap-4">
						<div className="relative">
							<DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
							<input
								type="number"
								value={formData.salary_min || ""}
								onChange={(e) => handleInputChange('salary_min', e.target.value ? parseInt(e.target.value) : null)}
								className="input-primary pl-10"
								placeholder="Min salary"
							/>
						</div>
						<div className="relative">
							<DollarSignIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
							<input
								type="number"
								value={formData.salary_max || ""}
								onChange={(e) => handleInputChange('salary_max', e.target.value ? parseInt(e.target.value) : null)}
								className="input-primary pl-10"
								placeholder="Max salary"
							/>
						</div>
					</div>
				</div>

				{/* Experience Range */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Experience Required (Years)
					</label>
					<div className="grid grid-cols-2 gap-4">
						<input
							type="number"
							value={formData.experience_min || ""}
							onChange={(e) => handleInputChange('experience_min', e.target.value ? parseInt(e.target.value) : null)}
							className="input-primary"
							placeholder="Min years"
							min="0"
						/>
						<input
							type="number"
							value={formData.experience_max || ""}
							onChange={(e) => handleInputChange('experience_max', e.target.value ? parseInt(e.target.value) : null)}
							className="input-primary"
							placeholder="Max years"
							min="0"
						/>
					</div>
				</div>

				{/* Required Skills */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Required Skills
					</label>
					<div className="flex space-x-2 mb-3">
						<input
							type="text"
							value={newRequiredSkill}
							onChange={(e) => setNewRequiredSkill(e.target.value)}
							className="input-primary flex-1"
							placeholder="Add a required skill..."
							onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('required'))}
						/>
						<button
							type="button"
							onClick={() => addSkill('required')}
							className="btn-secondary"
						>
							<PlusIcon size={16} />
						</button>
					</div>
					<div className="flex flex-wrap gap-2">
						{formData.skills_required.map((skill, index) => (
							<span
								key={index}
								className="badge badge-primary flex items-center space-x-1"
							>
								<span>{skill}</span>
								<button
									type="button"
									onClick={() => removeSkill('required', index)}
									className="text-blue-600 hover:text-blue-800"
								>
									×
								</button>
							</span>
						))}
					</div>
				</div>

				{/* Preferred Skills */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Preferred Skills
					</label>
					<div className="flex space-x-2 mb-3">
						<input
							type="text"
							value={newPreferredSkill}
							onChange={(e) => setNewPreferredSkill(e.target.value)}
							className="input-primary flex-1"
							placeholder="Add a preferred skill..."
							onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill('preferred'))}
						/>
						<button
							type="button"
							onClick={() => addSkill('preferred')}
							className="btn-secondary"
						>
							<PlusIcon size={16} />
						</button>
					</div>
					<div className="flex flex-wrap gap-2">
						{formData.skills_preferred.map((skill, index) => (
							<span
								key={index}
								className="badge badge-warning flex items-center space-x-1"
							>
								<span>{skill}</span>
								<button
									type="button"
									onClick={() => removeSkill('preferred', index)}
									className="text-yellow-600 hover:text-yellow-800"
								>
									×
								</button>
							</span>
						))}
					</div>
				</div>

				{/* Error Display */}
				{error && (
					<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
						<div className="text-red-700 text-sm">{error}</div>
					</div>
				)}

				{/* Form Actions */}
				<div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							className="btn-secondary"
							disabled={isSubmitting}
						>
							Cancel
						</button>
					)}
					<button
						type="submit"
						className="btn-primary"
						disabled={isSubmitting}
					>
						{isSubmitting ? (
							<>
								<div className="loading-spinner mr-2"></div>
								Creating Job...
							</>
						) : (
							<>
								<BriefcaseIcon className="mr-2" size={16} />
								Create Job
							</>
						)}
					</button>
				</div>
			</form>
		</div>
	);
}
