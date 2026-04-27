import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { findSessionById } from '$lib/server/sharing/session-store.js';

export const load: PageServerLoad = async ({ params }) => {
	const { id } = params;

	const session = await findSessionById(id);
	if (!session) {
		error(404, 'Session not found');
	}

	return {
		session: {
			id: session.id,
			sessionTitle: session.sessionTitle ?? '',
			sessionDate: session.sessionDate ?? '',
			courtBlocks: session.courtBlocks,
			groups: session.groups,
			extraCosts: session.extraCosts,
			createdAt: session.createdAt
		}
	};
};