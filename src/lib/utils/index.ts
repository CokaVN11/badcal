// ABOUTME: Barrel export for utility functions
// ABOUTME: Re-exports all utils for convenient imports

export {
	formatCurrency,
	formatDate,
	parseVietnameseNumber,
	formatCompactNumber,
	formatInputDisplay
} from './format';
export { AVATAR_COLORS, getAvatarColor, getInitial } from './avatar';
export {
	GROUP_COLORS,
	getGroupColor,
	groupByKey,
	getPlayerDisplayName,
	getNamedPlayers,
	getOthersCount
} from './design';
export type { ColorScheme } from './design';
export { triggerHaptic } from './haptics';
export { loadSavedLineups, upsertSavedLineup, deleteSavedLineup } from './saved-lineups';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };
