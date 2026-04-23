import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findSessionById, listPaidPlayerIds } from '$lib/server/sharing/session-store.js';

/**
 * Server load for shared session view /s/[id].
 *
 * Fetches the session row and paid player IDs from TypeORM,
 * then returns the payload data and paid IDs for the page.
 *
 * Throws 404 if the session ID is not found.
 */
export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const session = await findSessionById(id);
	if (!session) {
		error(404, 'Session not found');
	}

	const paidPlayerIds = await listPaidPlayerIds(id);

	return {
		session: {
			id: session.id,
			data: session.data as {
				sessionTitle: string;
				sessionDate: string;
				startTime: string | null;
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
			},
			createdAt: session.createdAt,
		},
		paidPlayerIds,
	};
};
