// ABOUTME: localStorage persistence for session data
// ABOUTME: Auto-saves form state, restores on page load

import type { Player, ExtraCost } from '$lib/types';

const STORAGE_KEY = 'badcal_session';
const STORAGE_VERSION = 2;

export interface PersistedSession {
	version: number;
	sessionTitle: string;
	sessionDate: string;
	startTime: string | null; // "HH:mm" format or null for all-day
	courtHours: number;
	courtPrice: number;
	shuttlecockPrice: number;
	shuttlecockCount: number;
	additionalCosts: ExtraCost[];
	players: Player[];
	savedAt: number;
}

export function saveSession(data: Omit<PersistedSession, 'version' | 'savedAt'>): void {
	try {
		const session: PersistedSession = {
			...data,
			additionalCosts: data.additionalCosts.map((c, i) => ({ ...c, id: c.id ?? String(i) })),
			version: STORAGE_VERSION,
			savedAt: Date.now()
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
	} catch {
		console.warn('Failed to save session to localStorage');
	}
}

export function loadSession(): Omit<PersistedSession, 'version' | 'savedAt'> | null {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;

		const session: PersistedSession = JSON.parse(raw);

		if (session.version !== STORAGE_VERSION) {
			clearSession();
			return null;
		}

		return {
			sessionTitle: session.sessionTitle ?? '',
			sessionDate: session.sessionDate ?? new Date().toISOString().split('T')[0],
			startTime: session.startTime ?? null,
			courtHours: session.courtHours ?? 2,
			courtPrice: session.courtPrice ?? 0,
			shuttlecockPrice: session.shuttlecockPrice ?? 0,
			shuttlecockCount: session.shuttlecockCount ?? 1,
			additionalCosts: (session.additionalCosts ?? []).map(
				(c: { id?: string | number; label: string; amount: number }, i: number) => ({
					id: String(c.id ?? i),
					label: c.label,
					amount: c.amount
				})
			),
			players: session.players ?? []
		};
	} catch {
		console.warn('Failed to load session from localStorage');
		return null;
	}
}

export function clearSession(): void {
	try {
		localStorage.removeItem(STORAGE_KEY);
	} catch {
		console.warn('Failed to clear session from localStorage');
	}
}

export function hasPersistedSession(): boolean {
	try {
		return localStorage.getItem(STORAGE_KEY) !== null;
	} catch {
		return false;
	}
}
