// ABOUTME: Shared design utilities - colors, grouping, display helpers
// ABOUTME: Centralizes design tokens and common UI logic

import { m } from '$lib/paraglide/messages';

export type ColorScheme = {
	bg: string;
	light: string;
	text: string;
};

export const GROUP_COLORS: ColorScheme[] = [
	{ bg: 'from-blue-500 to-indigo-600', light: 'bg-blue-50', text: 'text-blue-700' },
	{ bg: 'from-emerald-500 to-teal-600', light: 'bg-emerald-50', text: 'text-emerald-700' },
	{ bg: 'from-amber-500 to-orange-600', light: 'bg-amber-50', text: 'text-amber-700' },
	{ bg: 'from-rose-500 to-pink-600', light: 'bg-rose-50', text: 'text-rose-700' },
	{ bg: 'from-violet-500 to-purple-600', light: 'bg-violet-50', text: 'text-violet-700' }
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
