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
	import { createPlayerListStore } from './Players/playerList.store';
	import {
		getAvatarColor,
		getInitial,
		groupByKey,
		getGroupColor,
		getPlayerDisplayName
	} from '$lib/utils';
	import { IconChevronDown, IconX, IconClock } from '@tabler/icons-svelte-runes';
	import { SvelteSet } from 'svelte/reactivity';
	import HoursBadge from './shared/HoursBadge.svelte';
	import AvatarStack from './shared/AvatarStack.svelte';

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
		<h2 class="form-label">{m.players_heading()}</h2>
		<div class="flex items-center gap-2">
			<QuickAddControl onAdd={actions.addPlayers} max={MAX_QUICK_ADD} />
			<ImportPlayersDialog onImport={actions.importPlayersFromText} />
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
								<span class="text-base font-bold text-(--ink)">
									{groupPlayers.length}
								</span>
								<span class="text-sm text-(--ink-soft)">
									{groupPlayers.length === 1 ? m.player() : m.players_count()}
								</span>
							</div>

							{#if !isExpanded}
								<div class="flex items-center gap-1 mt-1.5">
									<AvatarStack items={getAvatarItems(groupPlayers)} size="sm" />
									{#if groupPlayers.some((p) => p.name?.trim())}
										<span class="text-xs text-(--ink-muted) truncate ml-2">
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
							class="chevron-icon w-8 h-8 rounded-lg flex items-center justify-center text-(--ink-muted) transition-all duration-300 {isExpanded
								? 'rotate-180 bg-white/50'
								: ''}"
						>
							<IconChevronDown size={20} stroke={2} />
						</div>
					</button>

					{#if isExpanded}
						<div class="group-content border-t border-(--border) bg-(--slate-50)/50">
							<div class="p-2 space-y-1">
								{#each groupPlayers as player, playerIndex (player.id)}
									{@const globalIndex = getGlobalIndex(player)}
									{@const isCustom = !!$customHoursByIdStore[player.id]}
									{@const displayName = getPlayerDisplayName(player, globalIndex)}
									<div
										class="player-row flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-transparent hover:border-(--border) hover:shadow-sm transition-all duration-150"
										style="animation: slideUp 0.25s ease-out backwards; animation-delay: {playerIndex *
											0.04}s;"
									>
										<div
											class="player-avatar w-9 h-9 text-xs ring-2 ring-white shadow-sm {getAvatarColor(
												globalIndex
											)}"
										>
											{getInitial(displayName)}
										</div>

										<div class="flex-1 min-w-0">
											<input
												type="text"
												value={player.name}
												oninput={(e) =>
													actions.updatePlayer(
														player.id,
														'name',
														(e.target as HTMLInputElement).value
													)}
												placeholder={displayName}
												class="w-full bg-transparent border-none p-0 text-sm font-semibold text-(--ink) focus:outline-none placeholder:text-(--slate-400) placeholder:font-normal"
											/>
										</div>

										<div class="flex items-center gap-0.5">
											{#if isCustom}
												<button
													type="button"
													class="stepper-btn w-7 h-7 rounded-lg bg-(--slate-100) hover:bg-(--slate-200) text-(--ink-soft) hover:text-(--ink) flex items-center justify-center transition-colors"
													onclick={() => actions.addHours(player.id, -HOUR_STEP)}
													aria-label={m.decrease_hours()}
												>
													<span class="text-sm font-bold">−</span>
												</button>
												<div
													class="hours-display w-11 h-7 rounded-lg {colorScheme.light} {colorScheme.text} flex items-center justify-center"
												>
													<span class="text-xs font-bold font-mono">{player.hours}h</span>
												</div>
												<button
													type="button"
													class="stepper-btn w-7 h-7 rounded-lg bg-(--slate-100) hover:bg-(--slate-200) text-(--ink-soft) hover:text-(--ink) flex items-center justify-center transition-colors"
													onclick={() => actions.addHours(player.id, HOUR_STEP)}
													aria-label={m.increase_hours()}
												>
													<span class="text-sm font-bold">+</span>
												</button>
											{:else}
												<button
													type="button"
													class="custom-hours-btn h-7 px-2 rounded-lg {colorScheme.light} {colorScheme.text} text-xs font-semibold hover:opacity-80 transition-opacity flex items-center gap-1"
													onclick={() => actions.enableCustomHours(player.id)}
												>
													<IconClock size={12} />
													{m.custom_hours()}
												</button>
											{/if}

											<button
												type="button"
												class="delete-btn w-7 h-7 rounded-lg text-(--slate-400) hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors ml-1"
												onclick={() => actions.removePlayer(player.id)}
												aria-label={m.remove()}
											>
												<IconX size={14} stroke={2.5} />
											</button>
										</div>
									</div>
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

	.stepper-btn:active {
		transform: scale(0.92);
	}

	.delete-btn:active {
		transform: scale(0.9);
	}
</style>
