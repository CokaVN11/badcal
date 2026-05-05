<script lang="ts">
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import { Button } from '$lib/components/ui/button';
	import { IconArrowLeft, IconArrowRight } from '@tabler/icons-svelte-runes';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';
	import { createOrReuseSession, type CourtBlockPayload, type GroupPayload, type ExtraCostPayload } from '$lib/api/sharing';
	import type { Group } from '$lib/types';

	import SessionInfoForm from './components/SessionInfoForm.svelte';
	import CourtScheduleSection from './components/CourtScheduleSection.svelte';
	import ExtraCostsSection from './components/ExtraCostsSection.svelte';
	import AssetOverview from '../details/components/AssetOverview.svelte';
	import PlayerGroupsSection from '../details/components/PlayerGroupsSection.svelte';

	const DEFAULT_TIME_RANGE = { startTime: '19:00', endTime: '21:00' };

	let saving = $state(false);

	// Initialize defaults on mount if empty
	if ((sessionStorage.courtBlocks?.length ?? 0) === 0) {
		sessionStorage.courtBlocks = [
			{
				id: crypto.randomUUID(),
				courtCount: 1,
				startTime: '19:00',
				endTime: '21:00',
				pricePerHour: 110
			}
		];
	}
	if ((sessionStorage.extraCosts?.length ?? 0) === 0) {
		sessionStorage.extraCosts = [{ id: crypto.randomUUID(), label: 'Shuttlecock', amount: 0 }];
	}

	let currentStep = $state<'info' | 'players'>('info');
	let groups = $state<Group[]>(
		sessionStorage.groups?.length > 0
			? [...sessionStorage.groups]
			: [{ id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] }]
	);

	$effect(() => {
		sessionStorage.groups = groups;
	});

	// Step validation
	let isStep1Valid = $derived(
		(sessionStorage.title ?? '').trim().length > 0 && (sessionStorage.date ?? '').length > 0 && (sessionStorage.courtBlocks?.length ?? 0) > 0 &&
			sessionStorage.courtBlocks.every((b) => b.courtCount >= 1 && b.pricePerHour > 0)
	);

	let isStep2Valid = $derived(groups.some((g) => g.playerNames.length > 0));

	// Navigation
	function nextStep() {
		if (currentStep === 'info') currentStep = 'players';
	}
	function prevStep() {
		if (currentStep === 'players') currentStep = 'info';
	}

	// Step indicator
	let stepNumber = $derived(currentStep === 'info' ? 1 : 2);

	// Step titles
	let stepTitle = $derived(
		currentStep === 'info'
			? m.onboarding_step1_title()
			: m.onboarding_step2_title()
	);

	// PlayerGroupsSection callbacks
	function onAddGroup() {
		groups = [...groups, { id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] }];
	}
	function onRemoveGroup(id: string) {
		groups = groups.filter((g) => g.id !== id);
	}
	function onBulkAdd(groupId: string, names: string[]) {
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: [...g.playerNames, ...names] } : g
		);
	}
	function onRemovePlayer(groupId: string, nameIndex: number) {
		groups = groups.map((g) => {
			if (g.id !== groupId) return g;
			const playerNames = g.playerNames.filter((_, i) => i !== nameIndex);
			return { ...g, playerNames };
		});
	}
	function onUpdateGroup(
		id: string,
		updates: Partial<Pick<Group, 'startTime' | 'endTime'>>
	) {
		groups = groups.map((g) => (g.id === id ? { ...g, ...updates } : g));
	}

	async function handleSaveAndShare() {
		if (!isStep2Valid || saving) return;
		saving = true;
		try {
			const courtBlockPayloads: CourtBlockPayload[] = sessionStorage.courtBlocks.map((b) => ({
				courtCount: b.courtCount,
				startTime: b.startTime,
				endTime: b.endTime,
				pricePerHour: b.pricePerHour
			}));
			const groupPayloads: GroupPayload[] = groups.map((g) => ({
				startTime: g.startTime,
				endTime: g.endTime,
				playerNames: g.playerNames
			}));
			const extraCostPayloads: ExtraCostPayload[] = sessionStorage.extraCosts.map((c) => ({
				label: c.label,
				amount: c.amount
			}));

			const result = await createOrReuseSession({
				title: sessionStorage.title,
				date: sessionStorage.date,
				courtBlocks: courtBlockPayloads,
				groups: groupPayloads,
				extraCosts: extraCostPayloads
			});

			sessionStorage.groups = [];
			sessionStorage.courtBlocks = [];
			await goto(`/s/${result.id}`);
		} catch {
			toast.error('Failed to create session');
		} finally {
			saving = false;
		}
	}
</script>

<!-- Header with back button and step indicator -->
<header
	class="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-white shadow-[0px_2px_8px_rgba(0,0,0,0.04)]"
>
	<div class="flex items-center gap-3">
		<Button
			size="icon"
			variant="ghost"
			aria-label="Go back"
			class="p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-colors"
			onclick={() => history.back()}
		>
			<IconArrowLeft size={16} class="text-on-surface" />
		</Button>
		<div class="flex flex-col">
			<h1 class="text-on-surface text-xl font-semibold">{stepTitle}</h1>
			<span class="text-label-sm text-outline">Step {stepNumber} of 2</span>
		</div>
	</div>
</header>

<!-- Content area -->
<div class="pb-24 px-6 pt-20 max-w-2xl mx-auto w-full gap-6 flex flex-col">
	{#if currentStep === 'info'}
		<SessionInfoForm />
		<CourtScheduleSection />
		<ExtraCostsSection />
		<AssetOverview />
	{:else if currentStep === 'players'}
		<PlayerGroupsSection
			{groups}
			{onAddGroup}
			{onRemoveGroup}
			{onBulkAdd}
			{onRemovePlayer}
			{onUpdateGroup}
		/>
	{/if}
</div>

<!-- Bottom navigation -->
<div
	class="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant/30 px-4 py-4 flex gap-3"
>
	{#if currentStep !== 'info'}
		<Button variant="outline" onclick={prevStep} class="flex-1" disabled={saving}>
			<IconArrowLeft size={16} />
			Back
		</Button>
	{/if}
	<Button
		onclick={currentStep === 'players' ? handleSaveAndShare : nextStep}
		disabled={saving || (currentStep === 'info'
			? !isStep1Valid
				: !isStep2Valid)}
		class="flex-1"
	>
		{currentStep === 'players' ? (saving ? 'Saving...' : 'Finish') : 'Next'}
		{#if currentStep !== 'players'}
			<IconArrowRight size={16} />
		{/if}
	</Button>
</div>
