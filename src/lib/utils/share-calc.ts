import type { CourtBlock, ExtraCost, Group } from '$lib/types';

export interface ShareResult {
	entryId: string;
	name: string;
	playerMinutes: number;
	ratio: number;
	courtShare: number;
	extraShare: number;
	total: number;
}

export interface PlayerOccurrence {
	entryId: string;
	groupId: string;
	name: string;
	playerMinutes: number;
	playerIndex: number;
}

export function parseTime(t: string): number {
	const [h, m] = t.split(':').map(Number);
	return h * 60 + (m ?? 0);
}

export function computeCourtTotal(courtBlocks: CourtBlock[]): number {
	return courtBlocks.reduce((sum, block) => {
		const hours = (parseTime(block.endTime) - parseTime(block.startTime)) / 60;
		return sum + hours * block.courtCount * block.pricePerHour;
	}, 0);
}

export function buildEntryId(groupId: string, playerIndex: number): string {
	return `${groupId}:${playerIndex}`;
}

export function listPlayerOccurrences(groups: Group[]): PlayerOccurrence[] {
	return groups.flatMap((group) => {
		const playerMinutes = parseTime(group.endTime) - parseTime(group.startTime);

		return group.playerNames.map((name, playerIndex) => ({
			entryId: buildEntryId(group.id, playerIndex),
			groupId: group.id,
			name,
			playerMinutes,
			playerIndex
		}));
	});
}

export function computeShares(
	groups: Group[],
	courtBlocks: CourtBlock[],
	extraCosts: ExtraCost[]
): ShareResult[] {
	const occurrencesByGroup = groups.map((group) => {
		const playerMinutes = parseTime(group.endTime) - parseTime(group.startTime);

		return group.playerNames.map((name, playerIndex) => ({
			entryId: buildEntryId(group.id, playerIndex),
			name,
			playerMinutes,
			playerIndex
		}));
	});

	const occurrenceCount = occurrencesByGroup.reduce((sum, group) => sum + group.length, 0);
	if (occurrenceCount === 0) return [];

	const courtTotal = computeCourtTotal(courtBlocks);
	const extraTotal = extraCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
	const totalPlayerMinutes = occurrencesByGroup.reduce(
		(sum, group) => sum + group.reduce((groupSum, occurrence) => groupSum + occurrence.playerMinutes, 0),
		0
	);
	const perPlayerExtra = extraTotal / occurrenceCount;

	return occurrencesByGroup.flatMap((group) =>
		group
			.map((occurrence) => {
				const ratio = totalPlayerMinutes > 0 ? occurrence.playerMinutes / totalPlayerMinutes : 0;
				const courtShare = courtTotal * ratio;

				return {
					entryId: occurrence.entryId,
					name: occurrence.name,
					playerMinutes: occurrence.playerMinutes,
					ratio,
					courtShare,
					extraShare: perPlayerExtra,
					total: courtShare + perPlayerExtra
				};
			})
			.sort((a, b) => b.total - a.total)
	);
}