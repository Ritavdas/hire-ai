"use client";

import React, { useState, useEffect } from "react";
import { 
	TrophyIcon, 
	StarIcon, 
	ShieldCheckIcon, 
	CalendarIcon,
	InfoIcon,
	ExternalLinkIcon
} from "./icons";

interface Badge {
	id: string;
	assessment_name: string;
	skill_category: string;
	difficulty_level: string;
	score: number;
	percentile: number;
	badge_expires_at: string;
	taken_at: string;
}

interface BadgeDisplayProps {
	resumeId: string;
	showExpired?: boolean;
	compact?: boolean;
	maxDisplay?: number;
}

export default function BadgeDisplay({ 
	resumeId, 
	showExpired = false, 
	compact = false,
	maxDisplay 
}: BadgeDisplayProps) {
	const [badges, setBadges] = useState<Badge[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		fetchBadges();
	}, [resumeId]);

	const fetchBadges = async () => {
		try {
			const response = await fetch(`/api/badges?resumeId=${resumeId}&includeExpired=${showExpired}`);
			if (!response.ok) throw new Error("Failed to fetch badges");
			
			const data = await response.json();
			setBadges(data.badges);
		} catch (err) {
			setError("Failed to load badges");
		} finally {
			setIsLoading(false);
		}
	};

	const getDifficultyColor = (level: string) => {
		switch (level) {
			case "beginner": return { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" };
			case "intermediate": return { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" };
			case "advanced": return { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200" };
			case "expert": return { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" };
			default: return { bg: "bg-gray-100", text: "text-gray-800", border: "border-gray-200" };
		}
	};

	const getPercentileColor = (percentile: number) => {
		if (percentile >= 90) return "text-purple-600";
		if (percentile >= 75) return "text-blue-600";
		if (percentile >= 50) return "text-green-600";
		return "text-gray-600";
	};

	const getPercentileLabel = (percentile: number) => {
		if (percentile >= 95) return "Top 5%";
		if (percentile >= 90) return "Top 10%";
		if (percentile >= 75) return "Top 25%";
		if (percentile >= 50) return "Above Average";
		return "Below Average";
	};

	const isExpired = (expiresAt: string) => {
		return new Date(expiresAt) < new Date();
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	};

	const getTimeUntilExpiry = (expiresAt: string) => {
		const now = new Date();
		const expiry = new Date(expiresAt);
		const diffTime = expiry.getTime() - now.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		
		if (diffDays < 0) return "Expired";
		if (diffDays < 30) return `${diffDays} days left`;
		if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months left`;
		return `${Math.ceil(diffDays / 365)} years left`;
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-4">
				<div className="loading-spinner mr-2"></div>
				<span className="text-sm text-gray-600">Loading badges...</span>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
				<div className="text-red-700 text-sm">{error}</div>
			</div>
		);
	}

	const activeBadges = badges.filter(badge => !isExpired(badge.badge_expires_at));
	const expiredBadges = badges.filter(badge => isExpired(badge.badge_expires_at));
	const displayBadges = showExpired ? badges : activeBadges;
	const limitedBadges = maxDisplay ? displayBadges.slice(0, maxDisplay) : displayBadges;

	if (badges.length === 0) {
		return (
			<div className="text-center py-6">
				<TrophyIcon className="mx-auto text-gray-400 mb-2" size={32} />
				<p className="text-sm text-gray-600">No verified badges yet</p>
				<p className="text-xs text-gray-500 mt-1">Complete assessments to earn skill badges</p>
			</div>
		);
	}

	if (compact) {
		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<h4 className="text-sm font-semibold text-gray-700">Verified Skills</h4>
					<span className="text-xs text-gray-500">
						{activeBadges.length} active badge{activeBadges.length !== 1 ? 's' : ''}
					</span>
				</div>
				<div className="flex flex-wrap gap-2">
					{limitedBadges.map((badge) => {
						const colors = getDifficultyColor(badge.difficulty_level);
						const expired = isExpired(badge.badge_expires_at);
						
						return (
							<div
								key={badge.id}
								className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
									expired ? 'bg-gray-100 text-gray-500 border-gray-200 opacity-60' : `${colors.bg} ${colors.text} ${colors.border}`
								}`}
								title={`${badge.skill_category} - ${badge.score}% (${badge.percentile}th percentile)`}
							>
								<ShieldCheckIcon size={12} />
								<span>{badge.skill_category}</span>
								{!expired && (
									<span className={`font-bold ${getPercentileColor(badge.percentile)}`}>
										{badge.percentile}%
									</span>
								)}
							</div>
						);
					})}
					{maxDisplay && displayBadges.length > maxDisplay && (
						<span className="text-xs text-gray-500 px-2 py-1">
							+{displayBadges.length - maxDisplay} more
						</span>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<TrophyIcon className="text-yellow-600" size={20} />
					<h3 className="text-lg font-semibold text-gray-900">Verified Skill Badges</h3>
				</div>
				<div className="text-sm text-gray-600">
					{activeBadges.length} active • {expiredBadges.length} expired
				</div>
			</div>

			{/* Active Badges */}
			{activeBadges.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
						Active Badges
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{activeBadges.map((badge) => {
							const colors = getDifficultyColor(badge.difficulty_level);
							
							return (
								<div
									key={badge.id}
									className={`border-2 ${colors.border} ${colors.bg} rounded-xl p-4 hover:shadow-md transition-all duration-200`}
								>
									<div className="flex items-start justify-between mb-3">
										<div className="flex items-center space-x-2">
											<div className={`p-2 bg-white rounded-lg shadow-sm`}>
												<ShieldCheckIcon className={colors.text} size={20} />
											</div>
											<div>
												<h5 className="font-semibold text-gray-900">
													{badge.skill_category}
												</h5>
												<p className="text-xs text-gray-600 capitalize">
													{badge.difficulty_level} Level
												</p>
											</div>
										</div>
										<div className="text-right">
											<div className={`text-lg font-bold ${getPercentileColor(badge.percentile)}`}>
												{badge.percentile}%
											</div>
											<div className="text-xs text-gray-600">
												{getPercentileLabel(badge.percentile)}
											</div>
										</div>
									</div>

									<div className="space-y-2">
										<div className="flex items-center justify-between text-sm">
											<span className="text-gray-600">Score:</span>
											<span className="font-semibold text-gray-900">{badge.score}%</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-gray-600">Earned:</span>
											<span className="text-gray-900">{formatDate(badge.taken_at)}</span>
										</div>
										<div className="flex items-center justify-between text-sm">
											<span className="text-gray-600">Expires:</span>
											<span className="text-gray-900">
												{getTimeUntilExpiry(badge.badge_expires_at)}
											</span>
										</div>
									</div>

									{/* Progress Bar */}
									<div className="mt-3">
										<div className="w-full bg-white rounded-full h-2">
											<div
												className={`h-2 rounded-full transition-all duration-300 ${
													badge.score >= 90 ? 'bg-green-500' :
													badge.score >= 80 ? 'bg-blue-500' :
													badge.score >= 70 ? 'bg-yellow-500' : 'bg-gray-500'
												}`}
												style={{ width: `${badge.score}%` }}
											></div>
										</div>
									</div>

									{/* Verification Link */}
									<div className="mt-3 pt-3 border-t border-white/50">
										<button className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800">
											<ExternalLinkIcon size={12} />
											<span>Verify Badge</span>
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}

			{/* Expired Badges */}
			{showExpired && expiredBadges.length > 0 && (
				<div className="space-y-3">
					<h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
						Expired Badges
					</h4>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{expiredBadges.map((badge) => (
							<div
								key={badge.id}
								className="border-2 border-gray-200 bg-gray-50 rounded-xl p-4 opacity-60"
							>
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center space-x-2">
										<div className="p-2 bg-white rounded-lg shadow-sm">
											<ShieldCheckIcon className="text-gray-400" size={20} />
										</div>
										<div>
											<h5 className="font-semibold text-gray-700">
												{badge.skill_category}
											</h5>
											<p className="text-xs text-gray-500 capitalize">
												{badge.difficulty_level} Level • Expired
											</p>
										</div>
									</div>
									<div className="text-right">
										<div className="text-lg font-bold text-gray-500">
											{badge.percentile}%
										</div>
										<div className="text-xs text-gray-500">
											Score: {badge.score}%
										</div>
									</div>
								</div>

								<div className="text-xs text-gray-500">
									Expired on {formatDate(badge.badge_expires_at)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Info Note */}
			<div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
				<div className="flex items-start space-x-2">
					<InfoIcon className="text-blue-600 mt-0.5" size={14} />
					<div className="text-xs text-blue-800">
						<span className="font-medium">Verified Badges:</span> These badges are earned through 
						proctored assessments and represent verified technical competency. Badges expire after 
						18 months to ensure skills remain current.
					</div>
				</div>
			</div>
		</div>
	);
}
