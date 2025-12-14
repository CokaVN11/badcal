<script lang="ts">
	// ABOUTME: Editor view - main form for entering session costs and players
	// ABOUTME: Contains cost inputs, player list, and live calculation summary

	import { m } from '$lib/paraglide/messages.js';
	import PlayerList from './PlayerList.svelte';
	import CostInputs from './CostInputs.svelte';
	import LiveSummary from './LiveSummary.svelte';
	import LanguageToggle from './LanguageToggle.svelte';
	import type { Player, AdditionalCost, PlayerShare } from '$lib/types';

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
		onShare
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
	} = $props();

	let hasTitle = $derived.by(() => sessionTitle.trim().length > 0);
	let hasCosts = $derived.by(() => {
		if (courtPrice > 0) return true;
		if (shuttlecockPrice > 0 && shuttlecockCount > 0) return true;
		return additionalCosts.some((c) => (c.amount || 0) > 0);
	});
	let hasPlayers = $derived.by(() => players.length > 0);
	let progressRatio = $derived.by(() => {
		const stepsDone = [hasTitle, hasCosts, hasPlayers].filter(Boolean).length;
		return stepsDone / 3;
	});

	let canShare = $derived.by(() => players.length > 0 && totalCost > 0 && totalHours > 0);

	let shareHint = $derived.by(() => {
		if (players.length === 0) return m.add_players_hint();
		if (totalHours === 0) return m.share_hint_add_hours();
		if (totalCost === 0) return m.share_hint_add_costs();
		return m.share_ready();
	});

	let sessionInfoEl: HTMLElement | null = $state(null);
	let costsEl: HTMLElement | null = $state(null);
	let playersEl: HTMLElement | null = $state(null);

	function scrollToSection(el: HTMLElement | null) {
		el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<div class="flex flex-col min-h-dvh">
	<!-- Header -->
	<header class="bg-white border-b border-(--slate-200) px-4 py-3 sticky top-0 z-30">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<div
				class="w-10 h-10 rounded-xl bg-linear-to-br from-(--court-500) to-(--court-600) flex items-center justify-center text-xl shadow-md"
			>
				🏸
			</div>
			<div class="flex-1 min-w-0">
				<h1 class="text-lg font-bold text-(--slate-800)">
					{m.app_title()}
				</h1>
				<p class="text-xs text-(--slate-500)">
					{m.web_description()}
				</p>
			</div>
			<LanguageToggle />
		</div>
	</header>

	<!-- Scrollable Content -->
	<main class="flex-1 overflow-y-auto pb-28">
		<div class="max-w-lg mx-auto p-4 space-y-4">
			<section class="quest-card animate-fade-in-up" style="animation-fill-mode: backwards;">
				<div class="quest-steps">
					<button
						type="button"
						class="quest-step"
						class:is-done={hasTitle}
						onclick={() => scrollToSection(sessionInfoEl)}
					>
						<div class="quest-dot">{hasTitle ? '✓' : '1'}</div>
						<div class="quest-label">{m.session_info()}</div>
					</button>
					<button
						type="button"
						class="quest-step"
						class:is-done={hasCosts}
						onclick={() => scrollToSection(costsEl)}
					>
						<div class="quest-dot">{hasCosts ? '✓' : '2'}</div>
						<div class="quest-label">{m.costs_heading()}</div>
					</button>
					<button
						type="button"
						class="quest-step"
						class:is-done={hasPlayers}
						onclick={() => scrollToSection(playersEl)}
					>
						<div class="quest-dot">{hasPlayers ? '✓' : '3'}</div>
						<div class="quest-label">{m.players_heading()}</div>
					</button>
				</div>

				<div class="quest-bar">
					<div class="quest-bar-fill" style:width={`${Math.round(progressRatio * 100)}%`}></div>
				</div>
			</section>

			<!-- Session Info -->
			<section
				class="section-card p-4 animate-fade-in-up scroll-target"
				style="animation-fill-mode: backwards;"
				bind:this={sessionInfoEl}
			>
				<h2 class="form-label mb-3">{m.session_info()}</h2>
				<div class="space-y-3">
					<input
						type="text"
						bind:value={sessionTitle}
						placeholder={m.session_title_placeholder()}
						class="form-input"
					/>
					<input type="date" bind:value={sessionDate} class="form-input" />
				</div>
			</section>

			<!-- Cost Inputs -->
			<section
				class="section-card p-4 animate-fade-in-up delay-1 scroll-target"
				style="animation-fill-mode: backwards;"
				bind:this={costsEl}
			>
				<CostInputs
					bind:courtHours
					bind:courtPrice
					bind:shuttlecockPrice
					bind:shuttlecockCount
					bind:additionalCosts
				/>
			</section>

			<!-- Players -->
			<section
				class="section-card p-4 animate-fade-in-up delay-2 scroll-target"
				style="animation-fill-mode: backwards;"
				bind:this={playersEl}
			>
				<PlayerList bind:players {courtHours} />
			</section>

			<!-- Live Summary -->
			{#if players.length > 0}
				<section
					class="section-card p-4 animate-fade-in-up delay-3"
					style="animation-fill-mode: backwards;"
				>
					<LiveSummary {playerShares} {totalCost} {totalHours} />
				</section>
			{/if}
		</div>
	</main>

	<!-- Fixed Bottom Action -->
	<footer
		class="fixed inset-x-0 bottom-0 p-4 bg-linear-to-t from-white via-white to-transparent z-20"
	>
		<div class="max-w-lg mx-auto">
			<p class="text-xs text-(--slate-500) mb-2">{shareHint}</p>
			<button class="btn-primary w-full h-14 text-base" onclick={onShare} disabled={!canShare}>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
					/>
				</svg>
				{m.share_btn()}
			</button>
		</div>
	</footer>
</div>
