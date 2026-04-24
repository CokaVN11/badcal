import { z } from 'zod';
import { m } from '$lib/paraglide/messages';

export const sessionFormSchema = z.object({
	title: z.string().min(1, m.validation_session_title_required()),
	date: z.string().min(1, m.validation_session_date_required())
});

export type SessionFormSchema = typeof sessionFormSchema;
