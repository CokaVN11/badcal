<script lang="ts">
	// ABOUTME: Cost inputs section - court fees, shuttlecocks, and additional costs
	// ABOUTME: Allows dynamic addition of extra costs like drinks/parking

	import { m } from '$lib/paraglide/messages.js';
	import type { AdditionalCost } from '$lib/types';

	let {
		courtHours = $bindable(),
		courtPrice = $bindable(),
		shuttlecockPrice = $bindable(),
		shuttlecockCount = $bindable(),
		additionalCosts = $bindable()
	}: {
		courtHours: number;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: AdditionalCost[];
	} = $props();

	function addCost() {
		additionalCosts = [...additionalCosts, { id: Date.now(), label: '', amount: 0 }];
	}

	function removeCost(id: number) {
		additionalCosts = additionalCosts.filter((c) => c.id !== id);
	}

	function updateCost(id: number, field: keyof Omit<AdditionalCost, 'id'>, value: string | number) {
		additionalCosts = additionalCosts.map((c) => (c.id === id ? { ...c, [field]: value } : c));
	}
</script>

<div class="space-y-4">
	<h2 class="form-label">{m.costs_heading()}</h2>

	<!-- Court Info -->
	<div class="grid grid-cols-2 gap-3">
		<div>
			<label for="court-hours" class="text-xs text-(--slate-500) mb-1 block"
				>{m.court_hours()}</label
			>
			<input
				id="court-hours"
				type="number"
				bind:value={courtHours}
				min="0"
				step="0.5"
				class="form-input form-input-number"
			/>
		</div>
		<div>
			<label for="court-price" class="text-xs text-(--slate-500) mb-1 block"
				>{m.court_price()}</label
			>
			<input
				id="court-price"
				type="number"
				bind:value={courtPrice}
				min="0"
				step="1000"
				placeholder="0đ"
				class="form-input form-input-number"
			/>
		</div>
	</div>

	<!-- Shuttlecocks -->
	<div class="grid grid-cols-2 gap-3">
		<div>
			<label for="shuttle-price" class="text-xs text-(--slate-500) mb-1 block"
				>{m.shuttlecock_price()}</label
			>
			<input
				id="shuttle-price"
				type="number"
				bind:value={shuttlecockPrice}
				min="0"
				step="1000"
				placeholder="0đ"
				class="form-input form-input-number"
			/>
		</div>
		<div>
			<label for="shuttle-count" class="text-xs text-(--slate-500) mb-1 block"
				>{m.shuttlecock_count()}</label
			>
			<input
				id="shuttle-count"
				type="number"
				bind:value={shuttlecockCount}
				min="0"
				step="1"
				class="form-input form-input-number"
			/>
		</div>
	</div>

	<!-- Additional Costs -->
	<div class="pt-2">
		<div class="flex items-center justify-between mb-3">
			<span class="text-xs text-(--slate-500)">{m.additional_costs()}</span>
			<button class="btn-secondary text-xs py-1.5 px-3" onclick={addCost}>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
				{m.add_cost_btn()}
			</button>
		</div>

		{#if additionalCosts.length > 0}
			<div class="space-y-2">
				{#each additionalCosts as cost (cost.id)}
					<div
						class="flex items-center gap-2 animate-slide-in"
						style="animation-fill-mode: backwards;"
					>
						<input
							type="text"
							value={cost.label}
							oninput={(e) => updateCost(cost.id, 'label', (e.target as HTMLInputElement).value)}
							placeholder={m.cost_label_placeholder()}
							class="form-input flex-1 text-sm"
						/>
						<input
							type="number"
							value={cost.amount}
							oninput={(e) =>
								updateCost(
									cost.id,
									'amount',
									parseFloat((e.target as HTMLInputElement).value) || 0
								)}
							placeholder="0đ"
							min="0"
							step="1000"
							class="form-input form-input-number w-28 text-sm"
						/>
						<button
							class="btn-icon btn-icon-danger"
							onclick={() => removeCost(cost.id)}
							aria-label={m.remove()}
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
