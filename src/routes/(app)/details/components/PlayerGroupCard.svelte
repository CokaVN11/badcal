<script lang="ts">
	import { IconPlus, IconX } from '@tabler/icons-svelte-runes';
	import * as m from '$lib/paraglide/messages';
	import type { Group } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { Dialog } from 'bits-ui';

	let {
		group,
		index,
		onRemovePlayer,
		onBulkAdd,
		onUpdateGroup
	}: {
		group: Group;
		index: number;
		onRemovePlayer: (nameIndex: number) => void;
		onBulkAdd: (names: string[]) => void;
		onUpdateGroup: (id: string, updates: Partial<Pick<Group, 'startTime' | 'endTime'>>) => void;
	} = $props();

	let importOpen = $state(false);
	let importText = $state('');

	let canImport = $derived(importText.trim().length > 0);

	function handleImportSubmit() {
		if (!canImport) return;
		const names = importText
			.split(/[,\n]/)
			.map((n) => n.trim())
			.filter(Boolean);
		onBulkAdd(names);
		importText = '';
		importOpen = false;
	}

	function handleImportKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			handleImportSubmit();
		}
	}
</script>

<div
	class="bg-white rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] border border-border overflow-hidden relative"
>
	<!-- Main row: time inputs + group info -->
	<div class="flex w-full items-center justify-between gap-3 p-4">
		<!-- Start time -->
		<div class="flex flex-col">
			<span class="font-semibold text-xs text-outline uppercase tracking-wider">
				{m.court_start_time()}
			</span>
			<input
				type="time"
				value={group.startTime}
				onchange={(e) => onUpdateGroup(group.id, { startTime: e.currentTarget.value })}
				class="font-bold text-xl p-0 text-on-background bg-transparent border-none focus:outline-none w-20 text-left no-clock"
			/>
		</div>

		<!-- Group number + count -->
		<div class="flex flex-col items-center justify-center min-w-0 px-2">
			<span class="font-semibold text-sm text-primary">
				{m.player()}
				{index + 1}
			</span>
			<span class="text-xs text-ink-muted">
				{group.playerNames.length}
				{group.playerNames.length === 1 ? m.player() : m.players_count()}
			</span>
		</div>

		<!-- End time -->
		<div class="flex flex-col">
			<span class="font-semibold text-xs text-outline uppercase tracking-wider">
				{m.court_end_time()}
			</span>
			<input
				type="time"
				value={group.endTime}
				onchange={(e) => onUpdateGroup(group.id, { endTime: e.currentTarget.value })}
				class="font-bold text-xl p-0 text-on-background bg-transparent border-none focus:outline-none w-20 text-right no-clock"
			/>
		</div>

		<!-- Spacer + player chips row below -->
	</div>

	<!-- Player chips row -->
	<div class="flex items-center gap-2 px-4 pb-4 flex-wrap min-w-0">
		{#each group.playerNames as name, ni (ni)}
			<span
				class="inline-flex items-center gap-1 bg-primary-soft text-primary px-3 py-1.5 rounded-full text-sm font-medium"
			>
				{name}
				<button
					type="button"
					onclick={() => onRemovePlayer(ni)}
					class="hover:text-error transition-colors"
					aria-label="Remove {name}"
				>
					<IconX class="h-3 w-3" />
				</button>
			</span>
		{/each}

		<!-- Import button -->
		<Dialog.Root bind:open={importOpen}>
			<Dialog.Trigger
				class="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors shrink-0"
				type="button"
				aria-label={m.add_player_btn()}
			>
				<IconPlus class="h-4 w-4" />
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50" />
				<Dialog.Content
					class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl outline-none"
				>
					<div class="p-4 border-b border-border">
						<div class="flex items-center justify-between">
							<Dialog.Title class="text-base font-semibold text-ink">
								{m.import_players_title()}
							</Dialog.Title>
							<Dialog.Close
								class="text-ink-muted hover:text-ink"
								type="button"
								aria-label={m.cancel()}
							>
								<IconX stroke={2} class="h-5 w-5" />
							</Dialog.Close>
						</div>
						<p class="text-sm text-ink-muted mt-1">
							{m.import_players_hint()}
						</p>
					</div>

					<div class="p-4">
						<textarea
							bind:value={importText}
							onkeydown={handleImportKeydown}
							aria-label={m.import_players_hint()}
							placeholder={m.player_name_placeholder()}
							rows="6"
							class="w-full px-3 py-2 rounded-xl border border-border bg-white text-sm resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft transition-all font-mono"
						></textarea>
					</div>

					<div class="p-4 border-t border-border flex gap-3">
						<Dialog.Close class="flex-1" type="button">
							<Button variant="destructive" class="w-full">{m.cancel()}</Button>
						</Dialog.Close>
						<Button class="flex-1" onclick={handleImportSubmit} disabled={!canImport}>
							{m.import_btn()}
						</Button>
					</div>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	</div>
</div>
