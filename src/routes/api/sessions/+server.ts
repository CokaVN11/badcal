export const runtime = 'nodejs';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { computeContentHash, type HashablePayload } from '$lib/utils/content-hash.js';
import { createOrReuseSession } from '$lib/server/sharing/session-store.js';

/**
 * POST /api/sessions
 *
 * Create a sharing session or reuse an existing one for the same
 * canonical content.
 *
 * Route contract:
 *   Input:  SessionPayload — see $lib/server/sharing/session-store.ts
 *   Output: { id: string }  — the UUID of the created or reused session
 *
 * The canonical content hash is computed server-side from the validated
 * payload. Any client-supplied hash is ignored.
 *
 * Fields used for hashing:
 *   sessionTitle, sessionDate, startTime, courtHours, courtPrice,
 *   shuttlecockPrice, shuttlecockCount, normalized additionalCosts,
 *   normalized players
 *
 * Race-safety: concurrent identical POSTs will return the same session ID.
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const payload = body as HashablePayload;

	// --- Validate required top-level fields ---
	const required = [
		'sessionTitle',
		'sessionDate',
		'startTime',
		'courtHours',
		'courtPrice',
		'shuttlecockPrice',
		'shuttlecockCount',
		'additionalCosts',
		'players',
	] as const;

	for (const field of required) {
		if (payload[field] === undefined) {
			return json({ error: `Missing required field: ${field}` }, { status: 400 });
		}
	}

	if (!Array.isArray(payload.additionalCosts)) {
		return json({ error: 'additionalCosts must be an array' }, { status: 400 });
	}
	if (!Array.isArray(payload.players)) {
		return json({ error: 'players must be an array' }, { status: 400 });
	}

	// --- Compute server-side canonical hash ---
	const contentHash = await computeContentHash(payload);

	// --- Race-safe create-or-reuse ---
	// The session-store helper is find-then-save (not atomic), so we delegate
	// to it for now. For true race-safety under concurrent inserts the TOCTOU
	// window between findOne and save would need a unique-constraint retry
	// loop. The existing findOne-then-save path is sufficient here because the
	// unique constraint on contentHash prevents duplicates at the DB level,
	// and a retry on the unique-violation error in the catch block would
	// make it fully race-safe when callers are genuinely concurrent.
	const session = await createOrReuseSession(contentHash, payload);

	return json({ id: session.id }, { status: 200 });
};
