<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import * as m from '$lib/paraglide/messages';
	import { IconPlus, IconTrash } from '@tabler/icons-svelte-runes';
	import { toast } from 'svelte-sonner';
	import { createOrReuseSession } from '$lib/api/sharing';
	import type { CourtBlock, Group } from '$lib/types';

	const setReady = getContext<{ setReady: (v: boolean) => void }>('layout').setReady;

	onMount(() => {
		if ((sessionStorage.courtBlocks?.length ?? 0) === 0) {
			goto('/create');
		}
	});

	let groups = $state<Group[]>(
		(sessionStorage.groups?.length ?? 0) > 0
			? [...sessionStorage.groups]
			: [{ id: crypto.randomUUID(), startTime: '19:00', endTime: '21:00', playerNames: [] }]
	);

	let saving = $state(false);

	$effect(() => {
		sessionStorage.groups = groups;
	});

	let isValid = $derived(groups.some((g) => g.playerNames.length > 0));

	$effect(() => {
		setReady(isValid);
	});

	function addGroup() {
		groups = [...groups, { id: crypto.randomUUID(), startTime: '19:00', endTime: '21:00', playerNames: [] }];
	}

	function removeGroup(id: string) {
		groups = groups.filter((g) => g.id !== id);
		if (groups.length === 0) {
			groups = [{ id: crypto.randomUUID(), startTime: '19:00', endTime: '21:00', playerNames: [] }];
		}
	}

	function addPlayerToGroup(groupId: string, name: string) {
		const trimmed = name.trim();
		if (!trimmed) return;
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: [...g.playerNames, trimmed] } : g
		);
	}

	function removePlayer(groupId: string, nameIndex: number) {
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: g.playerNames.filter((_, i) => i !== nameIndex) } : g
		);
	}

	function handleBulkPaste(groupId: string, event: Event) {
		const input = event.target as HTMLTextAreaElement;
		const names = input.value
			.split(/[\n,]+/)
			.map((n) => n.trim())
			.filter(Boolean);
		if (!names.length) return;
		groups = groups.map((g) =>
			g.id === groupId ? { ...g, playerNames: [...g.playerNames, ...names] } : g
		);
		input.value = '';
	}

	async function handleSaveAndShare() {
		if (!isValid || saving) return;
		saving = true;
		try {
			const payload = {
				title: sessionStorage.title,
				date: sessionStorage.date,
				courtBlocks: sessionStorage.courtBlocks.map((b) => ({
					courtCount: b.courtCount,
					startTime: b.startTime,
					endTime: b.endTime,
					pricePerHour: b.pricePerHour
				})) as CourtBlock[],
				groups: groups.map((g) => ({
					startTime: g.startTime,
					endTime: g.endTime,
					playerNames: g.playerNames
				})) as Group[],
				extraCosts: sessionStorage.extraCosts.map((c) => ({ label: c.label, amount: c.amount }))
			};

			const result = await createOrReuseSession(payload);
			await goto(`/s/${result.id}`);
		} catch (e) {
			toast.error('Failed to create session');
		} finally {
			saving = false;
		}
	}
</script>

<div class="pb-24">
	<header class="sticky top-0 z-20 backdrop-blur-md border-b bg-white/90 border-border px-4 py-3">
		<h1 class="text-lg font-semibold text-ink">{m.onboarding_step2_title()}</h1>
		<p class="text-sm text-ink-muted">{m.onboarding_step2_desc()}</p>
	</header>

	<form
		id="details-form"
		onsubmit={(e) => { e.preventDefault(); handleSaveAndShare(); }}
		class="max-w-lg mx-auto px-4 py-4 space-y-4"
	>
		<!-- Groups -->
		<section class="space-y-3">
			<div class="flex items-center justify-between">
				<h2 class="text-sm font-semibold text-ink">{m.grouped_players_heading()}</h2>
				<button type="button" onclick={addGroup} class="btn btn-xs btn-outline">
					<IconPlus class="h-3 w-3" /> Add group
				</button>
			</div>

			{#each groups as group, gi (group.id)}
				<div class="rounded-2xl bg-white shadow-sm border border-border p-4 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-xs font-medium text-ink-muted">Group {gi + 1}</span>
						{#if groups.length > 1}
							<button type="button" onclick={() => removeGroup(group.id)} class="text-ink-muted hover:text-red-500">
								<IconTrash class="h-4 w-4" />
							</button>
						{/if}
					</div>

					<!-- Time window -->
					<div class="flex items-center gap-2">
						<div class="flex-1">
							<label class="text-xs text-ink-muted">Start</label>
							<input
								type="time"
								bind:value={group.startTime}
								class="input input-bordered w-full h-9 text-sm mt-1"
							/>
						</div>
						<div class="flex-1">
							<label class="text-xs text-ink-muted">End</label>
							<input
								type="time"
								bind:value={group.endTime}
								class="input input-bordered w-full h-9 text-sm mt-1"
							/>
						</div>
					</div>

					<!-- Players in group -->
					<div>
						<label class="text-xs text-ink-muted">Players</label>
						<div class="flex flex-wrap gap-1 mt-1">
							{#each group.playerNames as name, ni (ni)}
								<span class="badge badge-outline gap-1">
									{name}
									<button type="button" onclick={() => removePlayer(group.id, ni)} class="text-ink-muted hover:text-red-500">×</button>
								</span>
							{/each}
						</div>

						<!-- Add player input -->
						<div class="mt-2">
							<input
								type="text"
								placeholder={m.player_name_placeholder()}
								class="input input-bordered w-full h-9 text-sm"
								onkeydown={(e) => {
									if (e.key === 'Enter') {
										e.preventDefault();
										addPlayerToGroup(group.id, (e.target as HTMLInputElement).value);
										(e.target as HTMLInputElement).value = '';
									}
								}}
							/>
						</div>

						<!-- Bulk paste -->
						<div class="mt-2">
							<textarea
								placeholder="Bulk paste names (comma or newline separated)"
								class="textarea textarea-bordered w-full h-16 text-sm"
								onblur={(e) => handleBulkPaste(group.id, e)}
							></textarea>
						</div>
					</div>
				</div>
			{/each}
		</section>
	</form>

	<!-- Save & Share button (shown inline below form content as fallback) -->
	<div class="max-w-lg mx-auto px-4">
		<button
			type="button"
			onclick={handleSaveAndShare}
			disabled={!isValid || saving}
			class="btn btn-primary w-full h-12"
		>
			{saving ? 'Creating...' : m.share_btn()}
		</button>
	</div>
</div>
