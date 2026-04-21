// ABOUTME: localStorage persistence for saved lineups (reusable player name presets)
// ABOUTME: Separate from session autosave — only stores player names, not timing data

import type { SavedLineup } from '$lib/types';

const STORAGE_KEY = 'badcal_saved_lineups';
const STORAGE_VERSION = 1;

interface PersistedLineups {
	version: number;
	lineups: SavedLineup[];
}

export function loadSavedLineups(): SavedLineup[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const data: PersistedLineups = JSON.parse(raw);
		if (data.version !== STORAGE_VERSION) return [];
		return data.lineups ?? [];
	} catch {
		console.warn('Failed to load saved lineups from localStorage');
		return [];
	}
}

function saveSavedLineups(lineups: SavedLineup[]): void {
	try {
		const data: PersistedLineups = { version: STORAGE_VERSION, lineups };
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
	} catch {
		console.warn('Failed to save lineups to localStorage');
	}
}

export function upsertSavedLineup(lineup: SavedLineup): void {
	const lineups = loadSavedLineups();
	const idx = lineups.findIndex((l) => l.id === lineup.id);
	if (idx >= 0) {
		lineups[idx] = lineup;
	} else {
		lineups.push(lineup);
	}
	saveSavedLineups(lineups);
}

export function deleteSavedLineup(id: string): void {
	const lineups = loadSavedLineups().filter((l) => l.id !== id);
	saveSavedLineups(lineups);
}
