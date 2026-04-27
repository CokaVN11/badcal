// ABOUTME: Zod integration utilities

/**
 * Extract a human-readable error message from a Zod error or generic unknown value.
 */
export function zodErrorMessage(err: unknown): string {
	if (err && typeof err === 'object' && 'issues' in err) {
		return (err as { issues?: Array<{ message?: string }> }).issues?.[0]?.message || 'Invalid value';
	}
	if (err instanceof Error) return err.message;
	return 'Invalid value';
}
