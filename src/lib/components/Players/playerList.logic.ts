import type { Player } from '$lib/types';

export const HOUR_STEP = 0.5;
export const MAX_QUICK_ADD = 50;
export const DEFAULT_HOUR_STEP = 0.5;
export const DEFAULT_MAX_PLAYERS = 50;
export const HOUR_OPTIONS = [0.5, 1, 1.5, 2, 2.5, 3] as const;

export type BucketVM = {
	hours: number;
	count: number;
	playersWithNamesCount: number;
	isDefault: boolean;
};

export type ApplyResult = {
	players: Player[];
	nextId: number;
	toast?: 'MAX_PLAYERS' | 'CANNOT_REMOVE_NAMED';
};

export function clampToIntegerRange(value: unknown, min: number, max: number): number {
	const clamped = Number.isFinite(value) ? Math.floor(Number(value)) : min;
	return Math.max(min, Math.min(max, clamped));
}

export function normalizeHours(hourStep: number, hours: number) {
	if (!Number.isFinite(hours) || hours < 0) return 0;
	if (hourStep <= 0) return hours;
	const snapped = Math.round(hours / hourStep) * hourStep;
	return Math.max(0, snapped);
}

export function formatHours(hours: number) {
	return Number.isInteger(hours) ? String(hours) : String(hours);
}

export function buildBucketIndex(
	players: Player[],
	step: number
): Map<number, { count: number; playersWithNamesCount: number }> {
	const bucketMap = new Map<number, { count: number; playersWithNamesCount: number }>();
	for (const player of players) {
		const hours = normalizeHours(step, player.hours || 0);
		const entry = bucketMap.get(hours) ?? { count: 0, playersWithNamesCount: 0 };
		entry.count += 1;
		if (player.name?.trim()) entry.playersWithNamesCount += 1;
		bucketMap.set(hours, entry);
	}
	return bucketMap;
}

export function createBucketViewModels(
	players: Player[],
	defaultHours: number,
	step: number
): BucketVM[] {
	const bucketIndex = buildBucketIndex(players, step);
	const defaultHoursNormalized = normalizeHours(step, defaultHours);

	// visible hours = default + all existing buckets
	const visibleHoursSet = new Set<number>([defaultHoursNormalized]);
	for (const hours of bucketIndex.keys()) visibleHoursSet.add(hours);

	const sortedHours = Array.from(visibleHoursSet).sort((a, b) => a - b);

	return sortedHours.map((hours) => {
		const entry = bucketIndex.get(hours) ?? { count: 0, playersWithNamesCount: 0 };
		return {
			hours,
			count: entry.count,
			playersWithNamesCount: entry.playersWithNamesCount,
			isDefault: hours === defaultHoursNormalized
		};
	});
}

export function getRemainingHourOptions(bucketViewModels: BucketVM[], step: number) {
	const visibleHours = new Set(
		bucketViewModels.map((bucket) => normalizeHours(step, bucket.hours))
	);
	return HOUR_OPTIONS.filter((hours) => !visibleHours.has(normalizeHours(step, hours)));
}

type BucketContext = {
	step: number;
	maxPlayers: number;
	nextId: number;
};

type BucketStats = {
	totalCount: number;
	playersWithNamesCount: number;
	anonymousPlayerIds: number[];
	playerIdsWithNames: number[];
};

function computeBucketStats(players: Player[], targetHours: number, step: number): BucketStats {
	let totalCount = 0;
	let playersWithNamesCount = 0;
	const anonymousPlayerIds: number[] = [];
	const playerIdsWithNames: number[] = [];

	for (const player of players) {
		const playerHours = normalizeHours(step, player.hours ?? 0);
		if (playerHours !== targetHours) continue;

		totalCount++;
		const hasName = Boolean(player.name?.trim());
		if (hasName) {
			playersWithNamesCount++;
			playerIdsWithNames.push(player.id);
		} else {
			anonymousPlayerIds.push(player.id);
		}
	}

	return { totalCount, playersWithNamesCount, anonymousPlayerIds, playerIdsWithNames };
}

function createPlayers(startId: number, count: number, hours: number): Player[] {
	return Array.from({ length: count }, (_, index) => ({
		id: startId + index,
		name: '',
		hours
	}));
}

function selectIdsToRemove(
	anonymousPlayerIds: number[],
	playerIdsWithNames: number[],
	removeCount: number
): Set<number> {
	const idsToRemove = new Set<number>();

	// Remove anonymous players first (from end of list = most recently added)
	for (let i = anonymousPlayerIds.length - 1; i >= 0 && idsToRemove.size < removeCount; i--) {
		idsToRemove.add(anonymousPlayerIds[i]);
	}

	// Only remove named players if we still need more
	for (let i = playerIdsWithNames.length - 1; i >= 0 && idsToRemove.size < removeCount; i--) {
		idsToRemove.add(playerIdsWithNames[i]);
	}

	return idsToRemove;
}

export function setPlayerCountForHours(
	players: Player[],
	targetHours: number,
	desiredCount: number,
	ctx: BucketContext
): ApplyResult {
	const normalizedHours = normalizeHours(ctx.step, targetHours);
	const safeDesiredCount = Math.max(0, Math.floor(desiredCount));
	const stats = computeBucketStats(players, normalizedHours, ctx.step);
	const countDiff = safeDesiredCount - stats.totalCount;

	if (countDiff === 0) {
		return { players, nextId: ctx.nextId };
	}

	if (countDiff > 0) {
		return addPlayersToBucket(players, normalizedHours, countDiff, ctx);
	}

	return removePlayersFromBucket(players, safeDesiredCount, -countDiff, ctx, stats);
}

function addPlayersToBucket(
	players: Player[],
	hours: number,
	requestedCount: number,
	ctx: BucketContext
): ApplyResult {
	const availableCapacity = ctx.maxPlayers - players.length;
	const actualAddCount = Math.min(requestedCount, availableCapacity);

	if (actualAddCount <= 0) {
		return { players, nextId: ctx.nextId, toast: 'MAX_PLAYERS' };
	}

	const newPlayers = createPlayers(ctx.nextId, actualAddCount, hours);
	const hitCapacityLimit = actualAddCount < requestedCount;

	return {
		players: [...players, ...newPlayers],
		nextId: ctx.nextId + actualAddCount,
		toast: hitCapacityLimit ? 'MAX_PLAYERS' : undefined
	};
}

function removePlayersFromBucket(
	players: Player[],
	desiredCount: number,
	requestedRemoveCount: number,
	ctx: BucketContext,
	stats: BucketStats
): ApplyResult {
	// Protect named players: can't go below the named count
	const minAllowedCount = stats.playersWithNamesCount;
	const maxRemovable = stats.totalCount - minAllowedCount;

	if (maxRemovable <= 0) {
		return { players, nextId: ctx.nextId, toast: 'CANNOT_REMOVE_NAMED' };
	}

	const actualRemoveCount = Math.min(requestedRemoveCount, maxRemovable);
	const idsToRemove = selectIdsToRemove(
		stats.anonymousPlayerIds,
		stats.playerIdsWithNames,
		actualRemoveCount
	);
	const filteredPlayers = players.filter((player) => !idsToRemove.has(player.id));

	// Show warning if user wanted fewer than the protected named count
	const triedToRemoveNamedPlayers = desiredCount < stats.playersWithNamesCount;

	return {
		players: filteredPlayers,
		nextId: ctx.nextId,
		toast: triedToRemoveNamedPlayers ? 'CANNOT_REMOVE_NAMED' : undefined
	};
}
