<script lang="ts">
	// ABOUTME: Live summary component - shows real-time calculation of player shares
	// ABOUTME: Displays in the editor view as players and costs are entered

	import { m } from '$lib/paraglide/messages.js';
	import { formatCurrency, getAvatarColor, getInitial } from '$lib/utils';
	import type { PlayerShare } from '$lib/types';

	let {
		playerShares,
		totalCost,
		totalHours
	}: {
		playerShares: PlayerShare[];
		totalCost: number;
		totalHours: number;
	} = $props();

	let toast = $state<string | null>(null);

	function displayName(player: PlayerShare, index: number) {
		return player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 });
	}

	function showToast(text: string) {
		toast = text;
		setTimeout(() => {
			toast = null;
		}, 1200);
	}

	async function copyAmount(amount: number) {
		try {
			await navigator.clipboard.writeText(String(amount));
			showToast(m.copied_to_clipboard());
		} catch {
			showToast(m.copy_failed());
		}
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h2 class="form-label">{m.summary_heading()}</h2>
		<span class="badge badge-paid">{m.live_calculation()}</span>
	</div>

	{#if toast}
		<div class="text-xs text-(--slate-600)">{toast}</div>
	{/if}

	<!-- Stats Grid -->
	<div class="grid grid-cols-3 gap-3">
		<div class="stat-box">
			<div class="stat-value">{formatCurrency(totalCost)}</div>
			<div class="stat-label">{m.total_cost()}</div>
		</div>
		<div class="stat-box">
			<div class="stat-value">{playerShares.length}</div>
			<div class="stat-label">{m.players_count()}</div>
		</div>
		<div class="stat-box">
			<div class="stat-value">{totalHours}</div>
			<div class="stat-label">{m.total_hours()}</div>
		</div>
	</div>

	<!-- Player Shares Table -->
	{#if playerShares.length > 0}
		<div class="rounded-xl border border-(--slate-200) overflow-hidden">
			<div class="bg-(--slate-50) px-4 py-2 border-b border-(--slate-200)">
				<div
					class="grid grid-cols-12 text-xs font-semibold text-(--slate-500) uppercase tracking-wide"
				>
					<div class="col-span-5">{m.player()}</div>
					<div class="col-span-2 text-right">{m.hours()}</div>
					<div class="col-span-2 text-center">{m.ratio()}</div>
					<div class="col-span-3 text-right">{m.amount()}</div>
				</div>
			</div>

			<div class="divide-y divide-(--slate-100)">
				{#each playerShares as player, index (player.id)}
					<div
						class="grid grid-cols-12 items-center px-4 py-3 hover:bg-(--slate-50) transition-colors"
					>
						<div class="col-span-5 flex items-center gap-2">
							<div class="player-avatar w-8 h-8 text-xs {getAvatarColor(index)}">
								{getInitial(displayName(player, index))}
							</div>
							<span class="text-sm font-medium text-(--slate-700) truncate">
								{displayName(player, index)}
							</span>
						</div>
						<div class="col-span-2 text-right font-mono text-sm text-(--slate-600)">
							{player.hours}
						</div>
						<div class="col-span-2 text-center text-xs text-(--slate-400)">
							{Math.round(player.ratio * 100)}%
						</div>
						<button
							type="button"
							class="col-span-3 text-right font-mono text-sm font-bold text-(--court-600) hover:underline"
							onclick={() => copyAmount(player.share)}
						>
							{formatCurrency(player.share)}
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
