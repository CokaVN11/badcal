<script lang="ts">
	import { getContext } from 'svelte';
	import { sessionStore } from '$lib/stores/session.svelte';
	import * as m from '$lib/paraglide/messages';
	import { IconPlus, IconTrash, IconChevronDown } from '@tabler/icons-svelte-runes';
	import type { CourtBlock, ExtraCost } from '$lib/types';

	// Receive setReady from parent layout context
	const setReady = getContext<{ setReady: (v: boolean) => void }>('layout').setReady;

	// Local form state — mirrors sessionStore but for controlled inputs
	let sessionTitle = $state(sessionStore.sessionTitle ?? 'New Session');
	let sessionDate = $state(sessionStore.sessionDate ?? new Date().toISOString().split('T')[0]);
	let courtBlocks = $state<CourtBlock[]>(
		(sessionStore.courtBlocks?.length ?? 0) > 0
			? [...sessionStore.courtBlocks]
			: [{ id: crypto.randomUUID(), courtCount: 1, startTime: '19:00', endTime: '21:00', pricePerHour: 110 }]
	);
	let extraCosts = $state<ExtraCost[]>(
		(sessionStore.extraCosts?.length ?? 0) > 0 ? [...sessionStore.extraCosts] : [{ id: crypto.randomUUID(), label: 'Shuttlecock', amount: 0 }]
	);
	let showMultiBlock = $state(courtBlocks.length > 1);

	// Sync to sessionStore on every change
	$effect(() => {
		sessionStore.sessionTitle = sessionTitle;
	});
	$effect(() => {
		sessionStore.sessionDate = sessionDate;
	});
	$effect(() => {
		sessionStore.courtBlocks = courtBlocks;
	});
	$effect(() => {
		sessionStore.extraCosts = extraCosts;
	});

	// Compute block hours from HH:mm strings
	function parseTime(t: string): number {
		const [h, m2] = t.split(':').map(Number);
		return h * 60 + (m2 ?? 0);
	}

	const courtTotal = $derived(
		courtBlocks.reduce((sum, b) => {
			const hours = (parseTime(b.endTime) - parseTime(b.startTime)) / 60;
			return sum + hours * b.courtCount * b.pricePerHour;
		}, 0)
	);

	const extraTotal = $derived(extraCosts.reduce((s, c) => s + (c.amount || 0), 0));
	const grandTotal = $derived(courtTotal + extraTotal);

	// Validation
	let isValid = $derived(
		sessionTitle.trim().length > 0 &&
		sessionDate.length > 0 &&
		courtBlocks.length > 0 &&
		courtBlocks.every((b) => b.courtCount >= 1 && parseTime(b.startTime) < parseTime(b.endTime) && b.pricePerHour > 0)
	);

	$effect(() => {
		setReady(isValid);
	});

	function addBlock() {
		courtBlocks = [...courtBlocks, { id: crypto.randomUUID(), courtCount: 1, startTime: '21:00', endTime: '22:00', pricePerHour: 110 }];
		showMultiBlock = true;
	}

	function removeBlock(id: string) {
		courtBlocks = courtBlocks.filter((b) => b.id !== id);
		if (courtBlocks.length <= 1) showMultiBlock = false;
	}

	function addExtraCost() {
		extraCosts = [...extraCosts, { id: crypto.randomUUID(), label: '', amount: 0 }];
	}

	function removeExtraCost(id: string) {
		extraCosts = extraCosts.filter((c) => c.id !== id);
	}

	function applyQuickCost(label: string, amount: number) {
		extraCosts = [...extraCosts, { id: crypto.randomUUID(), label, amount }];
	}
</script>

<div class="pb-24">
	<header class="sticky top-0 z-20 backdrop-blur-md border-b bg-white/90 border-(--border) px-4 py-3">
		<h1 class="text-lg font-semibold text-(--ink)">{m.onboarding_step1_title()}</h1>
		<p class="text-sm text-(--ink-muted)">{m.onboarding_step1_desc()}</p>
	</header>

	<div class="max-w-lg mx-auto px-4 py-4 space-y-6">
		<!-- Session Info -->
		<section class="rounded-2xl bg-white shadow-sm border border-(--border) p-4 space-y-3">
			<input
				type="text"
				bind:value={sessionTitle}
				placeholder={m.session_title_placeholder()}
				class="w-full border-b border-(--border) pb-2 text-base font-medium text-(--ink) placeholder:font-normal placeholder:text-(--ink-muted) focus:outline-none"
			/>
			<input
				type="date"
				bind:value={sessionDate}
				class="w-full text-sm text-(--ink-muted) focus:outline-none"
			/>
		</section>

		<!-- Court Schedule -->
		<section class="rounded-2xl bg-white shadow-sm border border-(--border) p-4 space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-(--ink)">{m.court_hours()}</h2>
				{#if !showMultiBlock && courtBlocks.length === 1}
					<button
						type="button"
						onclick={() => (showMultiBlock = true)}
						class="text-xs text-(--primary) underline"
					>
						Multiple time slots
					</button>
				{/if}
			</div>

			<!-- Single block form -->
			{#if !showMultiBlock}
				{@const block = courtBlocks[0]}
				<div class="grid grid-cols-4 gap-2">
					<div class="col-span-1">
						<label class="text-xs text-(--ink-muted)">{m.court_hours()}</label>
						<input
							type="number"
							min="1"
							bind:value={block.courtCount}
							class="input input-bordered w-full h-9 text-sm mt-1"
						/>
					</div>
					<div class="col-span-1">
						<label class="text-xs text-(--ink-muted)">Start</label>
						<input
							type="time"
							bind:value={block.startTime}
							class="input input-bordered w-full h-9 text-sm mt-1"
						/>
					</div>
					<div class="col-span-1">
						<label class="text-xs text-(--ink-muted)">End</label>
						<input
							type="time"
							bind:value={block.endTime}
							class="input input-bordered w-full h-9 text-sm mt-1"
						/>
					</div>
					<div class="col-span-1">
						<label class="text-xs text-(--ink-muted)">đ/hr</label>
						<input
							type="number"
							min="0"
							bind:value={block.pricePerHour}
							class="input input-bordered w-full h-9 text-sm mt-1"
						/>
					</div>
				</div>
			{:else}
				<!-- Multi-block editor -->
				{#each courtBlocks as block, i (block.id)}
					<div class="rounded-xl bg-(--surface-muted) p-3 space-y-2">
						<div class="flex items-center justify-between">
							<span class="text-xs font-medium text-(--ink-muted)">Block {i + 1}</span>
							{#if courtBlocks.length > 1}
								<button type="button" onclick={() => removeBlock(block.id)} class="text-(--ink-muted) hover:text-red-500">
									<IconTrash class="h-4 w-4" />
								</button>
							{/if}
						</div>
						<div class="grid grid-cols-4 gap-2">
							<div class="col-span-1">
								<input type="number" min="1" bind:value={block.courtCount} class="input input-bordered w-full h-8 text-sm" />
							</div>
							<div class="col-span-1">
								<input type="time" bind:value={block.startTime} class="input input-bordered w-full h-8 text-sm" />
							</div>
							<div class="col-span-1">
								<input type="time" bind:value={block.endTime} class="input input-bordered w-full h-8 text-sm" />
							</div>
							<div class="col-span-1">
								<input type="number" min="0" bind:value={block.pricePerHour} class="input input-bordered w-full h-8 text-sm" />
							</div>
						</div>
					</div>
				{/each}
				<button type="button" onclick={addBlock} class="btn btn-outline btn-sm w-full">
					<IconPlus class="h-4 w-4" /> Add block
				</button>
			{/if}
		</section>

		<!-- Extra Costs -->
		<section class="rounded-2xl bg-white shadow-sm border border-(--border) p-4 space-y-3">
			<h2 class="text-sm font-semibold text-(--ink)">{m.additional_costs()}</h2>

			<!-- Quick chips -->
			<div class="flex flex-wrap gap-1">
				{#each [['Shuttlecock', 30], ['Iced tea', 15], ['Drinks', 10], ['Parking', 10]] as [label, amt]}
					<button
						type="button"
						onclick={() => applyQuickCost(label, amt)}
						class="btn btn-xs btn-outline"
					>
						{label} {amt}k
					</button>
				{/each}
			</div>

			<!-- Extra cost list -->
			{#each extraCosts as cost (cost.id)}
				<div class="flex items-center gap-2">
					<input
						type="text"
						bind:value={cost.label}
						placeholder="Label"
						class="input input-bordered flex-1 h-9 text-sm"
					/>
					<div class="relative">
						<input
							type="number"
							min="0"
							bind:value={cost.amount}
							placeholder="0"
							class="input input-bordered w-24 h-9 text-sm pr-8"
						/>
						<span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--ink-muted)">k</span>
					</div>
					<button
						type="button"
						onclick={() => removeExtraCost(cost.id)}
						class="text-(--ink-muted) hover:text-red-500"
					>
						<IconTrash class="h-4 w-4" />
					</button>
				</div>
			{/each}

			<button type="button" onclick={addExtraCost} class="btn btn-outline btn-sm w-full">
				<IconPlus class="h-4 w-4" /> {m.add_cost_btn()}
			</button>
		</section>

		<!-- Summary -->
		<section class="rounded-2xl bg-white shadow-sm border border-(--border) p-4">
			<h2 class="text-sm font-semibold text-(--ink) mb-3">{m.summary_heading()}</h2>
			<div class="space-y-1 text-sm">
				<div class="flex justify-between">
					<span class="text-(--ink-muted)">Court total</span>
					<span class="font-medium">{courtTotal.toLocaleString()}đ</span>
				</div>
				<div class="flex justify-between">
					<span class="text-(--ink-muted)">Extra costs</span>
					<span class="font-medium">{extraTotal.toLocaleString()}đ</span>
				</div>
				<div class="border-t border-(--border) pt-1 flex justify-between font-semibold">
					<span>Grand total</span>
					<span class="text-(--primary)">{grandTotal.toLocaleString()}đ</span>
				</div>
			</div>
		</section>
	</div>
</div>
