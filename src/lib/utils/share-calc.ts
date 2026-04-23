/**
 * Shared billing and share-calculation utilities.
 *
 * Pure functions — no Svelte, no framework coupling.
 * Used by both the editor route and the shared view route.
 *
 * Algorithm: Largest Remainder Method (LRM) with rounding to 500đ units
 * for practical Vietnamese currency handling.
 */

import type { Player } from '$lib/types';

const SHARE_UNIT = 500; // VND rounding unit

export interface ShareResult extends Player {
	ratio: number;
	exactUnits: number;
	floorUnits: number;
	rem: number;
	share: number;
}

export interface TotalsResult {
	totalCost: number;
	shuttlecockTotal: number;
}

export interface ShareCalcAdditionalCost {
	label: string;
	amount: number;
}

/**
 * Sum all cost components into a single total.
 */
export function computeTotals(
	courtPrice: number,
	shuttlecockPrice: number,
	shuttlecockCount: number,
	additionalCosts: ShareCalcAdditionalCost[]
): TotalsResult {
	const shuttlecockTotal = shuttlecockPrice * shuttlecockCount;
	const additionalTotal = additionalCosts.reduce((sum, c) => sum + c.amount, 0);
	const totalCost = courtPrice + shuttlecockTotal + additionalTotal;
	return { totalCost, shuttlecockTotal };
}

/**
 * Compute each player's fair share using LRM with 500đ unit rounding.
 * Returns enriched players with ratio, exact/floor units, remainder, and final share.
 */
export function computePlayerShares(
	players: Player[],
	courtPrice: number,
	shuttlecockPrice: number,
	shuttlecockCount: number,
	additionalCosts: ShareCalcAdditionalCost[],
	_courtHours?: number // kept for signature compatibility; totalHours is derived here
): ShareResult[] {
	const totalHours = players.reduce((sum, p) => sum + (p.hours || 0), 0);
	if (totalHours === 0 || players.length === 0) return [];

	const { totalCost } = computeTotals(courtPrice, shuttlecockPrice, shuttlecockCount, additionalCosts);
	const roundedTotal = Math.ceil(totalCost / SHARE_UNIT) * SHARE_UNIT;
	const totalUnits = roundedTotal / SHARE_UNIT; // integer

	const withExact = players.map((p) => {
		const ratio = (p.hours || 0) / totalHours;
		const exactUnits = ratio * totalUnits;
		const floorUnits = Math.floor(exactUnits);
		return { ...p, ratio, exactUnits, floorUnits, rem: exactUnits - floorUnits };
	});

	let unitsLeft = totalUnits - withExact.reduce((sum, p) => sum + p.floorUnits, 0);
	const sortedByRemainder = [...withExact].sort((a, b) => b.rem - a.rem || a.id - b.id);

	const shares = new Map<number, number>();
	sortedByRemainder.forEach((p, index) => {
		const addOne = index < unitsLeft ? 1 : 0;
		shares.set(p.id, (p.floorUnits + addOne) * SHARE_UNIT);
	});

	return withExact.map((p) => ({
		...p,
		share: shares.get(p.id)!
	}));
}

/**
 * Compute paid/unpaid totals from a set of paid player IDs.
 */
export function computePaidTotals(
	players: Player[],
	paidIds: Set<number>
): { totalPaid: number; totalUnpaid: number } {
	let totalPaid = 0;
	let totalUnpaid = 0;
	for (const p of players) {
		const share = (p as ShareResult).share ?? 0;
		if (paidIds.has(p.id)) {
			totalPaid += share;
		} else {
			totalUnpaid += share;
		}
	}
	return { totalPaid, totalUnpaid };
}
