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

export function createPlayerListStore(args: CreatePlayerListStoreArgs = {}) {
	const hourStep = args.hourStep ?? 0.5;
	const maxQuickAdd = args.maxQuickAdd ?? 50;

	const players = writable<Player[]>(args.players ?? []);
	const courtHours = writable<number>(args.courtHours ?? 2);

	const defaultHours = derived(courtHours, (h) => (h > 0 ? h : 1));

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
				hours,
        arrivalOffsetMinutes: 0
			}))
		]);
	}

	function removePlayer(id: number) {
		players.update((current) => current.filter((p) => p.id !== id));
	}

	function updatePlayer(id: number, field: keyof Player, value: string | number) {
		players.update((current) => current.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
	}

	function setArrivalOffset(id: number, offsetMinutes: number) {
		players.update((current) =>
			current.map((p) => (p.id === id ? { ...p, arrivalOffsetMinutes: offsetMinutes } : p))
		);
	}

	function setGroupHours(hours: number, playerIds: number[]) {
		players.update((current) =>
			current.map((p) => (playerIds.includes(p.id) ? { ...p, hours } : p))
		);
	}

	function addHours(id: number, delta: number) {
		players.update((current) =>
			current.map((p) => {
				if (p.id !== id) return p;
				const next = toStep((p.hours || 0) + delta, hourStep);
				return { ...p, hours: next };
			})
		);

	}

	function importPlayersFromText(text: string) {
		const lines = text.split('\n').filter((l) => l.trim());
		const startId = Date.now();
		const hours = get(defaultHours);
		const newPlayers: Player[] = lines.map((line, i) => {
			const trimmed = line.trim();
			const match = trimmed.match(/^(.+?)[\s,]+(\d+(?:\.\d+)?)$/);
			if (match) {
				return { id: startId + i, name: match[1].trim(), hours: parseFloat(match[2]), arrivalOffsetMinutes: 0 };
			}
			return { id: startId + i, name: trimmed, hours, arrivalOffsetMinutes: 0 };
		});

		players.update((current) => [...current, ...newPlayers]);
	}


	return {
		players,
		courtHours,
		defaultHours,
		actions: {
			setPlayers,
			setCourtHours,
			addPlayers,
			removePlayer,
			updatePlayer,
			setArrivalOffset,
			setGroupHours,
			addHours,
			importPlayersFromText,
		}
	};
}
