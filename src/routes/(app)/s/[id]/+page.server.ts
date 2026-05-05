import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findSessionById, listPaidPlayerIds } from '$lib/server/sharing/session-store.js';
import { computeShares, computeCourtTotal, listPlayerOccurrences } from '$lib/utils/share-calc.js';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const session = await findSessionById(id);
	if (!session) {
		error(404, 'Session not found');
	}

	const paidPlayerIds = await listPaidPlayerIds(id);
	const occurrences = listPlayerOccurrences(session.groups);
	const paidEntryIds = paidPlayerIds
		.map((playerId) => occurrences[playerId]?.entryId)
		.filter((entryId): entryId is string => Boolean(entryId));
	const courtTotal = computeCourtTotal(session.courtBlocks);
	const extraTotal = (session.extraCosts ?? []).reduce((s, c) => s + (c.amount || 0), 0);
	const shareResults = computeShares(session.groups, session.courtBlocks, session.extraCosts ?? []);

	return {
		session: {
			id: session.id,
			sessionTitle: session.sessionTitle ?? '',
			sessionDate: session.sessionDate ?? '',
			courtBlocks: session.courtBlocks,
			groups: session.groups,
			extraCosts: session.extraCosts,
			createdAt: session.createdAt
		},
		paidEntryIds,
		courtTotal,
		extraTotal,
		grandTotal: courtTotal + extraTotal,
		shareResults
	};
};
