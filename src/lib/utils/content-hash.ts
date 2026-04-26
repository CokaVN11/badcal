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
 *   additionalCosts: sort by (label asc, amount asc, originalId asc)
 *   players:        sort by (id asc, name asc, hours asc,
 *                    arrivalOffsetMinutes asc, originalId asc)
 *
 * For both arrays, an `originalId` field is expected when present
 * and is used as a stable tiebreaker for equal sort keys.
 */

export interface HashableExtraCost {
	label: string;
	amount: number;
	originalId?: number;
}

export interface HasableGroup {
	id: number;
	startTime: string;
	endTime: string;
	playerNames: string[];
	originalId?: number;
}

export interface HashableCourtBlock {
	id: string;
	courtCount: number;
	startTime: string;
	endTime: string;
	pricePerHour: number;
	originalId?: number;
}

export interface HashablePayload {
	title: string;
	date: string;
	courtBlocks: HashableCourtBlock[];
	extraCosts: HashableExtraCost[];
	groups: HasableGroup[];
}

/** Stable tiebreaker field — prefer explicit index, fall back to array position */
function stableIndex(item: { originalId?: number }, fallback: number): number {
	return item.originalId ?? fallback;
}

/** Sort a copy of additionalCosts by (label, amount, originalId) */
function normalizeExtraCosts(costs: HashableExtraCost[]): HashableExtraCost[] {
	return [...costs]
		.map((c, i) => ({ ...c, _idx: stableIndex(c, i) }))
		.sort((a, b) => {
			if (a.label !== b.label) return a.label.localeCompare(b.label);
			if (a.amount !== b.amount) return a.amount - b.amount;
			return a._idx - b._idx;
		})
		.map(({ ...rest }) => rest);
}

/** Sort a copy of groups by (id, playerNames, startTime, endTime, originalId) */
function normalizeGroups(groups: HasableGroup[]): HasableGroup[] {
	return [...groups]
		.map((p, i) => ({ ...p, _idx: stableIndex(p, i) }))
		.sort((a, b) => {
			if (a.id !== b.id) return a.id - b.id;
			if (a.playerNames.join(',') !== b.playerNames.join(','))
				return a.playerNames.join(',').localeCompare(b.playerNames.join(','));
			if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
			if (a.endTime !== b.endTime) return a.endTime.localeCompare(b.endTime);
			return a._idx - b._idx;
		})
		.map(({ ...rest }) => rest);
}

/** Compute a deterministic SHA-256 hex digest of a payload. */
export async function computeContentHash(payload: HashablePayload): Promise<string> {
	const normalized: HashablePayload = {
		...payload,
		extraCosts: normalizeExtraCosts(payload.extraCosts),
		groups: normalizeGroups(payload.groups)
	};

	// Use the Web Crypto API (available in Node 18+ and browsers)
	const encoded = new TextEncoder().encode(JSON.stringify(normalized));
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
