<script lang="ts">
	// ABOUTME: Stacked avatar preview for collapsed group headers
	// ABOUTME: Shows up to maxVisible avatars with overflow indicator

	import { getAvatarColor, getInitial } from '$lib/utils';

	type AvatarItem = {
		id: number;
		displayName: string;
		globalIndex: number;
	};

	let {
		items,
		maxVisible = 4,
		size = 'sm'
	}: {
		items: AvatarItem[];
		maxVisible?: number;
		size?: 'xs' | 'sm';
	} = $props();

	const sizeClasses = {
		xs: 'w-5 h-5 text-[9px]',
		sm: 'w-6 h-6 text-[10px]'
	};

	let visibleItems = $derived(items.slice(0, maxVisible));
	let overflowCount = $derived(Math.max(0, items.length - maxVisible));
</script>

<div class="avatar-stack flex -space-x-2">
	{#each visibleItems as item, i (item.id)}
		<div
			class="rounded-full ring-2 ring-white font-bold flex items-center justify-center text-white {sizeClasses[
				size
			]} {getAvatarColor(item.globalIndex)}"
			style="z-index: {maxVisible - i};"
		>
			{getInitial(item.displayName)}
		</div>
	{/each}
	{#if overflowCount > 0}
		<div
			class="rounded-full ring-2 ring-white bg-(--slate-200) text-(--slate-600) font-bold flex items-center justify-center {sizeClasses[
				size
			]}"
		>
			+{overflowCount}
		</div>
	{/if}
</div>

<style>
	.avatar-stack > * {
		transition: transform 0.15s ease;
	}
</style>
