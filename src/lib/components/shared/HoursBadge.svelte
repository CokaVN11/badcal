<script lang="ts">
	// ABOUTME: Reusable hours badge component with gradient background
	// ABOUTME: Used in PlayerList, LiveSummary group headers, and BillPreview receipt

	import { m } from '$lib/paraglide/messages.js';
	import type { ColorScheme } from '$lib/utils';

	let {
		hours,
		colorScheme,
		size = 'md'
	}: {
		hours: number;
		colorScheme: ColorScheme;
		size?: 'xs' | 'sm' | 'md';
	} = $props();

	// Static class mappings for Tailwind JIT compilation
	const sizeConfig = {
		xs: {
			container: 'w-8 h-8 text-sm rounded-lg shadow-sm',
			unit: 'text-[7px]'
		},
		sm: {
			container: 'w-10 h-10 text-base rounded-xl shadow-lg shadow-black/10',
			unit: 'text-[8px]'
		},
		md: {
			container: 'w-12 h-12 text-lg rounded-xl shadow-lg shadow-black/10',
			unit: 'text-[9px]'
		}
	};
</script>

<div
	class="hours-badge bg-linear-to-br {colorScheme.bg} text-white flex flex-col items-center justify-center shrink-0 {sizeConfig[
		size
	].container}"
>
	<span class="font-bold leading-none">{hours}</span>
	<span class="{sizeConfig[size].unit} font-semibold uppercase tracking-wide opacity-80">
		{m.hours_unit()}
	</span>
</div>

<style>
	.hours-badge {
		transition: transform 0.2s ease;
	}
</style>
