import { z } from 'zod';

export const formSchema = z.object({
	sessionTitle: z.string().min(1, 'Session title is required'),
	sessionDate: z.string().min(1, 'Date is required')
});

export type FormSchema = typeof formSchema;