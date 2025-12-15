import type { Player } from '$lib/types';
import { derived, get, writable } from 'svelte/store';

type CreatePlayerListStoreArgs = {
	players?: Player[];
	courtHours?: number;
	hourStep?: number;
	maxQuickAdd?: number;
};

function clamp(n: number, min: number, max: number) {
	return Math.max(min, Math.min(max, n));
}

function toStep(value: number, step: number) {
	if (step <= 0) return Math.max(0, value);
	const snapped = Math.round(value / step) * step;
	return Math.max(0, snapped);
}

function computeNextCustomMap(
	players: Player[],
	current: Record<number, boolean>,
	defaultHours: number
) {
	const next: Record<number, boolean> = {};
	for (const p of players) {
		const existing = current[p.id];
		next[p.id] = existing ?? p.hours !== defaultHours;
	}

	let changed = false;
	for (const p of players) {
		if (current[p.id] !== next[p.id]) {
			changed = true;
			break;
		}
	}
	if (!changed) {
		for (const id of Object.keys(current)) {
			if (!(Number(id) in next)) {
				changed = true;
				break;
			}
		}
	}

	return { next, changed };
}

function computeDefaultHoursPlayers(
	players: Player[],
	customHoursById: Record<number, boolean>,
	defaultHours: number
) {
	let nextPlayers: Player[] | null = null;
	for (let i = 0; i < players.length; i++) {
		const player = players[i];
		if (customHoursById[player.id]) continue;
		if (player.hours === defaultHours) continue;
		if (!nextPlayers) nextPlayers = players.slice();
		nextPlayers[i] = { ...player, hours: defaultHours };
	}
	return nextPlayers;
}

export function createPlayerListStore(args: CreatePlayerListStoreArgs = {}) {
	const hourStep = args.hourStep ?? 0.5;
	const maxQuickAdd = args.maxQuickAdd ?? 50;

	const players = writable<Player[]>(args.players ?? []);
	const courtHours = writable<number>(args.courtHours ?? 2);
	const customHoursById = writable<Record<number, boolean>>({});

	const defaultHours = derived(courtHours, (h) => (h > 0 ? h : 1));

	const unsubCustomMap = derived([players, defaultHours], ([$players, $defaultHours]) => {
		const current = get(customHoursById);
		const { next, changed } = computeNextCustomMap($players, current, $defaultHours);
		if (changed) customHoursById.set(next);
	}).subscribe(() => {});

	const unsubDefaultSync = derived(
		[players, customHoursById, defaultHours],
		([$players, $customMap, $defaultHours]) => {
			const next = computeDefaultHoursPlayers($players, $customMap, $defaultHours);
			if (next) players.set(next);
		}
	).subscribe(() => {});

	function setPlayers(nextPlayers: Player[]) {
		const current = get(players);
		if (current === nextPlayers) return;
		players.set(nextPlayers);
	}

	function setCourtHours(nextCourtHours: number) {
		const current = get(courtHours);
		if (current === nextCourtHours) return;
		courtHours.set(nextCourtHours);
	}

	function addPlayers(count: number) {
		const safeCount = clamp(Math.floor(count), 0, maxQuickAdd);
		if (safeCount === 0) return;

		const startId = Date.now();
		const hours = get(defaultHours);
		players.update((current) => [
			...current,
			...Array.from({ length: safeCount }, (_, i) => ({
				id: startId + i,
				name: '',
				hours
			}))
		]);
	}

	function removePlayer(id: number) {
		players.update((current) => current.filter((p) => p.id !== id));
		customHoursById.update((m) => {
			if (!(id in m)) return m;
			const next = { ...m };
			delete next[id];
			return next;
		});
	}

	function updatePlayer(id: number, field: keyof Player, value: string | number) {
		players.update((current) => current.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
		if (field === 'hours') {
			customHoursById.update((m) => ({ ...m, [id]: true }));
		}
	}

	function addHours(id: number, delta: number) {
		players.update((current) =>
			current.map((p) => {
				if (p.id !== id) return p;
				const next = toStep((p.hours || 0) + delta, hourStep);
				return { ...p, hours: next };
			})
		);
		customHoursById.update((m) => ({ ...m, [id]: true }));
	}

	function enableCustomHours(id: number) {
		customHoursById.update((m) => ({ ...m, [id]: true }));
	}

	function useDefaultHours(id: number) {
		const hours = get(defaultHours);
		customHoursById.update((m) => ({ ...m, [id]: false }));
		players.update((current) => current.map((p) => (p.id === id ? { ...p, hours } : p)));
	}

	function importPlayersFromText(text: string) {
		const lines = text.split('\n').filter((l) => l.trim());
		const startId = Date.now();
		const hours = get(defaultHours);
		const newPlayers: Player[] = lines.map((line, i) => {
			const trimmed = line.trim();
			const match = trimmed.match(/^(.+?)[\s,]+(\d+(?:\.\d+)?)$/);
			if (match) {
				return { id: startId + i, name: match[1].trim(), hours: parseFloat(match[2]) };
			}
			return { id: startId + i, name: trimmed, hours };
		});

		players.update((current) => [...current, ...newPlayers]);
		customHoursById.update((m) => ({
			...m,
			...Object.fromEntries(newPlayers.map((p) => [p.id, p.hours !== hours] as const))
		}));
	}

	function destroy() {
		unsubCustomMap();
		unsubDefaultSync();
	}

	return {
		players,
		courtHours,
		defaultHours,
		customHoursById,
		actions: {
			setPlayers,
			setCourtHours,
			addPlayers,
			removePlayer,
			updatePlayer,
			addHours,
			enableCustomHours,
			useDefaultHours,
			importPlayersFromText,
			destroy
		}
	};
}
