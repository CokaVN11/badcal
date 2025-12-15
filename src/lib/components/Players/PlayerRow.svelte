<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { Player } from '$lib/types';
	import { getAvatarColor, getInitial } from '$lib/utils';
	import { IconX } from '@tabler/icons-svelte-runes';

	type Props = {
		player: Player;
		index: number;
		displayName: string;
		isCustom: boolean;
		hourStep: number;
		updatePlayer: (id: number, field: keyof Player, value: string | number) => void;
		enableCustomHours: (id: number) => void;
		useDefaultHours: (id: number) => void;
		addHours: (id: number, delta: number) => void;
		removePlayer: (id: number) => void;
	};

	let {
		player,
		index,
		displayName,
		isCustom,
		hourStep,
		enableCustomHours,
		updatePlayer,
		useDefaultHours,
		addHours,
		removePlayer
	}: Props = $props();
</script>

<div
	class="flex items-center gap-3 p-3 bg-(--slate-50) rounded-xl animate-slide-in"
	style="animation-fill-mode: backwards; animation-delay: {index * 0.05}s;"
>
	<div class="player-avatar {getAvatarColor(index)}">{getInitial(displayName)}</div>
	<div class="flex-1 min-w-0">
		<input
			type="text"
			value={player.name}
			oninput={(e) => updatePlayer(player.id, 'name', (e.target as HTMLInputElement).value)}
			placeholder={displayName}
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
				onclick={() => addHours(player.id, -hourStep)}
				aria-label={m.decrease_hours()}
			>
				<span class="text-lg leading-none">−</span>
			</button>
			<input
				type="number"
				value={player.hours}
				oninput={(e) =>
					updatePlayer(player.id, 'hours', parseFloat((e.target as HTMLInputElement).value) || 0)}
				min="0"
				step="0.5"
				class="w-16 form-input form-input-number text-sm py-1.5"
			/>
			<button
				type="button"
				class="btn-secondary w-9 h-9 p-0"
				onclick={() => addHours(player.id, hourStep)}
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
			<IconX stroke={2} />
		</button>
	</div>
</div>
