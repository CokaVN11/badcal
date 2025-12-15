<script lang="ts">
	// ABOUTME: Player list component - add/remove players with names and hours using bits-ui Dialog
	// ABOUTME: Supports both individual add and bulk import via textarea

	import PlayerEmptyState from './Players/PlayerEmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { Player } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import QuickAddControl from './Players/QuickAddControl.svelte';
	import ImportPlayersDialog from './Players/ImportPlayersDialog.svelte';
	import PlayerRow from './Players/PlayerRow.svelte';
	import { createPlayerListStore } from './Players/playerList.store';

	type Props = {
		players: Player[];
		courtHours: number;
	};

	let { players = $bindable(), courtHours }: Props = $props();

	const HOUR_STEP = 0.5;
	const MAX_QUICK_ADD = 50;

	const playerList = createPlayerListStore({
		players,
		hourStep: HOUR_STEP,
		maxQuickAdd: MAX_QUICK_ADD
	});
	const playersStore = playerList.players;
	const customHoursByIdStore = playerList.customHoursById;
	const actions = playerList.actions;

	const unsubPlayers = playersStore.subscribe((next) => {
		if (players !== next) players = next;
	});

	$effect(() => {
		actions.setCourtHours(courtHours);
	});

	$effect(() => {
		const current = get(playersStore);
		if (players !== current) actions.setPlayers(players);
	});

	onDestroy(() => {
		unsubPlayers();
		actions.destroy();
	});

	function getDisplayName(player: Player, index: number) {
		return player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 });
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h2 class="form-label">{m.players_heading()}</h2>
		<div class="flex items-center gap-2">
			<QuickAddControl onAdd={actions.addPlayers} max={MAX_QUICK_ADD} />
			<ImportPlayersDialog onImport={actions.importPlayersFromText} />
		</div>
	</div>

	{#if $playersStore.length === 0}
		<PlayerEmptyState />
	{:else}
		<div class="space-y-2">
			{#each $playersStore as player, index (player.id)}
				{@const isCustom = !!$customHoursByIdStore[player.id]}
				{@const name = getDisplayName(player, index)}
				<PlayerRow
					{index}
					{player}
					{isCustom}
					hourStep={HOUR_STEP}
					displayName={name}
					enableCustomHours={actions.enableCustomHours}
					useDefaultHours={actions.useDefaultHours}
					addHours={actions.addHours}
					updatePlayer={actions.updatePlayer}
					removePlayer={actions.removePlayer}
				/>
			{/each}
		</div>
	{/if}
</div>
