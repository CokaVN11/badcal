<script lang="ts">
	// ABOUTME: Player list component - add/remove players with names and hours using bits-ui Dialog
	// ABOUTME: Supports both individual add and bulk import via textarea

	import PlayerEmptyState from './Players/PlayerEmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { Player } from '$lib/types';
	import QuickAddControl from './Players/QuickAddControl.svelte';
	import ImportPlayersDialog from './Players/ImportPlayersDialog.svelte';
	import PlayerRow from './Players/PlayerRow.svelte';

	type Props = {
		players: Player[];
		courtHours: number;
	};

	let { players = $bindable(), courtHours }: Props = $props();

	const HOUR_STEP = 0.5;
	const MAX_QUICK_ADD = 50;

	// State
	let customHoursById = $state<Record<number, boolean>>({});

	// Derived
	let defaultHours = $derived.by(() => (courtHours > 0 ? courtHours : 1));

	$effect(() => {
		// Ensure `customHoursById` has an entry for each player and removes stale IDs.
		const next: Record<number, boolean> = {};
		for (const p of players) {
			const existing = customHoursById[p.id];
			next[p.id] = existing ?? p.hours !== defaultHours;
		}

		let changed = false;
		for (const p of players) {
			if (customHoursById[p.id] !== next[p.id]) {
				changed = true;
				break;
			}
		}
		if (!changed) {
			for (const id of Object.keys(customHoursById)) {
				if (!(Number(id) in next)) {
					changed = true;
					break;
				}
			}
		}

		if (changed) customHoursById = next;
	});

	$effect(() => {
		// Keep non-custom players in sync with the session's default hours.
		if (defaultHours <= 0) return;

		let nextPlayers: Player[] | null = null;
		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			if (customHoursById[player.id]) continue;
			if (player.hours === defaultHours) continue;
			if (!nextPlayers) nextPlayers = players.slice();
			nextPlayers[i] = { ...player, hours: defaultHours };
		}

		if (nextPlayers) players = nextPlayers;
	});

	function getDisplayName(player: Player, index: number) {
		return player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 });
	}

	function toHalfHours(value: number) {
		const snapped = Math.round(value / HOUR_STEP) * HOUR_STEP;
		return Math.max(0, snapped);
	}

	function addPlayers(count: number) {
		const safeCount = Math.max(0, Math.min(MAX_QUICK_ADD, Math.floor(count)));
		if (safeCount === 0) return;

		const startId = Date.now();
		const newPlayers: Player[] = Array.from({ length: safeCount }, (_, i) => ({
			id: startId + i,
			name: '',
			hours: defaultHours
		}));

		players = [...players, ...newPlayers];
	}

	function removePlayer(id: number) {
		players = players.filter((p) => p.id !== id);
	}

	function updatePlayer(id: number, field: keyof Player, value: string | number) {
		players = players.map((p) => (p.id === id ? { ...p, [field]: value } : p));
		if (field === 'hours') {
			customHoursById = { ...customHoursById, [id]: true };
		}
	}

	function addHours(id: number, delta: number) {
		players = players.map((p) => {
			if (p.id !== id) return p;
			const next = toHalfHours((p.hours || 0) + delta);
			return { ...p, hours: next };
		});
		customHoursById = { ...customHoursById, [id]: true };
	}

	function enableCustomHours(id: number) {
		customHoursById = { ...customHoursById, [id]: true };
	}

	function useDefaultHours(id: number) {
		customHoursById = { ...customHoursById, [id]: false };
		players = players.map((p) => (p.id === id ? { ...p, hours: defaultHours } : p));
	}

	function parseAndImport(text: string) {
		const lines = text.split('\n').filter((l) => l.trim());
		const startId = Date.now();
		const newPlayers: Player[] = lines.map((line, i) => {
			const trimmed = line.trim();
			const match = trimmed.match(/^(.+?)[\s,]+(\d+(?:\.\d+)?)$/);
			if (match) {
				return {
					id: startId + i,
					name: match[1].trim(),
					hours: parseFloat(match[2])
				};
			}
			return {
				id: startId + i,
				name: trimmed,
				hours: defaultHours
			};
		});

		players = [...players, ...newPlayers];
		customHoursById = {
			...customHoursById,
			...Object.fromEntries(newPlayers.map((p) => [p.id, p.hours !== defaultHours] as const))
		};
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h2 class="form-label">{m.players_heading()}</h2>
		<div class="flex items-center gap-2">
			<QuickAddControl onAdd={addPlayers} max={MAX_QUICK_ADD} />
			<ImportPlayersDialog onImport={parseAndImport} />
		</div>
	</div>

	{#if players.length === 0}
		<PlayerEmptyState />
	{:else}
		<div class="space-y-2">
			{#each players as player, index (player.id)}
				{@const isCustom = !!customHoursById[player.id]}
				{@const name = getDisplayName(player, index)}
				<PlayerRow
					{index}
					{player}
					{isCustom}
					hourStep={HOUR_STEP}
					displayName={name}
					{enableCustomHours}
					{useDefaultHours}
					{addHours}
					{updatePlayer}
					{removePlayer}
				/>
			{/each}
		</div>
	{/if}
</div>
