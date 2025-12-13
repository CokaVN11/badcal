// ABOUTME: Helper functions for TanStack Form with Zod validation
// ABOUTME: Converts Zod schemas to validator functions for field-level validation

import type { z } from 'zod';

/**
 * Converts a Zod schema to a TanStack Form validator function
 * Works with Standard Schema (Zod v3.23+)
 *
 * @param schema - Zod schema to validate against
 * @returns Validator function that returns error message or undefined
 *
 * @example
 * ```ts
 * const schema = z.number().min(0, "Must be positive");
 *
 * <form.Field
 *   name="age"
 *   validators={{ onChange: zodFieldValidator(schema) }}
 * >
 * ```
 */
export function zodFieldValidator<T>(schema: z.ZodType<T>) {
	return ({ value }: { value: unknown }) => {
		const result = schema.safeParse(value);
		if (result.success) return undefined;
		// Return first error message as string
		return result.error.issues[0]?.message || 'Validation failed';
	};
}
