<script lang="ts">
	// ABOUTME: Player list component - add/remove players with names and hours
	// ABOUTME: Supports both individual add and bulk import via textarea

	import { m } from '$lib/paraglide/messages.js';
	import { getAvatarColor, getInitial } from '$lib/utils';
	import type { Player } from '$lib/types';

	let { players = $bindable() }: { players: Player[] } = $props();

	let showImportModal = $state(false);
	let importText = $state('');

	function addPlayer() {
		const newPlayer: Player = {
			id: Date.now(),
			name: '',
			hours: 1
		};
		players = [...players, newPlayer];
	}

	function removePlayer(id: number) {
		players = players.filter((p) => p.id !== id);
	}

	function updatePlayer(
		id: number,
		field: keyof Pick<Player, 'name' | 'hours'>,
		value: string | number
	) {
		players = players.map((p) => (p.id === id ? { ...p, [field]: value } : p));
	}

	function openImportModal() {
		showImportModal = true;
		importText = '';
	}

	function closeImportModal() {
		showImportModal = false;
		importText = '';
	}

	function parseAndImport() {
		const lines = importText.split('\n').filter((l) => l.trim());
		const newPlayers: Player[] = lines.map((line, i) => {
			const trimmed = line.trim();
			const match = trimmed.match(/^(.+?)[\s,]+(\d+(?:\.\d+)?)$/);
			if (match) {
				return {
					id: Date.now() + i,
					name: match[1].trim(),
					hours: parseFloat(match[2])
				};
			}
			return {
				id: Date.now() + i,
				name: trimmed,
				hours: 1
			};
		});

		players = [...players, ...newPlayers];
		closeImportModal();
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h2 class="form-label">{m.players_heading()}</h2>
		<div class="flex gap-2">
			<button class="btn-secondary text-xs py-1.5 px-3" onclick={openImportModal}>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
				{m.import_btn()}
			</button>
			<button class="btn-secondary text-xs py-1.5 px-3" onclick={addPlayer}>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{m.add_player_btn()}
			</button>
		</div>
	</div>

	{#if players.length === 0}
		<div class="text-center py-8 text-(--slate-400)">
			<svg
				class="w-12 h-12 mx-auto mb-3 opacity-50"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
				/>
			</svg>
			<p class="text-sm">{m.no_players_yet()}</p>
			<p class="text-xs mt-1">{m.add_players_hint()}</p>
		</div>
	{:else}
		<div class="space-y-2">
			{#each players as player, index (player.id)}
				<div
					class="flex items-center gap-3 p-3 bg-(--slate-50) rounded-xl animate-slide-in"
					style="animation-fill-mode: backwards; animation-delay: {index * 0.05}s;"
				>
					<div class="player-avatar {getAvatarColor(index)}">
						{getInitial(player.name)}
					</div>
					<div class="flex-1 min-w-0">
						<input
							type="text"
							value={player.name}
							oninput={(e) => updatePlayer(player.id, 'name', (e.target as HTMLInputElement).value)}
							placeholder={m.player_name_placeholder()}
							class="w-full bg-transparent border-none p-0 text-sm font-medium text-(--slate-800) focus:outline-none placeholder:text-(--slate-400)"
						/>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="number"
							value={player.hours}
							oninput={(e) =>
								updatePlayer(
									player.id,
									'hours',
									parseFloat((e.target as HTMLInputElement).value) || 0
								)}
							min="0"
							step="0.5"
							class="w-16 form-input form-input-number text-sm py-1.5"
						/>
						<span class="text-xs text-(--slate-400)">{m.hours_unit()}</span>
						<button
							class="btn-icon btn-icon-danger"
							onclick={() => removePlayer(player.id)}
							aria-label={m.remove()}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Import Modal -->
{#if showImportModal}
	<div class="modal-backdrop">
		<dialog open class="modal-content" aria-labelledby="import-title">
			<div class="p-4 border-b border-(--slate-200)">
				<div class="flex items-center justify-between">
					<h3 id="import-title" class="text-lg font-semibold text-(--slate-800)">
						{m.import_players_title()}
					</h3>
					<button class="btn-icon" onclick={closeImportModal} aria-label={m.cancel()}>
						<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>
				<p class="text-sm text-(--slate-500) mt-1">{m.import_players_hint()}</p>
			</div>

			<div class="p-4">
				<textarea
					bind:value={importText}
					placeholder={m.import_placeholder()}
					rows="8"
					class="form-input resize-none font-mono text-sm"
				></textarea>
			</div>

			<div class="p-4 border-t border-(--slate-200) flex gap-3">
				<button class="btn-secondary flex-1" onclick={closeImportModal}>
					{m.cancel()}
				</button>
				<button class="btn-primary flex-1" onclick={parseAndImport} disabled={!importText.trim()}>
					{m.import_btn()}
				</button>
			</div>
		</dialog>
	</div>
{/if}
