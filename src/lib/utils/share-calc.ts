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

import type { Group, CourtBlock, ExtraCost } from '$lib/types';

export function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m ?? 0);
}

export function computeCourtTotal(courtBlocks: CourtBlock[]): number {
  return courtBlocks.reduce((sum, b) => {
    const hours = (parseTime(b.endTime) - parseTime(b.startTime)) / 60;
    return sum + hours * b.courtCount * b.pricePerHour;
  }, 0);
}

export interface MinuteShareResult {
  name: string;
  playerMinutes: number;
  ratio: number;
  courtShare: number;
  extraShare: number;
  total: number;
}

export function computeMinuteProportionShares(
  groups: Group[],
  courtBlocks: CourtBlock[],
  extraCosts: ExtraCost[]
): MinuteShareResult[] {
  const courtTotal = computeCourtTotal(courtBlocks);
  if (courtTotal === 0) return [];

  const roundedCourt = Math.ceil(courtTotal / SHARE_UNIT) * SHARE_UNIT;
  const totalUnits = roundedCourt / SHARE_UNIT;

  const allNames = groups.flatMap((g) => g.playerNames);
  const totalPlayerMinutes = groups.reduce(
    (sum, g) => sum + g.playerNames.length * (parseTime(g.endTime) - parseTime(g.startTime)),
    0
  );
  if (totalPlayerMinutes === 0 || allNames.length === 0) return [];

  const extraTotal = extraCosts.reduce((s, c) => s + (c.amount || 0), 0);
  const perPlayerExtra = allNames.length > 0 ? extraTotal / allNames.length : 0;

  const withExact = allNames.map((name: string, idx: number) => {
    const group = groups.find((g) => g.playerNames.includes(name))!;
    const minutes = parseTime(group.endTime) - parseTime(group.startTime);
    const ratio = minutes / totalPlayerMinutes;
    const exactUnits = ratio * totalUnits;
    const floorUnits = Math.floor(exactUnits);
    return { name, idx, ratio, exactUnits, floorUnits, rem: exactUnits - floorUnits };
  });

  let unitsLeft = totalUnits - withExact.reduce((s, p) => s + p.floorUnits, 0);
  const sorted = [...withExact].sort((a, b) => b.rem - a.rem || a.idx - b.idx);
  const shares = new Map<number, number>();
  sorted.forEach((p, i) => {
    shares.set(p.idx, (p.floorUnits + (i < unitsLeft ? 1 : 0)) * SHARE_UNIT);
  });

  return withExact.map((p) => ({
    name: p.name,
    playerMinutes: parseTime(groups.find((g) => g.playerNames.includes(p.name))!.endTime) -
      parseTime(groups.find((g) => g.playerNames.includes(p.name))!.startTime),
    ratio: p.ratio,
    courtShare: shares.get(p.idx) ?? 0,
    extraShare: perPlayerExtra,
    total: (shares.get(p.idx) ?? 0) + perPlayerExtra
  }));
}
