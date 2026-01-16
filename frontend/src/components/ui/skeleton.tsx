import { cn } from "@/lib/utils";

interface SkeletonProps {
	className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
	return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

// Notification Card Skeleton
export function NotificationSkeleton() {
	return (
		<div className="p-4 border rounded-lg space-y-3">
			<div className="flex items-start gap-3">
				<Skeleton className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-4 w-3/4" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-1/2" />
				</div>
			</div>
		</div>
	);
}

// Notification List Skeleton
export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
	return (
		<div className="space-y-4">
			{Array.from({ length: count }).map((_, i) => (
				<NotificationSkeleton key={i} />
			))}
		</div>
	);
}

// Card Skeleton
export function CardSkeleton() {
	return (
		<div className="p-6 border rounded-lg space-y-4">
			<div className="flex items-center gap-3">
				<Skeleton className="h-10 w-10 rounded-lg" />
				<div className="space-y-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-3 w-24" />
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton className="h-3 w-full" />
				<Skeleton className="h-3 w-4/5" />
				<Skeleton className="h-3 w-2/3" />
			</div>
			<div className="flex gap-2 pt-2">
				<Skeleton className="h-9 w-24" />
				<Skeleton className="h-9 w-9" />
				<Skeleton className="h-9 w-9" />
			</div>
		</div>
	);
}

// Template Card Skeleton
export function TemplateCardSkeleton() {
	return (
		<div className="p-6 border rounded-lg space-y-4">
			<div className="flex items-start justify-between">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-lg" />
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-24" />
					</div>
				</div>
				<Skeleton className="h-6 w-16 rounded" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-4 w-full" />
			</div>
			<div className="flex gap-1">
				<Skeleton className="h-6 w-16 rounded" />
				<Skeleton className="h-6 w-14 rounded" />
				<Skeleton className="h-6 w-12 rounded" />
			</div>
			<div className="flex gap-2 pt-2">
				<Skeleton className="h-9 flex-1" />
				<Skeleton className="h-9 w-9" />
				<Skeleton className="h-9 w-9" />
			</div>
		</div>
	);
}

// Template List Skeleton
export function TemplateListSkeleton({ count = 4 }: { count?: number }) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			{Array.from({ length: count }).map((_, i) => (
				<TemplateCardSkeleton key={i} />
			))}
		</div>
	);
}

// Settings Form Skeleton
export function SettingsFormSkeleton() {
	return (
		<div className="space-y-6">
			<div className="space-y-4">
				<Skeleton className="h-5 w-32" />
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between p-4 border rounded-lg"
						>
							<div className="flex items-center gap-3">
								<Skeleton className="h-8 w-8 rounded" />
								<div className="space-y-1">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-3 w-40" />
								</div>
							</div>
							<Skeleton className="h-6 w-12 rounded-full" />
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// Profile Form Skeleton
export function ProfileFormSkeleton() {
	return (
		<div className="space-y-4">
			{Array.from({ length: 3 }).map((_, i) => (
				<div key={i} className="space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-10 w-full" />
				</div>
			))}
			<Skeleton className="h-10 w-full mt-4" />
		</div>
	);
}
