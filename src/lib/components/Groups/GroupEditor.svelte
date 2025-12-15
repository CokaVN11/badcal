<script lang="ts">
	// ABOUTME: Grouped player editor - fastest mobile flow using hours × count buckets
	// ABOUTME: Keeps per-person names/overrides out of the default path (handled by optional Details UI)

	import { m } from '$lib/paraglide/messages';
	import type { Player } from '$lib/types';
	import { toast } from 'svelte-sonner';
	import {
		DEFAULT_HOUR_STEP,
		DEFAULT_MAX_PLAYERS,
		formatHours,
		createBucketViewModels,
		getRemainingHourOptions,
		setPlayerCountForHours
	} from '../Players/playerList.logic.ts';

	type Props = {
		players: Player[];
		defaultHours: number;
		hourStep?: number;
		maxPlayers?: number;
	};

	let {
		players = $bindable(),
		defaultHours,
		hourStep = DEFAULT_HOUR_STEP,
		maxPlayers = DEFAULT_MAX_PLAYERS
	}: Props = $props();

	let nextId = $state(Date.now());

	function showToast(kind: 'MAX_PLAYERS' | 'CANNOT_REMOVE_NAMED') {
		if (kind === 'MAX_PLAYERS') toast(m.group_max_players({ max: maxPlayers }), { duration: 1400 });
		else toast(m.group_cannot_remove_named(), { duration: 1400 });
	}

	let totalPlayers = $derived.by(() => players.length);

	let bucketViewModels = $derived.by(() => createBucketViewModels(players, defaultHours, hourStep));
	let remainingHourOptions = $derived.by(() => getRemainingHourOptions(bucketViewModels, hourStep));

	function updateCountForHours(hours: number, desiredCount: number) {
		const result = setPlayerCountForHours(players, hours, desiredCount, {
			step: hourStep,
			maxPlayers,
			nextId
		});
		if (result.players !== players) players = result.players;
		nextId = result.nextId;
		if (result.toast) showToast(result.toast);
	}

	function incrementHoursCount(hours: number, delta: number) {
		const viewModel = bucketViewModels.find((bucket) => bucket.hours === hours);
		const currentCount = viewModel?.count ?? 0;
		updateCountForHours(hours, currentCount + delta);
	}

	function handleCountInput(hours: number, rawValue: string) {
		const parsedCount = rawValue.trim() === '' ? 0 : Number(rawValue);
		updateCountForHours(hours, Number.isFinite(parsedCount) ? parsedCount : 0);
	}
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<div>
			<h2 class="form-label">{m.grouped_players_heading()}</h2>
			<p class="text-[11px] text-(--ink-muted) mt-0.5">{m.grouped_players_hint()}</p>
		</div>
		<div class="badge badge-paid">
			{totalPlayers}
			{m.players_count()}
		</div>
	</div>

	<div class="space-y-2">
		{#each bucketViewModels as bucket (bucket.hours)}
			{@const hours = bucket.hours}
			{@const count = bucket.count}
			{@const isDefault = bucket.isDefault}
			<div
				class="flex items-center gap-3 p-3 rounded-xl border border-(--border) bg-white"
				class:ring-2={isDefault}
				class:ring-(--zp-blue-200)={isDefault}
			>
				<div class="min-w-0">
					<div class="text-sm font-semibold text-(--ink)">
						{formatHours(hours)}{m.hours_unit()}
					</div>
					{#if isDefault}
						<div class="text-[11px] text-(--ink-muted)">
							{m.default_hours_badge({ hours, unit: m.hours_unit() })}
						</div>
					{/if}
				</div>

				<div class="ml-auto flex items-center gap-2">
					<button
						type="button"
						class="btn-secondary w-11 h-11 p-0"
						onclick={() => incrementHoursCount(hours, -1)}
						aria-label={m.group_decrease_count()}
					>
						<span class="text-lg leading-none">−</span>
					</button>

					<input
						id={`group-count-${hours}`}
						type="number"
						min="0"
						step="1"
						inputmode="numeric"
						class="w-16! form-input form-input-number text-sm py-2"
						value={count}
						oninput={(e) => handleCountInput(hours, (e.target as HTMLInputElement).value)}
						aria-label={m.group_count_label({ hours, unit: m.hours_unit() })}
					/>

					<button
						type="button"
						class="btn-secondary w-11 h-11 p-0"
						onclick={() => incrementHoursCount(hours, 1)}
						aria-label={m.group_increase_count()}
					>
						<span class="text-lg leading-none">+</span>
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if remainingHourOptions.length > 0}
		<div class="pt-1">
			<div class="text-xs text-(--ink-muted) mb-2">{m.custom_hours()}</div>
			<div class="flex flex-wrap gap-2">
				{#each remainingHourOptions as hourOption (hourOption)}
					<button
						type="button"
						class="btn-secondary text-xs! py-1.5 px-3"
						onclick={() => incrementHoursCount(hourOption, 1)}
						aria-label={m.group_add_hours({ hours: hourOption, unit: m.hours_unit() })}
					>
						{formatHours(hourOption)}{m.hours_unit()}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
