export const HOUR_STEP = 0.5;
export const MAX_QUICK_ADD = 50;

export function clampInt(n: unknown, min: number, max: number): number {
	const v = Number.isFinite(n) ? Math.floor(Number(n)) : min;
	return Math.max(min, Math.min(max, v));
}
