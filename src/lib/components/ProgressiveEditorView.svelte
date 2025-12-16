<script lang="ts">
	// ABOUTME: Progressive disclosure editor with accordion sections
	// ABOUTME: Auto-advances when each section is complete

	import { m } from '$lib/paraglide/messages.js';
	import AccordionSection from './AccordionSection.svelte';
	import CostInputs from './CostInputs.svelte';
	import GroupEditor from './Groups/GroupEditor.svelte';
	import PlayerList from './PlayerList.svelte';
	import LiveSummary from './LiveSummary.svelte';
	import LanguageToggle from './LanguageToggle.svelte';
	import OnboardingFlow from './OnboardingFlow.svelte';
	import type { Player, AdditionalCost, PlayerShare } from '$lib/types';
	import { formatCompactNumber, formatCurrency } from '$lib/utils';
	import {
		IconPingPong,
		IconShare,
		IconTrash,
		IconChevronDown,
		IconFileText
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

	// Section expansion state
	let expandedSection = $state<'costs' | 'players' | 'summary' | null>('costs');

	// Completion checks
	let isCostsComplete = $derived(totalCost > 0);
	let isPlayersComplete = $derived(players.length > 0 && totalHours > 0);
	let canShare = $derived(isCostsComplete && isPlayersComplete);

	// Auto-advance logic
	$effect(() => {
		if (isCostsComplete && !isPlayersComplete && expandedSection === 'costs') {
			// Auto-expand players when costs done
			expandedSection = 'players';
		}
	});

	// Toggle functions
	function toggleSection(section: 'costs' | 'players' | 'summary') {
		expandedSection = expandedSection === section ? null : section;
	}

	// Derived display values
	let costsBadge = $derived(isCostsComplete ? formatCompactNumber(totalCost) : undefined);
	let playersBadge = $derived(isPlayersComplete ? `${players.length} × ${totalHours}h` : undefined);
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
			aria-label={m.session_info()}
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
	<div class="summary-bar mx-4 mt-3">
		<div class="summary-bar-content">
			<div class="summary-total">
				<div class="summary-total-label">{m.total_cost()}</div>
				<div class="summary-total-value">{formatCurrency(totalCost)}</div>
			</div>
			<div class="summary-stats">
				<div class="summary-stat">
					<span>{players.length} {m.players_count()}</span>
				</div>
				<div class="summary-stat">
					<span>{totalHours}{m.hours_unit()}</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Main Content: Accordion Sections -->
	<main class="flex-1 overflow-y-auto pb-28 p-4">
		<div class="max-w-lg mx-auto space-y-3">
			<!-- Step 1: Costs -->
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

			<!-- Step 2: Players -->
			<AccordionSection
				title={m.players_heading()}
				subtitle={m.players_subtitle()}
				isComplete={isPlayersComplete}
				isExpanded={expandedSection === 'players'}
				completeBadge={playersBadge}
				onToggle={() => toggleSection('players')}
			>
				<div class="space-y-4">
					<GroupEditor bind:players defaultHours={courtHours} />

					<!-- Optional Details Accordion -->
					<details class="zp-details">
						<summary>
							<div class="zp-details-icon"><IconFileText class="w-5 h-5" /></div>
							<div class="zp-details-content">
								<div class="zp-details-title">{m.group_details_optional()}</div>
								<div class="zp-details-hint">{m.group_details_hint()}</div>
							</div>
							<IconChevronDown class="zp-details-chevron" />
						</summary>
						<div class="zp-details-body">
							<PlayerList bind:players {courtHours} />
						</div>
					</details>
				</div>
			</AccordionSection>

			<!-- Step 3: Summary (auto-visible when ready) -->
			{#if canShare}
				<AccordionSection
					title={m.summary_heading()}
					subtitle={m.summary_subtitle()}
					isComplete={true}
					isExpanded={expandedSection === 'summary'}
					onToggle={() => toggleSection('summary')}
				>
					<LiveSummary {playerShares} {totalCost} {totalHours} />
				</AccordionSection>
			{/if}
		</div>
	</main>

	<!-- Bottom CTA Bar (replaces FAB) -->
	<div class="fixed bottom-0 inset-x-0 p-4 bg-linear-to-t from-white via-white to-transparent z-20">
		<div class="max-w-lg mx-auto">
			{#if !canShare}
				<div class="text-center text-sm text-(--ink-muted) mb-2">
					{#if !isCostsComplete}
						{m.share_hint_add_costs()}
					{:else if !isPlayersComplete}
						{m.share_hint_add_hours()}
					{/if}
				</div>
			{/if}
			<button class="btn-primary w-full h-14 text-base" onclick={onShare} disabled={!canShare}>
				<IconShare class="w-5 h-5" />
				{m.share_btn()}
			</button>
		</div>
	</div>

	<!-- First-time user onboarding -->
	<OnboardingFlow />
</div>
