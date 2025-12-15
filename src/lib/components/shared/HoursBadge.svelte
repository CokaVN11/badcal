<script lang="ts">
	// ABOUTME: Reusable hours badge component with gradient background
	// ABOUTME: Used in PlayerList and LiveSummary group headers

	import { m } from '$lib/paraglide/messages.js';
	import type { ColorScheme } from '$lib/utils';

	let {
		hours,
		colorScheme,
		size = 'md'
	}: {
		hours: number;
		colorScheme: ColorScheme;
		size?: 'sm' | 'md';
	} = $props();

	const sizeClasses = {
		sm: 'w-10 h-10 text-base',
		md: 'w-12 h-12 text-lg'
	};
</script>

<div
	class="hours-badge rounded-xl bg-gradient-to-br {colorScheme.bg} text-white flex flex-col items-center justify-center shrink-0 shadow-lg shadow-black/10 {sizeClasses[
		size
	]}"
>
	<span class="font-bold leading-none">{hours}</span>
	<span class="text-[9px] font-semibold uppercase tracking-wide opacity-80">
		{m.hours_unit()}
	</span>
</div>

<style>
	.hours-badge {
		transition: transform 0.2s ease;
	}
</style>
