import { browser } from '$app/environment';
import type { CourtBlock, ExtraCost, Group } from '$lib/types';

function createDefaultSession() {
	return {
		sessionTitle: 'New Session',
		sessionDate: new Date().toISOString().split('T')[0],
		courtBlocks: [] as CourtBlock[],
		groups: [] as Group[],
		extraCosts: [{ id: crypto.randomUUID(), label: 'Shuttlecock', amount: 0 }] as ExtraCost[]
	};
}

// Singleton state instance — shared across all imports
const state = $state(createDefaultSession());
let initialized = $state(false);

// hydrate — read from localStorage on startup
export function hydrate() {
	if (!browser) return;
	const saved = localStorage.getItem('badcal_session_v4');
	if (saved) {
		Object.assign(state, JSON.parse(saved));
	}
	initialized = true;
}

// persist — auto-save on every change
$effect(() => {
	if (!browser || !initialized) return;
	// $effect tracks reactive dependencies automatically
	// Any state change triggers this effect
	localStorage.setItem('badcal_session_v4', JSON.stringify(state));
});

// clear — reset to defaults + remove from localStorage
export function clear() {
	if (!browser) return;
	Object.assign(state, createDefaultSession());
	localStorage.removeItem('badcal_session_v4');
}

// Singleton accessor
export const sessionStore = state;
