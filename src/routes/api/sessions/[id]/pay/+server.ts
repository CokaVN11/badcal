import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { findSessionById, markPaid, unmarkPaid } from '$lib/server/sharing/session-store.js';

/**
 * POST /api/sessions/[id]/pay
 *
 * Mark or unmark a player as paid for a sharing session.
 *
 * Route contract:
 *   Input:  { playerId: number, paid: boolean }
 *   Output: {} on success
 *           { error: string } on failure
 *
 * Validation order:
 *   1. Session exists → 404 if not found
 *   2. playerId exists in the stored session snapshot → 404 if not found
 *   3. Persist PaidStatus accordingly
 *
 * The route does NOT trust client-supplied player membership — it verifies
 * against the persisted session.data.players array before mutating.
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const { id } = params;

	// --- Parse body ---
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const { playerId, paid } = body as { playerId?: unknown; paid?: unknown };

	if (typeof playerId !== 'number' || !Number.isInteger(playerId)) {
		return json({ error: 'playerId must be an integer number' }, { status: 400 });
	}
	if (typeof paid !== 'boolean') {
		return json({ error: 'paid must be a boolean' }, { status: 400 });
	}

	// --- Load session ---
	const session = await findSessionById(id);
	if (!session) {
		return json({ error: 'Session not found' }, { status: 404 });
	}

	// --- Verify playerId exists in stored snapshot ---
	// session.data is Record<string, unknown>; players lives at data.players
	const data = session.data as { players?: Array<{ id: number }> };
	const players = data.players ?? [];
	if (!players.some((p) => p.id === playerId)) {
		return json({ error: 'Player not found in this session' }, { status: 404 });
	}

	// --- Persist ---
	if (paid) {
		await markPaid(id, playerId);
	} else {
		await unmarkPaid(id, playerId);
	}

	return json({}, { status: 200 });
};
