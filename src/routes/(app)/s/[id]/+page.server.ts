import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findSessionById, listPaidPlayerNames } from '$lib/server/sharing/session-store.js';
import { computeMinuteProportionShares, computeCourtTotal, SHARE_UNIT } from '$lib/utils/share-calc.js';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const session = await findSessionById(id);
	if (!session) {
		error(404, 'Session not found');
	}

	const paidPlayerNames = await listPaidPlayerNames(id);
	const courtTotal = computeCourtTotal(session.courtBlocks);
	const extraTotal = (session.extraCosts ?? []).reduce((s, c) => s + (c.amount || 0), 0);
	const shareResults = computeMinuteProportionShares(session.groups, session.courtBlocks, session.extraCosts ?? []);

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
		paidPlayerNames,
		courtTotal,
		extraTotal,
		grandTotal: courtTotal + extraTotal,
		shareResults
	};
};
