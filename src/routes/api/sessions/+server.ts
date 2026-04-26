import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { computeContentHash, type HashablePayload } from '$lib/utils/content-hash.js';
import { createOrReuseSession } from '$lib/server/sharing/session-store.js';

/**
 * POST /api/sessions
 *
 * Create a sharing session or reuse an existing one for identical canonical content.
 *
 * Route contract:
 *   Input:  HashablePayload — sessionTitle, sessionDate, courtBlocks, extraCosts, groups
 *   Output: { id: string }  — the UUID of the created or reused session
 *
 * The canonical content hash is computed server-side from the validated payload.
 * Race-safety: concurrent identical POSTs return the same session ID (unique constraint + retry).
 */
export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	const payload = body as HashablePayload;

	// --- Validate required fields ---
	if (!payload.title || typeof payload.title !== 'string') {
		return json({ error: 'Missing or invalid: sessionTitle' }, { status: 400 });
	}
	if (!payload.date || typeof payload.date !== 'string') {
		return json({ error: 'Missing or invalid: sessionDate' }, { status: 400 });
	}
	if (!Array.isArray(payload.courtBlocks)) {
		return json({ error: 'courtBlocks must be an array' }, { status: 400 });
	}
	if (!Array.isArray(payload.extraCosts)) {
		return json({ error: 'extraCosts must be an array' }, { status: 400 });
	}
	if (!Array.isArray(payload.groups)) {
		return json({ error: 'groups must be an array' }, { status: 400 });
	}

	// --- Compute server-side canonical hash ---
	const contentHash = await computeContentHash(payload);

	// --- Build normalized payload for createOrReuseSession ---
	const normalizedPayload = {
		sessionTitle: payload.title,
		sessionDate: payload.date,
		courtBlocks: payload.courtBlocks.map((cb) => ({
			courtCount: cb.courtCount,
			startTime: cb.startTime,
			endTime: cb.endTime,
			pricePerHour: cb.pricePerHour
		})),
		groups: payload.groups.map((g) => ({
			startTime: g.startTime,
			endTime: g.endTime,
			playerNames: g.playerNames
		})),
		extraCosts: payload.extraCosts.map((ec) => ({
			label: ec.label,
			amount: ec.amount
		}))
	};

	// --- Race-safe create-or-reuse ---
	const session = await createOrReuseSession(contentHash, normalizedPayload);

	if (!session?.id) {
		return json({ error: 'Failed to create or reuse session' }, { status: 500 });
	}

	return json({ id: session.id }, { status: 200 });
};
