<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import AccordionSection from './AccordionSection.svelte';
	import AnimatedNumber from './AnimatedNumber.svelte';
	import CostInputs from './CostInputs.svelte';
	import PlayerList from './PlayerList.svelte';
	import LiveSummary from './LiveSummary.svelte';
	import LanguageToggle from './LanguageToggle.svelte';
	import OnboardingFlow from './OnboardingFlow.svelte';
	import type { Player, ExtraCost } from '$lib/types';
	import { formatCompactNumber, triggerHaptic } from '$lib/utils';
	import { IconPingPong, IconShare, IconTrash } from '@tabler/icons-svelte-runes';

	let {
		sessionTitle = $bindable(),
		sessionDate = $bindable(),
		startTime = $bindable(),
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
		onClear,
		shareUrl = '',
		isGeneratingShare = false
	}: {
		sessionTitle: string;
		sessionDate: string;
		startTime: string | null;
		courtHours: number;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: ExtraCost[];
		players: Player[];
		totalCost: number;
		totalHours: number;
		playerShares: Player[];
		onShare: () => void;
		onClear: () => void;
		shareUrl?: string;
		isGeneratingShare?: boolean;
	} = $props();

	let expandedSection = $state<'costs' | 'players' | 'summary' | null>('costs');
	let isCostsComplete = $derived(totalCost > 0);
	let isPlayersComplete = $derived(players.length > 0 && totalHours > 0);
	let canShare = $derived(isCostsComplete && isPlayersComplete);

	$effect(() => {
		if (isCostsComplete && !isPlayersComplete && expandedSection === 'costs') {
			expandedSection = 'players';
		}
	});

	function toggleSection(section: 'costs' | 'players' | 'summary') {
		expandedSection = expandedSection === section ? null : section;
		triggerHaptic('light');
	}

	let costsBadge = $derived(isCostsComplete ? formatCompactNumber(totalCost) : undefined);
	let playersBadge = $derived(isPlayersComplete ? `${players.length} × ${totalHours}h` : undefined);
</script>

<div class="flex min-h-dvh flex-col bg-surface-muted">
	<header class="compact-header sticky top-0 z-30">
		<div class="compact-header-logo text-white"><IconPingPong class="h-5 w-5" /></div>
		<div class="min-w-0 flex-1">
			<input
				type="text"
				bind:value={sessionTitle}
				placeholder={m.session_title_placeholder()}
				class="w-full bg-transparent border-none p-0 text-base font-semibold tracking-tight text-ink placeholder:font-normal placeholder:text-ink-muted focus:outline-none focus:ring-0"
			/>
			<div class="mt-2 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:hidden">
				<input
					type="date"
					bind:value={sessionDate}
					class="w-full rounded-full bg-surface-muted px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/20"
					aria-label={m.session_info()}
				/>
				<input
					type="time"
					bind:value={startTime}
					class="w-full rounded-full bg-surface-muted px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-primary/20"
					aria-label={m.session_start_time()}
				/>
			</div>
		</div>
		<div class="hidden items-center gap-2 rounded-full bg-surface-muted px-3 py-2 sm:flex">
			<input
				type="date"
				bind:value={sessionDate}
				class="w-auto bg-transparent border-none p-0 text-sm text-ink-soft focus:outline-none focus:ring-0"
				aria-label={m.session_info()}
			/>
			<input
				type="time"
				bind:value={startTime}
				class="w-auto bg-transparent border-none p-0 text-sm text-ink-soft focus:outline-none focus:ring-0"
				aria-label={m.session_start_time()}
			/>
		</div>
		<button
			type="button"
			class="btn-icon btn-icon-danger"
			onclick={onClear}
			aria-label="Clear session"
		>
			<IconTrash class="h-5 w-5" />
		</button>
		<LanguageToggle />
	</header>

	<div class="mx-4 mt-4 summary-bar">
		<div class="summary-bar-content">
			<div class="summary-total">
				<div class="summary-total-label">{m.total_cost()}</div>
				<div class="summary-total-value">
					<AnimatedNumber value={totalCost} format="currency" />
				</div>
			</div>
			<div class="summary-stats">
				<div class="summary-stat">
					<span class="text-sm text-ink-muted lowercase"> {m.players_count()} </span>
					<span class="font-semibold text-lg">{players.length}</span>
				</div>
				<div class="summary-stat">
					<span class="text-sm text-ink-muted"> {m.hours_unit()}</span>
					<span class="font-semibold text-lg">{totalHours}</span>
				</div>
			</div>
		</div>
	</div>

	<main class="flex-1 overflow-y-auto p-4 pb-28">
		<div class="mx-auto max-w-lg space-y-4">
			<AccordionSection
				title={m.costs_heading()}
				subtitle={m.costs_subtitle()}
				isComplete={isCostsComplete}
				isExpanded={expandedSection === 'costs'}
				completeBadge={costsBadge}
				onToggle={() => toggleSection('costs')}
			>
				<CostInputs
					bind:courtHours
					bind:courtPrice
					bind:shuttlecockPrice
					bind:shuttlecockCount
					bind:additionalCosts
				/>
			</AccordionSection>

			<AccordionSection
				title={m.players_heading()}
				subtitle={m.players_subtitle()}
				isComplete={isPlayersComplete}
				isExpanded={expandedSection === 'players'}
				completeBadge={playersBadge}
				onToggle={() => toggleSection('players')}
			>
				<PlayerList bind:players {courtHours} />
			</AccordionSection>

			{#if canShare}
				<AccordionSection
					title={m.summary_heading()}
					subtitle={m.summary_subtitle()}
					isComplete={true}
					isExpanded={expandedSection === 'summary'}
					onToggle={() => toggleSection('summary')}
				>
					<LiveSummary {playerShares} {totalCost} {totalHours} {shareUrl} {isGeneratingShare} />
				</AccordionSection>
			{/if}
		</div>
	</main>

	<div
		class="fixed inset-x-0 bottom-0 z-20 bg-linear-to-t from-white via-white/96 to-transparent p-4 backdrop-blur-sm"
	>
		<div class="mx-auto max-w-lg">
			{#if !canShare}
				<div class="mb-2 text-center text-sm text-ink-muted">
					{#if !isCostsComplete}
						{m.share_hint_add_costs()}
					{:else if !isPlayersComplete}
						{m.share_hint_add_hours()}
					{/if}
				</div>
			{/if}
			<button class="btn-primary h-14 w-full text-base" onclick={onShare} disabled={!canShare}>
				<IconShare class="h-5 w-5" />
				{m.share_btn()}
			</button>
		</div>
	</div>

	<!-- <OnboardingFlow /> -->
</div>
