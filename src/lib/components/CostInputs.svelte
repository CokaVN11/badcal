<script lang="ts">
	// ABOUTME: Cost inputs section - court fees, shuttlecocks, and additional costs
	// ABOUTME: Allows dynamic addition of extra costs like drinks/parking

	import { m } from '$lib/paraglide/messages.js';
	import { costInputsSchema } from '$lib/schemas/cost-inputs.schema';
	import { formatCurrency, parseVietnameseNumber, formatCompactNumber } from '$lib/utils';
	import type { ExtraCost } from '$lib/types';
	import * as Form from '$lib/components/ui/form';
	import {
		type SuperValidated,
		type Infer,
		superForm
	} from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';

	let {
		form: externalForm,
		courtHours = $bindable(),
		courtPrice = $bindable(),
		shuttlecockPrice = $bindable(),
		shuttlecockCount = $bindable(),
		additionalCosts = $bindable()
	}: {
		form?: SuperValidated<Infer<typeof costInputsSchema>>;
		courtHours: number;
		courtPrice: number;
		shuttlecockPrice: number;
		shuttlecockCount: number;
		additionalCosts: ExtraCost[];
	} = $props();

	// Create internal form if none provided
	const form = externalForm
		? superForm(externalForm, { validators: zodClient(costInputsSchema) })
		: superForm(
				{
					courtHours,
					courtPrice,
					shuttlecockPrice,
					shuttlecockCount
				},
				{ validators: zodClient(costInputsSchema) }
			);

	const { form: formData, enhance } = form;

	// Sync form state back to parent bindables
	$effect(() => {
		courtHours = $formData.courtHours;
		courtPrice = $formData.courtPrice;
		shuttlecockPrice = $formData.shuttlecockPrice;
		shuttlecockCount = $formData.shuttlecockCount;
	});

	// Display values for price inputs (supports "14k" shorthand)
	let courtPriceDisplay = $state(courtPrice > 0 ? formatCompactNumber(courtPrice) : '');
	let shuttlePriceDisplay = $state(shuttlecockPrice > 0 ? formatCompactNumber(shuttlecockPrice) : '');

	// Parse and update price with Vietnamese shorthand support
	function handlePriceInput(displayValue: string, setter: (value: number) => void): string {
		const parsed = parseVietnameseNumber(displayValue);
		setter(parsed);
		return displayValue;
	}

	let courtPerHour = $derived.by(() => {
		if (!courtHours || courtHours <= 0) return 0;
		if (!courtPrice || courtPrice <= 0) return 0;
		return courtPrice / courtHours;
	});

	// Additional costs management
	function addCost() {
		additionalCosts = [...additionalCosts, { id: crypto.randomUUID(), label: '', amount: 0 }];
	}

	function removeCost(id: string) {
		additionalCosts = additionalCosts.filter((c) => c.id !== id);
	}

	// Track display values for additional cost amounts (prevents cursor jumps)
	let additionalCostDisplays = $state<Record<string, string>>({});

	function updateCostWithValidation(id: string, field: keyof Omit<ExtraCost, 'id'>, value: string | number) {
		additionalCosts = additionalCosts.map((c) => (c.id === id ? { ...c, [field]: value } : c));
	}
</script>

<div class="space-y-5">
	<!-- Court Info -->
	<form method="POST" use:enhance class="grid grid-cols-2 gap-3">
		<Form.Field {form} name="courtHours">
			<Form.Control>
				{#snippet children({ props })}
					<div>
						<label for="court-hours" class="form-label !mb-2 text-xs">
							{m.court_hours()}
						</label>
						<div class="relative">
							<input
								id="court-hours"
								type="number"
								{...props}
								bind:value={$formData.courtHours}
								min="0"
								step="0.5"
								class="form-input form-input-number pr-5!"
							/>
							<span
								class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
							>
								h
							</span>
						</div>
						<Form.FieldErrors />
					</div>
				{/snippet}
			</Form.Control>
		</Form.Field>

		<Form.Field {form} name="courtPrice">
			<Form.Control>
				{#snippet children({ props })}
					<div>
						<label for="court-price" class="form-label !mb-2 text-xs">
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
										(v) => ($formData.courtPrice = v)
									);
								}}
								onblur={() => {
									if ($formData.courtPrice > 0 && courtPriceDisplay === '') {
										courtPriceDisplay = formatCompactNumber($formData.courtPrice);
									}
								}}
								placeholder={m.court_price_placeholder()}
								class="form-input form-input-number pr-5!"
							/>
							<span
								class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
							>
								{m.currency()}
							</span>
						</div>
						<p class="text-xs text-slate-500 mt-1">{m.court_total_hint()}</p>
						{#if courtPerHour > 0}
							<p class="text-xs text-slate-500">
								{m.court_per_hour_hint({ amount: formatCurrency(courtPerHour) })}
							</p>
						{/if}
						<Form.FieldErrors />
					</div>
				{/snippet}
			</Form.Control>
		</Form.Field>
	</form>

	<!-- Shuttlecocks -->
	<div class="grid grid-cols-2 gap-3">
		<Form.Field {form} name="shuttlecockPrice">
			<Form.Control>
				{#snippet children({ props })}
					<div>
						<label for="shuttle-price" class="form-label !mb-2 text-xs">
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
										(v) => ($formData.shuttlecockPrice = v)
									);
								}}
								onblur={() => {
									if ($formData.shuttlecockPrice > 0 && shuttlePriceDisplay === '') {
										shuttlePriceDisplay = formatCompactNumber($formData.shuttlecockPrice);
									}
								}}
								placeholder={m.shuttle_price_placeholder()}
								class="form-input form-input-number pr-5!"
							/>
							<span
								class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
							>
								{m.currency()}
							</span>
						</div>
						<Form.FieldErrors />
					</div>
				{/snippet}
			</Form.Control>
		</Form.Field>

		<Form.Field {form} name="shuttlecockCount">
			<Form.Control>
				{#snippet children({ props })}
					<div>
						<label for="shuttle-count" class="form-label !mb-2 text-xs">
							{m.shuttlecock_count()}
						</label>
						<input
							id="shuttle-count"
							type="number"
							{...props}
							bind:value={$formData.shuttlecockCount}
							min="0"
							step="1"
							class="form-input form-input-number"
						/>
						<Form.FieldErrors />
					</div>
				{/snippet}
			</Form.Control>
		</Form.Field>
	</div>

	<!-- Additional Costs -->
	<div class="pt-2">
		<div class="flex items-center justify-between mb-3">
			<span class="text-xs text-slate-500">{m.additional_costs()}</span>
			<button type="button" class="btn-secondary h-8 text-sm rounded-sm!" onclick={addCost}>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
				</svg>
				<span>{m.add_cost_btn()}</span>
			</button>
		</div>

		{#if additionalCosts.length > 0}
			<div class="space-y-2">
				{#each additionalCosts as cost (cost.id)}
					<div class="flex items-center gap-2 animate-slide-in" style="animation-fill-mode: backwards;">
						<div class="flex-1">
							<input
								type="text"
								value={cost.label}
								oninput={(e) => updateCostWithValidation(cost.id, 'label', (e.target as HTMLInputElement).value)}
								placeholder={m.cost_label_placeholder()}
								class="form-input text-sm w-full"
							/>
						</div>
						<div class="w-28">
							<div class="relative">
								<input
									type="text"
									inputmode="decimal"
									value={additionalCostDisplays[cost.id] ?? (cost.amount > 0 ? formatCompactNumber(cost.amount) : '')}
									oninput={(e) => {
										const raw = (e.target as HTMLInputElement).value;
										additionalCostDisplays[cost.id] = raw;
										updateCostWithValidation(cost.id, 'amount', parseVietnameseNumber(raw));
									}}
									placeholder={m.amount_placeholder()}
									class="form-input form-input-number text-sm w-full pr-6"
								/>
								<span
									class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none"
								>
									{m.currency()}
								</span>
							</div>
						</div>
						<button
							type="button"
							class="btn-icon btn-icon-danger"
							onclick={() => removeCost(cost.id)}
							aria-label={m.remove()}
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
