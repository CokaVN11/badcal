/**
 * Deterministic content hash for session payloads.
 *
 * Produces the same hash for two payloads that are logically identical
 * but have their arrays in different orders. This ensures that
 * "create-or-reuse" always maps to the same session link regardless
 * of how the client assembled the data.
 *
 * Which top-level fields are hashed:
 *   sessionTitle, sessionDate, startTime, courtHours, courtPrice,
 *   shuttlecockPrice, shuttlecockCount, normalized additionalCosts,
 *   normalized players
 *
 * Which fields are EXCLUDED:
 *   - paid status (mutable, not content-identity)
 *
 * Normalization rules:
 *   additionalCosts: sort by (label asc, amount asc, originalIndex asc)
 *   players:        sort by (id asc, name asc, hours asc,
 *                    arrivalOffsetMinutes asc, originalIndex asc)
 *
 * For both arrays, an `originalIndex` field is expected when present
 * and is used as a stable tiebreaker for equal sort keys.
 */

export interface HashableAdditionalCost {
	label: string;
	amount: number;
	originalIndex?: number;
}

export interface HashablePlayer {
	id: number;
	name: string;
	hours: number;
	arrivalOffsetMinutes: number;
	originalIndex?: number;
}

export interface HashablePayload {
	sessionTitle: string;
	sessionDate: string;
	startTime: string;
	courtHours: number;
	courtPrice: number;
	shuttlecockPrice: number;
	shuttlecockCount: number;
	additionalCosts: HashableAdditionalCost[];
	players: HashablePlayer[];
}

/** Stable tiebreaker field — prefer explicit index, fall back to array position */
function stableIndex(item: { originalIndex?: number }, fallback: number): number {
	return item.originalIndex ?? fallback;
}

/** Sort a copy of additionalCosts by (label, amount, originalIndex) */
function normalizeAdditionalCosts(
	costs: HashableAdditionalCost[]
): HashableAdditionalCost[] {
	return [...costs]
		.map((c, i) => ({ ...c, _idx: stableIndex(c, i) }))
		.sort((a, b) => {
			if (a.label !== b.label) return a.label.localeCompare(b.label);
			if (a.amount !== b.amount) return a.amount - b.amount;
			return a._idx - b._idx;
		})
		.map(({ _idx: _idx, ...rest }) => rest);
}

/** Sort a copy of players by (id, name, hours, arrivalOffsetMinutes, originalIndex) */
function normalizePlayers(players: HashablePlayer[]): HashablePlayer[] {
	return [...players]
		.map((p, i) => ({ ...p, _idx: stableIndex(p, i) }))
		.sort((a, b) => {
			if (a.id !== b.id) return a.id - b.id;
			if (a.name !== b.name) return a.name.localeCompare(b.name);
			if (a.hours !== b.hours) return a.hours - b.hours;
			if (a.arrivalOffsetMinutes !== b.arrivalOffsetMinutes)
				return a.arrivalOffsetMinutes - b.arrivalOffsetMinutes;
			return a._idx - b._idx;
		})
		.map(({ _idx: _idx, ...rest }) => rest);
}

/** Compute a deterministic SHA-256 hex digest of a payload. */
export async function computeContentHash(payload: HashablePayload): Promise<string> {
	const normalized: HashablePayload = {
		...payload,
		additionalCosts: normalizeAdditionalCosts(payload.additionalCosts),
		players: normalizePlayers(payload.players),
	};

	// Use the Web Crypto API (available in Node 18+ and browsers)
	const encoded = new TextEncoder().encode(JSON.stringify(normalized));
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
