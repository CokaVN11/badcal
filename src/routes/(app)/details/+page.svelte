<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import { toast } from 'svelte-sonner';
	import { createOrReuseSession, type CourtBlockPayload, type GroupPayload, type ExtraCostPayload } from '$lib/api/sharing';
	import type { Group } from '$lib/types';

	import AssetOverview from './components/AssetOverview.svelte';
	import PlayerGroupsSection from './components/PlayerGroupsSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import { IconArrowLeft } from '@tabler/icons-svelte-runes';

	const layout = getContext<{ setReady: (v: boolean) => void; saving: boolean; setSaving: (v: boolean) => void }>('layout');

	onMount(() => {
		if ((sessionStorage.courtBlocks?.length ?? 0) === 0) {
			goto('/create');
		}
	});

	const DEFAULT_TIME_RANGE = { startTime: '19:00', endTime: '21:00' };

	let groups = $state<Group[]>(
		(sessionStorage.groups?.length ?? 0) > 0
			? [...sessionStorage.groups]
			: [{ id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] }]
	);

	let saving = $state(false);

	$effect(() => {
		sessionStorage.groups = groups;
	});

	let isValid = $derived(groups.some((g) => g.playerNames.length > 0));

	$effect(() => {
		layout.setReady(isValid);
	});

	function addGroup() {
		const newGroup = { id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] };
		groups = [...groups, newGroup];
	}

	function removeGroup(id: string) {
		groups = groups.filter((g) => g.id !== id);
		if (groups.length === 0) {
			groups = [{ id: crypto.randomUUID(), ...DEFAULT_TIME_RANGE, playerNames: [] }];
		}
	}

	function bulkAdd(groupId: string, names: string[]) {
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: [...g.playerNames, ...names] } : g
		);
	}

	function removePlayer(groupId: string, nameIndex: number) {
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: g.playerNames.filter((_, i) => i !== nameIndex) } : g
		);
	}

	function updateGroup(id: string, updates: Partial<Pick<Group, 'startTime' | 'endTime'>>) {
		groups = groups.map((g) => (g.id === id ? { ...g, ...updates } : g));
	}

	async function handleSaveAndShare(e: Event) {
		e.preventDefault();
		if (!isValid || saving) return;
		saving = true;
		layout.setSaving?.(true);
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
		} finally { layout.setSaving?.(false);
			saving = false;
		}
	}
</script>

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
			<h1 class="text-on-surface text-xl font-semibold">{m.onboarding_step2_title()}</h1>
			<!-- <span class="font-label-md text-label-md text-outline">Bước 1/3</span> -->
		</div>
	</div>
</header>

<form id="details-form" onsubmit={handleSaveAndShare}>
  <div class="pb-24 px-6 pt-20 max-w-2xl mx-auto w-full gap-6 flex flex-col">
	<AssetOverview />

	<PlayerGroupsSection
		{groups}
		onAddGroup={addGroup}
		onRemoveGroup={removeGroup}
		onBulkAdd={bulkAdd}
		onRemovePlayer={removePlayer}
		onUpdateGroup={updateGroup}
	/>
</div>

</form>
