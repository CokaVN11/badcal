<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import type { PageData } from './$types';
	import { togglePaid } from '$lib/api/sharing';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';

	let { data }: { data: PageData } = $props();

	// Flatten all player names from groups — playerId = array index
	const allPlayers = $derived(
		data.session.groups.flatMap((g) => g.playerNames.map((name) => name))
	);

	let selectedPlayerIdx = $state<number | null>(null);
	let pendingToggle = $state<number | null>(null);

	// Initialize from server
	let localPaidIdxs = $state(new Set<number>(untrack(() => data.paidPlayerIds)));

	let selfPaid = $derived(selectedPlayerIdx !== null && localPaidIdxs.has(selectedPlayerIdx));
	let paidCount = $derived(localPaidIdxs.size);
	let allPaid = $derived(allPlayers.length > 0 && paidCount === allPlayers.length);

	function handleFork() {
		// Populate session store from DB session data and navigate to /create
		sessionStorage.title = data.session.sessionTitle;
		sessionStorage.date = data.session.sessionDate;
		sessionStorage.courtBlocks = data.session.courtBlocks;
		sessionStorage.groups = data.session.groups;
		sessionStorage.extraCosts = data.session.extraCosts;
		goto('/create');
	}

	async function handleTogglePaid() {
		if (selectedPlayerIdx === null) return;
		const newPaid = !selfPaid;
		// Optimistic update
		if (newPaid) {
			localPaidIdxs.add(selectedPlayerIdx);
		} else {
			localPaidIdxs.delete(selectedPlayerIdx);
		}
		pendingToggle = selectedPlayerIdx;
		try {
			await togglePaid(data.session.id, selectedPlayerIdx, newPaid);
		} catch {
			// Revert on failure
			if (newPaid) {
				localPaidIdxs.delete(selectedPlayerIdx);
			} else {
				localPaidIdxs.add(selectedPlayerIdx);
			}
		} finally {
			pendingToggle = null;
		}
	}
</script>

<div class="min-h-dvh flex flex-col bg-surface-muted">
	<header class="backdrop-blur-md border-b px-4 py-2 sticky top-0 z-30 bg-white/90 border-border">
		<div class="max-w-lg mx-auto flex items-center gap-3">
			<button onclick={() => history.back()} class="text-ink-muted hover:text-ink">
				←
			</button>
			<h1 class="text-lg font-semibold flex-1 text-ink">{m.bill_preview_heading()}</h1>
			<a href={`/s/${data.session.id}/review`} class="text-sm text-primary underline">
				Review
			</a>
		</div>
	</header>

	<main class="flex-1 p-4 pb-28">
		<div class="max-w-md mx-auto space-y-4">
			<!-- Session info card -->
			<div class="rounded-2xl bg-white shadow-sm border border-border p-4">
				<h2 class="font-semibold text-ink">{data.session.sessionTitle}</h2>
				<p class="text-sm text-ink-muted">{data.session.sessionDate}</p>
				<div class="mt-2 flex flex-wrap gap-1">
					{#each data.session.groups as group (group.id)}
						{#each group.playerNames as name (name)}
							<span
								class="badge badge-sm"
								class:badge-success={localPaidIdxs.has(allPlayers.indexOf(name))}
								class:badge-outline={!localPaidIdxs.has(allPlayers.indexOf(name))}
							>
								{name}
							</span>
						{/each}
					{/each}
				</div>
				{#if allPaid}
					<p class="mt-2 text-sm font-medium text-green-600">All paid ✓</p>
				{:else}
					<p class="mt-2 text-sm text-ink-muted">{paidCount}/{allPlayers.length} paid</p>
				{/if}
			</div>

			<!-- Who are you + Mark paid -->
			<div class="rounded-2xl bg-white shadow-sm border border-border overflow-hidden">
				<div class="px-4 py-3 border-b border-border">
					<span class="text-sm font-semibold text-ink">{m.players_heading()}</span>
				</div>
				<div class="p-4 space-y-3">
					<select
						class="w-full select select-bordered"
						bind:value={selectedPlayerIdx}
						aria-label="Select your name"
					>
						<option value={null}>— Choose —</option>
						{#each allPlayers as name, i (name)}
							<option value={i}>{name}</option>
						{/each}
					</select>

					{#if selectedPlayerIdx !== null}
						<button
							class="btn w-full h-12"
							class:btn-success={!selfPaid}
							class:btn-warning={selfPaid}
							onclick={handleTogglePaid}
							disabled={pendingToggle !== null}
						>
							{selfPaid ? m.onboarding_next() : 'Mark as Paid'}
						</button>
					{/if}
				</div>
			</div>

			<!-- Fork to editor -->
			<div>
				<button class="btn btn-outline w-full h-12" onclick={handleFork}>
					{m.edit()} a copy
				</button>
			</div>
		</div>
	</main>
</div>
