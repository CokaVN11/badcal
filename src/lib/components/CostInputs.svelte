<script lang="ts">
	// ABOUTME: Cost inputs section - court fees, shuttlecocks, and additional costs
	// ABOUTME: Allows dynamic addition of extra costs like drinks/parking

	import { createForm } from '@tanstack/svelte-form';
	import { m } from '$lib/paraglide/messages.js';
	import { costInputSchema, additionalCostSchema } from '$lib/schemas';
	import { zodFieldValidator } from '$lib/form-helpers';
	import { formatCurrency, parseVietnameseNumber, formatCompactNumber } from '$lib/utils';
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

	// Create reactive schema with Paraglide messages
	// $derived ensures schema updates when language changes
	const schema = $derived(costInputSchema());

	// Initialize TanStack Form (Standard Schema approach)
	// No validatorAdapter needed - Zod v3.23+ implements Standard Schema natively
	const form = createForm(() => ({
		defaultValues: {
			courtHours,
			courtPrice,
			shuttlecockPrice,
			shuttlecockCount
		}
	}));

	// TanStack Form state is reactive via its internal store; `form.state` is not.
	const valuesStore = form.useStore((state) => state.values);

	// Sync form state back to parent bindables
	$effect(() => {
		const values = valuesStore.current;
		courtHours = values.courtHours;
		courtPrice = values.courtPrice;
		shuttlecockPrice = values.shuttlecockPrice;
		shuttlecockCount = values.shuttlecockCount;
	});

	// Display values for price inputs (supports "14k" shorthand)
	let courtPriceDisplay = $state(courtPrice > 0 ? formatCompactNumber(courtPrice) : '');
	let shuttlePriceDisplay = $state(
		shuttlecockPrice > 0 ? formatCompactNumber(shuttlecockPrice) : ''
	);

	// Parse and update price with Vietnamese shorthand support
	function handlePriceInput(displayValue: string, handleChange: (value: number) => void): string {
		const parsed = parseVietnameseNumber(displayValue);
		handleChange(parsed);
		return displayValue;
	}

	let courtPerHour = $derived.by(() => {
		if (!courtHours || courtHours <= 0) return 0;
		if (!courtPrice || courtPrice <= 0) return 0;
		return courtPrice / courtHours;
	});

	// Additional costs management (not in main form - stays simple)
	// We'll validate these individually per field
	function addCost() {
		additionalCosts = [...additionalCosts, { id: Date.now(), label: '', amount: 0 }];
	}

	function removeCost(id: number) {
		additionalCosts = additionalCosts.filter((c) => c.id !== id);
	}

	// Helper to validate additional cost fields on the fly
	function validateAdditionalCostField(
		field: 'label' | 'amount',
		value: string | number
	): string | null {
		try {
			const costSchema = additionalCostSchema();
			// Validate just this field
			if (field === 'label') {
				costSchema.shape.label.parse(value);
			} else {
				costSchema.shape.amount.parse(value);
			}
			return null; // No error
		} catch (err: unknown) {
			if (err && typeof err === 'object' && 'issues' in err) {
				const { issues } = err as { issues?: Array<{ message?: string }> };
				return issues?.[0]?.message || 'Invalid value';
			}
			if (err instanceof Error) return err.message;
			return 'Invalid value';
		}
	}

	// Track validation errors for additional costs
	let additionalCostErrors = $state<Record<number, { label?: string; amount?: string }>>({});

	// Track display values for additional cost amounts (prevents cursor jumps)
	let additionalCostDisplays = $state<Record<number, string>>({});

	function updateCostWithValidation(
		id: number,
		field: keyof Omit<AdditionalCost, 'id'>,
		value: string | number
	) {
		// Update the value
		additionalCosts = additionalCosts.map((c) => (c.id === id ? { ...c, [field]: value } : c));

		// Validate and track errors
		const error = validateAdditionalCostField(field as 'label' | 'amount', value);
		additionalCostErrors = {
			...additionalCostErrors,
			[id]: {
				...additionalCostErrors[id],
				[field]: error || undefined
			}
		};
	}
</script>

<!-- TUTORIAL STEP 4: Use form fields directly (no Provider in Svelte) -->
<!-- TanStack Form Svelte API uses form instance directly -->
<div class="space-y-4">
	<h2 class="form-label">{m.costs_heading()}</h2>

	<!-- Court Info -->
	<div class="grid grid-cols-2 gap-3">
		<!-- Field-level validation with Zod via helper function -->
		<!-- zodFieldValidator converts Zod schema to validator function -->
		<form.Field
			name="courtHours"
			validators={{
				onChange: zodFieldValidator(schema.shape.courtHours)
			}}
		>
			{#snippet children({ state, handleChange, handleBlur })}
				<div>
					<label for="court-hours" class="text-xs text-(--slate-500) mb-1 block">
						{m.court_hours()}
					</label>
					<div class="relative">
						<input
							id="court-hours"
							type="number"
							value={state.value}
							oninput={(e) => {
								const val = parseFloat((e.target as HTMLInputElement).value);
								handleChange(isNaN(val) ? 0 : val);
							}}
							onblur={handleBlur}
							min="0"
							step="0.5"
							class="form-input form-input-number pr-5!"
							class:border-red-500={state.meta.errors.length > 0}
						/>
						<span
							class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-(--slate-400) pointer-events-none"
						>
							h
						</span>
					</div>
					{#if state.meta.errors.length > 0}
						<p class="text-xs text-red-500 mt-1">{state.meta.errors[0]}</p>
					{/if}
				</div>
			{/snippet}
		</form.Field>

		<form.Field
			name="courtPrice"
			validators={{
				onChange: zodFieldValidator(schema.shape.courtPrice)
			}}
		>
			{#snippet children({ state, handleChange, handleBlur })}
				<div>
					<label for="court-price" class="text-xs text-(--slate-500) mb-1 block">
						{m.court_price()}
					</label>
					<div class="relative">
						<input
							id="court-price"
							type="text"
							inputmode="decimal"
							value={courtPriceDisplay}
							oninput={(e) => {
								courtPriceDisplay = handlePriceInput(
									(e.target as HTMLInputElement).value,
									handleChange
								);
							}}
							onblur={() => {
								handleBlur();
								if (state.value > 0 && courtPriceDisplay === '') {
									courtPriceDisplay = formatCompactNumber(state.value);
								}
							}}
							placeholder={m.court_price_placeholder()}
							class="form-input form-input-number pr-5!"
							class:border-red-500={state.meta.errors.length > 0}
						/>
						<span
							class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-(--slate-400) pointer-events-none"
						>
							{m.currency()}
						</span>
					</div>
					<p class="text-[11px] text-(--slate-500) mt-1">{m.court_total_hint()}</p>
					{#if courtPerHour > 0}
						<p class="text-[11px] text-(--slate-500)">
							{m.court_per_hour_hint({ amount: formatCurrency(courtPerHour) })}
						</p>
					{/if}
					{#if state.meta.errors.length > 0}
						<p class="text-xs text-red-500 mt-1">{state.meta.errors[0]}</p>
					{/if}
				</div>
			{/snippet}
		</form.Field>
	</div>

	<!-- Shuttlecocks -->
	<div class="grid grid-cols-2 gap-3">
		<form.Field
			name="shuttlecockPrice"
			validators={{
				onChange: zodFieldValidator(schema.shape.shuttlecockPrice)
			}}
		>
			{#snippet children({ state, handleChange, handleBlur })}
				<div>
					<label for="shuttle-price" class="text-xs text-(--slate-500) mb-1 block">
						{m.shuttlecock_price()}
					</label>
					<div class="relative">
						<input
							id="shuttle-price"
							type="text"
							inputmode="decimal"
							value={shuttlePriceDisplay}
							oninput={(e) => {
								shuttlePriceDisplay = handlePriceInput(
									(e.target as HTMLInputElement).value,
									handleChange
								);
							}}
							onblur={() => {
								handleBlur();
								if (state.value > 0 && shuttlePriceDisplay === '') {
									shuttlePriceDisplay = formatCompactNumber(state.value);
								}
							}}
							placeholder={m.shuttle_price_placeholder()}
							class="form-input form-input-number pr-5!"
							class:border-red-500={state.meta.errors.length > 0}
						/>
						<span
							class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-(--slate-400) pointer-events-none"
						>
							{m.currency()}
						</span>
					</div>
					{#if state.meta.errors.length > 0}
						<p class="text-xs text-red-500 mt-1">{state.meta.errors[0]}</p>
					{/if}
				</div>
			{/snippet}
		</form.Field>

		<form.Field
			name="shuttlecockCount"
			validators={{
				onChange: zodFieldValidator(schema.shape.shuttlecockCount)
			}}
		>
			{#snippet children({ state, handleChange, handleBlur })}
				<div>
					<label for="shuttle-count" class="text-xs text-(--slate-500) mb-1 block">
						{m.shuttlecock_count()}
					</label>
					<input
						id="shuttle-count"
						type="number"
						value={state.value}
						oninput={(e) => {
							const val = parseFloat((e.target as HTMLInputElement).value);
							handleChange(isNaN(val) ? 0 : val);
						}}
						onblur={handleBlur}
						min="0"
						step="1"
						class="form-input form-input-number"
						class:border-red-500={state.meta.errors.length > 0}
					/>
					{#if state.meta.errors.length > 0}
						<p class="text-xs text-red-500 mt-1">{state.meta.errors[0]}</p>
					{/if}
				</div>
			{/snippet}
		</form.Field>
	</div>

	<!-- Additional Costs with manual Zod validation -->
	<!-- Array items managed outside TanStack Form for simplicity -->
	<div class="pt-2">
		<div class="flex items-center justify-between mb-3">
			<span class="text-xs text-(--slate-500)">{m.additional_costs()}</span>
			<button type="button" class="btn-secondary text-xs py-1.5 px-3" onclick={addCost}>
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
						<div class="flex-1">
							<input
								type="text"
								value={cost.label}
								oninput={(e) =>
									updateCostWithValidation(cost.id, 'label', (e.target as HTMLInputElement).value)}
								placeholder={m.cost_label_placeholder()}
								class="form-input text-sm w-full"
								class:border-red-500={additionalCostErrors[cost.id]?.label}
							/>
							{#if additionalCostErrors[cost.id]?.label}
								<p class="text-xs text-red-500 mt-1">
									{additionalCostErrors[cost.id].label}
								</p>
							{/if}
						</div>
						<div class="w-28">
							<div class="relative">
								<input
									type="text"
									inputmode="decimal"
									value={additionalCostDisplays[cost.id] ??
										(cost.amount > 0 ? formatCompactNumber(cost.amount) : '')}
									oninput={(e) => {
										const raw = (e.target as HTMLInputElement).value;
										additionalCostDisplays[cost.id] = raw;
										updateCostWithValidation(cost.id, 'amount', parseVietnameseNumber(raw));
									}}
									placeholder={m.amount_placeholder()}
									class="form-input form-input-number text-sm w-full pr-6"
									class:border-red-500={additionalCostErrors[cost.id]?.amount}
								/>
								<span
									class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-(--slate-400) pointer-events-none"
								>
									{m.currency()}
								</span>
							</div>
							{#if additionalCostErrors[cost.id]?.amount}
								<p class="text-xs text-red-500 mt-1">
									{additionalCostErrors[cost.id].amount}
								</p>
							{/if}
						</div>
						<button
							type="button"
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
