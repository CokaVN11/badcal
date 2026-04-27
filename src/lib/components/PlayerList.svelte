<script lang="ts">
	// ABOUTME: Player list with grouped accordion - players grouped by hours played
	// ABOUTME: Expandable groups for easy management of players with same hours

	import PlayerEmptyState from './Players/PlayerEmptyState.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { Player } from '$lib/types';
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import QuickAddControl from './Players/QuickAddControl.svelte';
	import ImportPlayersDialog from './Players/ImportPlayersDialog.svelte';
	import SavedLineupsDialog from './Players/SavedLineupsDialog.svelte';
	import { loadSavedLineups, upsertSavedLineup, deleteSavedLineup } from '$lib/utils';
	import type { SavedLineup } from '$lib/types';
	import PlayerRow from './Players/PlayerRow.svelte';
	import { createPlayerListStore } from './Players/playerList.store';
	import { groupByKey, getGroupColor, getPlayerDisplayName } from '$lib/utils';
	import { HOUR_OPTIONS } from './Players/playerList.logic';
	import { IconChevronDown } from '@tabler/icons-svelte-runes';
	import { SvelteSet } from 'svelte/reactivity';
	import HoursBadge from './shared/HoursBadge.svelte';
	import AvatarStack from './shared/AvatarStack.svelte';
	import { toast } from 'svelte-sonner';

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
	const actions = playerList.actions;

	let savedLineups = $state<SavedLineup[]>(loadSavedLineups());

	function handleSaveLineup(name: string) {
		const names = actions.extractLineupNames();
		if (names.length === 0){
      toast.error(m.cannot_save_empty_lineup());
      return;
    }
		const now = Date.now();
		const lineup: SavedLineup = {
			id: crypto.randomUUID(),
			name,
			playerNames: names,
			createdAt: now,
			updatedAt: now
		};
    console.log('Saving lineup', lineup);
		upsertSavedLineup(lineup);
		savedLineups = loadSavedLineups();
	}

	function handleApplyLineup(lineup: SavedLineup) {
		actions.applyLineup(lineup);
	}

	function handleDeleteLineup(id: string) {
		deleteSavedLineup(id);
		savedLineups = loadSavedLineups();
	}

	function handleRenameLineup(id: string, newName: string) {
		const lineup = savedLineups.find((l) => l.id === id);
		if (!lineup) return;
		upsertSavedLineup({ ...lineup, name: newName, updatedAt: Date.now() });
		savedLineups = loadSavedLineups();
	}

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
	});

	let groupedPlayers = $derived(groupByKey($playersStore, (p) => p.hours));

	let expandedGroups = new SvelteSet<number>();

	function toggleGroup(hours: number) {
		if (expandedGroups.has(hours)) {
			expandedGroups.delete(hours);
		} else {
			expandedGroups.add(hours);
		}
	}

	function getGlobalIndex(player: Player): number {
		return $playersStore.findIndex((p) => p.id === player.id);
	}

	function getAvatarItems(groupPlayers: Player[]) {
		return groupPlayers.map((p) => {
			const idx = getGlobalIndex(p);
			return { id: p.id, displayName: getPlayerDisplayName(p, idx), globalIndex: idx };
		});
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<QuickAddControl onAdd={actions.addPlayers} max={MAX_QUICK_ADD} />
			<ImportPlayersDialog onImport={actions.importPlayersFromText} />
			<SavedLineupsDialog
				lineups={savedLineups}
				onSave={handleSaveLineup}
				onApply={handleApplyLineup}
				onDelete={handleDeleteLineup}
				onRename={handleRenameLineup}
			/>
		</div>
	</div>

	{#if $playersStore.length === 0}
		<PlayerEmptyState />
	{:else}
		<div class="space-y-3">
			{#each groupedPlayers as [hours, groupPlayers], groupIndex (hours)}
				{@const isExpanded = expandedGroups.has(hours)}
				{@const colorScheme = getGroupColor(groupIndex)}
				<div
					class="group-card rounded-2xl overflow-hidden animate-slide-in"
					class:is-expanded={isExpanded}
					style="animation-delay: {groupIndex * 0.08}s;"
				>
					<button
						type="button"
						class="group-header w-full flex items-center gap-3 p-3 cursor-pointer transition-all duration-200"
						onclick={() => toggleGroup(hours)}
					>
						<HoursBadge {hours} {colorScheme} />

						<div class="flex-1 text-left min-w-0">
							<div class="flex items-center gap-2">
								<span class="text-base font-bold text-ink">
									{groupPlayers.length}
								</span>
								<span class="text-sm text-ink-soft">
									{groupPlayers.length === 1 ? m.player() : m.players_count()}
								</span>
							</div>

							{#if !isExpanded}
								<div class="flex items-center gap-1 mt-1.5">
									<AvatarStack items={getAvatarItems(groupPlayers)} size="sm" />
									{#if groupPlayers.some((p) => p.name?.trim())}
										<span class="text-xs text-ink-muted truncate ml-2">
											{groupPlayers
												.filter((p) => p.name?.trim())
												.map((p) => p.name)
												.slice(0, 2)
												.join(', ')}
										</span>
									{/if}
								</div>
							{/if}
						</div>

						<div
							class="chevron-icon w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted transition-all duration-300 {isExpanded
								? 'rotate-180 bg-white/50'
								: ''}"
						>
							<IconChevronDown size={20} stroke={2} />
						</div>
					</button>

					<div class="flex items-center gap-1.5 px-3 pb-2">
						{#each HOUR_OPTIONS as chip (chip)}
							<button
								type="button"
								class="h-11 px-4 rounded-lg text-sm font-bold transition-colors {chip === hours
									? `${colorScheme.light} ${colorScheme.text}`
									: 'bg-slate-100 text-ink-muted hover:bg-slate-200'}"
								onclick={() =>
									actions.setGroupHours(
										chip,
										groupPlayers.map((p) => p.id)
									)}
							>
								{chip}h
							</button>
						{/each}
					</div>

					{#if isExpanded}
						<div class="group-content border-t border-border">
							<div class="p-2 space-y-1">
								{#each groupPlayers as player, playerIndex (player.id)}
									<PlayerRow
										{player}
										playerIndex={playerIndex}
										globalIndex={getGlobalIndex(player)}
										colorScheme={colorScheme}
										hourStep={HOUR_STEP}
										onUpdateName={(value) => actions.updatePlayer(player.id, 'name', value)}
										onAddHours={(delta) => actions.addHours(player.id, delta)}
										onRemove={() => actions.removePlayer(player.id)}
										onSetArrivalOffset={(offset) => actions.setArrivalOffset(player.id, offset)}
									/>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* === Component-specific styles (shared styles in layout.css) === */
	.group-header:hover .chevron-icon {
		background: var(--slate-100);
	}
</style>
