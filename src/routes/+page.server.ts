import { getPrisma } from '$lib/server/db/prisma.server.js';
import type { PageServerLoad } from './$types';
import { superValidate } from 'sveltekit-superforms';
import { sessionFormSchema } from '$lib/schemas/+page.schema';
import { zod4 } from 'sveltekit-superforms/adapters';

export const load: PageServerLoad = async () => {
	const sessions = await getPrisma().session.findMany({
		orderBy: { createdAt: 'desc' },
		take: 5,
		select: { id: true, sessionTitle: true, sessionDate: true }
	});

	return {
		recentSessions: sessions,
		form: await superValidate(zod4(sessionFormSchema))
	};
};
