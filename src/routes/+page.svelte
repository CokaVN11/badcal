<script lang="ts">
	// ABOUTME: Main page - Editor view with form inputs and live calculation
	// ABOUTME: Switches to Bill Preview mode for sharing

	import EditorView from '$lib/components/EditorView.svelte';
	import BillPreview from '$lib/components/BillPreview.svelte';
	import type { Player, AdditionalCost } from '$lib/types';

	// App state
	let currentView = $state<'editor' | 'preview'>('editor');

	// Session data
	let sessionTitle = $state('');
	let sessionDate = $state(new Date().toISOString().split('T')[0]);

	// Cost inputs
	let courtHours = $state(2);
	let courtPrice = $state(0);
	let shuttlecockPrice = $state(0);
	let shuttlecockCount = $state(1);

	// Additional costs
	let additionalCosts = $state<AdditionalCost[]>([]);

	// Players
	let players = $state<Player[]>([]);

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

	// Calculate each player's share based on hours played
	let playerShares = $derived.by(() => {
		const total = totalCost;
		const hours = totalHours;
		if (hours === 0 || players.length === 0) return [];

		return players.map((p) => ({
			...p,
			ratio: (p.hours || 0) / hours,
			share: Math.round(((p.hours || 0) / hours) * total)
		}));
	});

	function switchToPreview() {
		currentView = 'preview';
		console.log(currentView);
	}

	function switchToEditor() {
		currentView = 'editor';
	}
</script>

<div class="app-shell">
	{#if currentView === 'editor'}
		<EditorView
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
