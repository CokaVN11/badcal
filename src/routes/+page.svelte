<script lang="ts">
	// ABOUTME: Main page - Editor view with form inputs and live calculation
	// ABOUTME: Switches to Bill Preview mode for sharing

	import { onMount } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import BillPreview from '$lib/components/BillPreview.svelte';
	import ProgressiveEditorView from '$lib/components/ProgressiveEditorView.svelte';
	import type { Player, AdditionalCost } from '$lib/types';
	import { saveSession, loadSession, clearSession } from '$lib/utils';
	import { toast } from 'svelte-sonner';

	let currentView = $state<'editor' | 'preview'>('editor');
	let isHydrated = $state(false);

	let sessionTitle = $state('');
	let sessionDate = $state(new Date().toISOString().split('T')[0]);
	let courtHours = $state(2);
	let courtPrice = $state(0);
	let shuttlecockPrice = $state(0);
	let shuttlecockCount = $state(1);
	let additionalCosts = $state<AdditionalCost[]>([]);
	let players = $state<Player[]>([]);

	onMount(() => {
		const saved = loadSession();
		if (saved) {
			sessionTitle = saved.sessionTitle;
			sessionDate = saved.sessionDate;
			courtHours = saved.courtHours;
			courtPrice = saved.courtPrice;
			shuttlecockPrice = saved.shuttlecockPrice;
			shuttlecockCount = saved.shuttlecockCount;
			additionalCosts = saved.additionalCosts;
			players = saved.players;
		}
		isHydrated = true;
	});

	$effect(() => {
		if (!isHydrated) return;
		saveSession({
			sessionTitle,
			sessionDate,
			courtHours,
			courtPrice,
			shuttlecockPrice,
			shuttlecockCount,
			additionalCosts,
			players
		});
	});

	function handleClearSession() {
		clearSession();
		sessionTitle = '';
		sessionDate = new Date().toISOString().split('T')[0];
		courtHours = 2;
		courtPrice = 0;
		shuttlecockPrice = 0;
		shuttlecockCount = 1;
		additionalCosts = [];
		players = [];
		toast.success('Session cleared');
	}

	// Derived calculations
	let totalCost = $derived.by(() => {
		const court = courtPrice;
		const shuttles = shuttlecockPrice * shuttlecockCount;
		const extras = additionalCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
		return court + shuttles + extras;
	});

	let totalHours = $derived.by(() => {
		return players.reduce((sum, p) => sum + (p.hours || 0), 0);
	});

	const UNIT = 500;
	// Calculate each player's share based on hours played (Largest Remainder Method)
	// Rounds to 500đ units for practical Vietnamese currency handling
	let playerShares = $derived.by(() => {
		const hours = totalHours;
		if (hours === 0 || players.length === 0) return [];

		const roundedTotal = Math.ceil(totalCost / UNIT) * UNIT;
		const totalUnits = roundedTotal / UNIT; // integer

		const withExact = players.map((p) => {
			const ratio = (p.hours || 0) / hours;
			const exactUnits = ratio * totalUnits;
			const floorUnits = Math.floor(exactUnits);
			return { ...p, ratio, exactUnits, floorUnits, rem: exactUnits - floorUnits };
		});

		let unitsLeft = totalUnits - withExact.reduce((sum, p) => sum + p.floorUnits, 0);
		const sortedByRemainder = [...withExact].sort((a, b) => b.rem - a.rem || a.id - b.id);

		const shares = new SvelteMap<number, number>();
		sortedByRemainder.forEach((p, index) => {
			const addOne = index < unitsLeft ? 1 : 0;
			shares.set(p.id, (p.floorUnits + addOne) * UNIT);
		});

		return withExact.map((p) => ({
			...p,
			share: shares.get(p.id)!
		}));
	});

	function switchToPreview() {
		currentView = 'preview';
	}

	function switchToEditor() {
		currentView = 'editor';
	}
</script>

<div class="app-shell">
	{#if currentView === 'editor'}
		<ProgressiveEditorView
			bind:sessionTitle
			bind:sessionDate
			bind:courtHours
			bind:courtPrice
			bind:shuttlecockPrice
			bind:shuttlecockCount
			bind:additionalCosts
			bind:players
			{totalCost}
			{totalHours}
			{playerShares}
			onShare={switchToPreview}
			onClear={handleClearSession}
		/>
	{:else}
		<BillPreview
			{sessionTitle}
			{sessionDate}
			{courtPrice}
			{shuttlecockPrice}
			{shuttlecockCount}
			{additionalCosts}
			{playerShares}
			{totalCost}
			onBack={switchToEditor}
		/>
	{/if}
</div>
