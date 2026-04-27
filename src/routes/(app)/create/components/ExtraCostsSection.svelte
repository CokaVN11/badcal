<script lang="ts">
	import { IconPlus, IconReceipt, IconTrash } from '@tabler/icons-svelte-runes';
	import { sessionStorage } from '$lib/stores/storage.svelte';
	import { formatCompactNumber } from '$lib/utils/format';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as m from '$lib/paraglide/messages';

	const QUICK_COSTS: [string, number][] = [
		[m.quick_cost_shuttlecock(), 30000],
		[m.quick_cost_iced_tea(), 15000],
		[m.quick_cost_drinks(), 10000],
		[m.quick_cost_parking(), 5000]
	];

	function addExtraCost() {
		sessionStorage.extraCosts = [
			...sessionStorage.extraCosts,
			{ id: crypto.randomUUID(), label: '', amount: 0 }
		];
	}

	function removeExtraCost(id: string) {
		sessionStorage.extraCosts = sessionStorage.extraCosts.filter((c) => c.id !== id);
	}

	function applyQuickCost(label: string, amount: number) {
		sessionStorage.extraCosts = [
			...sessionStorage.extraCosts,
			{ id: crypto.randomUUID(), label, amount }
		];
	}
</script>

<section class="bg-surface-container-lowest rounded-xl shadow-[0px_2px_8px_rgba(0,0,0,0.04)] p-4 flex flex-col space-y-4">
	<div class="flex items-center space-x-2 border-b border-surface-container">
		<IconReceipt class="text-primary-container" />
		<h2 class="font-semibold text-xl text-on-background">{m.additional_costs()}</h2>
	</div>

	<div class="flex flex-wrap gap-2">
		{#each QUICK_COSTS as [label, amt] (label)}
			<Button
				onclick={() => applyQuickCost(String(label), Number(amt))}
				class="h-8 bg-surface-container rounded-full text-sm text-on-surface-variant flex items-center gap-1 hover:bg-surface-container-high transition-colors"
			>
				<span>{label}</span>
				<span class="font-semibold text-primary-container">{formatCompactNumber(Number(amt))}</span>
			</Button>
		{/each}
	</div>

	{#each sessionStorage.extraCosts as cost, i (cost.id)}
		<div class="flex items-center gap-2">
			<Input
				type="text"
				value={cost.label}
				oninput={(e) => {
					const arr = sessionStorage.extraCosts;
					arr[i] = { ...arr[i], label: e.currentTarget.value };
					sessionStorage.extraCosts = arr;
				}}
				placeholder="Label"
				class="flex-1 text-sm"
			/>
			<div class="relative">
				<Input
					type="number"
					min="0"
					value={cost.amount}
					oninput={(e) => {
						const arr = sessionStorage.extraCosts;
						arr[i] = { ...arr[i], amount: Number(e.currentTarget.value) };
						sessionStorage.extraCosts = arr;
					}}
					placeholder="0"
					class="w-24 text-sm pr-8"
				/>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onclick={() => removeExtraCost(String(cost.id))}
				class="text-error hover:text-error transition-colors"
			>
				<IconTrash class="h-4 w-4" />
			</Button>
		</div>
	{/each}

	<Button variant="outline" onclick={addExtraCost} class="w-full">
		<IconPlus class="h-4 w-4" /> {m.add_cost_btn()}
	</Button>
</section>
