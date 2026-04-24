// ABOUTME: Shared design utilities - colors, grouping, display helpers
// ABOUTME: Centralizes design tokens and common UI logic

import { m } from '$lib/paraglide/messages';

export type ColorScheme = {
	bg: string;
	light: string;
	text: string;
};

export const GROUP_COLORS: ColorScheme[] = [
	{ bg: 'from-[#0144DB] to-[#012d8a]', light: 'bg-[#e8eeff]', text: 'text-[#0144DB]' },
	{ bg: 'from-[#2f7cff] to-[#0144DB]', light: 'bg-[#e8eeff]', text: 'text-[#012d8a]' },
	{ bg: 'from-[#1740b3] to-[#0a0b0d]', light: 'bg-[#EFEFEF]', text: 'text-[#1740b3]' },
	{ bg: 'from-[#33D387] to-[#1f9d68]', light: 'bg-[#eaf8f1]', text: 'text-[#33D387]' },
	{ bg: 'from-[#0a0b0d] to-[#282b31]', light: 'bg-[#EFEFEF]', text: 'text-[#282b31]' }
];

export function getGroupColor(index: number): ColorScheme {
	return GROUP_COLORS[index % GROUP_COLORS.length];
}

export function groupByKey<T>(items: T[], keyFn: (item: T) => number): [number, T[]][] {
	const groups: Record<number, T[]> = {};
	for (const item of items) {
		const key = keyFn(item);
		if (!groups[key]) {
			groups[key] = [];
		}
		groups[key].push(item);
	}
	return Object.entries(groups)
		.map(([k, v]) => [Number(k), v] as [number, T[]])
		.sort((a, b) => b[0] - a[0]);
}

export function getPlayerDisplayName(player: { name?: string }, index: number): string {
	return player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 });
}

export function getNamedPlayers<T extends { name?: string }>(players: T[]): string[] {
	return players.filter((p) => p.name?.trim()).map((p) => p.name!.trim());
}

export function getOthersCount(namedCount: number, totalCount: number): number {
	return namedCount > 0 ? totalCount - 1 : 0;
}
