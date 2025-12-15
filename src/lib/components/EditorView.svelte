<script lang="ts">
	// ABOUTME: Editor view - main form for entering session costs and players
	// ABOUTME: ZaloPay-inspired layout with sticky summary, tabs, and FAB

	import { m } from '$lib/paraglide/messages.js';
	import PlayerList from './PlayerList.svelte';
	import CostInputs from './CostInputs.svelte';
	import LiveSummary from './LiveSummary.svelte';
	import LanguageToggle from './LanguageToggle.svelte';
	import GroupEditor from './Groups/GroupEditor.svelte';
	import type { Player, AdditionalCost, PlayerShare } from '$lib/types';
	import { formatCurrency } from '$lib/utils';
	import {
		IconChevronDown,
		IconShare,
		IconPingPong,
		IconUsers,
		IconClock,
		IconCash,
		IconFileText,
		IconCheck,
		IconTrash
	} from '@tabler/icons-svelte-runes';

	let {
		sessionTitle = $bindable(),
		sessionDate = $bindable(),
		courtHours = $bindable(),
		courtPrice = $bindable(),
		shuttlecockPrice = $bindable(),
		shuttlecockCount = $bindable(),
		additionalCosts = $bindable(),
		players = $bindable(),
		totalCost,
		totalHours,
		playerShares,
		onShare,
		onClear
	}: {
		sessionTitle: string;
		sessionDate: string;
		courtHours: number;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: AdditionalCost[];
		players: Player[];
		totalCost: number;
		totalHours: number;
		playerShares: PlayerShare[];
		onShare: () => void;
		onClear: () => void;
	} = $props();

	let activeTab = $state<'costs' | 'players'>('costs');

	let hasCosts = $derived.by(() => {
		if (courtPrice > 0) return true;
		if (shuttlecockPrice > 0 && shuttlecockCount > 0) return true;
		return additionalCosts.some((c) => (c.amount || 0) > 0);
	});

	let hasPlayers = $derived.by(() => players.length > 0);

	let canShare = $derived.by(() => players.length > 0 && totalCost > 0 && totalHours > 0);

	let costItemCount = $derived.by(() => {
		let count = 0;
		if (courtPrice > 0) count++;
		if (shuttlecockPrice > 0 && shuttlecockCount > 0) count++;
		count += additionalCosts.filter((c) => (c.amount || 0) > 0).length;
		return count;
	});

	let namedPlayersCount = $derived.by(() => {
		return players.filter((p) => p.name?.trim()).length;
	});
</script>

<div class="flex flex-col min-h-dvh bg-(--slate-50)">
	<!-- Compact Header -->
	<header class="compact-header sticky top-0 z-30 bg-white/95 backdrop-blur-md">
		<div class="compact-header-logo text-white"><IconPingPong class="w-5 h-5" /></div>
		<div class="flex-1 min-w-0">
			<input
				type="text"
				bind:value={sessionTitle}
				placeholder={m.session_title_placeholder()}
				class="w-full bg-transparent border-none p-0 text-base font-bold text-(--ink) placeholder:text-(--ink-muted) placeholder:font-normal focus:outline-none focus:ring-0"
			/>
		</div>
		<input
			type="date"
			bind:value={sessionDate}
			class="w-auto bg-transparent border-none p-0 text-sm text-(--ink-soft) focus:outline-none focus:ring-0"
		/>
		<button
			type="button"
			class="btn-icon btn-icon-danger"
			onclick={onClear}
			aria-label="Clear session"
		>
			<IconTrash class="w-5 h-5" />
		</button>
		<LanguageToggle />
	</header>

	<!-- Sticky Summary Bar -->
	<div class="summary-bar mx-4 mt-3 animate-fade-in-up" style="animation-fill-mode: backwards;">
		<div class="summary-bar-content">
			<div class="summary-total">
				<div class="summary-total-label">{m.total_cost()}</div>
				<div class="summary-total-value">{formatCurrency(totalCost)}</div>
			</div>
			<div class="summary-stats">
				<div class="summary-stat">
					<IconUsers class="summary-stat-icon w-4 h-4" />
					<span>{players.length}</span>
				</div>
				<div class="summary-stat">
					<IconClock class="summary-stat-icon w-4 h-4" />
					<span>{totalHours}{m.hours_unit()}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Segment Control -->
	<div class="px-4 pt-4">
		<div class="segment-control animate-fade-in-up delay-1" style="animation-fill-mode: backwards;">
			<button
				type="button"
				class="segment-btn"
				class:is-active={activeTab === 'costs'}
				onclick={() => (activeTab = 'costs')}
			>
				<IconCash class="segment-btn-icon w-5 h-5" />
				<span>{m.costs_heading()}</span>
				{#if costItemCount > 0}
					<span class="segment-btn-badge">{costItemCount}</span>
				{/if}
			</button>
			<button
				type="button"
				class="segment-btn"
				class:is-active={activeTab === 'players'}
				onclick={() => (activeTab = 'players')}
			>
				<IconUsers class="segment-btn-icon w-5 h-5" />
				<span>{m.players_heading()}</span>
				{#if players.length > 0}
					<span class="segment-btn-badge">{players.length}</span>
				{/if}
			</button>
		</div>
	</div>

	<!-- Tab Content -->
	<main class="flex-1 overflow-y-auto pb-28">
		<div class="max-w-lg mx-auto p-4 space-y-4">
			<!-- Costs Tab -->
			<div class="tab-panel" class:is-active={activeTab === 'costs'}>
				<section
					class="section-card p-4 animate-fade-in-up"
					style="animation-fill-mode: backwards;"
				>
					<CostInputs
						bind:courtHours
						bind:courtPrice
						bind:shuttlecockPrice
						bind:shuttlecockCount
						bind:additionalCosts
					/>
				</section>

				{#if hasCosts}
					<div class="flex items-center justify-center gap-2 py-3 text-sm text-(--ink-muted)">
						<IconCheck class="w-4 h-4" />
						<span>{m.costs_heading()} {m.live_calculation().toLowerCase()}</span>
					</div>
				{/if}
			</div>

			<!-- Players Tab -->
			<div class="tab-panel" class:is-active={activeTab === 'players'}>
				<section
					class="section-card p-4 animate-fade-in-up"
					style="animation-fill-mode: backwards;"
				>
					<GroupEditor bind:players defaultHours={courtHours} />
				</section>

				<details class="zp-details mt-4">
					<summary>
						<div class="zp-details-icon"><IconFileText class="w-5 h-5" /></div>
						<div class="zp-details-content">
							<div class="zp-details-title flex items-center gap-2">
								{m.group_details_optional()}
								{#if namedPlayersCount > 0}
									<span class="badge badge-info text-[10px] py-0.5 px-2">
										{namedPlayersCount}
										{m.named()}
									</span>
								{/if}
							</div>
							<div class="zp-details-hint">{m.group_details_hint()}</div>
						</div>
						<IconChevronDown class="zp-details-chevron" />
					</summary>
					<div class="zp-details-body">
						<PlayerList bind:players {courtHours} />
					</div>
				</details>

				<!-- Live Summary (shows when has players) -->
				{#if players.length > 0}
					<section
						class="section-card p-4 mt-4 animate-fade-in-up"
						style="animation-fill-mode: backwards;"
					>
						<LiveSummary {playerShares} {totalCost} {totalHours} />
					</section>
				{/if}
			</div>
		</div>
	</main>

	<!-- Floating Action Button -->
	<button
		class="fab"
		class:fab-pulse={canShare}
		onclick={onShare}
		disabled={!canShare}
		aria-label={m.share_btn()}
	>
		<IconShare class="fab-icon" />
	</button>

	<!-- Progress Pills (bottom indicator) -->
	<div
		class="fixed bottom-0 inset-x-0 px-4 py-3 bg-linear-to-t from-white via-white/90 to-transparent pointer-events-none z-10"
	>
		<div class="max-w-lg mx-auto">
			<div class="progress-pills">
				<div class="progress-pill" class:is-done={hasCosts}></div>
				<div class="progress-pill" class:is-done={hasPlayers}></div>
			</div>
		</div>
	</div>
</div>
