<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import type { Player } from '$lib/types';
	import { getAvatarColor, getInitial, getPlayerDisplayName } from '$lib/utils';
	import { IconX } from '@tabler/icons-svelte-runes';

	type ColorScheme = {
		light: string;
		text: string;
	};

	type Props = {
		player: Player;
		playerIndex: number;
		globalIndex: number;
		colorScheme: ColorScheme;
		hourStep: number;
		onUpdateName: (value: string) => void;
		onAddHours: (delta: number) => void;
		onRemove: () => void;
		onSetArrivalOffset: (offset: number) => void;
	};

	let {
		player,
		playerIndex,
		globalIndex,
		colorScheme,
		hourStep,
		onUpdateName,
		onAddHours,
		onRemove,
		onSetArrivalOffset
	}: Props = $props();

	const ARRIVAL_OFFSETS = [0, 15, 30, 60] as const;

	let displayName = $derived(getPlayerDisplayName(player, globalIndex));
</script>

<div
	class="player-row flex flex-col gap-1.5 p-2.5 bg-white rounded-xl border border-transparent hover:border-(--border) hover:shadow-sm transition-all duration-150"
	style="animation: slideUp 0.25s ease-out backwards; animation-delay: {playerIndex * 0.04}s;"
>
	<div class="flex items-center gap-2.5">
		<div class="player-avatar w-9 h-9 text-xs ring-2 ring-white shadow-sm {getAvatarColor(globalIndex)}">
			{getInitial(displayName)}
		</div>

		<div class="flex-1 min-w-0">
			<input
				type="text"
				value={player.name}
				oninput={(e) => onUpdateName((e.target as HTMLInputElement).value)}
				placeholder={displayName}
				class="w-full bg-transparent border-none p-0 text-sm font-semibold text-(--ink) focus:outline-none placeholder:text-(--slate-400) placeholder:font-normal"
			/>
		</div>

		<div class="flex items-center gap-0.5">
			<button
				type="button"
				class="stepper-btn w-11 h-11 rounded-lg bg-(--slate-100) hover:bg-(--slate-200) text-(--ink-soft) hover:text-(--ink) flex items-center justify-center transition-colors"
				onclick={() => onAddHours(-hourStep)}
				aria-label={m.decrease_hours()}
			>
				<span class="text-sm font-bold">−</span>
			</button>
			<div
				class="hours-display w-11 h-7 rounded-lg {colorScheme.light} {colorScheme.text} flex items-center justify-center"
			>
				<span class="text-xs font-bold font-mono">{player.hours}h</span>
			</div>
			<button
				type="button"
				class="stepper-btn w-11 h-11 rounded-lg bg-(--slate-100) hover:bg-(--slate-200) text-(--ink-soft) hover:text-(--ink) flex items-center justify-center transition-colors"
				onclick={() => onAddHours(hourStep)}
				aria-label={m.increase_hours()}
			>
				<span class="text-sm font-bold">+</span>
			</button>
			<button
				type="button"
				class="delete-btn w-11 h-11 rounded-lg text-(--slate-400) hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors ml-1"
				onclick={onRemove}
				aria-label={m.remove()}
			>
				<IconX size={18} stroke={2.5} />
			</button>
		</div>
	</div>

	<div class="flex items-center gap-1 pl-11">
		{#each ARRIVAL_OFFSETS as offset (offset)}
			<button
				type="button"
				class="h-11 px-3 rounded-md text-sm font-medium transition-colors {player.arrivalOffsetMinutes === offset
					? `${colorScheme.light} ${colorScheme.text}`
					: 'bg-(--slate-100) text-(--ink-muted) hover:bg-(--slate-200)'}"
				onclick={() => onSetArrivalOffset(offset)}
			>
				{offset === 0 ? 'On time' : `+${offset}m`}
			</button>
		{/each}
	</div>
</div>

<style>
	.stepper-btn:active {
		transform: scale(0.92);
	}

	.delete-btn:active {
		transform: scale(0.9);
	}
</style>
