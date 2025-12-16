<script lang="ts">
	// ABOUTME: Animated number display with spring-based counting effect
	// ABOUTME: Respects prefers-reduced-motion for accessibility

	import { spring } from 'svelte/motion';
	import { formatCurrency, formatCompactNumber } from '$lib/utils';
	import { onMount } from 'svelte';

	type Format = 'currency' | 'compact' | 'plain';

	let {
		value,
		format = 'currency'
	}: {
		value: number;
		format?: Format;
	} = $props();

	// Check for reduced motion preference
	let prefersReducedMotion = $state(false);

	onMount(() => {
		prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	});

	const displayed = spring(0, {
		stiffness: 0.15,
		damping: 0.8
	});

	$effect(() => {
		if (prefersReducedMotion) {
			displayed.set(value, { hard: true });
		} else {
			displayed.set(value);
		}
	});

	// Format the displayed value
	let formatted = $derived.by(() => {
		const rounded = Math.round($displayed);
		switch (format) {
			case 'currency':
				return formatCurrency(rounded);
			case 'compact':
				return formatCompactNumber(rounded);
			case 'plain':
			default:
				return String(rounded);
		}
	});
</script>

<span class="font-mono tabular-nums">{formatted}</span>
