<script lang="ts">
	// ABOUTME: Player list component - add/remove players with names and hours using bits-ui Dialog
	// ABOUTME: Supports both individual add and bulk import via textarea

	import { Dialog } from 'bits-ui';
	import EmptyPlayerList from './EmptyPlayerList.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import { getAvatarColor, getInitial } from '$lib/utils';
	import type { Player } from '$lib/types';

	type Props = {
		players: Player[];
		courtHours: number;
	};

	let { players = $bindable(), courtHours }: Props = $props();

	const HOUR_STEP = 0.5;
	const MAX_QUICK_ADD = 50;

	// State
	let showImportModal = $state(false);
	let importText = $state('');
	let quickAddCount = $state(0);
	let customHoursById = $state<Record<number, boolean>>({});

	// Derived
	let defaultHours = $derived.by(() => (courtHours > 0 ? courtHours : 1));
	let quickAddN = $derived.by(() => {
		const n = Number.isFinite(quickAddCount) ? Math.floor(quickAddCount) : 0;
		return Math.max(0, Math.min(MAX_QUICK_ADD, n));
	});

	$effect(() => {
		// Ensure `customHoursById` has an entry for each player and removes stale IDs.
		const next: Record<number, boolean> = {};
		for (const p of players) {
			const existing = customHoursById[p.id];
			next[p.id] = existing ?? p.hours !== defaultHours;
		}

		let changed = false;
		for (const p of players) {
			if (customHoursById[p.id] !== next[p.id]) {
				changed = true;
				break;
			}
		}
		if (!changed) {
			for (const id of Object.keys(customHoursById)) {
				if (!(Number(id) in next)) {
					changed = true;
					break;
				}
			}
		}

		if (changed) customHoursById = next;
	});

	$effect(() => {
		// Keep non-custom players in sync with the session's default hours.
		if (defaultHours <= 0) return;

		let nextPlayers: Player[] | null = null;
		for (let i = 0; i < players.length; i++) {
			const player = players[i];
			if (customHoursById[player.id]) continue;
			if (player.hours === defaultHours) continue;
			if (!nextPlayers) nextPlayers = players.slice();
			nextPlayers[i] = { ...player, hours: defaultHours };
		}

		if (nextPlayers) players = nextPlayers;
	});

	function getDisplayName(player: Player, index: number) {
		return player.name?.trim() ? player.name : m.player_numbered({ n: index + 1 });
	}

	function toHalfHours(value: number) {
		const snapped = Math.round(value / HOUR_STEP) * HOUR_STEP;
		return Math.max(0, snapped);
	}

	function addPlayers(count: number) {
		const safeCount = Math.max(0, Math.min(MAX_QUICK_ADD, Math.floor(count)));
		if (safeCount === 0) return;

		const startId = Date.now();
		const newPlayers: Player[] = Array.from({ length: safeCount }, (_, i) => ({
			id: startId + i,
			name: '',
			hours: defaultHours
		}));

		players = [...players, ...newPlayers];
	}

	function addPlayer() {
		addPlayers(1);
	}

	function removePlayer(id: number) {
		players = players.filter((p) => p.id !== id);
	}

	function addPlayersCount() {
		addPlayers(quickAddN);
		quickAddCount = 0;
	}

	function updatePlayer(
		id: number,
		field: keyof Pick<Player, 'name' | 'hours'>,
		value: string | number
	) {
		players = players.map((p) => (p.id === id ? { ...p, [field]: value } : p));
		if (field === 'hours') {
			customHoursById = { ...customHoursById, [id]: true };
		}
	}

	function addHours(id: number, delta: number) {
		players = players.map((p) => {
			if (p.id !== id) return p;
			const next = toHalfHours((p.hours || 0) + delta);
			return { ...p, hours: next };
		});
		customHoursById = { ...customHoursById, [id]: true };
	}

	function enableCustomHours(id: number) {
		customHoursById = { ...customHoursById, [id]: true };
	}

	function useDefaultHours(id: number) {
		customHoursById = { ...customHoursById, [id]: false };
		players = players.map((p) => (p.id === id ? { ...p, hours: defaultHours } : p));
	}

	function parseAndImport() {
		const lines = importText.split('\n').filter((l) => l.trim());
		const startId = Date.now();
		const newPlayers: Player[] = lines.map((line, i) => {
			const trimmed = line.trim();
			const match = trimmed.match(/^(.+?)[\s,]+(\d+(?:\.\d+)?)$/);
			if (match) {
				return {
					id: startId + i,
					name: match[1].trim(),
					hours: parseFloat(match[2])
				};
			}
			return {
				id: startId + i,
				name: trimmed,
				hours: defaultHours
			};
		});

		players = [...players, ...newPlayers];
		customHoursById = {
			...customHoursById,
			...Object.fromEntries(newPlayers.map((p) => [p.id, p.hours !== defaultHours] as const))
		};
		showImportModal = false;
		importText = '';
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h2 class="form-label">{m.players_heading()}</h2>
		<div class="flex items-center gap-2">
			<div class="flex items-center gap-2">
				<label for="quick-add-count" class="text-[11px] text-(--slate-500)">
					{m.quick_add()}
				</label>
				<input
					id="quick-add-count"
					type="number"
					min="0"
					step="1"
					inputmode="numeric"
					placeholder={m.players_count_placeholder()}
					bind:value={quickAddCount}
					class="w-16 form-input form-input-number text-xs py-1.5 px-2"
				/>
				<button
					type="button"
					class="btn-secondary text-xs py-1.5 px-3"
					onclick={addPlayersCount}
					disabled={quickAddN <= 0}
				>
					{m.add_n_players({ count: quickAddN })}
				</button>
			</div>
			<Dialog.Root bind:open={showImportModal}>
				<Dialog.Trigger class="btn-secondary text-xs py-1.5 px-3">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
					{m.import_btn()}
				</Dialog.Trigger>

				<Dialog.Portal>
					<Dialog.Overlay
						class="fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-fade-in"
					/>
					<Dialog.Content
						class="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-xl outline-none data-[state=open]:animate-fade-in"
					>
						<div class="p-4 border-b border-(--slate-200)">
							<div class="flex items-center justify-between">
								<Dialog.Title class="text-lg font-semibold text-(--slate-800)">
									{m.import_players_title()}
								</Dialog.Title>
								<Dialog.Close class="btn-icon">
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</Dialog.Close>
							</div>
							<Dialog.Description class="text-sm text-(--slate-500) mt-1">
								{m.import_players_hint()}
							</Dialog.Description>
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
							<Dialog.Close class="btn-secondary flex-1">
								{m.cancel()}
							</Dialog.Close>
							<button
								class="btn-primary flex-1"
								onclick={parseAndImport}
								disabled={!importText.trim()}
							>
								{m.import_btn()}
							</button>
						</div>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>

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
		<EmptyPlayerList />
	{:else}
		<div class="space-y-2">
			{#each players as player, index (player.id)}
				{@const isCustom = !!customHoursById[player.id]}
				{@const name = getDisplayName(player, index)}
				<div
					class="flex items-center gap-3 p-3 bg-(--slate-50) rounded-xl animate-slide-in"
					style="animation-fill-mode: backwards; animation-delay: {index * 0.05}s;"
				>
					<div class="player-avatar {getAvatarColor(index)}">
						{getInitial(name)}
					</div>
					<div class="flex-1 min-w-0">
						<input
							type="text"
							value={player.name}
							oninput={(e) => updatePlayer(player.id, 'name', (e.target as HTMLInputElement).value)}
							placeholder={name}
							class="w-full bg-transparent border-none p-0 text-sm font-medium text-(--slate-800) focus:outline-none placeholder:text-(--slate-400)"
						/>
						{#if !isCustom}
							<div class="text-[11px] text-(--slate-500) mt-0.5">
								{m.default_hours_badge({ hours: player.hours, unit: m.hours_unit() })}
							</div>
						{/if}
					</div>
					<div class="flex items-center gap-2">
						{#if isCustom}
							<button
								type="button"
								class="btn-secondary w-9 h-9 p-0"
								onclick={() => addHours(player.id, -0.5)}
								aria-label={m.decrease_hours()}
							>
								<span class="text-lg leading-none">−</span>
							</button>
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
							<button
								type="button"
								class="btn-secondary w-9 h-9 p-0"
								onclick={() => addHours(player.id, 0.5)}
								aria-label={m.increase_hours()}
							>
								<span class="text-lg leading-none">+</span>
							</button>
							<button
								type="button"
								class="btn-secondary text-xs py-1.5 px-3"
								onclick={() => useDefaultHours(player.id)}
								aria-label={m.use_default_hours()}
							>
								{m.use_default_hours()}
							</button>
						{:else}
							<button
								type="button"
								class="btn-secondary text-xs py-1.5 px-3"
								onclick={() => enableCustomHours(player.id)}
								aria-label={m.custom_hours()}
							>
								{m.custom_hours()}
							</button>
						{/if}
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
