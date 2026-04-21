<script lang="ts">
	// ABOUTME: ZaloPay-style modern bill theme component

	import { m } from '$lib/paraglide/messages.js';
	import {
		formatCurrency,
		formatDate,
		groupByKey,
		getNamedPlayers,
		getOthersCount
	} from '$lib/utils';
	import type { AdditionalCost, Player } from '$lib/types';
	import { IconCheck } from '@tabler/icons-svelte-runes';
	import PaymentQR from '../PaymentQR.svelte';
	import { calculatePlayerTimes } from '../Players/playerList.logic';

	const PLAYER_COLORS = [
		'#0033c9',
		'#00cf6a',
		'#6e0cdf',
		'#ff8a00',
		'#00b4ff',
		'#14b8a6',
		'#f43f5e',
		'#8b5cf6'
	];

	type Props = {
		sessionTitle: string;
		sessionDate: string;
		startTime: string | null;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: AdditionalCost[];
		playerShares: Player[];
		totalCost: number;
		showNames: boolean;
		includeQR: boolean;
	};

	let {
		sessionTitle,
		sessionDate,
		startTime,
		courtPrice,
		shuttlecockPrice,
		shuttlecockCount,
		additionalCosts,
		playerShares,
		totalCost,
		showNames,
		includeQR
	}: Props = $props();

	let receiptEl: HTMLDivElement | null = $state(null);

	// Expose getter method to parent
	export function getElement(): HTMLDivElement | null {
		return receiptEl;
	}

	const MAX_VISIBLE_EXTRAS = 6;

	function getPlayerColor(index: number): string {
		return PLAYER_COLORS[index % PLAYER_COLORS.length];
	}

	let totalHours = $derived(playerShares.reduce((sum, p) => sum + (p.hours || 0), 0));
	let paidExtras = $derived(additionalCosts.filter((c) => c.amount > 0));
	let visibleExtras = $derived(paidExtras.slice(0, MAX_VISIBLE_EXTRAS));
	let remainingExtras = $derived(paidExtras.slice(MAX_VISIBLE_EXTRAS));
	let remainingExtrasTotal = $derived(remainingExtras.reduce((sum, c) => sum + c.amount, 0));
	let groupedByHours = $derived(groupByKey(playerShares, (p) => p.hours));
	let shuttlecockTotal = $derived(shuttlecockPrice * shuttlecockCount);
</script>

<div class="zp-receipt animate-pop-in" bind:this={receiptEl}>
	<div class="zp-header">
		<div class="zp-header-left">
			<span class="zp-logo">🏸</span>
			<span class="zp-brand">{m.app_title()}</span>
		</div>
		<div class="zp-status"><IconCheck class="w-3 h-3" />{m.status_done()}</div>
	</div>

	<div class="zp-hero">
		<div class="zp-hero-top">
			<span class="zp-session">{sessionTitle || m.session_fallback()}</span>
			<span class="zp-date">{formatDate(sessionDate)}</span>
		</div>
		<div class="zp-total">{formatCurrency(totalCost)}</div>
		<div class="zp-stats">
			<span>{playerShares.length} {m.players_count()}</span>
			<span class="zp-dot">•</span>
			<span>{totalHours}h</span>
		</div>
	</div>

	<div class="zp-section">
		<div class="zp-section-head">{m.breakdown()}</div>
		{#if courtPrice > 0}
			<div class="zp-row">
				<span>{m.court_fee()}</span>
				<span class="zp-val">{formatCurrency(courtPrice)}</span>
			</div>
		{/if}
		{#if shuttlecockTotal > 0}
			<div class="zp-row">
				<span>{m.shuttlecocks()} ×{shuttlecockCount}</span>
				<span class="zp-val">{formatCurrency(shuttlecockTotal)}</span>
			</div>
		{/if}
		{#each visibleExtras as cost (cost.id)}
			<div class="zp-row">
				<span>{cost.label}</span>
				<span class="zp-val">{formatCurrency(cost.amount)}</span>
			</div>
		{/each}
		{#if remainingExtras.length > 0}
			<div class="zp-row zp-muted">
				<span>{m.more_items({ count: remainingExtras.length })}</span>
				<span class="zp-val">{formatCurrency(remainingExtrasTotal)}</span>
			</div>
		{/if}
	</div>

	<div class="zp-section">
		<div class="zp-section-head">{m.player_shares()}</div>
		{#if showNames}
			{#each playerShares as player, i (player.id)}
				<div class="zp-player">
					<span class="zp-avatar" style="background:{getPlayerColor(i)}"
						>{(player.name?.trim() || `P${i + 1}`).charAt(0).toUpperCase()}</span
					>
					<span class="zp-name">{player.name?.trim() || m.player_numbered({ n: i + 1 })}</span>
					<span class="zp-hrs">{player.hours}h</span>
					<span class="zp-share">{formatCurrency(player.share ?? 0)}</span>
				</div>
			{/each}
		{:else}
			{#each groupedByHours as [hours, players] (hours)}
				{@const groupShare = players[0]?.share ?? 0}
				{@const namedPlayers = getNamedPlayers(players)}
				{@const othersCount = getOthersCount(namedPlayers.length, players.length)}
				{@const minOffset = Math.min(...players.map((p) => p.arrivalOffsetMinutes ?? 0))}
				{@const timeWindow = calculatePlayerTimes(startTime, minOffset, hours)}
				<div class="zp-group">
					<div class="zp-badge-wrap">
						<span class="zp-badge">{hours}h</span>
						{#if timeWindow.arrivalTime}
							<span class="zp-time">{timeWindow.arrivalTime}–{timeWindow.leaveTime}</span>
						{/if}
					</div>
					<div>
						<span class="zp-gcount">{players.length}×</span>
						{#if namedPlayers.length > 0}
							<span class="zp-gnames"
								>{namedPlayers[0]}{#if othersCount > 0}+{othersCount}{/if}</span
							>
						{/if}
						<span class="zp-gshare"
							>{formatCurrency(groupShare)}<small>{m.each_suffix()}</small></span
						>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	{#if includeQR}
		<div class="zp-qr">
			<PaymentQR />
		</div>
	{/if}

	<div class="zp-foot">
		<span>🏸 {m.generated_with()}</span>
		<span>{new Date().toLocaleDateString()}</span>
	</div>
</div>

<style>
	.zp-receipt {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.08),
			0 0 0 1px rgba(0, 0, 0, 0.04);
	}

	.zp-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		background: var(--zp-blue-500);
	}

	.zp-header-left {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.zp-logo {
		font-size: 18px;
	}

	.zp-brand {
		font-size: 14px;
		font-weight: 700;
		color: white;
		letter-spacing: 0.01em;
	}

	.zp-status {
		display: flex;
		align-items: center;
		gap: 3px;
		padding: 3px 8px;
		background: var(--zp-green-500);
		border-radius: 4px;
		color: white;
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}

	.zp-hero {
		padding: 12px;
		text-align: center;
		border-bottom: 1px solid var(--border);
	}

	.zp-hero-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4px;
	}

	.zp-session {
		font-size: 13px;
		font-weight: 600;
		color: var(--ink);
	}

	.zp-date {
		font-size: 11px;
		color: var(--ink-muted);
	}

	.zp-total {
		font-family: 'JetBrains Mono', monospace;
		font-size: 28px;
		font-weight: 700;
		color: var(--zp-blue-600);
		letter-spacing: -0.02em;
		line-height: 1.2;
	}

	.zp-stats {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 6px;
		margin-top: 4px;
		font-size: 11px;
		color: var(--ink-muted);
		font-weight: 500;
	}

	.zp-dot {
		opacity: 0.4;
	}

	.zp-section {
		padding: 10px 12px;
		border-bottom: 1px solid var(--border);
	}

	.zp-section:last-of-type {
		border-bottom: none;
	}

	.zp-section-head {
		font-size: 10px;
		font-weight: 700;
		color: var(--ink-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		margin-bottom: 6px;
	}

	.zp-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 5px 0;
		font-size: 13px;
		color: var(--ink);
	}

	.zp-row.zp-muted {
		color: var(--ink-muted);
	}

	.zp-val {
		font-family: 'JetBrains Mono', monospace;
		font-weight: 600;
		font-size: 12px;
	}

	.zp-player {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 4px 0;
	}

	.zp-avatar {
		width: 22px;
		height: 22px;
		border-radius: 5px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 700;
		color: white;
		flex-shrink: 0;
	}

	.zp-name {
		flex: 1;
		font-size: 13px;
		font-weight: 500;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.zp-hrs {
		font-size: 11px;
		color: var(--ink-muted);
		flex-shrink: 0;
	}

	.zp-share {
		font-family: 'JetBrains Mono', monospace;
		font-size: 12px;
		font-weight: 700;
		color: var(--zp-blue-600);
		flex-shrink: 0;
	}

	.zp-group {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 6px 0;
	}

	.zp-badge-wrap {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.zp-badge {
		padding: 3px 6px;
		background: var(--zp-blue-500);
		color: white;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
	}

	.zp-time {
		font-size: 0.75rem;
		color: var(--ink-muted);
		white-space: nowrap;
	}

	.zp-gcount {
		font-size: 12px;
		font-weight: 600;
		color: var(--ink);
	}

	.zp-gnames {
		flex: 1;
		font-size: 11px;
		color: var(--ink-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.zp-gshare {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		font-weight: 700;
		color: var(--zp-green-600);
		flex-shrink: 0;
	}

	.zp-gshare small {
		font-size: 10px;
		font-weight: 500;
		color: var(--ink-muted);
	}

	.zp-qr {
		padding: 10px 12px;
		border-top: 1px solid var(--border);
	}

	.zp-foot {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
		background: var(--slate-50);
		font-size: 10px;
		color: var(--ink-muted);
	}
</style>
