<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import { IconBookmark, IconTrash, IconX } from '@tabler/icons-svelte-runes';
	import { Dialog } from 'bits-ui';
	import type { SavedLineup } from '$lib/types';

	type Props = {
		lineups: SavedLineup[];
		onSave: (name: string) => void;
		onApply: (lineup: SavedLineup) => void;
		onDelete: (id: string) => void;
		onRename: (id: string, newName: string) => void;
	};

	let { lineups, onSave, onApply, onDelete, onRename }: Props = $props();

	let open = $state(false);
	let newLineupName = $state('');
	let renamingId = $state<string | null>(null);
	let renameValue = $state('');

	let canSave = $derived(newLineupName.trim().length > 0);

	function handleSave() {
		if (!canSave) return;
		onSave(newLineupName.trim());
		newLineupName = '';
	}

	function startRename(lineup: SavedLineup) {
		renamingId = lineup.id;
		renameValue = lineup.name;
	}

	function commitRename(id: string) {
		if (renameValue.trim()) {
			onRename(id, renameValue.trim());
		}
		renamingId = null;
		renameValue = '';
	}

	function handleRenameKeydown(e: KeyboardEvent, id: string) {
		if (e.key === 'Enter') {
			e.preventDefault();
			commitRename(id);
		} else if (e.key === 'Escape') {
			renamingId = null;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger class="btn-secondary h-11 px-4 text-sm rounded-sm!" type="button">
		<IconBookmark stroke={1.5} />
		{m.saved_lineups()}
	</Dialog.Trigger>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in" />
		<Dialog.Content
			class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl outline-none data-[state=open]:animate-fade-in"
		>
			<div class="p-4 border-b border-slate-200">
				<div class="flex items-center justify-between">
					<Dialog.Title class="text-lg font-semibold text-slate-800">
						{m.saved_lineups()}
					</Dialog.Title>
					<Dialog.Close class="btn-icon" type="button" aria-label={m.cancel()}>
						<IconX stroke={2} />
					</Dialog.Close>
				</div>
			</div>

			<div class="p-4 space-y-4 max-h-96 overflow-y-auto">
				{#if lineups.length === 0}
					<p class="text-sm text-slate-500 text-center py-4">{m.saved_lineups_empty()}</p>
				{:else}
					<div class="space-y-2">
						{#each lineups as lineup (lineup.id)}
							<div class="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
								{#if renamingId === lineup.id}
									<input
										class="form-input flex-1 h-9 text-sm"
										bind:value={renameValue}
										onkeydown={(e) => handleRenameKeydown(e, lineup.id)}
										onblur={() => commitRename(lineup.id)}
									/>
								{:else}
									<div class="flex-1 min-w-0">
										<button
											type="button"
											class="text-sm font-medium text-slate-800 truncate block w-full text-left hover:text-slate-600"
											onclick={() => startRename(lineup)}
										>
											{lineup.name}
										</button>
										<span class="text-xs text-slate-500"
											>{lineup.playerNames.length}
											{lineup.playerNames.length === 1 ? m.player() : m.players_count()}</span
										>
									</div>
									<button
										type="button"
										class="btn-primary text-sm px-3 h-9 shrink-0"
										onclick={() => {
											onApply(lineup);
											open = false;
										}}
									>
										{m.apply_lineup()}
									</button>
									<button
										type="button"
										class="btn-icon text-slate-400 hover:text-red-500"
										onclick={() => onDelete(lineup.id)}
										aria-label={m.delete_lineup()}
									>
										<IconTrash size={16} stroke={1.5} />
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<div class="p-4 border-t border-slate-200">
				<div class="flex gap-2">
					<input
						class="form-input flex-1 h-11 text-sm"
						placeholder={m.lineup_name()}
						bind:value={newLineupName}
						onkeydown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault();
								handleSave();
							}
						}}
					/>
					<button
						type="button"
						class="btn-primary h-11 px-4 text-sm shrink-0"
						onclick={handleSave}
						disabled={!canSave}
					>
						{m.save_current_lineup()}
					</button>
				</div>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
