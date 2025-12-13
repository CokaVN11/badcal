// ABOUTME: Zod validation schemas for form inputs
// ABOUTME: Type-safe validation rules for session, costs, and players

import { z } from 'zod';
import { m } from '$lib/paraglide/messages';

export const sessionInfoSchema = () =>
	z.object({
		title: z
			.string()
			.min(1, m.validation_title_required())
			.max(100, m.validation_title_too_long({ max: 100 })),
		date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, m.validation_date_invalid())
	});

export const costInputSchema = () =>
	z.object({
		courtHours: z
			.number()
			.min(0, m.validation_hours_negative())
			.max(24, m.validation_hours_max({ max: 24 })),
		courtPrice: z.number().min(0, m.validation_price_negative()),
		shuttlecockPrice: z.number().min(0, m.validation_price_negative()),
		shuttlecockCount: z.number().int(m.validation_integer()).min(0, m.validation_amount_negative())
	});

export const additionalCostSchema = () => z.object({
	id: z.number(),
	label: z.string().min(1, m.validation_label_required()).max(50, m.validation_name_too_long({ max: 50 })),
	amount: z.number().min(0, m.validation_amount_negative())
});

export const playerSchema = () => z.object({
	id: z.number(),
	name: z.string().min(1, m.validation_name_required()).max(50, m.validation_name_too_long({ max: 50 })),
	hours: z.number().min(0, m.validation_hours_negative()).max(24, m.validation_hours_max({ max: 24 }))
});

// Array schemas
export const additionalCostsArraySchema = () => {
  return z.array(additionalCostSchema());
}
export const playersArraySchema = () => {
  return z.array(playerSchema());
}
