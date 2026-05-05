<script lang="ts">
	// ABOUTME: Thermal receipt-style bill theme component

	import { m } from '$lib/paraglide/messages.js';
	import {
		formatCurrency,
		formatDate,
		getNamedPlayers,
		getOthersCount,
		groupByKey
	} from '$lib/utils';
	import type { ExtraCost, Player, Group, CourtBlock } from '$lib/types';
	import { computeShares } from '$lib/utils/share-calc';
	import PaymentQR from '../PaymentQR.svelte';
	import { calculatePlayerTimes } from '../Players/playerList.logic';

	type Props = {
		sessionTitle: string;
		sessionDate: string;
		startTime: string | null;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: ExtraCost[];
		playerShares: Player[];
		totalCost: number;
		showNames: boolean;
		includeQR: boolean;
		groups?: Group[];
		courtBlocks?: CourtBlock[];
		extraCosts?: ExtraCost[];
		shareResults?: { entryId: string; name: string; ratio: number; total: number; playerMinutes: number; courtShare: number; extraShare: number }[];
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
		includeQR,
		groups,
		courtBlocks,
		extraCosts,
		shareResults
	}: Props = $props();

	let receiptEl: HTMLDivElement | null = $state(null);

	// Expose getter method to parent
	export function getElement(): HTMLDivElement | null {
		return receiptEl;
	}

	const MAX_VISIBLE_EXTRAS = 6;

	// Compute shares from groups if provided
	type CompatPlayer = { entryId: string; name: string; hours: number; arrivalOffsetMinutes: number; share: number; playerMinutes?: number; courtShare?: number; extraShare?: number; total?: number; };
	const computedShares = $derived(
		shareResults ?? (groups?.length && courtBlocks?.length
			? computeShares(groups, courtBlocks, extraCosts ?? [])
			: [])
	);
	const compatShares = $derived<CompatPlayer[]>(
		computedShares.length > 0
			? computedShares.map((s) => ({
					entryId: s.entryId,
					name: s.name,
					hours: Math.round(s.playerMinutes / 60 * 10) / 10,
					arrivalOffsetMinutes: 0,
					share: s.courtShare + s.extraShare,
					playerMinutes: s.playerMinutes,
					courtShare: s.courtShare,
					extraShare: s.extraShare,
					total: s.total
				}))
			: []
	);
	const displayShares = $derived<CompatPlayer[]>(
		computedShares.length > 0 ? compatShares : (playerShares as unknown as CompatPlayer[])
	);
	const compatGroupedByHours = $derived.by((): [number, CompatPlayer[]][] => {
		if (computedShares.length === 0) return [];
		const groups: Record<number, CompatPlayer[]> = {};
		for (const s of computedShares) {
			const hours = Math.round((s.playerMinutes / 60) * 10) / 10;
			if (!groups[hours]) groups[hours] = [];
			groups[hours].push({
				entryId: s.entryId,
				name: s.name,
				hours,
				arrivalOffsetMinutes: 0,
				share: s.courtShare + s.extraShare,
				playerMinutes: s.playerMinutes,
				courtShare: s.courtShare,
				extraShare: s.extraShare,
				total: s.total
			});
		}
		return Object.entries(groups)
			.map(([k, v]) => [Number(k), v] as [number, CompatPlayer[]])
			.sort((a, b) => b[0] - a[0]);
	});

	let groupedByHours = $derived(groupByKey(playerShares, (p: Player) => p.hours));
	let shuttlecockTotal = $derived(shuttlecockPrice * shuttlecockCount);

	const compatTotalHours = $derived(
		computedShares.length > 0
			? computedShares.reduce((sum, s) => sum + s.playerMinutes, 0) / 60
			: 0
	);
	let totalHours = $derived(
		computedShares.length > 0
			? compatTotalHours
			: playerShares.reduce((sum, p) => sum + (p.hours || 0), 0)
	);
	let paidExtras = $derived(additionalCosts.filter((c) => c.amount > 0));
	let visibleExtras = $derived(paidExtras.slice(0, MAX_VISIBLE_EXTRAS));
	let remainingExtras = $derived(paidExtras.slice(MAX_VISIBLE_EXTRAS));
	let remainingExtrasTotal = $derived(remainingExtras.reduce((sum, c) => sum + c.amount, 0));
</script>

<div class="thermal-receipt animate-pop-in" bind:this={receiptEl}>
	<div class="torn-edge torn-top"></div>

	<div class="thermal-paper">
		<div class="scratches"></div>

		<div class="receipt-store">
			<div class="store-logo">🏸</div>
			<div class="store-name">{m.app_title()}</div>
			<div class="store-tagline">{m.app_tagline()}</div>
		</div>

		<div class="receipt-line-double"></div>

		<div class="receipt-section">
			<div class="receipt-title">{sessionTitle || m.session_fallback()}</div>
			<div class="receipt-meta">
				<span>{formatDate(sessionDate)}</span>
				<span>{m.thermal_stats({ count: playerShares.length, hours: totalHours })}</span>
			</div>
		</div>

		<div class="receipt-line-dashed"></div>

		<div class="receipt-section">
			<div class="receipt-heading">{m.breakdown().toUpperCase()}</div>

			<div class="receipt-items">
				{#if courtPrice > 0}
					<div class="receipt-item">
						<span>{m.court_fee()}</span>
						<span class="dots"></span>
						<span>{formatCurrency(courtPrice)}</span>
					</div>
				{/if}
				{#if shuttlecockTotal > 0}
					<div class="receipt-item">
						<span>{m.shuttlecocks()} x{shuttlecockCount}</span>
						<span class="dots"></span>
						<span>{formatCurrency(shuttlecockTotal)}</span>
					</div>
				{/if}
				{#each visibleExtras as cost (cost.id)}
					<div class="receipt-item">
						<span>{cost.label}</span>
						<span class="dots"></span>
						<span>{formatCurrency(cost.amount)}</span>
					</div>
				{/each}
				{#if remainingExtras.length > 0}
					<div class="receipt-item muted">
						<span>{m.more_items({ count: remainingExtras.length })}</span>
						<span class="dots"></span>
						<span>{formatCurrency(remainingExtrasTotal)}</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="receipt-line-dashed"></div>

		<div class="receipt-total">
			<span>{m.total_cost().toUpperCase()}</span>
			<span>{formatCurrency(totalCost)}</span>
		</div>

		<div class="receipt-line-double"></div>

		<div class="receipt-section">
			<div class="receipt-heading">{m.player_shares().toUpperCase()}</div>

			{#if showNames}
				{#each displayShares as player, i (player.entryId)}
					<div class="receipt-item">
						<span>{player.name?.trim() || m.player_numbered({ n: i + 1 })}</span>
						<span class="dots"></span>
						<span>{formatCurrency(player.share ?? 0)}</span>
					</div>
				{/each}
			{:else}
				{#each compatGroupedByHours as [hours, players] (hours)}
					{@const groupShare = players[0]?.share ?? 0}
					{@const namedPlayers = getNamedPlayers(players)}
					{@const othersCount = getOthersCount(namedPlayers.length, players.length)}
					{@const minOffset = Math.min(...players.map((p: CompatPlayer) => p.arrivalOffsetMinutes ?? 0))}
					{@const timeWindow = calculatePlayerTimes(startTime, minOffset, hours)}

					<div class="player-group">
						<div class="group-header">
							<span class="group-hours">[{hours}h]</span>
							{#if timeWindow.arrivalTime}
								<span class="group-time">{timeWindow.arrivalTime}–{timeWindow.leaveTime}</span>
							{/if}
							<span class="group-count">{players.length}x</span>
							<span class="dots"></span>
							<span class="group-amount"
								>{formatCurrency(groupShare)} {m.each_suffix()}
							</span>
						</div>
						{#if namedPlayers.length > 0}
							<div class="group-names">
								{namedPlayers[0]}{#if othersCount > 0}, {m.and_others({
										count: othersCount
									})}{/if}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>

		<div class="receipt-line-dashed"></div>

		<div class="receipt-footer">
			<div class="barcode">
				{#each [2, 1, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1] as width, idx (idx)}
					<div class="bar" style="width: {width}px; height: 22px"></div>
				{/each}
			</div>
			<div class="footer-text">
				{m.generated_with()}
			</div>
			<div class="footer-date">
				{new Date().toLocaleString()}
			</div>
		</div>

		{#if includeQR}
			<div class="receipt-line-dashed"></div>

			<PaymentQR />
		{/if}
	</div>

	<div class="torn-edge torn-bottom"></div>
</div>

<style>
	.thermal-receipt {
		position: relative;
		filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
	}

	.thermal-paper {
		position: relative;
		background:
			url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E"),
			linear-gradient(180deg, #fdfcf8 0%, #f9f7f1 20%, #f7f5ed 50%, #f5f3e9 80%, #f2f0e4 100%);
		background-blend-mode: soft-light, normal;
		padding: 16px 16px;
		font-family: 'JetBrains Mono', 'Courier New', monospace;
		color: #2d2a26;
		overflow: hidden;
	}

	.scratches {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.08;
		background-image:
			linear-gradient(90deg, transparent 0%, transparent 70%, #8b8680 70.5%, transparent 71%),
			linear-gradient(90deg, transparent 20%, #8b8680 20.3%, transparent 20.6%),
			linear-gradient(85deg, transparent 40%, #8b8680 40.2%, transparent 40.4%),
			linear-gradient(92deg, transparent 60%, #8b8680 60.1%, transparent 60.3%),
			linear-gradient(180deg, transparent 30%, #8b8680 30.2%, transparent 30.4%),
			linear-gradient(178deg, transparent 55%, #8b8680 55.1%, transparent 55.3%),
			linear-gradient(182deg, transparent 75%, #8b8680 75.2%, transparent 75.5%);
		background-size:
			100% 3px,
			100% 5px,
			100% 4px,
			100% 6px,
			2px 100%,
			3px 100%,
			2px 100%;
		background-position:
			0 15%,
			0 45%,
			0 70%,
			0 88%,
			12% 0,
			67% 0,
			89% 0;
	}

	.torn-edge {
		height: 12px;
		background: #f9f7f1;
		position: relative;
	}

	.torn-top {
		clip-path: polygon(
			0% 100%,
			2% 60%,
			4% 100%,
			6% 50%,
			8% 100%,
			10% 70%,
			12% 100%,
			14% 40%,
			16% 100%,
			18% 65%,
			20% 100%,
			22% 55%,
			24% 100%,
			26% 45%,
			28% 100%,
			30% 70%,
			32% 100%,
			34% 50%,
			36% 100%,
			38% 60%,
			40% 100%,
			42% 45%,
			44% 100%,
			46% 55%,
			48% 100%,
			50% 65%,
			52% 100%,
			54% 40%,
			56% 100%,
			58% 70%,
			60% 100%,
			62% 50%,
			64% 100%,
			66% 60%,
			68% 100%,
			70% 45%,
			72% 100%,
			74% 55%,
			76% 100%,
			78% 65%,
			80% 100%,
			82% 50%,
			84% 100%,
			86% 70%,
			88% 100%,
			90% 55%,
			92% 100%,
			94% 45%,
			96% 100%,
			98% 60%,
			100% 100%
		);
	}

	.torn-bottom {
		clip-path: polygon(
			0% 0%,
			2% 40%,
			4% 0%,
			6% 50%,
			8% 0%,
			10% 30%,
			12% 0%,
			14% 60%,
			16% 0%,
			18% 35%,
			20% 0%,
			22% 45%,
			24% 0%,
			26% 55%,
			28% 0%,
			30% 30%,
			32% 0%,
			34% 50%,
			36% 0%,
			38% 40%,
			40% 0%,
			42% 55%,
			44% 0%,
			46% 45%,
			48% 0%,
			50% 35%,
			52% 0%,
			54% 60%,
			56% 0%,
			58% 30%,
			60% 0%,
			62% 50%,
			64% 0%,
			66% 40%,
			68% 0%,
			70% 55%,
			72% 0%,
			74% 45%,
			76% 0%,
			78% 35%,
			80% 0%,
			82% 50%,
			84% 0%,
			86% 30%,
			88% 0%,
			90% 45%,
			92% 0%,
			94% 55%,
			96% 0%,
			98% 40%,
			100% 0%
		);
	}

	.receipt-store {
		text-align: center;
		margin-bottom: 10px;
	}

	.store-logo {
		font-size: 28px;
		margin-bottom: 2px;
	}

	.store-name {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: 0.15em;
		text-transform: uppercase;
	}

	.store-tagline {
		font-size: 9px;
		letter-spacing: 0.2em;
		color: #6b6560;
		margin-top: 4px;
	}

	.receipt-line-double {
		border-top: 2px double #8b8680;
		margin: 8px 0;
	}

	.receipt-line-dashed {
		border-top: 1px dashed #a8a39d;
		margin: 8px 0;
	}

	.receipt-section {
		margin: 4px 0;
	}

	.receipt-title {
		font-size: 14px;
		font-weight: 600;
		text-align: center;
		margin-bottom: 4px;
	}

	.receipt-meta {
		display: flex;
		justify-content: space-between;
		font-size: 11px;
		color: #6b6560;
	}

	.receipt-heading {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #6b6560;
		margin-bottom: 4px;
	}

	.receipt-items {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.receipt-item {
		display: flex;
		align-items: baseline;
		font-size: 12px;
		line-height: 1.4;
	}

	.receipt-item.muted {
		color: #8b8680;
	}

	.receipt-item span:first-child {
		flex-shrink: 0;
		max-width: 60%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.receipt-item span:last-child {
		flex-shrink: 0;
		font-weight: 600;
	}

	.dots {
		flex: 1;
		border-bottom: 1px dotted #c4c0ba;
		margin: 0 6px 4px;
		min-width: 20px;
	}

	.receipt-total {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 16px;
		font-weight: 700;
		padding: 4px 0;
	}

	.player-group {
		margin-bottom: 6px;
	}

	.group-header {
		display: flex;
		align-items: baseline;
		font-size: 12px;
	}

	.group-hours {
		font-weight: 700;
		color: #4a4640;
		margin-right: 6px;
	}

	.group-time {
		font-size: 10px;
		color: #8b8680;
		margin-right: 6px;
	}

	.group-count {
		color: #6b6560;
	}

	.group-amount {
		font-weight: 600;
		flex-shrink: 0;
	}

	.group-names {
		font-size: 10px;
		color: #8b8680;
		margin-left: 42px;
		margin-top: 2px;
		font-style: italic;
	}

	.barcode {
		display: flex;
		justify-content: center;
		align-items: flex-end;
		gap: 1px;
		height: 28px;
		margin: 10px auto 6px;
		opacity: 0.7;
	}

	.bar {
		background: #2d2a26;
		flex-shrink: 0;
	}

	.receipt-footer {
		text-align: center;
	}

	.footer-text {
		font-size: 10px;
		color: #8b8680;
		margin-bottom: 2px;
	}

	.footer-date {
		font-size: 9px;
		color: #a8a39d;
	}

	.thermal-paper::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse 120% 80% at 50% 50%,
			transparent 0%,
			transparent 70%,
			rgba(139, 134, 128, 0.05) 100%
		);
	}

	.thermal-paper::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.03;
		background-image:
			radial-gradient(circle at 15% 25%, #2d2a26 0%, transparent 8%),
			radial-gradient(circle at 85% 40%, #2d2a26 0%, transparent 6%),
			radial-gradient(circle at 45% 75%, #2d2a26 0%, transparent 10%),
			radial-gradient(circle at 70% 85%, #2d2a26 0%, transparent 5%);
	}
</style>
