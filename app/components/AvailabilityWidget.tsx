"use client";

import React, { useState, useEffect } from "react";
import {
	ClockIcon,
	CheckIcon,
	GlobeAltIcon,
	CalendarIcon,
	DollarSignIcon,
	UserIcon,
} from "./icons";

interface AvailabilityWidgetProps {
	resumeId: string;
	currentStatus?: string;
	currentTimezone?: string;
	isCandidate?: boolean; // true if this is the candidate's own widget
	onStatusUpdate?: (newStatus: string) => void;
}

const AVAILABILITY_OPTIONS = [
	{
		value: "actively_looking",
		label: "Actively Looking",
		description: "Ready to start immediately",
		color: "bg-green-100 text-green-800 border-green-200",
		icon: "🟢",
	},
	{
		value: "open",
		label: "Open to Opportunities",
		description: "Interested in the right role",
		color: "bg-yellow-100 text-yellow-800 border-yellow-200",
		icon: "🟡",
	},
	{
		value: "not_looking",
		label: "Not Looking",
		description: "Happy in current role",
		color: "bg-red-100 text-red-800 border-red-200",
		icon: "🔴",
	},
	{
		value: "unknown",
		label: "Unknown",
		description: "Status not specified",
		color: "bg-gray-100 text-gray-800 border-gray-200",
		icon: "⚪",
	},
];

const TIMEZONE_OPTIONS = [
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"Europe/London",
	"Europe/Paris",
	"Europe/Berlin",
	"Asia/Tokyo",
	"Asia/Shanghai",
	"Asia/Kolkata",
	"Australia/Sydney",
];

export default function AvailabilityWidget({
	resumeId,
	currentStatus = "unknown",
	currentTimezone,
	isCandidate = false,
	onStatusUpdate,
}: AvailabilityWidgetProps) {
	const [status, setStatus] = useState(currentStatus);
	const [timezone, setTimezone] = useState(currentTimezone || "");
	const [salaryMin, setSalaryMin] = useState<number | null>(null);
	const [salaryMax, setSalaryMax] = useState<number | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

	useEffect(() => {
		setStatus(currentStatus);
		setTimezone(currentTimezone || "");
	}, [currentStatus, currentTimezone]);

	const handleUpdate = async () => {
		setIsUpdating(true);
		setError(null);

		try {
			const response = await fetch("/api/availability", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					resumeId,
					availability_status: status,
					timezone: timezone || null,
					preferred_salary_min: salaryMin,
					preferred_salary_max: salaryMax,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to update availability");
			}

			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			await response.json();
			setLastUpdated(new Date());
			setIsEditing(false);
			onStatusUpdate?.(status);
		} catch (err) {
			console.error("Error updating availability:", err);
			setError("Failed to update availability. Please try again.");
		} finally {
			setIsUpdating(false);
		}
	};

	const handleCancel = () => {
		setStatus(currentStatus);
		setTimezone(currentTimezone || "");
		setSalaryMin(null);
		setSalaryMax(null);
		setIsEditing(false);
		setError(null);
	};

	const getCurrentOption = () => {
		return (
			AVAILABILITY_OPTIONS.find((option) => option.value === status) ||
			AVAILABILITY_OPTIONS[3]
		);
	};

	const getStatusAge = () => {
		if (!lastUpdated) return "";

		const now = new Date();
		const diffTime = now.getTime() - lastUpdated.getTime();
		const diffMinutes = Math.floor(diffTime / (1000 * 60));

		if (diffMinutes < 1) return "Just now";
		if (diffMinutes < 60) return `${diffMinutes}m ago`;

		const diffHours = Math.floor(diffMinutes / 60);
		if (diffHours < 24) return `${diffHours}h ago`;

		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d ago`;
	};

	if (!isCandidate && !isEditing) {
		// Read-only view for recruiters
		const currentOption = getCurrentOption();

		return (
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-gray-700">
						Availability Status
					</h4>
					{lastUpdated && (
						<span className="text-xs text-gray-500">
							{getStatusAge()}
						</span>
					)}
				</div>

				<div
					className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${currentOption.color}`}
				>
					<span className="text-sm">{currentOption.icon}</span>
					<div>
						<div className="font-medium text-sm">
							{currentOption.label}
						</div>
						<div className="text-xs opacity-75">
							{currentOption.description}
						</div>
					</div>
				</div>

				{timezone && (
					<div className="flex items-center space-x-2 text-sm text-gray-600">
						<GlobeAltIcon size={14} />
						<span>{timezone.replace("_", " ")}</span>
					</div>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<UserIcon className="text-gray-600" size={16} />
					<h4 className="text-sm font-semibold text-gray-700">
						{isCandidate
							? "Update Your Availability"
							: "Availability Status"}
					</h4>
				</div>
				{!isEditing && isCandidate && (
					<button
						onClick={() => setIsEditing(true)}
						className="btn-ghost text-xs"
					>
						Edit
					</button>
				)}
			</div>

			{isEditing ? (
				<div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
					{/* Status Selection */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Current Status
						</label>
						<div className="space-y-2">
							{AVAILABILITY_OPTIONS.slice(0, 3).map((option) => (
								<label
									key={option.value}
									className="flex items-center space-x-3 cursor-pointer"
								>
									<input
										type="radio"
										name="availability_status"
										value={option.value}
										checked={status === option.value}
										onChange={(e) => setStatus(e.target.value)}
										className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
									/>
									<div className="flex items-center space-x-2">
										<span>{option.icon}</span>
										<div>
											<div className="text-sm font-medium text-gray-900">
												{option.label}
											</div>
											<div className="text-xs text-gray-600">
												{option.description}
											</div>
										</div>
									</div>
								</label>
							))}
						</div>
					</div>

					{/* Timezone */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Timezone (Optional)
						</label>
						<div className="relative">
							<GlobeAltIcon
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={16}
							/>
							<select
								value={timezone}
								onChange={(e) => setTimezone(e.target.value)}
								className="input-primary pl-10"
							>
								<option value="">Select timezone...</option>
								{TIMEZONE_OPTIONS.map((tz) => (
									<option key={tz} value={tz}>
										{tz.replace("_", " ")}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Salary Expectations */}
					{(status === "actively_looking" || status === "open") && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Salary Expectations (USD, Optional)
							</label>
							<div className="grid grid-cols-2 gap-3">
								<div className="relative">
									<DollarSignIcon
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
										size={16}
									/>
									<input
										type="number"
										value={salaryMin || ""}
										onChange={(e) =>
											setSalaryMin(
												e.target.value
													? parseInt(e.target.value)
													: null
											)
										}
										className="input-primary pl-10"
										placeholder="Min"
									/>
								</div>
								<div className="relative">
									<DollarSignIcon
										className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
										size={16}
									/>
									<input
										type="number"
										value={salaryMax || ""}
										onChange={(e) =>
											setSalaryMax(
												e.target.value
													? parseInt(e.target.value)
													: null
											)
										}
										className="input-primary pl-10"
										placeholder="Max"
									/>
								</div>
							</div>
						</div>
					)}

					{/* Error Display */}
					{error && (
						<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
							<div className="text-red-700 text-sm">{error}</div>
						</div>
					)}

					{/* Actions */}
					<div className="flex items-center justify-end space-x-3 pt-2">
						<button
							onClick={handleCancel}
							disabled={isUpdating}
							className="btn-secondary"
						>
							Cancel
						</button>
						<button
							onClick={handleUpdate}
							disabled={isUpdating}
							className="btn-primary"
						>
							{isUpdating ? (
								<>
									<div className="loading-spinner mr-2"></div>
									Updating...
								</>
							) : (
								<>
									<CheckIcon className="mr-2" size={16} />
									Update Status
								</>
							)}
						</button>
					</div>
				</div>
			) : (
				<div className="space-y-3">
					{/* Current Status Display */}
					<div
						className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${
							getCurrentOption().color
						}`}
					>
						<span className="text-sm">{getCurrentOption().icon}</span>
						<div>
							<div className="font-medium text-sm">
								{getCurrentOption().label}
							</div>
							<div className="text-xs opacity-75">
								{getCurrentOption().description}
							</div>
						</div>
					</div>

					{/* Additional Info */}
					<div className="space-y-2 text-sm text-gray-600">
						{timezone && (
							<div className="flex items-center space-x-2">
								<GlobeAltIcon size={14} />
								<span>{timezone.replace("_", " ")}</span>
							</div>
						)}

						{lastUpdated && (
							<div className="flex items-center space-x-2">
								<ClockIcon size={14} />
								<span>Updated {getStatusAge()}</span>
							</div>
						)}
					</div>

					{/* Quick Actions for Candidates */}
					{isCandidate && (
						<div className="pt-2">
							<button
								onClick={() => setIsEditing(true)}
								className="btn-secondary w-full justify-center"
							>
								<CalendarIcon className="mr-2" size={16} />
								Update Availability
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
