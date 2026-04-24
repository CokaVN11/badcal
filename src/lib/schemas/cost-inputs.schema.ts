import { z } from 'zod';

export const costInputsSchema = z.object({
	courtHours: z.number().min(0, 'Hours cannot be negative').max(24, 'Max 24 hours'),
	courtPrice: z.number().min(0, 'Price cannot be negative'),
	shuttlecockPrice: z.number().min(0, 'Price cannot be negative'),
	shuttlecockCount: z.number().int('Must be a whole number').min(0, 'Cannot be negative')
});

export const additionalCostSchema = z.object({
	id: z.string(),
	label: z.string().min(1, 'Label is required').max(50, 'Label too long'),
	amount: z.number().min(0, 'Amount cannot be negative')
});

export type CostInputsSchema = typeof costInputsSchema;
export type AdditionalCostSchema = typeof additionalCostSchema;
