<script lang="ts">
	// ABOUTME: Live summary component - shows real-time calculation of player shares
	// ABOUTME: Displays grouped by share amount with premium card design

	import { m } from '$lib/paraglide/messages.js';
	import {
		formatCurrency,
		getAvatarColor,
		getInitial,
		groupByKey,
		getGroupColor,
		getPlayerDisplayName
	} from '$lib/utils';
	import type { PlayerShare } from '$lib/types';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import {
		IconCash,
		IconUsers,
		IconClock,
		IconCopy,
		IconCheck,
		IconChevronDown
	} from '@tabler/icons-svelte-runes';
	import { SvelteSet } from 'svelte/reactivity';
	import HoursBadge from './shared/HoursBadge.svelte';
	import AvatarStack from './shared/AvatarStack.svelte';

	let {
		playerShares,
		totalCost,
		totalHours
	}: {
		playerShares: PlayerShare[];
		totalCost: number;
		totalHours: number;
	} = $props();

	let copiedId = $state<number | null>(null);

	function getGlobalIndex(player: PlayerShare): number {
		return playerShares.findIndex((p) => p.id === player.id);
	}

	async function copyAmount(player: PlayerShare) {
		try {
			await navigator.clipboard.writeText(String(player.share));
			copiedId = player.id;
			setTimeout(() => {
				copiedId = null;
			}, 1500);
		} catch {
			// Silent fail
		}
	}

	let groupedByHours = $derived(groupByKey(playerShares, (p) => p.hours));

	let expandedGroups = new SvelteSet<number>();

	function toggleGroup(hours: number) {
		if (expandedGroups.has(hours)) {
			expandedGroups.delete(hours);
		} else {
			expandedGroups.add(hours);
		}
	}

	function getAvatarItems(players: PlayerShare[]) {
		return players.map((p) => {
			const idx = getGlobalIndex(p);
			return { id: p.id, displayName: getPlayerDisplayName(p, idx), globalIndex: idx };
		});
	}

	const STAT_STYLES = [
		{
			gradient: 'from-emerald-500 to-teal-600',
			bg: 'bg-emerald-50',
			text: 'text-emerald-700',
			icon: IconCash
		},
		{
			gradient: 'from-blue-500 to-indigo-600',
			bg: 'bg-blue-50',
			text: 'text-blue-700',
			icon: IconUsers
		},
		{
			gradient: 'from-amber-500 to-orange-600',
			bg: 'bg-amber-50',
			text: 'text-amber-700',
			icon: IconClock
		}
	];
</script>

<div class="space-y-4 mt-2">
	<div class="stats-grid grid grid-cols-3 gap-2">
		{#each [[totalCost, m.total_cost(), 0], [playerShares.length, m.players_count(), 1], [totalHours, m.total_hours(), 2]] as [value, label, idx], i (i)}
			{@const style = STAT_STYLES[idx as number]}
			<div
				class="stat-card group relative overflow-hidden rounded-xl p-3 bg-white border border-(--border) hover:border-transparent hover:shadow-lg transition-all duration-200"
				style="animation: fadeUp 0.3s ease-out backwards; animation-delay: {i * 0.05}s;"
			>
				<div
					class="stat-icon absolute -right-2 -top-2 w-14 h-14 rounded-xl bg-linear-to-br {style.gradient} opacity-10 group-hover:opacity-20 transition-opacity"
				></div>
				<div class="relative">
					<div class="stat-value text-lg font-bold text-(--ink) leading-tight">
						{#if idx === 0}
							<AnimatedNumber value={value as number} format="compact" />
						{:else}
							<AnimatedNumber value={value as number} format="plain" />
						{/if}
					</div>
					<div
						class="stat-label text-[10px] font-semibold uppercase tracking-wider text-(--ink-muted) mt-0.5"
					>
						{label}
					</div>
				</div>
			</div>
		{/each}
	</div>

	{#if playerShares.length > 0}
		<div class="shares-section space-y-2">
			{#each groupedByHours as [hours, players], groupIndex (hours)}
				{@const isExpanded = expandedGroups.has(hours)}
				{@const colorScheme = getGroupColor(groupIndex)}
				{@const groupShare = players[0]?.share ?? 0}
				<div
					class="group-card animate-slide-in"
					class:is-expanded={isExpanded}
					style="animation-delay: {(groupIndex + 3) * 0.05}s;"
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
									{players.length}
								</span>
								<span class="text-sm text-(--ink-soft)">
									{players.length === 1 ? m.player() : m.players_count()}
								</span>
								<span
									class="text-xs font-mono font-semibold {colorScheme.text} {colorScheme.light} px-1.5 py-0.5 rounded"
								>
									{formatCurrency(groupShare)}
								</span>
							</div>

							{#if !isExpanded}
								<div class="flex items-center gap-1 mt-1">
									<AvatarStack items={getAvatarItems(players)} size="xs" />
								</div>
							{/if}
						</div>

						<div
							class="chevron w-7 h-7 rounded-lg flex items-center justify-center text-(--ink-muted) transition-all duration-300 {isExpanded
								? 'rotate-180 bg-(--slate-100)'
								: ''}"
						>
							<IconChevronDown size={18} stroke={2} />
						</div>
					</button>

					{#if isExpanded}
						<div class="group-content border-t border-(--border) bg-(--slate-50)/50 p-2 space-y-1">
							{#each players as player, playerIndex (player.id)}
								{@const globalIndex = getGlobalIndex(player)}
								{@const displayName = getPlayerDisplayName(player, globalIndex)}
								<div
									class="player-row flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-transparent hover:border-(--border) hover:shadow-sm transition-all duration-150"
									style="animation: slideUp 0.2s ease-out backwards; animation-delay: {playerIndex *
										0.03}s;"
								>
									<div
										class="player-avatar w-8 h-8 text-[11px] ring-2 ring-white shadow-sm {getAvatarColor(
											globalIndex
										)}"
									>
										{getInitial(displayName)}
									</div>

									<div class="flex-1 min-w-0">
										<div class="text-sm font-semibold text-(--ink) truncate">
											{displayName}
										</div>
										<div class="flex items-center gap-2 mt-0.5">
											<span class="text-xs {colorScheme.text} font-semibold">
												{Math.round(player.ratio * 100)}%
											</span>
										</div>
									</div>

									<button
										type="button"
										class="copy-btn flex items-center gap-1.5 h-8 px-2.5 rounded-lg {colorScheme.light} {colorScheme.text} font-mono text-sm font-bold hover:opacity-80 active:scale-95 transition-all"
										onclick={() => copyAmount(player)}
									>
										{#if copiedId === player.id}
											<IconCheck size={14} stroke={2.5} />
										{:else}
											<IconCopy size={14} stroke={2} />
										{/if}
										<span>{formatCurrency(player.share)}</span>
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* === Component-specific styles (shared styles in layout.css) === */
	.live-dot {
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.5;
			transform: scale(0.8);
		}
	}

	.group-header:hover .chevron {
		background: var(--slate-100);
	}

	/* share-group uses .group-card styles from layout.css */
</style>
