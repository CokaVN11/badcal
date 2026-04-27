/**
 * Browser-side fetch wrappers for sharing session endpoints.
 *
 * All functions call SvelteKit server routes — no TypeORM, no DB drivers,
 * no $lib/server code may be imported here.
 */

export interface CourtBlockPayload {
	courtCount: number;
	startTime: string;
	endTime: string;
	pricePerHour: number;
}

export interface GroupPayload {
	startTime: string;
	endTime: string;
	playerNames: string[];
}

export interface ExtraCostPayload {
	label: string;
	amount: number;
}

export interface CreateSessionPayload {
	title: string;
	date: string;
	courtBlocks: CourtBlockPayload[];
	groups: GroupPayload[];
	extraCosts: ExtraCostPayload[];
}

export interface CreateSessionResult {
	id: string;
}

/** Create a sharing session or reuse an existing one for identical content. */
export async function createOrReuseSession(
	payload: CreateSessionPayload
): Promise<CreateSessionResult> {
	const res = await fetch('/api/sessions', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(payload),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error((err as { error: string }).error ?? 'Failed to create session');
	}

	return res.json() as Promise<CreateSessionResult>;
}

/** Mark or unmark a player as paid for a sharing session. */
export async function togglePaid(
	sessionId: string,
	playerId: number,
	paid: boolean
): Promise<{ success: boolean }> {
	const res = await fetch(`/api/sessions/${sessionId}/pay`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ playerId, paid }),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error((err as { error: string }).error ?? 'Failed to toggle paid status');
	}

	return res.json() as Promise<{ success: boolean }>;
}
