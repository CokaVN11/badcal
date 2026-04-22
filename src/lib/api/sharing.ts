/**
 * Browser-side fetch wrappers for sharing session endpoints.
 *
 * All functions call SvelteKit server routes — no TypeORM, no DB drivers,
 * no $lib/server code may be imported here.
 */

export interface SessionPayload {
	sessionTitle: string;
	sessionDate: string;
	startTime: string;
	courtHours: number;
	courtPrice: number;
	shuttlecockPrice: number;
	shuttlecockCount: number;
	additionalCosts: Array<{ label: string; amount: number }>;
	players: Array<{
		id: number;
		name: string;
		hours: number;
		arrivalOffsetMinutes: number;
	}>;
}

export interface CreateSessionResult {
	id: string;
}

export interface PayToggleResult {}

/** Create a sharing session or reuse an existing one for identical content. */
export async function createOrReuseSession(
	payload: SessionPayload
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
): Promise<PayToggleResult> {
	const res = await fetch(`/api/sessions/${sessionId}/pay`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ playerId, paid }),
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error((err as { error: string }).error ?? 'Failed to toggle paid status');
	}

	return res.json() as Promise<PayToggleResult>;
}
